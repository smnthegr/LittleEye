import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children)] : [];

function field(initial = {}) {
  let visible = false;
  let props = initial;
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL('../src/components/password-input.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require(name) {
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'react') return { useState: () => [visible, update => { visible = update(visible); }] };
      if (name === 'react-native') return { View: 'View', TextInput: 'TextInput', Pressable: 'Pressable',
        StyleSheet: { create: s => s, flatten: s => Object.assign({}, ...[s].flat(Infinity).filter(Boolean)) } };
      if (name === 'expo-symbols') return { SymbolView: 'SymbolView' };
      if (name === '@/constants/brand') return { BrandColors: { blue: '#32507B' } };
      if (name === '@/hooks/use-responsive-layout') return { useResponsiveStyles: s => s };
      throw new Error(name);
    },
  });
  const find = type => nodes(module.exports.PasswordInput(props)).find(n => n.type === type);
  return { input: () => find('TextInput').props, toggle: () => find('Pressable').props,
    update: next => { props = { ...props, ...next }; } };
}

test('password visibility toggles without changing the value, validation callbacks or submit action', () => {
  const changes = [];
  let submits = 0;
  const password = field({ accessibilityLabel: 'Password', value: 'My Password 123!', autoComplete: 'current-password',
    onChangeText: value => changes.push(value), onSubmitEditing: () => { submits++; } });
  assert.equal(password.input().secureTextEntry, true);
  assert.equal(password.toggle().accessibilityLabel, 'Show password');
  password.toggle().onPress();
  assert.equal(password.input().secureTextEntry, false);
  assert.equal(password.toggle().accessibilityLabel, 'Hide password');
  assert.equal(password.input().value, 'My Password 123!');
  assert.equal(password.input().autoComplete, 'current-password');
  assert.equal(changes.length, 0, 'Revealing must not rewrite the password');
  password.input().onChangeText('new value');
  password.input().onSubmitEditing();
  assert.deepEqual(changes, ['new value']); assert.equal(submits, 1);
  password.toggle().onPress();
  assert.equal(password.input().secureTextEntry, true);
});

test('password and confirmation have independent visibility and unavailable fields stay masked', () => {
  const password = field({ accessibilityLabel: 'Create a Password' });
  const confirmation = field({ accessibilityLabel: 'Confirm Password' });
  password.toggle().onPress();
  assert.equal(password.input().secureTextEntry, false);
  assert.equal(confirmation.input().secureTextEntry, true);
  assert.equal(confirmation.toggle().accessibilityHint, 'Confirm Password');
  password.update({ editable: false });
  assert.equal(password.input().secureTextEntry, true);
  assert.equal(password.toggle().disabled, true);
  assert.equal(password.toggle().accessibilityState.disabled, true);
});
