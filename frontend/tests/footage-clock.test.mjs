import assert from 'node:assert/strict';
import test from 'node:test';
import { createFootageClock } from '../src/utils/footage-clock.ts';

test('actual footage does not wrap at the removed sample-video duration', () => {
  const clock = createFootageClock();
  assert.equal(clock.update(52), 52);
  assert.equal(clock.update(53), 53);
  assert.equal(clock.update(3600), 3600);
  assert.equal(clock.mediaTime, 3600);
});

test('seek and real media events share the actual position without invented progress', () => {
  const clock = createFootageClock();
  assert.equal(clock.seconds, 0);
  assert.equal(clock.seek(125.5), 125.5);
  assert.equal(clock.update(125.75), 125.75);
  assert.equal(clock.update(Number.NaN), 125.75);
});
