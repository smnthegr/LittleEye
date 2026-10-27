import type { VideoSource } from 'expo-video';

import { clampPlaybackSeconds, FULL_TIMELINE_RANGE, PLAYBACK_DURATION_SECONDS, type TimelineRange } from './playback-timeline';

type RecordingDetails = { id?: string; date: string; detail: string; uri?: VideoSource; thumbnailUri?: string };
export type FallEventEntry = RecordingDetails & {
  kind: 'event';
  /** Actual detection time, in seconds from midnight of the recording date. */
  fallAtSeconds: number;
  detectedAt?: string;
  /** A physically trimmed file uses clip-relative playback, independently of the detection clock time. */
  trimmedClip?: { durationSeconds: number; fallOffsetSeconds: number };
  clipStartSeconds?: number;
  clipEndSeconds?: number;
};
export type HistoryEntry = (RecordingDetails & { kind: 'playback' }) | FallEventEntry;

/** Default event highlights include ten seconds before and twenty after the fall. */
export function getRecordingRange(entry: HistoryEntry | null): TimelineRange {
  if (entry?.kind !== 'event') return FULL_TIMELINE_RANGE;
  if (entry.trimmedClip) return { start: 0, end: entry.trimmedClip.durationSeconds };
  const fall = Math.min(PLAYBACK_DURATION_SECONDS - 1, clampPlaybackSeconds(entry.fallAtSeconds));
  const start = Math.min(fall, clampPlaybackSeconds(entry.clipStartSeconds ?? fall - 10));
  const end = Math.max(fall + 1, clampPlaybackSeconds(entry.clipEndSeconds ?? fall + 20));
  return { start, end };
}

export function getRecordingInitialTime(entry: HistoryEntry) {
  if (entry.kind === 'event' && entry.trimmedClip) return entry.trimmedClip.fallOffsetSeconds;
  return entry.kind === 'event'
    ? Math.min(PLAYBACK_DURATION_SECONDS - 1, clampPlaybackSeconds(entry.fallAtSeconds))
    : 0;
}
