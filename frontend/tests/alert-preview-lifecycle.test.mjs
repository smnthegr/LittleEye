import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidPhoneNumber } from '../src/utils/contact-validation.ts';
import { getHomeDestination } from '../src/utils/session-navigation.ts';
import { loadFrontend, nodes, stateHooks, text } from './helpers/ui-test.mjs';

function preview(relative) {
  const hooks = stateHooks();
  const state = { foreground: true, focused: true, reduced: false, active: true, key: Symbol('session') };
  const audio = { playCount: 0, pauseCount: 0, play() { this.playCount++; }, pause() { this.pauseCount++; }, async seekTo() {} };
  const animations = { repeatCount: 0, cancelCount: 0 };
  const routes = [];
  const components = new Proxy({}, { get: (_, name) => name });
  const reanimated = {
    __esModule: true, default: { createAnimatedComponent: value => value, View: 'AnimatedView' },
    Easing: { inOut: value => value, out: value => value, in: value => value, ease: 'ease' },
    useSharedValue: initial => hooks.useMemo(() => ({ value: initial }), []),
    useAnimatedStyle: fn => fn(), cancelAnimation() { animations.cancelCount++; },
    withTiming: value => value, withSequence: (...values) => values.at(-1), withDelay: (_, value) => value,
    withRepeat: value => { animations.repeatCount++; return value; },
  };
  const session = () => {
    const key = state.key;
    return {
      signedIn: state.active, accepted: true, camera: null, sessionKey: state.active ? key : null,
      isCurrentSession: () => state.active && state.key === key,
    };
  };
  const module = loadFrontend(relative, new Proxy({
    react: hooks,
    'react-native': {
      Modal: 'Modal', View: 'View', Text: 'Text', ScrollView: 'ScrollView',
      StyleSheet: { create: value => value, absoluteFill: {} },
    },
    'expo-router': {
      router: { push: route => routes.push(route) }, useIsFocused: () => state.focused,
      useLocalSearchParams: () => ({ kind: 'contact', phone: '09171234567', recipient: 'QA Contact' }),
    },
    'expo-audio': { useAudioPlayer: () => audio }, 'expo-image': { Image: 'Image' },
    'expo-status-bar': { StatusBar: 'StatusBar' }, 'expo-symbols': { SymbolView: 'SymbolView' },
    'react-native-reanimated': reanimated,
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '@/components/app-session': { useAppSession: session },
    '@/hooks/use-foreground': { useForeground: () => state.foreground },
    '@/hooks/use-reduced-motion': { useReducedMotion: () => state.reduced },
    '@/hooks/use-emergency-hotlines': {},
    '@/hooks/use-responsive-layout': {
      useResponsiveLayout: () => ({ pageWidth: 390, scaleSize: x => x, insets: { top: 0, bottom: 0, left: 0, right: 0 } }),
      useResponsiveStyles: value => value,
    },
    '@/utils/responsive': { getPageHeaderLayout: () => ({ contentTop: 72 }) },
    '@/utils/contact-validation': { isValidPhoneNumber }, '@/utils/session-navigation': { getHomeDestination },
    '@/constants/brand': { BrandColors: {}, BrandFonts: {}, PageTypography: {} },
  }, {
    has: (target, name) => name in target || name.startsWith('@/components/'),
    get: (target, name) => name in target ? target[name] : components,
  }));
  function render() {
    hooks.reset();
    let tree;
    if (module.FallAlertProvider) tree = module.FallAlertProvider({ children: 'navigator' });
    else { const branch = module.default(); tree = branch.type(branch.props); }
    hooks.flush();
    return tree;
  }
  return { state, audio, animations, routes, render, unmount: () => hooks.unmount() };
}

test('repeated alerts use one modal and old-session callbacks cannot show or dismiss a new account alert', () => {
  const h = preview('src/components/fall-alert.tsx');
  let tree = h.render();
  const oldShow = tree.props.value.showFallAlert;
  oldShow(); oldShow();
  tree = h.render();
  assert.equal(nodes(tree).filter(node => node.type === 'Modal' && node.props.visible).length, 1);
  assert.equal(h.audio.playCount, 1);
  const oldDismiss = nodes(tree).find(node => node.type === 'Modal').props.onRequestClose;
  h.state.active = false;
  assert.equal(nodes(h.render()).find(node => node.type === 'Modal').props.visible, false);
  h.state.active = true; h.state.key = Symbol('next-account');
  oldShow();
  tree = h.render();
  assert.equal(nodes(tree).find(node => node.type === 'Modal').props.visible, false);
  tree.props.value.showFallAlert();
  oldDismiss();
  assert.equal(nodes(h.render()).find(node => node.type === 'Modal').props.visible, true);
  h.unmount();
});

test('alert audio pauses in the background and reduced motion keeps the alert static', () => {
  const h = preview('src/components/fall-alert.tsx');
  h.state.reduced = true;
  h.render().props.value.showFallAlert();
  h.render();
  assert.equal(h.audio.playCount, 1);
  assert.equal(h.animations.repeatCount, 0);
  h.state.foreground = false;
  const pauses = h.audio.pauseCount;
  h.render();
  assert.ok(h.audio.pauseCount > pauses);
  assert.equal(h.audio.playCount, 1);
  h.state.foreground = true;
  h.render();
  assert.equal(h.audio.playCount, 2);
  h.unmount();
});

test('personal-contact preview discloses no call and stops background/blur audio and pulse work', () => {
  const h = preview('src/app/call.tsx');
  const tree = h.render();
  assert.match(text(tree), /No call has been placed/);
  assert.equal(h.routes.length, 0);
  assert.equal(h.audio.playCount, 1);
  assert.equal(h.animations.repeatCount, 3);
  h.state.foreground = false;
  h.render();
  const repeats = h.animations.repeatCount;
  assert.ok(h.audio.pauseCount > 0);
  h.state.foreground = true; h.state.focused = false;
  h.render();
  assert.equal(h.audio.playCount, 1);
  assert.equal(h.animations.repeatCount, repeats);
  h.state.focused = true; h.state.reduced = true;
  h.render();
  assert.equal(h.animations.repeatCount, repeats, 'reduced motion does not restart pulsing');
  h.unmount();
});

test('foreground subscription follows AppState and removes its listener on unmount', () => {
  const hooks = stateHooks();
  let listener, removed = false;
  const { useForeground } = loadFrontend('src/hooks/use-foreground.ts', {
    react: hooks,
    'react-native': { AppState: { currentState: 'background', addEventListener(_, callback) {
      listener = callback; return { remove() { removed = true; } };
    } } },
  });
  const render = () => { hooks.reset(); const value = useForeground(); hooks.flush(); return value; };
  assert.equal(render(), false);
  listener('active'); assert.equal(render(), true);
  listener('inactive'); assert.equal(render(), false);
  hooks.unmount(); assert.equal(removed, true);
});
