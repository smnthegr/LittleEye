import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { getHomeDestination } from '../../src/utils/session-navigation.ts';

const require = createRequire(import.meta.url);
const react = require('react');
const hooks = {
  ...react, useEffect() {}, useMemo: fn => fn(),
  createContext: current => ({ current }), use: context => context.current,
};
const Stack = Object.assign(() => null, { Protected: 'Protected', Screen: 'Screen' });

function load(url, overrides, suffix = '', transpile = false) {
  const module = { exports: {} };
  const localRequire = createRequire(url);
  let code = readFileSync(url, 'utf8');
  if (transpile) code = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code + suffix, {
    module, exports: module.exports, process,
    require: name => name in overrides ? overrides[name] : localRequire(name),
  });
  return module.exports;
}

// SDK 58 keeps guarded screens declared and resolves fallbacks from route files.
// Exercise its actual guard flattening and redirect resolution, not JSX order.
const { useFilterScreenChildren: filterScreenChildren } = load(new URL('../../node_modules/expo-router/build/layouts/withLayoutContext.js', import.meta.url), {
  react: hooks, '../Route': {}, '../useScreens': {}, './GuardContext': {
    normalizeRouteName: name => name.replace(/\/index$/, ''),
  },
  '../native-tabs/NativeTabTrigger': { isNativeTabTrigger: () => false },
  '../views/Protected': { isProtectedReactElement: node => node?.type === 'Protected' },
  '../views/Screen': { isScreen: node => node?.type === 'Screen' },
});
const { GuardContextProvider } = load(new URL('../../node_modules/expo-router/build/layouts/GuardContext.js', import.meta.url), {
  react: hooks,
  '../Route': {
    ...require('../../node_modules/expo-router/build/sortRoutes.js'),
    LocalRouteParamsContext: { current: {} },
  },
});
const files = readdirSync(new URL('../../src/app/', import.meta.url), { withFileTypes: true });
const routeNode = {
  type: 'layout', route: '', contextKey: './_layout.tsx', loadRoute: () => ({}),
  children: files.filter(file => file.name !== '_layout.tsx').map(file => ({
    route: file.name.replace(/\.tsx$/, ''),
    contextKey: `./${file.name}${file.isDirectory() ? '/_layout.tsx' : ''}`,
  })),
};

export function sessionRoutes(session) {
  const components = new Proxy({}, { get: (_, name) => name });
  const { navigator } = load(new URL('../../src/app/_layout.tsx', import.meta.url), new Proxy({
    react: hooks,
    'expo-router': { Stack, usePathname: () => '/' },
    'react-native': { View: 'View', Platform: { OS: 'web' } },
    '@/components/app-session': { useAppSession: () => session },
    '@/utils/session-navigation': { getHomeDestination },
    '@/hooks/use-reduced-motion': { useReducedMotion: () => true },
    '@/constants/brand': { BrandColors: {} },
    'expo-splash-screen': { preventAutoHideAsync() {} },
    'expo-font': {}, '@expo-google-fonts/vt323': {}, '@/global.css': {},
  }, {
    has: (target, name) => name in target || name.startsWith('@/components/'),
    get: (target, name) => name in target ? target[name] : components,
  }), '\nmodule.exports.navigator = AppNavigator;', true);
  const tree = navigator();
  const stack = react.Children.toArray(tree.props.children).find(node => node.type === Stack);
  const { screens, guardedRedirects } = filterScreenChildren(stack.props.children);
  const resolved = GuardContextProvider({ node: routeNode, guardedRedirects, children: null });
  const guards = resolved.props.children.props.value;
  return { names: screens.map(screen => screen.name), guards };
}

const { StackRouter } = require('../../node_modules/expo-router/build/react-navigation/routers/StackRouter.js');
export const UNHANDLED = require('../../node_modules/expo-router/build/react-navigation/routers/types.js').RouterActionHandling.Unhandled;

export function sessionStack(session, initialName) {
  const router = StackRouter({});
  let config = sessionRoutes(session);
  let state = {
    stale: false, type: 'stack', key: 'test-root', routeKeySeq: 1, index: 0,
    routeNames: config.names, routes: [{ key: 'test-root:0', name: initialName }],
  };
  function dispatch(action) {
    const result = router.getStateForAction(state, action, { routeParamList: {}, routeGetIdList: {} });
    if (result !== UNHANDLED) state = result.state;
    return result;
  }
  function settle(nextSession) {
    config = sessionRoutes(nextSession);
    // The focused guarded screen renders Redirect; the stack then clears guarded
    // history. Run both operations through the installed SDK's reducer.
    const focused = state.routes[state.index].name;
    const destination = config.guards.get(focused);
    if (destination) dispatch({ type: 'REPLACE', payload: { name: destination === '/' ? 'index' : destination.slice(1) } });
    dispatch({ type: 'REMOVE_ROUTES', payload: { routeNames: [...config.guards.keys()] } });
    assert.ok(state.index >= 0);
    assert.equal(config.guards.has(state.routes[state.index].name), false, 'redirect destination must be available');
    return state;
  }
  return { dispatch, settle, get state() { return state; } };
}
