import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { NAVIGATION_TRANSITION_MS, navigateWithTransition } from '../src/components/navigation-transition.ts';

test('rapid tab taps cause one navigation, and the next switch works after the transition', async () => {
  const destinations = [];
  assert.equal(navigateWithTransition(() => destinations.push('first-aid')), true);
  assert.equal(navigateWithTransition(() => destinations.push('duplicate-first-aid')), false);
  assert.equal(navigateWithTransition(() => destinations.push('home-too-early')), false);
  assert.deepEqual(destinations, ['first-aid']);

  await delay(NAVIGATION_TRANSITION_MS + 20);
  assert.equal(navigateWithTransition(() => destinations.push('home')), true);
  assert.deepEqual(destinations, ['first-aid', 'home']);
  await delay(NAVIGATION_TRANSITION_MS + 20);
});

test('a failed navigation releases the guard so the user can immediately retry', async () => {
  const failure = new Error('Route could not open');
  assert.throws(() => navigateWithTransition(() => { throw failure; }), error => error === failure);
  let retried = false;
  assert.equal(navigateWithTransition(() => { retried = true; }), true);
  assert.equal(retried, true);
  await delay(NAVIGATION_TRANSITION_MS + 20);
});
