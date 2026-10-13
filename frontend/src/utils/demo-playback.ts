export const DEMO_DURATION_SECONDS = 120;

function clampDemoSeconds(seconds: number) {
  if (!Number.isFinite(seconds)) return 0;
  return Math.max(0, Math.min(DEMO_DURATION_SECONDS, Math.round(seconds)));
}

export function formatDemoTime(seconds: number) {
  const value = clampDemoSeconds(seconds);
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function getDemoSecondsAtPosition(locationX: number, trackWidth: number) {
  if (!Number.isFinite(locationX) || !Number.isFinite(trackWidth) || trackWidth <= 0) return 0;
  return clampDemoSeconds(locationX / trackWidth * DEMO_DURATION_SECONDS);
}

/** Advance the placeholder demonstration by one second, resetting at its end. */
export function advanceDemoPlayback(seconds: number) {
  const next = clampDemoSeconds(seconds) + 1;
  return next >= DEMO_DURATION_SECONDS
    ? { seconds: 0, playing: false }
    : { seconds: next, playing: true };
}
