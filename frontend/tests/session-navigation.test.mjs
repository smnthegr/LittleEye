import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { getHomeDestination } from '../src/utils/session-navigation.ts';

function navigationHarness(initialSession) {
  let session = initialSession;
  let navigationState = { key: 'root-stack' };
  let previous;
  let effect;
  const destinations = [];
  const module = { exports: {} };
  const source = readFileSync(new URL('../src/hooks/use-session-navigation.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require(name) {
      if (name === 'react') return {
        useRef(initial) { previous ??= { current: initial }; return previous; },
        useEffect(callback) { effect = callback; },
      };
      if (name === 'expo-router') return {
        router: { replace(destination) { destinations.push(destination); } },
        useRootNavigationState: () => navigationState,
      };
      if (name === '@/components/app-session') return { useAppSession: () => session };
      if (name === '@/utils/session-navigation') return { getHomeDestination };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    destinations,
    commit(nextSession = session, ready = true) {
      session = nextSession;
      navigationState = ready ? { key: 'root-stack' } : undefined;
      module.exports.useSessionNavigation();
      effect();
    },
  };
}

test('signing out and back in routes to camera setup instead of the previous First Aid screen', () => {
  const signedIn = { signedIn: true, accepted: true, camera: { name: 'Camera' } };
  const signedOut = { ...signedIn, signedIn: false, camera: null };
  const harness = navigationHarness(signedIn);
  harness.commit();
  assert.deepEqual(harness.destinations, []);
  harness.commit(signedOut);
  harness.commit({ ...signedOut, signedIn: true });
  assert.deepEqual(harness.destinations, ['/', '/connect-camera']);
  assert.equal(getHomeDestination({ ...signedOut, signedIn: true }), '/connect-camera');
  assert.equal(getHomeDestination(signedIn), '/home');
  // Saving camera details must not redirect unrelated pages; camera setup owns its handoff.
  harness.commit(signedIn);
  assert.deepEqual(harness.destinations, ['/', '/connect-camera']);
});

test('session redirects wait for the navigator and run once per sign-in change', () => {
  const signedOut = { signedIn: false, accepted: true, camera: null };
  const harness = navigationHarness(signedOut);
  harness.commit(signedOut, false);
  harness.commit({ ...signedOut, signedIn: true }, false);
  assert.deepEqual(harness.destinations, []);
  harness.commit({ ...signedOut, signedIn: true });
  harness.commit({ ...signedOut, signedIn: true });
  assert.deepEqual(harness.destinations, ['/connect-camera']);
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
