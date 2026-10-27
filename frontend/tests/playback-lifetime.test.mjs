import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlaybackLifetime } from '../src/utils/playback-lifetime.ts';

test('video stops before native release and focus cleanup never touches the released object', () => {
  let released = false;
  let pauses = 0;
  const lifetime = createPlaybackLifetime({
    pause() {
      if (released) throw new Error('Unable to find the native shared object');
      pauses++;
    },
  });
  lifetime.mount();
  lifetime.unmount(); // React layout cleanup.
  released = true; // Expo useVideoPlayer passive cleanup.
  assert.doesNotThrow(() => lifetime.pause()); // Router focus cleanup / late AppState callback.
  assert.doesNotThrow(() => lifetime.unmount());
  assert.equal(pauses, 1);
  assert.equal(lifetime.active, false);
});

test('blur and background pause a mounted player without disposing it', () => {
  let pauses = 0;
  const lifetime = createPlaybackLifetime({ pause() { pauses++; } });
  lifetime.mount();
  lifetime.pause();
  lifetime.pause();
  assert.equal(pauses, 2);
  assert.equal(lifetime.active, true);
});

test('Fast Refresh can clean up and reattach the retained player', () => {
  let pauses = 0;
  const lifetime = createPlaybackLifetime({ pause() { pauses++; } });
  lifetime.mount();
  lifetime.unmount();
  lifetime.mount();
  lifetime.pause();
  assert.equal(pauses, 2);
  assert.equal(lifetime.active, true);
});

test('unrelated playback failures are not silently swallowed', () => {
  const failure = new Error('Audio session failure');
  const lifetime = createPlaybackLifetime({ pause() { throw failure; } });
  lifetime.mount();
  assert.throws(() => lifetime.pause(), failure);
});
