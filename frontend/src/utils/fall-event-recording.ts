import type { FallEventEntry } from './recorded-footage';

/** Integration contract for a confirmed fall whose trimmed recording is ready. */
export type FallEventRecording = {
  id: string;
  /** ISO 8601 timestamp with Z or a timezone offset. Displayed in Philippine time. */
  detectedAt: string;
  clip: {
    uri: string;
    durationSeconds: number;
    /** Position of the detected fall within this trimmed file, not seconds since midnight. */
    fallOffsetSeconds: number;
  };
  thumbnailUri?: string;
};

export type ReadyFallEventEntry = FallEventEntry & { id: string; detectedAt: string };

/** Keep backend payloads and sample fixtures separate from the history UI model. */
export function toFallEventEntry(record: FallEventRecording): ReadyFallEventEntry {
  const timestamp = Date.parse(record.detectedAt);
  if (!record.id?.trim() || !record.clip?.uri?.trim()) throw new Error('A fall event needs an ID and a ready clip URI.');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i.test(record.detectedAt) || !Number.isFinite(timestamp)) {
    throw new Error('Fall detection time must be an ISO timestamp with a timezone.');
  }
  const { durationSeconds, fallOffsetSeconds } = record.clip;
  if (!Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > 86400 ||
      !Number.isFinite(fallOffsetSeconds) || fallOffsetSeconds < 0 || fallOffsetSeconds >= durationSeconds) {
    throw new Error('The detected fall must be inside the available trimmed clip.');
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)!.value;
  return {
    id: record.id,
    kind: 'event',
    detectedAt: new Date(timestamp).toISOString(),
    date: `${part('day')}/${part('month')}/${part('year')}`,
    fallAtSeconds: Number(part('hour')) * 3600 + Number(part('minute')) * 60 + Number(part('second')),
    detail: 'Automatically recorded fall event.',
    uri: record.clip.uri,
    thumbnailUri: record.thumbnailUri,
    trimmedClip: { durationSeconds, fallOffsetSeconds },
  };
}

/** Repeated deliveries update an incident instead of creating duplicate cards. */
export function mergeFallEvents(entries: ReadyFallEventEntry[], incoming: ReadyFallEventEntry[]): ReadyFallEventEntry[] {
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  for (const entry of incoming) byId.set(entry.id, entry);
  return [...byId.values()].sort((a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt));
}
