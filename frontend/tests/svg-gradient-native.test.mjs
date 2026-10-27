import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { mock, test } from 'node:test';
import { runInThisContext } from 'node:vm';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const nativePath = require.resolve('react-native-svg/lib/commonjs/lib/extract/extractGradient.js');
const nativeRequire = createRequire(nativePath);
const nativeModule = { exports: {} };
const evaluate = runInThisContext(`(function(require,module,exports){${readFileSync(nativePath, 'utf8')}\n})`, { filename: nativePath });
// Only bridge processColor; offset validation runs through the installed native extractor.
evaluate(name => name === 'react-native' ? { processColor: require('react-native-web').processColor }
  : nativeRequire(name), nativeModule, nativeModule.exports);
const extractGradient = nativeModule.exports.default;

function nativeOffset(offset) {
  return extractGradient({ id: 'regression-check', children: [
    React.createElement('stop', { key: 'stop', offset, stopColor: '#FFFFFF', stopOpacity: 1 }),
  ] }, {}).gradient[0];
}

test('native SVG parser reproduces the reported shorthand-string failure', () => {
  const warnings = mock.method(console, 'warn', () => {});
  try {
    assert.equal(nativeOffset('.42'), 0);
    assert.equal(warnings.mock.callCount(), 1);
    assert.equal(nativeOffset(0.42), 0.42);
    assert.equal(warnings.mock.callCount(), 1);
  } finally { warnings.mock.restore(); }
});

test('every component gradient stop is accepted by the native SVG parser without warning or fallback', () => {
  const root = new URL('../src/components/', import.meta.url);
  const warnings = mock.method(console, 'warn', () => {});
  let count = 0;
  try {
    for (const entry of readdirSync(root)) {
      if (!entry.endsWith('.tsx')) continue;
      const source = ts.createSourceFile(entry, readFileSync(new URL(entry, root), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node) {
        if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(source) === 'Stop') {
          const attribute = node.attributes.properties.find(value => ts.isJsxAttribute(value) && value.name.getText(source) === 'offset');
          assert.ok(attribute?.initializer, `Missing gradient offset: ${entry}`);
          const initializer = attribute.initializer;
          let value;
          if (ts.isStringLiteral(initializer)) value = initializer.text;
          else if (ts.isJsxExpression(initializer) && initializer.expression && ts.isNumericLiteral(initializer.expression)) value = Number(initializer.expression.text);
          else assert.fail(`Add native validation for dynamic offset in ${entry}`);
          const expected = typeof value === 'string' && value.endsWith('%') ? Number.parseFloat(value) / 100 : Number(value);
          assert.equal(nativeOffset(value), expected, `Native offset changed in ${path.basename(entry)}: ${value}`);
          count++;
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
    assert.ok(count > 50, 'Expected to validate the complete SVG component collection');
    assert.equal(warnings.mock.callCount(), 0);
  } finally { warnings.mock.restore(); }
});
