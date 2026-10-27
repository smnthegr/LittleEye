import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as contactValidation from '../src/utils/contact-validation.ts';
import { addresses } from './helpers/address-fixtures.mjs';

const require = createRequire(import.meta.url);

// Render the production route components with local route params and a recording router.
function harness() {
  let params = {};
  let camera = { name: 'Camera', status: 'connected' };
  let canGoBack = true;
  let session = { profile: null, signedIn: true, accepted: true };
  const navigation = [];
  const router = {
    push: href => navigation.push({ method: 'push', href }),
    replace: href => navigation.push({ method: 'replace', href }),
    back: () => navigation.push({ method: 'back' }),
    canGoBack: () => canGoBack,
  };
  const componentStubs = new Proxy({}, { get: (_, name) => name });
  function load(relative) {
    const file = new URL(relative, import.meta.url);
    const code = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(code, {
      module, exports: module.exports, __DEV__: true,
      require(name) {
        if (name === 'react') return { useState: value => [value, () => {}] };
        if (name === 'react/jsx-runtime') return require(name);
        if (name === '@/utils/contact-validation') return contactValidation;
        if (name === '@/utils/philippine-address') return addresses;
        if (name === 'expo-router') return { router, Redirect: 'Redirect', useLocalSearchParams: () => params };
        if (name === 'react-native') return {
          View: 'View', Text: 'Text', Modal: 'Modal', ScrollView: 'ScrollView', Pressable: 'Pressable',
          KeyboardAvoidingView: 'KeyboardAvoidingView', TextInput: 'TextInput', Platform: { OS: 'ios' },
          StyleSheet: { create: value => value, absoluteFill: {} },
        };
        if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
        if (name === '@/hooks/use-responsive-layout') return {
          useResponsiveLayout: () => ({ pageWidth: 390, scaleSize: x => x }),
          useResponsiveStyles: value => value,
        };
        if (name === '@/utils/responsive') return { getPageHeaderLayout: () => ({ top: 8, contentTop: 72, buttonSize: 44 }) };
        if (name === '@/hooks/use-settings-camera') return { useSettingsCamera: () => ({ camera, isPreview: params.preview === 'connected' }) };
        if (name.endsWith('app-session')) return { useAppSession: () => session };
        if (name === '@/constants/brand') return { BrandColors: {}, BrandFonts: {}, PageTypography: {} };
        if (name === 'expo-image') return { Image: 'Image' };
        if (name === 'expo-status-bar') return { StatusBar: 'StatusBar' };
        if (name === 'expo-image-picker') return {};
        if (/\.(svg|png)$/.test(name)) return name;
        if (name.endsWith('package.json')) return { version: 'test' };
        if (name.startsWith('@/components/') || name.startsWith('./')) return componentStubs;
        throw new Error(`Unexpected dependency: ${name}`);
      },
    });
    return module.exports;
  }
  return {
    navigation,
    profile: load('../src/components/profile-screen.tsx').ProfileScreen,
    settings: load('../src/app/settings.tsx').default,
    page: load('../src/components/settings-page.tsx').SettingsPage,
    about: load('../src/components/settings-about-page.tsx').SettingsAboutPage,
    setParams: next => { params = next; },
    setSession: next => { session = { ...session, ...next }; },
    noCamera: () => { camera = null; },
    noHistory: () => { canGoBack = false; },
  };
}

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree?.props) return [];
  return [tree, ...nodes(tree.props.children)];
}
function header(tree) { return nodes(tree).find(node => node.type === 'FixedPageHeader'); }
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join(' ');
  return typeof tree === 'string' ? tree : tree?.props ? text(tree.props.children) : '';
}
function button(tree, label) {
  return nodes(tree).find(node => node.type === 'GlowButton' && text(node).includes(label));
}

test('a profile losing its session redirects to landing before the cleared-camera Settings fallback', () => {
  for (const params of [{}, { preview: 'connected', from: 'profile' }]) {
    const h = harness();
    h.setParams(params);
    h.noCamera();
    for (const mode of ['guardian', 'child', 'account']) {
      h.setSession({ signedIn: false, accepted: true });
      assert.equal(h.profile({ mode }).props.href, '/');
      assert.equal(h.settings().props.href, '/', 'Settings must not show its signed-out preview footer while exiting');
      h.setSession({ signedIn: false, accepted: false });
      assert.equal(h.profile({ mode }).props.href, '/');
      assert.equal(h.settings().props.href, '/');
    }
    assert.deepEqual(h.navigation, [], 'no background navigation to Settings after logout');
  }
});

test('Settings opened from every Profile mode carries its origin and preview data', () => {
  const h = harness();
  h.setParams({ preview: 'connected' });
  for (const mode of ['guardian', 'child', 'account']) {
    const tree = h.profile({ mode });
    nodes(tree).find(node => node.props.accessibilityLabel === 'Open Settings').props.onPress();
    const { href } = h.navigation.at(-1);
    assert.equal(href.pathname, '/settings');
    assert.equal(href.params.from, 'profile');
    assert.equal(href.params.preview, 'connected');
  }
});

test('Profile-origin Settings hides the avatar and preserves origin through About and its subpages', () => {
  const h = harness();
  h.setParams({ from: 'profile', preview: 'connected' });
  assert.equal(header(h.settings()).props.profile, false);
  button(h.settings(), 'About LittleEye').props.onPress();
  const aboutParams = h.navigation.at(-1).href.params;
  assert.equal(aboutParams.from, 'profile');
  h.setParams(aboutParams);
  const about = h.about();
  assert.equal(header(h.page(about.props)).props.profile, false);
  for (const label of ['App Version', 'System Information', 'Privacy Policy', 'Terms of Service']) {
    button(about, label).props.onPress();
    const { params } = h.navigation.at(-1).href;
    assert.equal(params.from, 'profile', label);
    assert.equal(params.preview, 'connected', label);
    h.setParams(params);
    assert.equal(header(h.page({ white: true, fallback: 'about', children: label })).props.profile, false);
  }
});

test('regular Settings sections inherit Profile origin', () => {
  const h = harness();
  h.setParams({ from: 'profile' });
  const settings = h.settings();
  for (const label of ['Device Information', 'Network & Connection', 'Image & Sound Settings', 'Fall Detection & Alerts', 'Security & Access', 'Instructions & Help']) {
    button(settings, label).props.onPress();
    const { params } = h.navigation.at(-1).href;
    assert.equal(params.from, 'profile', label);
    h.setParams(params);
    assert.equal(header(h.page({ children: label })).props.profile, false);
  }
});

test('menu/direct Settings and subpages keep the avatar after a previous Profile flow', () => {
  const h = harness();
  h.setParams({ from: 'profile' });
  assert.equal(header(h.settings()).props.profile, false);
  h.setParams({}); // A new menu entry has its own local route params.
  assert.equal(header(h.settings()).props.profile, true);
  button(h.settings(), 'About LittleEye').props.onPress();
  assert.equal(h.navigation.at(-1).href.params.from, undefined);
  h.setParams(h.navigation.at(-1).href.params);
  button(h.about(), 'Privacy Policy').props.onPress();
  h.setParams(h.navigation.at(-1).href.params);
  assert.equal(header(h.page({ white: true, children: 'Policy' })).props.profile, true);
});

test('Settings and About fallback routes retain Profile origin without changing normal back navigation', () => {
  const h = harness();
  h.setParams({ from: 'profile', preview: 'connected' });
  header(h.page({ children: 'Page' })).props.onBack();
  assert.equal(h.navigation.at(-1).method, 'back');
  h.noHistory();
  for (const fallback of ['settings', 'about']) {
    header(h.page({ children: 'Page', fallback })).props.onBack();
    const { href, method } = h.navigation.at(-1);
    assert.equal(method, 'replace');
    assert.equal(href.params.from, 'profile');
    assert.equal(href.params.preview, 'connected');
    assert.equal(href.pathname, fallback === 'about' ? '/settings-pages/[section]' : '/settings');
  }
});

test('Profile redirect without a camera still marks Settings as Profile-origin', () => {
  const h = harness();
  h.noCamera();
  const redirect = h.profile({ mode: 'guardian' });
  assert.equal(redirect.props.href.pathname, '/settings');
  h.setParams(redirect.props.href.params);
  assert.equal(header(h.settings()).props.profile, false);
});
