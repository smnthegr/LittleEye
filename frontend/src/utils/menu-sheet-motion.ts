export function shouldStartMenuDrag(distanceY: number, distanceX: number) {
  return distanceY > 4 && distanceY > Math.abs(distanceX) * 0.5;
}

export function shouldDismissMenuSheet(distance: number, velocity: number, height: number) {
  return distance >= Math.min(36, height * 0.1) || (distance > 8 && velocity > 0.35);
}
