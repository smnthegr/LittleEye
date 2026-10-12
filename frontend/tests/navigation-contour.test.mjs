import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  AID_CONTOUR_DISTANCE,
  CONTOUR_LENGTH,
  CONTOUR_MARKER_LENGTH,
  getNavigationContourPointAtDistance,
  getNavigationContourY,
  HOME_CONTOUR_DISTANCE,
  NAVIGATION_CONTOUR_PATH,
  NAVIGATION_SHAPE_PATH,
} from '../src/utils/navigation-contour.ts';

const asset = readFileSync(new URL('../assets/images/home-nav-wave.svg', import.meta.url), 'utf8');
const tokenizePath = (path) => path.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)/g);

test('coded navigation retains the reference silhouette and contour bounds', () => {
  const artworkPath = asset.match(/<path\s+d="([^"]+)"/)[1];
  assert.deepEqual(tokenizePath(NAVIGATION_SHAPE_PATH), tokenizePath(artworkPath));
  assert.deepEqual(tokenizePath(NAVIGATION_CONTOUR_PATH), tokenizePath(artworkPath.split('V')[0]));
  assert.equal(getNavigationContourY(0), 60);
  assert.equal(getNavigationContourY(91), 53);
  assert.equal(getNavigationContourY(195), 116);
  assert.equal(getNavigationContourY(299), 53);
  assert.equal(getNavigationContourY(390), 60);
  assert.equal(getNavigationContourY(-10), 60);
  assert.equal(getNavigationContourY(400), 60);
});

test('the sliding contour follows the symmetric centre dip rather than a separate arc', () => {
  let previous = getNavigationContourY(71);
  for (let x = 71; x <= 195; x++) {
    const y = getNavigationContourY(x);
    assert.ok(y >= previous - 0.000001, `contour should descend into the central notch at ${x}`);
    assert.ok(Math.abs(y - getNavigationContourY(390 - x)) < 0.000001, `curve must be symmetric at ${x}`);
    previous = y;
  }
  assert.ok(getNavigationContourY(195) - getNavigationContourY(71) > 60);
});

test('arc-length anchors place the sliding marker precisely above the side-tab centres', () => {
  const home = getNavigationContourPointAtDistance(HOME_CONTOUR_DISTANCE);
  const aid = getNavigationContourPointAtDistance(AID_CONTOUR_DISTANCE);
  assert.ok(Math.abs(home.x - 71) < 0.000001);
  assert.ok(Math.abs(aid.x - 319) < 0.000001);
  assert.ok(Math.abs(home.y - getNavigationContourY(home.x)) < 0.01);
  assert.ok(Math.abs(aid.y - getNavigationContourY(aid.x)) < 0.01);
  assert.ok(Math.abs(HOME_CONTOUR_DISTANCE + AID_CONTOUR_DISTANCE - CONTOUR_LENGTH) < 0.000001);
  assert.deepEqual(getNavigationContourPointAtDistance(-10), { x: 0, y: 60 });
  assert.deepEqual(getNavigationContourPointAtDistance(CONTOUR_LENGTH + 10), { x: 390, y: 60 });
});

test('continuous marker movement remains on the curve and leaves both ends clear', () => {
  const halfMarker = CONTOUR_MARKER_LENGTH / 2;
  assert.ok(HOME_CONTOUR_DISTANCE > halfMarker);
  assert.ok(AID_CONTOUR_DISTANCE + halfMarker < CONTOUR_LENGTH);
  let previousX = 0;
  for (let frame = 0; frame <= 120; frame++) {
    const distance = HOME_CONTOUR_DISTANCE + (AID_CONTOUR_DISTANCE - HOME_CONTOUR_DISTANCE) * frame / 120;
    const point = getNavigationContourPointAtDistance(distance);
    assert.ok(point.x > previousX, 'marker should travel forward continuously');
    assert.ok(Math.abs(point.y - getNavigationContourY(point.x)) < 0.02,
      `marker has left the contour at frame ${frame}`);
    previousX = point.x;
  }
  const midpoint = getNavigationContourPointAtDistance(CONTOUR_LENGTH / 2);
  assert.ok(Math.abs(midpoint.x - 195) < 0.000001);
  assert.ok(Math.abs(midpoint.y - 116) < 0.000001);
});
