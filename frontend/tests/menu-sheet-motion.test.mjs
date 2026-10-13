import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldDismissMenuSheet, shouldStartMenuDrag } from '../src/utils/menu-sheet-motion.ts';

test('downward movement captures early, including diagonal pulls over options', () => {
  assert.equal(shouldStartMenuDrag(5, 0), true);
  assert.equal(shouldStartMenuDrag(8, 12), true);
  assert.equal(shouldStartMenuDrag(3, 0), false);
  assert.equal(shouldStartMenuDrag(-10, 0), false);
  assert.equal(shouldStartMenuDrag(5, 30), false);
});

test('short drags return to the open position', () => {
  assert.equal(shouldDismissMenuSheet(20, 0.2, 450), false);
  assert.equal(shouldDismissMenuSheet(5, 1, 450), false);
  assert.equal(shouldDismissMenuSheet(-50, -1, 450), false);
});

test('a deliberate downward drag or flick closes the sheet', () => {
  assert.equal(shouldDismissMenuSheet(36, 0, 450), true);
  assert.equal(shouldDismissMenuSheet(12, 0.4, 450), true);
  assert.equal(shouldDismissMenuSheet(30, 0, 300), true);
});
