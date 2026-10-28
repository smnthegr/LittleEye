import assert from 'node:assert/strict';
import test from 'node:test';
import { getHomeDestination } from '../src/utils/session-navigation.ts';
import { sessionRoutes, sessionStack, UNHANDLED } from './helpers/session-routes.mjs';

const signedOut = { signedIn: false, accepted: true, camera: null };
const cameraSetup = { ...signedOut, signedIn: true };
const connected = { ...cameraSetup, camera: { name: 'Camera' } };

for (const entry of ['sign-in', 'set-up']) {
  for (const session of [cameraSetup, connected]) {
    const target = session.camera ? 'home' : 'connect-camera';
    test(`${entry} opens ${target} without calling or retaining account setup history`, () => {
      const stack = sessionStack(signedOut, 'index');
      stack.dispatch({ type: 'PUSH', payload: { name: entry } });
      stack.settle(session);
      assert.deepEqual(stack.state.routes.map(route => route.name), [target]);
      assert.equal(stack.dispatch({ type: 'POP', payload: { count: 1 } }), UNHANDLED);
    });
  }
}

test('opening Home before camera setup redirects to camera setup and cannot loop back to Call', () => {
  const stack = sessionStack(cameraSetup, 'emergency-hotline');
  stack.dispatch({ type: 'REPLACE', payload: { name: 'home' } });
  stack.settle(cameraSetup);
  assert.deepEqual(stack.state.routes.map(route => route.name), ['connect-camera']);
  assert.equal(stack.dispatch({ type: 'POP', payload: { count: 1 } }), UNHANDLED);
});

test('saving a camera makes Home available without redirecting unrelated screens', () => {
  const stack = sessionStack(cameraSetup, 'connect-camera');
  stack.settle(connected);
  assert.equal(stack.state.routes[stack.state.index].name, 'connect-camera');
  stack.dispatch({ type: 'REPLACE', payload: { name: 'home' } });
  stack.dispatch({ type: 'PUSH', payload: { name: 'history' } });
  stack.settle(connected);
  assert.equal(stack.state.routes[stack.state.index].name, 'history');
});

test('each guarded route has an explicit available destination, regardless of filesystem order', () => {
  for (const session of [signedOut, { ...signedOut, accepted: false }, cameraSetup, connected]) {
    const { guards } = sessionRoutes(session);
    for (const [name, href] of guards) {
      assert.ok(href, `${name} needs an explicit destination`);
      assert.equal(guards.has(href === '/' ? 'index' : href.slice(1)), false, name);
      assert.notEqual(href, '/call');
    }
  }
});

test('Home follows the same session and camera requirements as the protected route', () => {
  for (const signedIn of [false, true]) {
    for (const accepted of [false, true]) {
      for (const camera of [null, { name: 'Camera' }]) {
        const destination = getHomeDestination({ signedIn, accepted, camera });
        assert.equal(destination, !signedIn || !accepted ? '/' : camera ? '/home' : '/connect-camera');
      }
    }
  }
});
