import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceDemoPlayback,
  DEMO_DURATION_SECONDS,
  formatDemoTime,
  getDemoSecondsAtPosition,
} from '../src/utils/demo-playback.ts';

test('demonstration timestamps stay valid at boundaries and minute changes', () => {
  assert.equal(DEMO_DURATION_SECONDS, 120);
  for (const [seconds, expected] of [[0, '00:00'], [9, '00:09'], [59, '00:59'], [60, '01:00'], [119, '01:59'], [120, '02:00']]) {
    assert.equal(formatDemoTime(seconds), expected);
  }
  assert.equal(formatDemoTime(-4), '00:00');
  assert.equal(formatDemoTime(600), '02:00');
  assert.equal(formatDemoTime(Number.NaN), '00:00');
});

test('seeking uses each track width and clamps drags beyond its edges', () => {
  for (const width of [200, 320, 700]) {
    assert.equal(getDemoSecondsAtPosition(0, width), 0);
    assert.equal(getDemoSecondsAtPosition(width / 4, width), 30);
    assert.equal(getDemoSecondsAtPosition(width / 2, width), 60);
    assert.equal(getDemoSecondsAtPosition(width, width), 120);
    assert.equal(getDemoSecondsAtPosition(-20, width), 0);
    assert.equal(getDemoSecondsAtPosition(width + 20, width), 120);
  }
  assert.equal(getDemoSecondsAtPosition(20, 0), 0);
  assert.equal(getDemoSecondsAtPosition(20, -10), 0);
  assert.equal(getDemoSecondsAtPosition(Number.NaN, 200), 0);
  assert.equal(getDemoSecondsAtPosition(20, Number.NaN), 0);
});

test('playback advances and stops with a reset at the two-minute end', () => {
  assert.deepEqual(advanceDemoPlayback(0), { seconds: 1, playing: true });
  assert.deepEqual(advanceDemoPlayback(118), { seconds: 119, playing: true });
  assert.deepEqual(advanceDemoPlayback(119), { seconds: 0, playing: false });
  assert.deepEqual(advanceDemoPlayback(120), { seconds: 0, playing: false });
  assert.deepEqual(advanceDemoPlayback(200), { seconds: 0, playing: false });
});
