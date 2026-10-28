import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

export function loadFrontend(relative, dependencies, globals = {}) {
  const module = { exports: {} };
  const source = readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, ...globals,
    require(name) {
      if (name in dependencies) return dependencies[name];
      if (name === 'react/jsx-runtime') return require(name);
      if (name.includes('/assets/')) return 'fixture:asset';
      throw new Error(`Unexpected dependency in ${relative}: ${name}`);
    },
  });
  return module.exports;
}

export function stateHooks() {
  let cursor = 0;
  const slots = [];
  const pending = [];
  function memo(factory, deps) {
    const i = cursor++;
    if (!slots[i] || !deps || deps.some((d, n) => d !== slots[i].deps[n])) slots[i] = { deps, value: factory() };
    return slots[i].value;
  }
  function effect(callback, deps) {
    const i = cursor++;
    if (!slots[i] || !deps || deps.some((d, n) => d !== slots[i].deps[n])) {
      const previous = slots[i];
      const slot = slots[i] = { deps };
      pending.push(() => { previous?.cleanup?.(); slot.cleanup = callback(); });
    }
  }
  return {
    reset() { cursor = 0; },
    flush() { while (pending.length) pending.shift()(); },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { state: typeof initial === 'function' ? initial() : initial };
      return [slots[i].state, next => { slots[i].state = typeof next === 'function' ? next(slots[i].state) : next; }];
    },
    useRef(initial) { return memo(() => ({ current: initial }), []); },
    useMemo: memo,
    useCallback: (callback, deps) => memo(() => callback, deps),
    useEffect: effect,
    useLayoutEffect: effect,
    createContext: require('react').createContext,
  };
}

export function nodes(tree) {
  return Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children)] : [];
}

export function text(tree) {
  return Array.isArray(tree) ? tree.map(text).join(' ') : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : tree?.props ? text(tree.props.children) : '';
}
