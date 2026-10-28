import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { toFallEventEntry, mergeFallEvents } from '../src/utils/fall-event-recording.ts';
import {
  getTimelineSecondsAtPosition, getTimelineTicks, panTimelineViewport, zoomTimelineViewport,
} from '../src/utils/playback-timeline.ts';

const recordingURL = new URL('../src/utils/recorded-footage.ts', import.meta.url).href;
const resolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(context.parentURL === recordingURL && specifier === './playback-timeline' ? `${specifier}.ts` : specifier, context);
  },
});
const { getRecordingRange, getRecordingInitialTime } = await import(recordingURL);
resolution.deregister();
const event = { kind: 'event', date: '17/10/2026', detail: 'Detected fall', fallAtSeconds: 26132 };

test('an event opens at the exact fall timestamp within its short highlight clip', () => {
  assert.equal(getRecordingInitialTime(event), 26132);
  assert.deepEqual(getRecordingRange(event), { start: 26122, end: 26152 });
  assert.deepEqual(getRecordingRange({ ...event, clipStartSeconds: 26100, clipEndSeconds: 26160 }), { start: 26100, end: 26160 });
});

test('event highlights remain inside the recording at day boundaries', () => {
  assert.deepEqual(getRecordingRange({ ...event, fallAtSeconds: 0 }), { start: 0, end: 20 });
  assert.deepEqual(getRecordingRange({ ...event, fallAtSeconds: 86399 }), { start: 86389, end: 86400 });
  const corrected = getRecordingRange({ ...event, clipStartSeconds: 30000, clipEndSeconds: 20000 });
  assert.ok(corrected.start <= event.fallAtSeconds && corrected.end > event.fallAtSeconds);
});

test('event seeking, panning, and pinch zoom cannot escape the highlight', () => {
  const range = getRecordingRange(event);
  const full = { start: range.start, span: range.end - range.start };
  const zoomed = zoomTimelineViewport(full, 100, event.fallAtSeconds, range);
  assert.equal(zoomed.span, 5);
  assert.ok(event.fallAtSeconds >= zoomed.start && event.fallAtSeconds <= zoomed.start + zoomed.span);
  assert.deepEqual(zoomTimelineViewport(zoomed, 0.0001, event.fallAtSeconds, range), full);
  assert.equal(getTimelineSecondsAtPosition(-10000, 300, zoomed, range), range.start);
  assert.equal(getTimelineSecondsAtPosition(10000, 300, zoomed, range), range.end);
  assert.equal(panTimelineViewport(zoomed, -10000, 300, range).start + zoomed.span, range.end);
  assert.equal(panTimelineViewport(zoomed, 10000, 300, range).start, range.start);
  const fallX = (event.fallAtSeconds - zoomed.start) / zoomed.span * 300;
  assert.equal(getTimelineSecondsAtPosition(fallX, 300, zoomed, range), event.fallAtSeconds);
});

test('event rulers show seconds while full playback keeps the 24-hour range', () => {
  const range = getRecordingRange(event);
  const ruler = getTimelineTicks({ start: range.start, span: range.end - range.start }, 350, range);
  assert.ok(ruler.interval < 60);
  assert.ok(ruler.ticks.every(tick => /^\d{2}:\d{2}:\d{2}$/.test(tick.label)));
  assert.deepEqual(getRecordingRange({ kind: 'playback', date: event.date, detail: 'Daily footage' }), { start: 0, end: 86400 });
  assert.deepEqual(getRecordingRange(null), { start: 0, end: 86400 });
});

const readyRecording = {
  id: 'fall-1', detectedAt: '2026-10-22T14:35:00+08:00',
  clip: { uri: 'https://example.com/fall-1.mp4', durationSeconds: 30.25, fallOffsetSeconds: 10.5 },
};

test('a backend-trimmed clip opens at the fall inside the file, independently of its real clock time', () => {
  const entry = toFallEventEntry(readyRecording);
  assert.equal(entry.date, '22/10/2026');
  assert.equal(entry.fallAtSeconds, 14 * 3600 + 35 * 60);
  assert.equal(entry.detectedAt, '2026-10-22T06:35:00.000Z');
  assert.equal(entry.uri, readyRecording.clip.uri);
  assert.equal(entry.isPreview, undefined);
  assert.equal(getRecordingInitialTime(entry), 10.5, 'must not seek to 14:35 in a thirty-second file');
  assert.deepEqual(getRecordingRange(entry), { start: 0, end: 30.25 });
});

test('events whose highlights cross midnight keep a complete clip and Philippine detection date', () => {
  for (const [detectedAt, date, fallAtSeconds] of [
    ['2026-10-21T15:59:58Z', '21/10/2026', 86398],
    ['2026-10-21T16:00:02Z', '22/10/2026', 2],
  ]) {
    const entry = toFallEventEntry({ ...readyRecording, detectedAt });
    assert.equal(entry.date, date);
    assert.equal(entry.fallAtSeconds, fallAtSeconds);
    assert.equal(getRecordingInitialTime(entry), 10.5);
    assert.deepEqual(getRecordingRange(entry), { start: 0, end: 30.25 });
  }
});

test('unusable clips and timestamps are rejected before creating a fall card', () => {
  for (const invalid of [
    { ...readyRecording, id: '' },
    { ...readyRecording, detectedAt: '2026-10-22T14:35:00' },
    { ...readyRecording, detectedAt: 'invalid' },
    ...[
      { uri: '' }, { durationSeconds: 0 }, { durationSeconds: NaN },
      { fallOffsetSeconds: -1 }, { fallOffsetSeconds: 30.25 }, { fallOffsetSeconds: Infinity },
    ].map(clip => ({ ...readyRecording, clip: { ...readyRecording.clip, ...clip } })),
  ]) assert.throws(() => toFallEventEntry(invalid));
});

test('repeated backend messages update one event and newest incidents appear first', () => {
  const first = toFallEventEntry(readyRecording);
  const newer = toFallEventEntry({ ...readyRecording, id: 'fall-2', detectedAt: '2026-10-22T15:00:00+08:00' });
  const updated = toFallEventEntry({ ...readyRecording, thumbnailUri: 'https://example.com/fall-1.jpg' });
  const entries = mergeFallEvents([first], [newer, updated]);
  assert.deepEqual(entries.map(entry => entry.id), ['fall-2', 'fall-1']);
  assert.equal(entries[1].thumbnailUri, updated.thumbnailUri);
  assert.equal(first.thumbnailUri, undefined, 'merging must not mutate existing entries');
});

test('incident calendar validation rejects Date rollover but keeps valid leap dates and offsets', () => {
  for (const detectedAt of [
    '2026-02-30T12:00:00Z', '2026-02-29T12:00:00Z', '1900-02-29T12:00:00Z',
    '2026-04-31T12:00:00+08:00', '2026-00-01T12:00:00Z', '2026-01-00T12:00:00Z',
    '2026-10-22T24:00:00Z', '2026-10-22T12:60:00Z', '2026-10-22T12:00:60Z',
  ]) assert.throws(() => toFallEventEntry({ ...readyRecording, detectedAt }), /ISO timestamp/);
  for (const detectedAt of ['2024-02-29T12:00:00Z', '2000-02-29T12:00:00+08:00', '2026-10-22T23:59:59.125-05:30']) {
    assert.equal(toFallEventEntry({ ...readyRecording, detectedAt }).detectedAt, new Date(detectedAt).toISOString());
  }
});
