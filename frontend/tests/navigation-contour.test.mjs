import assert from 'node:assert/strict';
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
  NAVIGATION_SIDE_CENTER_X,
} from '../src/utils/navigation-contour.ts';

const tokenizePath = (path) => path.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)/g);

function sampleOutline(path) {
  const tokens = tokenizePath(path);
  const points = [];
  let cursor = 0;
  let current;
  let start;
  while (cursor < tokens.length) {
    const command = tokens[cursor++];
    if (command === 'M') {
      current = { x: Number(tokens[cursor++]), y: Number(tokens[cursor++]) };
      start = current;
      points.push(current);
    } else if (command === 'C') {
      const coordinates = tokens.slice(cursor, cursor + 6).map(Number);
      cursor += 6;
      const [x1, y1, x2, y2, x3, y3] = coordinates;
      for (let step = 1; step <= 64; step++) {
        const t = step / 64;
        const r = 1 - t;
        points.push({
          x: r ** 3 * current.x + 3 * r ** 2 * t * x1 + 3 * r * t ** 2 * x2 + t ** 3 * x3,
          y: r ** 3 * current.y + 3 * r ** 2 * t * y1 + 3 * r * t ** 2 * y2 + t ** 3 * y3,
        });
      }
      current = { x: x3, y: y3 };
    } else if (command === 'H') {
      current = { x: Number(tokens[cursor++]), y: current.y };
      points.push(current);
    } else if (command === 'V') {
      current = { x: current.x, y: Number(tokens[cursor++]) };
      points.push(current);
    } else if (command === 'Z') {
      points.push(start);
    } else {
      assert.fail(`Unexpected outline command ${command}`);
    }
  }
  return points;
}

test('the rounded dock stays attached to both edges and closes at the bottom', () => {
  const outline = sampleOutline(NAVIGATION_SHAPE_PATH);
  assert.deepEqual(outline[0], outline.at(-1), 'the dock must close back onto its outer shoulder');
  assert.equal(tokenizePath(NAVIGATION_SHAPE_PATH).at(-1), 'Z');
  assert.equal(Math.min(...outline.map(point => point.x)), 0);
  assert.equal(Math.max(...outline.map(point => point.x)), 390);
  assert.equal(Math.min(...outline.map(point => point.y)), 48);
  assert.equal(Math.max(...outline.map(point => point.y)), 120);
  assert.ok(outline.some(point => point.x === 0 && point.y === 120));
  assert.ok(outline.some(point => point.x === 390 && point.y === 120));
  assert.equal(getNavigationContourY(0), 84);
  assert.equal(getNavigationContourY(390), 84);
  assert.ok(NAVIGATION_SHAPE_PATH.startsWith(NAVIGATION_CONTOUR_PATH), 'the selection must share the body outline');
  for (let x = 48; x <= 93; x++) {
    assert.ok(Math.abs(getNavigationContourY(x) - 48) < 0.000001);
    assert.ok(Math.abs(getNavigationContourY(390 - x) - 48) < 0.000001);
  }
  assert.equal(getNavigationContourY(195), 106);
  assert.equal(getNavigationContourY(-10), 84);
  assert.equal(getNavigationContourY(400), 84);
});

test('the sliding contour follows the symmetric centre dip rather than a separate arc', () => {
  let previous = getNavigationContourY(61);
  for (let x = 61; x <= 195; x++) {
    const y = getNavigationContourY(x);
    assert.ok(y >= previous - 0.000001, `contour should descend into the central notch at ${x}`);
    assert.ok(Math.abs(y - getNavigationContourY(390 - x)) < 0.000001, `curve must be symmetric at ${x}`);
    previous = y;
  }
  assert.ok(getNavigationContourY(195) - getNavigationContourY(61) > 45);
  // The upper lips have a generous circular rollover, not a tight elbow.
  for (let x = 94; x <= 145; x++) {
    const shoulderRadius = Math.hypot(x - 93.393, getNavigationContourY(x) - 108);
    assert.ok(Math.abs(shoulderRadius - 60) < 0.05, `the cradle shoulder should stay broadly rounded at ${x}`);
  }
  for (let x = 146; x <= 244; x++) {
    const radius = Math.hypot(x - 195, getNavigationContourY(x) - 48);
    assert.ok(Math.abs(radius - 58) < 0.05, `the menu cradle should follow a round cup at ${x}`);
  }
  assert.ok(getNavigationContourY(195) < 120, 'the notch must leave a continuous blue bridge below it');
});

test('arc-length anchors place the sliding marker precisely above the side-tab centres', () => {
  const home = getNavigationContourPointAtDistance(HOME_CONTOUR_DISTANCE);
  const aid = getNavigationContourPointAtDistance(AID_CONTOUR_DISTANCE);
  assert.ok(Math.abs(home.x - NAVIGATION_SIDE_CENTER_X) < 0.000001);
  assert.ok(Math.abs(aid.x - (390 - NAVIGATION_SIDE_CENTER_X)) < 0.000001);
  assert.ok(Math.abs(home.y - getNavigationContourY(home.x)) < 0.01);
  assert.ok(Math.abs(aid.y - getNavigationContourY(aid.x)) < 0.01);
  assert.ok(Math.abs(HOME_CONTOUR_DISTANCE + AID_CONTOUR_DISTANCE - CONTOUR_LENGTH) < 0.000001);
  assert.deepEqual(getNavigationContourPointAtDistance(-10), { x: 0, y: 84 });
  assert.deepEqual(getNavigationContourPointAtDistance(CONTOUR_LENGTH + 10), { x: 390, y: 84 });
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
  assert.ok(Math.abs(midpoint.y - 106) < 0.000001);
});
