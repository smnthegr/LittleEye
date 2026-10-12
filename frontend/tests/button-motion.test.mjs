import assert from 'node:assert/strict';
import test from 'node:test';
import { getPressTransform } from '../src/utils/button-motion.ts';

test('pressing keeps navbar positioning and existing rotation without mutating the caller', () => {
  const transforms = Object.freeze([{ translateX: -6 }, { rotate: '45deg' }]);
  const animatedScale = { current: 0.975 };
  const result = getPressTransform(transforms, animatedScale, false);
  assert.deepEqual(result.slice(0, 2), transforms);
  assert.equal(result[2].scale, animatedScale);
  assert.equal(transforms.length, 2);
});

test('reduced motion keeps the original transform without adding a press movement', () => {
  const transforms = [{ translateX: 6 }];
  assert.equal(getPressTransform(transforms, { current: 0.975 }, true), transforms);
  assert.equal(getPressTransform(undefined, { current: 0.975 }, true), undefined);
});

test('web string transforms are preserved rather than replaced or spread into characters', () => {
  assert.equal(getPressTransform('translateX(6px)', { current: 0.975 }, false), 'translateX(6px)');
});
