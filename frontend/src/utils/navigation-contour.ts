/** An attached full-width dock with a generous circular cradle, in a 390 × 120 canvas. */
export const NAVIGATION_CONTOUR_PATH =
  'M 0 84 C 0 64.118 21.491 48 48 48 C 63 48 78 48 93.393 48 C 114.619 48 134.265 59.215 145.058 77.492 C 155.491 95.159 174.482 106 195 106 C 215.518 106 234.509 95.159 244.942 77.492 C 255.735 59.215 275.381 48 296.607 48 C 312 48 327 48 342 48 C 368.509 48 390 64.118 390 84';

export const NAVIGATION_BODY_BOTTOM = 120;
export const NAVIGATION_SHAPE_PATH = `${NAVIGATION_CONTOUR_PATH} V 120 H 0 Z`;

const contourSegments = [
  [[0, 84], [0, 64.118], [21.491, 48], [48, 48]],
  [[48, 48], [63, 48], [78, 48], [93.393, 48]],
  // Broad 60-unit shoulder arcs roll into the 58-unit cup with matching tangents.
  // This rounds the two upper lips of the cradle as well as its lower U.
  [[93.393, 48], [114.619, 48], [134.265, 59.215], [145.058, 77.492]],
  [[145.058, 77.492], [155.491, 95.159], [174.482, 106], [195, 106]],
  [[195, 106], [215.518, 106], [234.509, 95.159], [244.942, 77.492]],
  [[244.942, 77.492], [255.735, 59.215], [275.381, 48], [296.607, 48]],
  [[296.607, 48], [312, 48], [327, 48], [342, 48]],
  [[342, 48], [368.509, 48], [390, 64.118], [390, 84]],
] as const;

const firstContourPoint = contourSegments[0][0];
const lastContourPoint = contourSegments[contourSegments.length - 1][3];
const clampContourX = (x: number) => Math.max(firstContourPoint[0], Math.min(lastContourPoint[0], x));

function cubicCoordinate(a: number, b: number, c: number, d: number, t: number) {
  const remaining = 1 - t;
  return remaining ** 3 * a + 3 * remaining ** 2 * t * b + 3 * remaining * t ** 2 * c + t ** 3 * d;
}

/** Finds the contour itself rather than approximating its dip with a separate arc. */
export function getNavigationContourY(x: number): number {
  const boundedX = clampContourX(x);
  const segment = contourSegments.find((points) => boundedX <= points[3][0])!;
  if (boundedX === segment[0][0]) return segment[0][1];
  if (boundedX === segment[3][0]) return segment[3][1];

  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 32; iteration++) {
    const t = (low + high) / 2;
    const curveX = cubicCoordinate(segment[0][0], segment[1][0], segment[2][0], segment[3][0], t);
    if (curveX < boundedX) low = t;
    else high = t;
  }

  return cubicCoordinate(segment[0][1], segment[1][1], segment[2][1], segment[3][1], (low + high) / 2);
}

type ContourPoint = { x: number; y: number; distance: number };

// Sample once, not during animation. Arc length gives the SVG dash a consistent
// speed through the steep centre dip and the shallower outer shoulders.
const contourPoints: ContourPoint[] = [{ x: firstContourPoint[0], y: firstContourPoint[1], distance: 0 }];
for (const segment of contourSegments) {
  for (let sample = 1; sample <= 64; sample++) {
    const t = sample / 64;
    const x = cubicCoordinate(segment[0][0], segment[1][0], segment[2][0], segment[3][0], t);
    const y = cubicCoordinate(segment[0][1], segment[1][1], segment[2][1], segment[3][1], t);
    const previous = contourPoints[contourPoints.length - 1];
    contourPoints.push({ x, y, distance: previous.distance + Math.hypot(x - previous.x, y - previous.y) });
  }
}

export const CONTOUR_LENGTH = contourPoints[contourPoints.length - 1].distance;
export const CONTOUR_MARKER_LENGTH = 64;

function getContourDistanceAtX(x: number): number {
  const boundedX = clampContourX(x);
  const upperIndex = contourPoints.findIndex((point) => point.x >= boundedX);
  if (upperIndex <= 0) return 0;
  const start = contourPoints[upperIndex - 1];
  const end = contourPoints[upperIndex];
  const position = (boundedX - start.x) / (end.x - start.x);
  return start.distance + position * (end.distance - start.distance);
}

// Both anchors align with the actual side-tab centres; the fixed menu button is
// intentionally excluded from selection and from the sliding marker's range.
export const NAVIGATION_SIDE_CENTER_X = 73;
export const HOME_CONTOUR_DISTANCE = getContourDistanceAtX(NAVIGATION_SIDE_CENTER_X);
export const AID_CONTOUR_DISTANCE = getContourDistanceAtX(390 - NAVIGATION_SIDE_CENTER_X);

/** Useful for positioning any contour-bound decoration without inventing an arc. */
export function getNavigationContourPointAtDistance(distance: number): { x: number; y: number } {
  const boundedDistance = Math.max(0, Math.min(CONTOUR_LENGTH, distance));
  let low = 0;
  let high = contourPoints.length - 1;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (contourPoints[middle].distance < boundedDistance) low = middle;
    else high = middle;
  }

  const start = contourPoints[low];
  const end = contourPoints[high];
  const position = (boundedDistance - start.distance) / (end.distance - start.distance);
  return {
    x: start.x + position * (end.x - start.x),
    y: start.y + position * (end.y - start.y),
  };
}
