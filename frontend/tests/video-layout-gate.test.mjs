import assert from 'node:assert/strict';
import test from 'node:test';
import { createVideoLayoutGate } from '../src/utils/video-layout-gate.ts';

test('landscape reveal waits for rotation and the last safe-area update', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const layout = createVideoLayoutGate();
  layout.update(390, 844);
  let revealed = false;
  const ready = layout.wait(true).then(() => { revealed = true; });
  t.mock.timers.tick(150);
  await Promise.resolve();
  assert.equal(revealed, false, 'the portrait modal must stay concealed');
  layout.update(844, 390);
  t.mock.timers.tick(70);
  layout.invalidate(); // The notch/gesture insets often arrive after the new size.
  t.mock.timers.tick(99);
  await Promise.resolve();
  assert.equal(revealed, false, 'late inset changes restart the settling window');
  t.mock.timers.tick(1);
  await ready;
  assert.equal(revealed, true);
});

test('exit keeps the page concealed until the portrait surface settles', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const layout = createVideoLayoutGate();
  layout.update(844, 390);
  let dismissed = false;
  const ready = layout.wait(false).then(() => { dismissed = true; });
  t.mock.timers.tick(200);
  await Promise.resolve();
  assert.equal(dismissed, false);
  layout.update(390, 844);
  t.mock.timers.tick(100);
  await ready;
  assert.equal(dismissed, true);
});

test('unsupported rotation still reveals fullscreen at the available size', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const layout = createVideoLayoutGate();
  layout.update(390, 844);
  const ready = layout.wait();
  t.mock.timers.tick(100);
  await ready;
});

test('missing layout events cannot leave the viewer stuck in transition', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const layout = createVideoLayoutGate();
  const ready = layout.wait(true);
  t.mock.timers.tick(850);
  await ready;
});

test('leaving the route cancels pending layout waits and resets stale dimensions', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const layout = createVideoLayoutGate();
  layout.update(844, 390);
  const oldWait = layout.wait(true);
  layout.reset();
  await oldWait;
  let ready = false;
  const nextWait = layout.wait(true).then(() => { ready = true; });
  t.mock.timers.tick(100);
  await Promise.resolve();
  assert.equal(ready, false, 'a reopened modal needs a fresh layout');
  layout.update(844, 390);
  t.mock.timers.tick(100);
  await nextWait;
});
