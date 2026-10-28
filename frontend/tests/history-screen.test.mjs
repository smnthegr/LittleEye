import assert from 'node:assert/strict';
import test from 'node:test';
import * as timeline from '../src/utils/playback-timeline.ts';
import { loadFrontend, nodes, stateHooks, text } from './helpers/ui-test.mjs';

const fixture = {
  id: 'incident', kind: 'event', uri: 'fixture:original', date: '28/10/2026',
  detail: 'Fixture event', fallAtSeconds: 2,
  trimmedClip: { durationSeconds: 30, fallOffsetSeconds: 10 },
};

function screen() {
  const hooks = stateHooks();
  const session = { fallEvents: [fixture] };
  const inputs = [];
  const actions = [];
  const video = {
    available: true, status: 'readyToPlay', seconds: 10, isPlaying: false, player: {},
    play: () => actions.push('play'), pause: () => actions.push('pause'), seek: seconds => actions.push(['seek', seconds]),
  };
  const fullscreen = { visible: false, transitioning: false, toggle() {} };
  const components = new Proxy({}, { get: (_, name) => name });
  const { default: History } = loadFrontend('src/app/history.tsx', new Proxy({
    react: hooks,
    'react-native': {
      ActivityIndicator: 'ActivityIndicator', Pressable: 'Pressable', Text: 'Text', View: 'View',
      StyleSheet: { create: value => value, absoluteFill: {} }, Easing: { out: x => x },
      Animated: { Value: class { interpolate() { return 0; } }, View: 'AnimatedView', timing: () => ({ start() {}, stop() {} }) },
      useWindowDimensions: () => ({ width: 390, height: 844 }),
    },
    'expo-image': { Image: 'Image' }, 'expo-status-bar': { StatusBar: 'StatusBar' },
    'expo-router': { router: { canGoBack: () => false, replace: href => actions.push(href) } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '@/components/app-session': { useAppSession: () => session },
    '@/hooks/use-footage-video': { useFootageVideo: input => { inputs.push(input); return video; } },
    '@/hooks/use-reduced-motion': { useReducedMotion: () => true },
    '@/hooks/use-video-fullscreen': { useVideoFullscreen: () => fullscreen },
    '@/hooks/use-responsive-layout': {
      useResponsiveLayout: () => ({ pageWidth: 390, scaleSize: x => x }), useResponsiveStyles: value => value,
    },
    '@/utils/responsive': { getPageHeaderLayout: () => ({ contentTop: 72 }) },
    '@/utils/playback-timeline': timeline,
    '@/utils/recorded-footage': {
      getRecordingRange: entry => entry?.trimmedClip ? { start: 0, end: entry.trimmedClip.durationSeconds } : timeline.FULL_TIMELINE_RANGE,
      getRecordingInitialTime: entry => entry.trimmedClip?.fallOffsetSeconds ?? 0,
    },
    '@/constants/brand': { BrandColors: {}, BrandFonts: {}, PageTypography: {} },
  }, {
    has: (target, name) => name in target || name.startsWith('@/components/'),
    get: (target, name) => name in target ? target[name] : components,
  }));
  const render = () => { hooks.reset(); return History(); };
  const main = () => render().props.children[1];
  function press(label) {
    const button = nodes(main()).find(node => node.props.onPress && (node.props.accessibilityLabel === label || text(node).trim() === label));
    assert.ok(button, label);
    button.props.onPress();
  }
  function open() {
    press('Events');
    nodes(main()).find(node => node.props.accessibilityLabel?.startsWith('Play fall event')).props.onPress();
  }
  return { session, video, fullscreen, inputs, actions, render, main, press, open };
}

test('History shows loading and error feedback, permits recovery, and never plays an unready clip', () => {
  const h = screen();
  h.open();
  h.video.status = 'loading';
  assert.ok(nodes(h.main()).some(node => node.type === 'ActivityIndicator'));
  assert.equal(nodes(h.main()).some(node => node.props.accessibilityLabel === 'Play footage'), false);
  h.video.status = 'error'; h.video.error = new Error('Synthetic load failure');
  const error = nodes(h.main()).find(node => node.type === 'VideoEmptyState');
  assert.equal(error.props.title, 'Video could not load');
  assert.match(error.props.detail, /reopen.*retry/);
  assert.equal(nodes(h.main()).some(node => node.type === 'FootageVideo'), false);
  assert.equal(nodes(h.main()).some(node => node.props.accessibilityLabel === 'Play footage'), false);
  nodes(h.main()).find(node => node.type === 'FixedPageHeader').props.onBack();
  h.main();
  assert.equal(h.inputs.at(-1).source, null);
  h.video.status = 'readyToPlay'; h.video.error = undefined;
  nodes(h.main()).find(node => node.props.accessibilityLabel?.startsWith('Play fall event')).props.onPress();
  h.press('Play footage');
  assert.equal(h.actions.filter(action => action === 'play').length, 1);
});

test('fullscreen uses the same recording error and loading states as portrait', () => {
  const h = screen(); h.open(); h.fullscreen.visible = true;
  h.video.status = 'loading';
  assert.ok(nodes(h.render().props.children[0].props.footage).some(node => node.type === 'ActivityIndicator'));
  h.video.status = 'error';
  assert.equal(nodes(h.render().props.children[0].props.footage).find(node => node.type === 'VideoEmptyState').props.title, 'Video could not load');
});

test('an open incident resolves new same-ID clip data and closes when the event is removed', () => {
  const h = screen(); h.open();
  h.session.fallEvents = [{ ...fixture, uri: 'fixture:renewed', detail: 'Updated event', trimmedClip: { durationSeconds: 5, fallOffsetSeconds: 1 } }];
  assert.ok(text(h.main()).includes('Updated event'));
  assert.equal(h.inputs.at(-1).source, 'fixture:renewed');
  assert.equal(h.inputs.at(-1).range.end, 5);
  h.session.fallEvents = [];
  assert.ok(text(h.main()).includes('No events recorded yet'));
  assert.equal(h.inputs.at(-1).source, null);
});
