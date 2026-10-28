import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as contactValidation from '../src/utils/contact-validation.ts';
import { addresses, qcAddress, completeAddress } from './helpers/address-fixtures.mjs';
import { getHomeDestination } from '../src/utils/session-navigation.ts';

const require = createRequire(import.meta.url);
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return tree?.props ? [tree, ...nodes(tree.props.children)] : [];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join(' ');
  return typeof tree === 'string' ? tree : tree?.props ? text(tree.props.children) : '';
}
const responsive = {
  useResponsiveLayout: () => ({ pageWidth: 390, height: 844, fontScale: 1, scaleSize: x => x, insets: { top: 0, bottom: 0 } }),
  useResponsiveStyles: value => value,
};
const native = {
  StyleSheet: { create: value => value, absoluteFill: {} }, Platform: { OS: 'ios' },
  View: 'View', Text: 'Text', TextInput: 'TextInput', ScrollView: 'ScrollView', Modal: 'Modal', Pressable: 'Pressable', KeyboardAvoidingView: 'KeyboardAvoidingView',
  Keyboard: { dismiss() {} }, BackHandler: { addEventListener: () => ({ remove() {} }) },
  Easing: { inOut: x => x, sin: 'sin' },
  Animated: { Value: class { stopAnimation() {} setValue() {} }, View: 'AnimatedView', timing: () => ({ start() {} }) },
};
function load(relative, overrides) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    requestAnimationFrame: callback => callback(), cancelAnimationFrame() {},
    require(name) {
      if (name in overrides) return overrides[name];
      if (name === 'react/jsx-runtime') return require(name);
      if (name === '@/utils/contact-validation') return contactValidation;
      if (name === '@/utils/session-navigation') return { getHomeDestination };
      if (name === '@/hooks/use-foreground') return { useForeground: () => true };
      if (name === '@/hooks/use-reduced-motion') return { useReducedMotion: () => true };
      if (name === '@/components/app-session') return { useAppSession: () => ({ signedIn: true, accepted: true, camera: null }) };
      if (name === '@/utils/philippine-address') return addresses;
      if (name === 'react-native') return native;
      if (name === '@/hooks/use-responsive-layout') return responsive;
      if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
      if (name === '@/utils/responsive') return { getPageHeaderLayout: () => ({ contentTop: 72 }) };
      if (name === '@/constants/brand') return { BrandColors: {}, BrandFonts: {}, PageTypography: {} };
      if (name === 'expo-image') return { Image: 'Image' };
      if (name === 'expo-status-bar') return { StatusBar: 'StatusBar' };
      if (name === 'expo-audio' || name === '@/hooks/use-emergency-hotlines') return {};
      if (name.startsWith('@/components/')) return new Proxy({}, { get: (_, key) => key });
      if (name === '@/hooks/use-mascot-images') return {};
      if (name === 'expo-symbols') return { SymbolView: 'SymbolView' };
      if (name === 'react-native-reanimated') return { default: {}, Easing: {} };
      if (name.startsWith('../../assets/')) return 'asset';
      throw new Error(`Unexpected module: ${name}`);
    },
  });
  return module.exports;
}

test('setup offers an area preview after the address and saves the selected area with the profile', () => {
  const slots = [];
  let cursor = 0;
  let saved;
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i]; },
    useEffect() {}, useCallback: callback => callback,
  };
  const { default: SetUp } = load('../src/app/set-up.tsx', {
    react: hooks,
    'expo-router': { router: {}, useFocusEffect() {}, useLocalSearchParams: () => ({}) },
    '@/components/app-session': { useAppSession: () => ({ enterPreview: value => { saved = value; } }) },
    '@/components/mascot-images': { useMascotImages: () => ({ signUp: 'fixture' }) },
  });
  const render = () => { cursor = 0; return SetUp(); };
  const field = (label, value) => label === 'Address'
    ? nodes(render()).find(node => node.type === 'PhilippineAddressField').props.onChange(value)
    : nodes(render()).find(node => node.props.placeholder === label).props.onChangeText(value);
  const next = label => nodes(render()).find(node => node.type === 'GlowButton' && text(node).trim() === label).props.onPress();
  assert.equal(nodes(render()).some(node => node.type === 'EmergencyAreaCard'), false);
  field('Full Name', 'Sample Guardian'); field('Contact Number', '09000000001'); field('Email', 'guardian@example.com');
  field('Address', { ...qcAddress, confirmed: false });
  const preview = nodes(render()).find(node => node.type === 'EmergencyAreaCard');
  assert.ok(preview, 'City hotlines must be visible before address confirmation');
  assert.equal(preview.props.localityCode, qcAddress.localityCode);
  assert.equal(preview.props.compact, true);
  const card = nodes(render()).find(node => node.type === 'EmergencyAreaCard');
  assert.equal(card.props.address, completeAddress);
  const area = { country: 'PH', localityId: 'quezon-city', addressKey: 'commonwealth quezon city philippines' };
  card.props.onChange(area);
  next('Next');
  field('Full Name', 'Sample Child');
  field('Birthdate (MM/DD/YYYY)', `0101${new Date().getFullYear() - 2}`);
  field('Height (cm)', '90');
  nodes(render()).find(node => node.props.accessibilityLabel === 'Select sex').props.onPress();
  nodes(render()).find(node => node.props.accessibilityRole === 'radio' && text(node).includes('Female')).props.onPress();
  next('Next');
  field('Full Name', 'Sample Contact'); field('Contact Number', '09000000002'); field('Address', qcAddress);
  next('Connect a Camera');
  assert.ok(saved, 'Setup completion should save a profile');
  assert.equal(saved.guardian.address, completeAddress);
  assert.equal(saved.guardian.addressDetails.confirmed, false, 'No checkbox is needed to complete setup');
  assert.equal(saved.emergencyArea, area);
  assert.equal(saved.contacts.length, 1);
});

test('a single SOS tap immediately requests 911 without a hold, picker, or navigation and guards repeated taps', async () => {
  const hotline = { id: 'ph-911', number: '911', dialNumber: '911' };
  const calls = [];
  const routes = [];
  let finish;
  let focused = true;
  const pending = new Promise(resolve => { finish = resolve; });
  const slots = [];
  let cursor = 0;
  const { default: SOS } = load('../src/app/emergency-hotline.tsx', {
    react: {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value; }]; },
      useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i]; },
    },
    'expo-router': { router: { push: route => routes.push(route) }, useIsFocused: () => focused, useLocalSearchParams: () => ({ service: '122' }) },
    '@/components/app-session': { useAppSession: () => ({}) },
    '@/hooks/use-emergency-hotlines': { useEmergencyHotlines: () => ({ address: '', directory: { areaName: 'Philippines' } }) },
    '@/constants/emergency-hotlines': { SOS_HOTLINE: hotline },
    '@/services/emergency-dialer': { openEmergencyDialer: item => { calls.push(item); return pending; } },
    '@/utils/responsive': { getEmergencyHotlineLayout: () => ({ sosDiameter: 204, textScale: 1, spacingScale: 1 }) },
  });
  const render = () => { cursor = 0; return SOS(); };
  const button = () => nodes(render()).find(node => node.props.accessibilityLabel === 'SOS. Call 911');
  assert.equal(calls.length, 0, 'Rendering must not call');
  assert.equal(button().props.onLongPress, undefined);
  assert.equal(button().props.delayLongPress, undefined);
  const attempt = button().props.onPress();
  button().props.onPress();
  assert.equal(calls.length, 1);
  assert.equal(calls[0], hotline, 'SOS always means 911, regardless of old service route params');
  assert.equal(routes.length, 0, 'No extra app screen before calling');
  assert.equal(button().props.disabled, true);
  assert.equal(nodes(render()).some(node => node.type === 'Modal' && node.props.visible), false);
  finish();
  await attempt;
  assert.equal(button().props.disabled, false);
  focused = false;
  button().props.onPress();
  assert.equal(calls.length, 1, 'A background screen cannot initiate a call');
});

test('legacy hotline call links never start the simulated ringing audio', () => {
  let audioStarts = 0;
  const hotline = { id: 'ph-911', number: '911', dialNumber: '911' };
  const { default: Call } = load('../src/app/call.tsx', {
    react: { useEffect() {} },
    'expo-router': { router: {}, useLocalSearchParams: () => ({ kind: 'hotline', phone: '911' }) },
    'expo-audio': { useAudioPlayer: () => { audioStarts++; throw new Error('Hotline must not simulate audio'); } },
    '@/hooks/use-emergency-hotlines': { useEmergencyHotlines: () => ({ directory: { hotlines: [hotline] } }) },
  });
  const branch = Call();
  const tree = branch.type(branch.props);
  const list = nodes(tree).find(node => node.type === 'EmergencyHotlineList');
  assert.equal(list.props.hotlines[0], hotline);
  assert.equal(audioStarts, 0);
  assert.ok(text(tree).includes('LittleEye has not placed a call'));
});

test('Call requires explicit, valid contact parameters before mounting ringing audio', () => {
  for (const camera of [null, { name: 'Camera' }]) {
    for (const params of [{}, { kind: 'contact' }, { kind: 'contact', phone: 'invalid' }, { phone: '09171234567' }]) {
      const { default: Call } = load('../src/app/call.tsx', {
        react: { useEffect() {} },
        'expo-router': { Redirect: 'Redirect', useLocalSearchParams: () => params },
        '@/components/app-session': { useAppSession: () => ({ signedIn: true, accepted: true, camera }) },
        'expo-audio': { useAudioPlayer: () => { throw new Error('Invalid Call must not mount audio'); } },
      });
      const branch = Call();
      assert.equal(branch.type, 'Redirect');
      assert.equal(branch.props.href, camera ? '/home' : '/connect-camera');
    }
  }
  const { default: Call } = load('../src/app/call.tsx', {
    react: { useEffect() {} },
    'expo-router': { Redirect: 'Redirect', useLocalSearchParams: () => ({ kind: 'contact', phone: '09171234567', recipient: 'Guardian' }) },
  });
  assert.equal(Call().type.name, 'ContactCallPreview', 'An explicit contact selection still opens the call preview');
});

test('Emergency Hotline Back without history returns to the available Home destination', () => {
  for (const camera of [null, { name: 'Camera' }]) {
    const routes = [];
    const { default: Hotline } = load('../src/app/emergency-hotline.tsx', {
      react: { useState: initial => [initial, () => {}], useRef: current => ({ current }) },
      'expo-router': { router: { canGoBack: () => false, replace: href => routes.push(href) }, useIsFocused: () => true },
      '@/components/app-session': { useAppSession: () => ({ signedIn: true, accepted: true, camera }) },
      '@/hooks/use-emergency-hotlines': { useEmergencyHotlines: () => ({ directory: { areaName: 'Philippines' } }) },
      '@/utils/responsive': { getEmergencyHotlineLayout: () => ({ sosDiameter: 204, textScale: 1, spacingScale: 1 }) },
      '@/constants/emergency-hotlines': {}, '@/services/emergency-dialer': {},
    });
    nodes(Hotline()).find(node => node.type === 'FixedPageHeader').props.onBack();
    assert.deepEqual(routes, [camera ? '/home' : '/connect-camera']);
  }
});
