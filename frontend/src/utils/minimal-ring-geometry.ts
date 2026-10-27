/** Coordinates traced from the supplied 347 × 345 reference, cropped x=28..328,
 * y=0..300. Caption and sample background are deliberately excluded. */
export const RING_SIZE = 300;
export type DPadDirection = 'up' | 'right' | 'down' | 'left';
export type DPadControl = DPadDirection | 'center';
export const RING_CENTER = 150;
// Directional segments retain their enlargement; the center is sized independently.
export const BUTTON_SCALE = 1.08;
export const SEGMENT_ANCHOR_Y = 66;
export const CENTER_RADIUS = 32;
export const BUTTON_ART_PADDING = 18;
export const BUTTON_PRESS_SCALE = .95;
export const DIRECTION_ROTATIONS = { up: 0, right: 90, down: 180, left: 270 } as const;
export const SEGMENT_SCALE_TRANSFORM = `translate(150 ${SEGMENT_ANCHOR_Y}) scale(${BUTTON_SCALE}) translate(-150 -${SEGMENT_ANCHOR_Y})`;

type Point = readonly [number, number];
// One source for rendering and hit testing; each cubic is [control1, control2, end].
const start: Point = [89, 58];
const curves: readonly (readonly [Point, Point, Point])[] = [
  [[88, 42], [118, 28], [150, 28]],
  [[182, 28], [212, 42], [211, 58]],
  [[211, 72], [197, 96], [185, 104]],
  [[175, 110], [164, 102], [150, 102]],
  [[136, 102], [125, 110], [115, 104]],
  [[103, 96], [89, 72], [89, 58]],
];
export const SEGMENT_PATH = `M${start.join(' ')}${curves.map(curve => `C${curve.flat().join(' ')}`).join('')}Z`;
export const CHEVRON_PATH = 'M140 67 L150 57 L160 67';
export const SPARKLE_PATH = 'M150 137 C151.8 145.5 154.5 148.2 163 150 C154.5 151.8 151.8 154.5 150 163 C148.2 154.5 145.5 151.8 137 150 C145.5 148.2 148.2 145.5 150 137Z';

// Sampling error is below 0.1 reference pixels; avoids rectangular hit regions.
const outline: Point[] = [start];
let previous = start;
for (const [a, b, end] of curves) {
  for (let step = 1; step <= 24; step++) {
    const t = step / 24;
    const u = 1 - t;
    const coordinate = (axis: 0 | 1) => u ** 3 * previous[axis] + 3 * u ** 2 * t * a[axis]
      + 3 * u * t ** 2 * b[axis] + t ** 3 * end[axis];
    outline.push([coordinate(0), coordinate(1)]);
  }
  previous = end;
}

function insideSegment(x: number, y: number) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i];
    const [xj, yj] = outline[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Accept local layout coordinates and uniformly map them into the artwork. */
export function hitTestDPad(x: number, y: number, size = RING_SIZE): DPadControl | null {
  if (!Number.isFinite(size) || size <= 0) return null;
  const dx = x * RING_SIZE / size - RING_CENTER;
  const dy = y * RING_SIZE / size - RING_CENTER;
  if (dx * dx + dy * dy <= CENTER_RADIUS ** 2) return 'center';
  for (const direction of Object.keys(DIRECTION_ROTATIONS) as DPadDirection[]) {
    const angle = -DIRECTION_ROTATIONS[direction] * Math.PI / 180;
    const localX = dx * Math.cos(angle) - dy * Math.sin(angle) + RING_CENTER;
    const localY = dx * Math.sin(angle) + dy * Math.cos(angle) + RING_CENTER;
    if (insideSegment((localX - RING_CENTER) / BUTTON_SCALE + RING_CENTER,
      (localY - SEGMENT_ANCHOR_Y) / BUTTON_SCALE + SEGMENT_ANCHOR_Y)) return direction;
  }
  return null;
}

export const CONTROL_BOUNDS = {
  up: { left: 84.12, top: 24.96, width: 131.76, height: 86.4 },
  right: { left: 188.64, top: 84.12, width: 86.4, height: 131.76 },
  down: { left: 84.12, top: 188.64, width: 131.76, height: 86.4 },
  left: { left: 24.96, top: 84.12, width: 86.4, height: 131.76 },
  center: { left: 150 - CENTER_RADIUS, top: 150 - CENTER_RADIUS, width: CENTER_RADIUS * 2, height: CENTER_RADIUS * 2 },
} as const;

const controlOutlines = (Object.keys(DIRECTION_ROTATIONS) as DPadDirection[]).map(control => {
  const angle = DIRECTION_ROTATIONS[control] * Math.PI / 180;
  return { control, points: outline.map(([x, y]): Point => {
    const dx = (x - RING_CENTER) * BUTTON_SCALE;
    const dy = (y - SEGMENT_ANCHOR_Y) * BUTTON_SCALE + SEGMENT_ANCHOR_Y - RING_CENTER;
    return [dx * Math.cos(angle) - dy * Math.sin(angle) + RING_CENTER,
      dx * Math.sin(angle) + dy * Math.cos(angle) + RING_CENTER];
  }) };
});

function distanceToControl(x: number, y: number, control: DPadControl) {
  if (control === 'center') return Math.max(0, Math.hypot(x - RING_CENTER, y - RING_CENTER) - CENTER_RADIUS);
  const points = controlOutlines.find(value => value.control === control)!.points;
  let nearestSquared = Infinity;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[j];
    const [bx, by] = points[i];
    const vx = bx - ax;
    const vy = by - ay;
    const lengthSquared = vx * vx + vy * vy;
    const t = lengthSquared ? Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / lengthSquared)) : 0;
    nearestSquared = Math.min(nearestSquared, (x - ax - t * vx) ** 2 + (y - ay - t * vy) ** 2);
  }
  return Math.sqrt(nearestSquared);
}

/** 14 layout-point touch padding, partitioned by nearest shape: no overlapping targets.
 * Once pressed, allow 24 points of drift in gaps; entering another button still stops. */
export function hitTestDPadTouch(x: number, y: number, size = RING_SIZE, retained?: DPadDirection): DPadDirection | null {
  if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(x) || !Number.isFinite(y)
    || x < 0 || y < 0 || x > size || y > size) return null;
  const exact = hitTestDPad(x, y, size);
  // Reserve the decorative center instead of redirecting its taps to a direction.
  if (exact === 'center') return null;
  if (retained && exact && exact !== retained) return null;
  if (exact) return exact;
  const referenceX = x * RING_SIZE / size;
  const referenceY = y * RING_SIZE / size;
  if (retained) return distanceToControl(referenceX, referenceY, retained) * size / RING_SIZE <= 24 ? retained : null;
  let closest: DPadControl | null = null;
  let distance = 14;
  for (const control of ['center', 'up', 'right', 'down', 'left'] as const) {
    const candidate = distanceToControl(referenceX, referenceY, control) * size / RING_SIZE;
    if (candidate < distance) { closest = control; distance = candidate; }
  }
  return closest === 'center' ? null : closest;
}
