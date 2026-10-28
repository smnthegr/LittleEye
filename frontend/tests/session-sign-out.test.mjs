import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { mergeFallEvents, toFallEventEntry } from '../src/utils/fall-event-recording.ts';
import { sessionRoutes, sessionStack, UNHANDLED } from './helpers/session-routes.mjs';
import { createEmptyProfile } from '../src/utils/profile.ts';

const require = createRequire(import.meta.url);
const components = new Proxy({}, { get: (_, name) => name });
const Stack = Object.assign(() => null, { Protected: 'Protected', Screen: 'Screen' });

function stateHooks() {
  let cursor = 0;
  const slots = [];
  return {
    reset() { cursor = 0; },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    createContext: require('react').createContext,
    useEffect() {},
  };
}

function load(relative, overrides, dev = true, suffix = '') {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code + suffix, {
    module, exports: module.exports, __DEV__: dev,
    require(name) {
      if (name in overrides) return overrides[name];
      if (name === 'react/jsx-runtime') return require(name);
      if (name === '@/utils/fall-event-recording') return { mergeFallEvents, toFallEventEntry };
      if (name === '@/utils/profile') return { createEmptyProfile };
      if (name === '@/utils/place-search-cache') return { clearPlaceSearchCache() {} };
      if (name === 'react-native') return { Platform: { OS: 'web' }, View: 'View', Text: 'Text', Modal: 'Modal', ScrollView: 'ScrollView', StyleSheet: { create: value => value, absoluteFill: {} } };
      if (name === 'expo-router') return { Stack, usePathname: () => '/settings' };
      if (name === '@/constants/brand') return { BrandColors: {}, BrandFonts: {}, PageTypography: {} };
      if (name === '@/hooks/use-responsive-layout') return { useResponsiveStyles: value => value, useResponsiveLayout: () => ({ scaleSize: x => x }) };
      if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
      if (name === 'expo-splash-screen') return { preventAutoHideAsync() {} };
      if (name === '@/hooks/use-reduced-motion') return { useReducedMotion: () => true };
      if (name === '@/components/navigation-transition') return { NAVIGATION_TRANSITION_MS: 0 };
      if (name === 'expo-font' || name === '@expo-google-fonts/vt323' || name.endsWith('.css')) return {};
      if (name.startsWith('@/components/') || name === './glow-button') return components;
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return module.exports;
}

function sessionHarness() {
  const hooks = stateHooks();
  let cacheClears = 0;
  const { AppSessionProvider } = load('../src/components/app-session.tsx', {
    react: hooks, '@/utils/place-search-cache': { clearPlaceSearchCache() { cacheClears++; } },
  });
  const getSession = () => { hooks.reset(); return AppSessionProvider({ children: null }).props.value; };
  getSession.cacheClears = () => cacheClears;
  return getSession;
}

test('session owns contacts before a profile exists and rejects writes from a previous session', () => {
  const getSession = sessionHarness();
  getSession().acceptPolicies();
  getSession().enterPreview();
  const contact = { fullName: 'QA Contact', phone: '09171234567', email: '', address: 'Test address' };
  getSession().updateContacts([contact]);
  assert.equal(getSession().profile.contacts[0], contact);
  assert.equal(getSession().profile.guardian.fullName, '');
  const profile = { ...getSession().profile, guardian: { ...getSession().profile.guardian, fullName: 'Guardian' } };
  getSession().updateProfile(profile);
  getSession().updateContacts([]);
  assert.equal(getSession().profile.guardian.fullName, 'Guardian');
  const oldSession = getSession();
  oldSession.signOut();
  oldSession.updateContacts([contact]);
  assert.equal(getSession().profile, null);
  getSession().enterPreview();
  oldSession.updateContacts([contact]);
  assert.equal(getSession().profile, null);
});

test('logout clears transient searches and stale profile/photo/camera callbacks cannot affect the next account', () => {
  const getSession = sessionHarness();
  getSession().enterPreview();
  const old = getSession();
  const profile = createEmptyProfile();
  old.signOut();
  assert.equal(old.isCurrentSession(), false);
  getSession().enterPreview();
  const current = getSession();
  assert.notEqual(current.sessionKey, old.sessionKey);
  old.updateProfile(profile);
  old.setProfilePhoto('fixture:old-photo'); old.setChildPhoto('fixture:old-child');
  old.saveCamera({ name: 'Old camera' });
  const after = getSession();
  for (const key of ['profile', 'profilePhoto', 'childPhoto', 'camera']) assert.equal(after[key], null);
  assert.equal(getSession.cacheClears(), 3, 'sign-in, logout, and new sign-in each clear search memory');
});

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  return node?.props ? [node, ...nodes(node.props.children)] : [];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join(' ');
  return typeof node === 'string' ? node : node?.props ? text(node.props.children) : '';
}

function confirmExit(getSession, deleting, dev) {
  const hooks = stateHooks();
  const { SettingsSignOut } = load('../src/components/settings-sign-out.tsx', {
    react: hooks, './app-session': { useAppSession: getSession },
  }, dev);
  const render = () => { hooks.reset(); return SettingsSignOut({ action: deleting ? 'delete-account' : 'sign-out' }); };
  const outerButton = nodes(render()).filter(node => node.type === 'GlowButton').at(-1);
  assert.equal(outerButton.props.disabled, false);
  outerButton.props.onPress();
  const modal = nodes(render()).find(node => node.type === 'Modal');
  assert.equal(modal.props.visible, true);
  const button = nodes(modal).find(node => node.type === 'GlowButton' && text(node).trim() === (deleting ? 'Delete' : 'Sign out'));
  button.props.onPress();
  assert.equal(nodes(render()).find(node => node.type === 'Modal').props.visible, false);
}

for (const dev of [true, false]) {
  test(`confirmed sign-out/deletion removes account history and opens landing immediately (${dev ? 'development' : 'production'})`, () => {
    for (const deleting of [false, true]) {
      for (const connected of [false, true]) {
        const getSession = sessionHarness();
        getSession().acceptPolicies();
        getSession().enterPreview({ guardian: { fullName: 'Fixture' }, child: {}, contacts: [] });
        getSession().setProfilePhoto('fixture:guardian');
        getSession().setChildPhoto('fixture:child');
        if (connected) getSession().saveCamera({ name: 'Fixture camera', address: 'https://example.com/stream', status: 'pending' });
        const stack = sessionStack(getSession(), connected ? 'home' : 'connect-camera');
        for (const name of connected ? ['profile-account', 'settings', 'settings-pages'] : ['settings']) {
          assert.notEqual(stack.dispatch({ type: 'PUSH', payload: { name } }), UNHANDLED);
        }
        confirmExit(getSession, deleting, dev);
        const signedOut = getSession();
        assert.equal(signedOut.signedIn, false);
        assert.equal(signedOut.accepted, !deleting);
        for (const key of ['profile', 'camera', 'profilePhoto', 'childPhoto']) assert.equal(signedOut[key], null);
        stack.settle(signedOut);
        assert.equal(stack.state.routes[stack.state.index].name, 'index', 'landing must be visible without pressing Back');
        assert.deepEqual(stack.state.routes.map(route => route.name), ['index']);
        const { guards } = sessionRoutes(signedOut);
        for (const blocked of ['settings', 'settings-pages', 'profile', 'profile-account', 'connect-camera', 'home', 'history', 'call']) {
          assert.equal(guards.get(blocked), '/', `${blocked} must redirect after logout`);
          stack.dispatch({ type: 'PUSH', payload: { name: blocked, params: { preview: 'connected' } } });
          stack.settle(signedOut);
          assert.ok(stack.state.routes.every(route => route.name === 'index'));
        }
        while (stack.dispatch({ type: 'POP', payload: { count: 1 } }) !== UNHANDLED) {
          assert.equal(stack.state.routes[stack.state.index].name, 'index', 'Back cannot reveal previous account screens');
        }
        // A new session starts at camera setup rather than reopening old Settings.
        signedOut.acceptPolicies();
        getSession().enterPreview();
        stack.settle(getSession());
        assert.deepEqual(stack.state.routes.map(route => route.name), ['connect-camera']);
      }
    }
  });
}

test('backend-ready events update History state and clear when the account session ends', () => {
  const getSession = sessionHarness();
  const record = {
    id: 'fall-1', detectedAt: '2026-10-22T14:35:00+08:00',
    clip: { uri: 'https://example.com/fall-1.mp4', durationSeconds: 30, fallOffsetSeconds: 10 },
  };
  getSession().recordFallEvent(record);
  assert.equal(getSession().fallEvents.length, 0, 'signed-out sessions cannot receive history');
  getSession().enterPreview();
  getSession().replaceFallEvents([record, record]);
  assert.equal(getSession().fallEvents.length, 1);
  getSession().recordFallEvent({ ...record, thumbnailUri: 'https://example.com/thumbnail.jpg' });
  assert.equal(getSession().fallEvents.length, 1);
  assert.equal(getSession().fallEvents[0].thumbnailUri, 'https://example.com/thumbnail.jpg');
  getSession().recordFallEvent({ ...record, id: 'fall-2', detectedAt: '2026-10-22T15:00:00+08:00' });
  assert.equal(getSession().fallEvents[0].id, 'fall-2');
  assert.throws(() => getSession().replaceFallEvents([{ ...record, clip: { ...record.clip, uri: '' } }]));
  assert.equal(getSession().fallEvents.length, 2, 'invalid hydration leaves existing history intact');
  const previousAccount = getSession();
  getSession().signOut();
  previousAccount.recordFallEvent(record);
  previousAccount.replaceFallEvents([record]);
  assert.equal(getSession().fallEvents.length, 0);
  getSession().enterPreview();
  previousAccount.recordFallEvent(record);
  previousAccount.replaceFallEvents([record]);
  assert.equal(getSession().fallEvents.length, 0, 'a new account cannot inherit previous history');
  getSession().recordFallEvent(record);
  getSession().deleteAccount();
  assert.equal(getSession().fallEvents.length, 0);
});
