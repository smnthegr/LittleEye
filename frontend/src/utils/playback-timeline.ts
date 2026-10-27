export const PLAYBACK_DURATION_SECONDS = 24 * 60 * 60;
export const MIN_TIMELINE_SPAN = 5 * 60;
export type TimelineRange = { start: number; end: number };
export const FULL_TIMELINE_RANGE: TimelineRange = { start: 0, end: PLAYBACK_DURATION_SECONDS };
export type TimelineViewport = { start: number; span: number };
export const FULL_TIMELINE: TimelineViewport = { start: 0, span: PLAYBACK_DURATION_SECONDS };

export function clampPlaybackSeconds(seconds: number) {
  return Number.isFinite(seconds) ? Math.max(0, Math.min(PLAYBACK_DURATION_SECONDS, Math.round(seconds))) : 0;
}

export function formatPlaybackTime(seconds: number) {
  const value = clampPlaybackSeconds(seconds);
  return `${String(Math.floor(value / 3600)).padStart(2, '0')}:${String(Math.floor(value / 60) % 60).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function clampTimelineRange(range: TimelineRange): TimelineRange {
  const start = Math.min(PLAYBACK_DURATION_SECONDS - 1, clampPlaybackSeconds(range.start));
  return { start, end: Math.max(start + 1, clampPlaybackSeconds(range.end)) };
}

function minimumSpan(range: TimelineRange) {
  return Math.min(range.end - range.start, Math.max(1, Math.min(MIN_TIMELINE_SPAN, (range.end - range.start) / 6)));
}

export function clampTimelineViewport(viewport: TimelineViewport, range: TimelineRange = FULL_TIMELINE_RANGE): TimelineViewport {
  const bounds = clampTimelineRange(range);
  const duration = bounds.end - bounds.start;
  const span = Number.isFinite(viewport.span) ? Math.max(minimumSpan(bounds), Math.min(duration, viewport.span)) : duration;
  const start = Number.isFinite(viewport.start) ? Math.max(bounds.start, Math.min(bounds.end - span, viewport.start)) : bounds.start;
  return { start, span };
}

/** Follow playback without resetting the user's zoom or leaving an event clip. */
export function getTimelineViewportForTime(viewport: TimelineViewport, seconds: number, range: TimelineRange = FULL_TIMELINE_RANGE): TimelineViewport {
  const view = clampTimelineViewport(viewport, range);
  const time = clampPlaybackSeconds(seconds);
  if (time < view.start) return clampTimelineViewport({ start: time - view.span * 0.25, span: view.span }, range);
  if (time > view.start + view.span) return clampTimelineViewport({ start: time - view.span * 0.75, span: view.span }, range);
  return view;
}

/** A scale above one zooms in, keeping the selected time in the same place. */
export function zoomTimelineViewport(viewport: TimelineViewport, scale: number, anchorSeconds: number, range: TimelineRange = FULL_TIMELINE_RANGE): TimelineViewport {
  const bounds = clampTimelineRange(range);
  const view = clampTimelineViewport(viewport, bounds);
  if (!Number.isFinite(scale) || scale <= 0) return view;
  const anchor = Math.max(bounds.start, Math.min(bounds.end, clampPlaybackSeconds(anchorSeconds)));
  const ratio = Math.max(0, Math.min(1, (anchor - view.start) / view.span));
  const span = Math.max(minimumSpan(bounds), Math.min(bounds.end - bounds.start, view.span / scale));
  return clampTimelineViewport({ start: anchor - ratio * span, span }, bounds);
}

/** Dragging the filmstrip left reveals later footage. */
export function panTimelineViewport(viewport: TimelineViewport, deltaX: number, width: number, range: TimelineRange = FULL_TIMELINE_RANGE): TimelineViewport {
  const view = clampTimelineViewport(viewport, range);
  if (!Number.isFinite(deltaX) || !Number.isFinite(width) || width <= 0) return view;
  return clampTimelineViewport({ start: view.start - deltaX / width * view.span, span: view.span }, range);
}

/** Seeking follows only the visible scale and is restricted to the supplied footage. */
export function getTimelineSecondsAtPosition(x: number, width: number, viewport: TimelineViewport = FULL_TIMELINE, range: TimelineRange = FULL_TIMELINE_RANGE) {
  const bounds = clampTimelineRange(range);
  const view = clampTimelineViewport(viewport, bounds);
  if (!Number.isFinite(x) || !Number.isFinite(width) || width <= 0) return clampPlaybackSeconds(view.start);
  return Math.max(bounds.start, Math.min(bounds.end, clampPlaybackSeconds(view.start + x / width * view.span)));
}

export function getTimelineTicks(viewport: TimelineViewport, width: number, range: TimelineRange = FULL_TIMELINE_RANGE, fontScale = 1) {
  const view = clampTimelineViewport(viewport, range);
  const textScale = Number.isFinite(fontScale) ? Math.max(1, fontScale) : 1;
  const availableWidth = Math.max(0, width);
  const intervals = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400];
  const target = Math.max(view.span / 6, view.span / Math.max(1, availableWidth) * (view.span <= 120 ? 64 : 40) * textScale);
  const interval = intervals.find(value => value >= target) ?? 86400;
  const labelWidth = Math.min(availableWidth, (interval >= 3600 ? 24 : interval < 60 ? 64 : 36) * textScale);
  const ticks: { seconds: number; fraction: number; label: string }[] = [];
  for (let seconds = Math.ceil(view.start / interval) * interval; seconds <= view.start + view.span; seconds += interval) {
    ticks.push({ seconds, fraction: (seconds - view.start) / view.span,
      label: interval >= 3600 ? `${String(Math.floor(seconds / 3600)).padStart(2, '0')}h`
        : interval < 60 ? formatPlaybackTime(seconds) : formatPlaybackTime(seconds).slice(0, 5) });
  }
  // Clamping edge labels into the ruler can bring them closer than the tick spacing.
  // Keep all marks, but omit colliding labels and reserve room for the final label.
  const positioned = ticks.map(tick => ({ ...tick,
    left: Math.max(0, Math.min(availableWidth - labelWidth, tick.fraction * availableWidth - labelWidth / 2)),
  }));
  let lastRight = -4;
  const finalLeft = positioned.at(-1)?.left ?? 0;
  const labels = positioned.filter((tick, index) => {
    if (tick.left < lastRight + 4) return false;
    if (index > 0 && index < positioned.length - 1 && tick.left + labelWidth + 4 > finalLeft) return false;
    lastRight = tick.left + labelWidth;
    return true;
  });
  return { interval, ticks, labelWidth, labels };
}
