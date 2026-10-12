/** The coded navigation silhouette, measured in its original 390 × 120 canvas. */
export const NAVIGATION_CONTOUR_PATH =
  'M 0 60 C 29 41 61 40 91 53 C 132 70 149 116 195 116 C 241 116 258 70 299 53 C 329 40 361 41 390 60';

export const NAVIGATION_SHAPE_PATH = `${NAVIGATION_CONTOUR_PATH} V 120 H 0 V 60 Z`;

const contourSegments = [
  [[0, 60], [29, 41], [61, 40], [91, 53]],
  [[91, 53], [132, 70], [149, 116], [195, 116]],
  [[195, 116], [241, 116], [258, 70], [299, 53]],
  [[299, 53], [329, 40], [361, 41], [390, 60]],
] as const;

function cubicCoordinate(a: number, b: number, c: number, d: number, t: number) {
  const remaining = 1 - t;
  return remaining ** 3 * a + 3 * remaining ** 2 * t * b + 3 * remaining * t ** 2 * c + t ** 3 * d;
}

/** Finds the contour itself rather than approximating its dip with a separate arc. */
export function getNavigationContourY(x: number): number {
  const boundedX = Math.max(0, Math.min(390, x));
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
const contourPoints: ContourPoint[] = [{ x: 0, y: 60, distance: 0 }];
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
export const CONTOUR_MARKER_LENGTH = 50;

function getContourDistanceAtX(x: number): number {
  const boundedX = Math.max(0, Math.min(390, x));
  const upperIndex = contourPoints.findIndex((point) => point.x >= boundedX);
  if (upperIndex <= 0) return 0;
  const start = contourPoints[upperIndex - 1];
  const end = contourPoints[upperIndex];
  const position = (boundedX - start.x) / (end.x - start.x);
  return start.distance + position * (end.distance - start.distance);
}

// Both anchors align with the actual side-tab centres; the fixed menu button is
// intentionally excluded from selection and from the sliding marker's range.
export const HOME_CONTOUR_DISTANCE = getContourDistanceAtX(71);
export const AID_CONTOUR_DISTANCE = getContourDistanceAtX(319);

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
