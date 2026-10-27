import assert from 'node:assert/strict';
import test from 'node:test';
import { createMediaSourceQueue } from '../src/utils/media-source-queue.ts';

test('leaving the page unloads video after an in-flight load instead of restoring hidden playback', async () => {
  let finishLoad;
  const loading = new Promise(resolve => { finishLoad = resolve; });
  const calls = [];
  let current;
  const replace = createMediaSourceQueue(async source => {
    calls.push(source);
    if (source !== null) await loading;
    current = source;
  }, () => true);
  const opened = replace('sample');
  await Promise.resolve();
  await Promise.resolve();
  const closed = replace(null);
  assert.deepEqual(calls, ['sample']);
  finishLoad();
  await opened;
  await closed;
  assert.deepEqual(calls, ['sample', null]);
  assert.equal(current, null);
});

test('rapid navigation finishes with only the currently requested source loaded', async () => {
  const calls = [];
  const replace = createMediaSourceQueue(async source => { calls.push(source); }, () => true);
  await Promise.all([replace('sample'), replace(null), replace('sample'), replace(null)]);
  assert.deepEqual(calls, ['sample', null, 'sample', null]);
});

test('a failed load does not prevent the inactive page from unloading', async () => {
  const calls = [];
  const replace = createMediaSourceQueue(async source => {
    calls.push(source);
    if (source) throw new Error('Load failed');
  }, () => true);
  await assert.rejects(replace('sample'), /Load failed/);
  await replace(null);
  assert.deepEqual(calls, ['sample', null]);
});

test('queued work never accesses a player after its lifetime ends', async () => {
  let active = true;
  const calls = [];
  const replace = createMediaSourceQueue(async source => { calls.push(source); }, () => active);
  const pending = replace('sample');
  active = false;
  await pending;
  assert.deepEqual(calls, []);
});
