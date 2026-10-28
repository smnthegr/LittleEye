import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { createFootageClock } from '../src/utils/footage-clock.ts';
import { createPlaybackLifetime } from '../src/utils/playback-lifetime.ts';
import { createMediaSourceQueue } from '../src/utils/media-source-queue.ts';

const require = createRequire(import.meta.url);

// Exercise the production hook against native-player events without a decoder.
function playerHarness(range) {
  const listeners = new Map();
  const cleanups = [];
  const states = [];
  const player = {
    currentTime: 0, playing: false, status: 'readyToPlay', pauseCount: 0,
    play() { this.playing = true; },
    pause() { this.playing = false; this.pauseCount++; },
    async replaceAsync() {},
  };
  const react = {
    useState(initial) {
      const index = states.length;
      states.push(typeof initial === 'function' ? initial() : initial);
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useRef: current => ({ current }), useMemo: fn => fn(), useCallback: fn => fn,
    useEffect: fn => { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); },
    useLayoutEffect: fn => { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); },
  };
  const dependencies = {
    react,
    expo: {
      useEvent: (_, name) => name === 'playingChange' ? { isPlaying: player.playing } : { status: player.status },
      useEventListener: (_, name, callback) => listeners.set(name, callback),
    },
    'expo-router': { useIsFocused: () => true, useFocusEffect: fn => { cleanups.push(fn()); } },
    'expo-video': { useVideoPlayer: (_, configure) => { configure(player); return player; } },
    'react-native': { Platform: { OS: 'web' }, AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) } },
    '@/utils/footage-clock': { createFootageClock },
    '@/utils/playback-lifetime': { createPlaybackLifetime },
    '@/utils/media-source-queue': { createMediaSourceQueue },
    '@/utils/playback-timeline': { FULL_TIMELINE_RANGE: { start: 0, end: 86400 } },
  };
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL('../src/hooks/use-footage-video.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name in dependencies) return dependencies[name];
    return require(name);
  } });
  const video = module.exports.useFootageVideo({ source: 'https://example.com/fall.mp4', range });
  return {
    player, video, get seconds() { return states[1]; },
    emit: (name, event) => listeners.get(name)(event),
    unmount: () => cleanups.forEach(cleanup => cleanup()),
  };
}

test('an event seeks inside its clip, restores that position on load, and stops at the highlight boundary', () => {
  const harness = playerHarness({ start: 0, end: 30.25 });
  harness.video.seek(10.5);
  harness.emit('sourceLoad');
  assert.equal(harness.player.currentTime, 10.5);
  harness.video.play();
  harness.emit('timeUpdate', { currentTime: 15.7 });
  assert.equal(harness.seconds, 15);
  harness.emit('timeUpdate', { currentTime: 30.4 });
  assert.equal(harness.seconds, 30.25);
  assert.equal(harness.player.currentTime, 30.25);
  assert.equal(harness.player.playing, false);
  harness.video.seek(0);
  harness.video.play();
  assert.equal(harness.player.currentTime, 0);
  assert.equal(harness.player.playing, true);
});

test('natural clip completion publishes its precise end so a fractional-duration clip can replay', () => {
  const harness = playerHarness({ start: 0, end: 30.25 });
  harness.video.play();
  harness.player.currentTime = 30.25;
  harness.player.playing = false;
  harness.emit('playToEnd');
  assert.equal(harness.seconds, 30.25);
  harness.video.seek(0);
  harness.video.play();
  assert.equal(harness.player.playing, true);
});

test('event seeking stays within available footage and late completion events do nothing after unmount', () => {
  const harness = playerHarness({ start: 100, end: 130 });
  harness.video.seek(0);
  assert.equal(harness.player.currentTime, 100);
  harness.video.seek(999);
  assert.equal(harness.player.currentTime, 130);
  harness.unmount();
  harness.player.currentTime = 120;
  harness.emit('playToEnd');
  harness.emit('timeUpdate', { currentTime: 120 });
  assert.equal(harness.seconds, 130);
});

test('a refreshed shorter clip clamps the restored media position and displayed clock', () => {
  const range = { start: 0, end: 30 };
  const harness = playerHarness(range);
  harness.video.seek(25);
  range.end = 5;
  harness.emit('sourceLoad');
  assert.equal(harness.player.currentTime, 5);
  assert.equal(harness.seconds, 5);
  harness.video.seek(NaN);
  assert.equal(harness.player.currentTime, 0);
});
