import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/components/glow-button.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));

// Exercise the production component's handlers/effects with controllable native events.
function harness() {
  const slots = [];
  const listeners = new Map();
  const animations = [];
  let cursor = 0;
  let effects = [];
  let reducedMotion = false;
  let unmounted = false;
  let props = { style: { borderRadius: 25 }, children: 'icon', background: 'artwork' };
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!slots[i]) {
        const slot = { value: typeof initial === 'function' ? initial() : initial };
        slot.set = value => {
          assert.equal(unmounted, false, 'No state writes after unmount');
          slot.value = typeof value === 'function' ? value(slot.value) : value;
        };
        slots[i] = slot;
      }
      return [slots[i].value, slots[i].set];
    },
    useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i]; },
    useMemo(factory, deps) {
      const i = cursor++;
      if (!sameDeps(slots[i]?.deps, deps)) slots[i] = { value: factory(), deps };
      return slots[i].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(callback, deps) {
      const i = cursor++;
      if (!sameDeps(slots[i]?.deps, deps)) effects.push(() => {
        slots[i]?.cleanup?.();
        slots[i] = { deps, cleanup: callback() };
      });
    },
  };
  class Value {
    constructor(value) { this.value = value; }
    interpolate(config) { return { config }; }
    setValue(value) { this.value = value; }
    stopAnimation() {
      const callback = this.pending;
      this.pending = undefined;
      callback?.({ finished: false });
    }
  }
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === '@/constants/brand') return { BrandColors: { white: '#FFFFFF' } };
      if (name === '@/hooks/use-reduced-motion') return { useReducedMotion: () => reducedMotion };
      if (name === './glow-button-focus') return {};
      if (name === 'react-native') return {
        Pressable: 'Pressable', View: 'View', Platform: { OS: 'android' },
        Easing: { out: x => x, cubic: 'cubic' },
        StyleSheet: {
          create: value => value,
          flatten: value => Array.isArray(value) ? Object.assign({}, ...value.filter(Boolean)) : value,
        },
        AppState: {
          addEventListener(event, callback) {
            const set = listeners.get(event) ?? new Set();
            listeners.set(event, set);
            set.add(callback);
            return { remove: () => set.delete(callback) };
          },
        },
        Animated: {
          Value, View: 'AnimatedView',
          timing(value) { return { start(callback) { value.pending = callback; animations.push({ value, callback }); } }; },
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    animations,
    render(next = {}) {
      props = { ...props, ...next };
      cursor = 0;
      effects = [];
      const tree = module.exports.GlowButton(props);
      effects.forEach(effect => effect());
      return tree;
    },
    emit(event, state) { listeners.get(event)?.forEach(callback => callback(state)); },
    reduceMotion(enabled = true) { reducedMotion = enabled; },
    unmount() { unmounted = true; slots.forEach(slot => slot.cleanup?.()); },
    listenerCount() { return [...listeners.values()].reduce((count, set) => count + set.size, 0); },
  };
}

function feedbackVisible(tree) {
  return tree.props.children({ pressed: true }).props.children.some(child => child?.type === 'View');
}
function pressedStyleCount(tree) { return tree.props.style({ pressed: true }).filter(Boolean).length; }

test('idle buttons have no ripple/shimmer layer before or after app resume', () => {
  const h = harness();
  assert.equal(feedbackVisible(h.render()), false);
  h.emit('change', 'background');
  h.emit('change', 'active');
  const tree = h.render();
  assert.equal(feedbackVisible(tree), false);
  assert.equal(pressedStyleCount(tree), 1);
  h.unmount();
});

test('backgrounding cancels an interrupted press without requiring press-out or another tap', () => {
  const h = harness();
  h.render().props.onPressIn({});
  assert.equal(feedbackVisible(h.render()), true);
  assert.equal(pressedStyleCount(h.render()), 3);
  h.emit('change', 'inactive');
  h.emit('change', 'background');
  h.emit('change', 'active');
  const tree = h.render();
  assert.equal(feedbackVisible(tree), false);
  assert.equal(pressedStyleCount(tree), 1);
  assert.equal(h.animations[0].value.value, 0);
  h.unmount();
});

test('Android focus interruptions clear feedback even without an AppState change', () => {
  const h = harness();
  h.render().props.onPressIn({});
  h.emit('blur');
  h.emit('focus');
  assert.equal(feedbackVisible(h.render()), false);
  assert.equal(pressedStyleCount(h.render()), 1);
  h.unmount();
});

test('late completion from an interrupted tap cannot erase feedback for a new tap', () => {
  const h = harness();
  h.render().props.onPressIn({});
  const oldAnimation = h.animations[0];
  h.emit('change', 'background');
  h.emit('change', 'active');
  h.render().props.onPressIn({});
  oldAnimation.callback({ finished: true });
  assert.equal(feedbackVisible(h.render()), true);
  h.animations.at(-1).callback({ finished: true });
  assert.equal(feedbackVisible(h.render()), false);
  h.render().props.onPressOut({});
  assert.equal(pressedStyleCount(h.render()), 1);
  h.unmount();
});

test('release, disabling and reduced motion each remove feedback layers', () => {
  for (const reason of ['release', 'disabled', 'reduced']) {
    const h = harness();
    h.render().props.onPressIn({});
    if (reason === 'release') h.render().props.onPressOut({});
    if (reason === 'disabled') h.render({ disabled: true });
    if (reason === 'reduced') { h.reduceMotion(); h.render(); }
    assert.equal(feedbackVisible(h.render()), false, reason);
    assert.equal(pressedStyleCount(h.render()), 1, reason);
    // Re-enabling settings must not bring back the previously visible effect.
    h.reduceMotion(false);
    h.render({ disabled: false });
    assert.equal(feedbackVisible(h.render()), false, reason);
    h.unmount();
  }
});

test('unmount removes native listeners and invalidates pending animation callbacks', () => {
  const h = harness();
  h.render().props.onPressIn({});
  assert.equal(h.listenerCount(), 3);
  const animation = h.animations[0];
  h.unmount();
  assert.equal(h.listenerCount(), 0);
  assert.doesNotThrow(() => animation.callback({ finished: true }));
});
