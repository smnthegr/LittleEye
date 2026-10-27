import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampPlaybackSeconds, clampTimelineViewport, formatPlaybackTime, FULL_TIMELINE,
  getTimelineSecondsAtPosition, getTimelineTicks, getTimelineViewportForTime,
  MIN_TIMELINE_SPAN, panTimelineViewport, PLAYBACK_DURATION_SECONDS, zoomTimelineViewport,
} from '../src/utils/playback-timeline.ts';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} should equal ${expected}`);

test('timestamps preserve minute, hour and end-of-day boundaries', () => {
  assert.equal(PLAYBACK_DURATION_SECONDS, 86400);
  for (const [seconds, expected] of [[0, '00:00:00'], [59, '00:00:59'], [60, '00:01:00'], [3600, '01:00:00'], [86399, '23:59:59'], [86400, '24:00:00']]) {
    assert.equal(formatPlaybackTime(seconds), expected);
  }
  assert.equal(clampPlaybackSeconds(-1), 0);
  assert.equal(clampPlaybackSeconds(Infinity), 0);
  assert.equal(clampPlaybackSeconds(90000), 86400);
});

test('pinch zoom preserves the playhead position and reverses without moving playback time', () => {
  const seconds = 26100;
  const zoomed = zoomTimelineViewport(FULL_TIMELINE, 4, seconds);
  assert.equal(zoomed.span, 21600);
  close((seconds - zoomed.start) / zoomed.span, seconds / 86400);
  const restored = zoomTimelineViewport(zoomed, 0.25, seconds);
  assert.deepEqual(restored, FULL_TIMELINE);
});

test('zoom limits and day boundaries stay valid at every playback time', () => {
  for (const seconds of [0, 60, 26100, 86340, 86400]) {
    for (const scale of [0.00001, 0.25, 1, 4, 100000]) {
      const view = zoomTimelineViewport(FULL_TIMELINE, scale, seconds);
      assert.ok(view.span >= MIN_TIMELINE_SPAN && view.span <= 86400);
      assert.ok(view.start >= 0 && view.start + view.span <= 86400);
      assert.ok(seconds >= view.start && seconds <= view.start + view.span);
    }
  }
  assert.deepEqual(zoomTimelineViewport(FULL_TIMELINE, NaN, 26100), FULL_TIMELINE);
  assert.deepEqual(zoomTimelineViewport(FULL_TIMELINE, 0, 26100), FULL_TIMELINE);
  assert.deepEqual(clampTimelineViewport({ start: NaN, span: Infinity }), FULL_TIMELINE);
});

test('zoomed dragging reaches every minute of the 24-hour recording', () => {
  for (let minute = 0; minute <= 1440; minute++) {
    const seconds = minute * 60;
    const view = zoomTimelineViewport(FULL_TIMELINE, 1000, seconds);
    for (const width of [192, 278, 650]) {
      const x = (seconds - view.start) / view.span * width;
      assert.equal(getTimelineSecondsAtPosition(x, width, view), seconds);
    }
  }
});

test('drag speed changes only with the explicit zoom, with no forced minute snapping', () => {
  const wide = { start: 21600, span: 7200 };
  const narrow = { start: 25200, span: 300 };
  assert.equal(getTimelineSecondsAtPosition(150, 300, wide), 25200);
  assert.equal(getTimelineSecondsAtPosition(151, 300, wide), 25224);
  assert.equal(getTimelineSecondsAtPosition(150, 300, narrow), 25350);
  assert.equal(getTimelineSecondsAtPosition(151, 300, narrow), 25351);
});

test('dragging the filmstrip pans through footage and stops at recording edges', () => {
  const view = { start: 25200, span: 3600 };
  assert.deepEqual(panTimelineViewport(view, -150, 300), { start: 27000, span: 3600 });
  assert.deepEqual(panTimelineViewport(view, 150, 300), { start: 23400, span: 3600 });
  assert.equal(panTimelineViewport(view, 100000, 300).start, 0);
  assert.equal(panTimelineViewport(view, -100000, 300).start, 82800);
  assert.deepEqual(panTimelineViewport(FULL_TIMELINE, -150, 300), FULL_TIMELINE);
  assert.deepEqual(panTimelineViewport(view, NaN, 300), view);
  assert.deepEqual(panTimelineViewport(view, 10, 0), view);
});

test('maximum zoom out has six-hour marks on every screen size, then hours and minutes when zoomed in', () => {
  for (const width of [192, 350, 650, 1000]) {
    const full = getTimelineTicks(FULL_TIMELINE, width);
    assert.equal(full.interval, 21600);
    assert.deepEqual(full.ticks.map(tick => tick.seconds), [0, 21600, 43200, 64800, 86400]);
    assert.deepEqual(full.ticks.map(tick => tick.label), ['00h', '06h', '12h', '18h', '24h']);
  }
  assert.equal(getTimelineTicks({ start: 0, span: 43200 }, 350).interval, 7200);
  assert.equal(getTimelineTicks({ start: 0, span: 21600 }, 350).interval, 3600);
  const minuteView = getTimelineTicks({ start: 26100, span: 300 }, 350);
  assert.equal(minuteView.interval, 60);
  assert.deepEqual(minuteView.ticks.map(tick => tick.label), ['07:15', '07:16', '07:17', '07:18', '07:19', '07:20']);
  for (const tick of minuteView.ticks) assert.ok(tick.fraction >= 0 && tick.fraction <= 1);
});

test('playback and keyboard seeking follow the selected time while keeping zoom', () => {
  const view = { start: 26100, span: 300 };
  assert.deepEqual(getTimelineViewportForTime(view, 26200), view);
  for (const seconds of [0, 26000, 26401, 86400]) {
    const next = getTimelineViewportForTime(view, seconds);
    assert.equal(next.span, 300);
    assert.ok(seconds >= next.start && seconds <= next.start + next.span);
  }
  assert.equal(getTimelineSecondsAtPosition(1, 0, view), 26100);
  assert.equal(getTimelineSecondsAtPosition(NaN, 300, view), 26100);
  assert.equal(getTimelineSecondsAtPosition(-10, 300), 0);
  assert.equal(getTimelineSecondsAtPosition(400, 300), 86400);
});

test('enlarged timeline labels stay inside the ruler without colliding at either edge', () => {
  for (const width of [160, 192, 278, 350, 650, 1000]) {
    for (const fontScale of [1, 1.3, 2, 3]) {
      for (const view of [FULL_TIMELINE, { start: 26100, span: 300 }, { start: 26100, span: 60 }]) {
        const { labels, labelWidth, interval } = getTimelineTicks(view, width, undefined, fontScale);
        assert.ok(labels.length > 0);
        let previousRight = -4;
        for (const label of labels) {
          assert.ok(label.left >= 0);
          assert.ok(label.left + labelWidth <= width + 0.001);
          assert.ok(label.left >= previousRight + 4 - 0.001, `${width}/${fontScale}: overlapping ruler labels`);
          previousRight = label.left + labelWidth;
        }
        assert.ok(interval >= getTimelineTicks(view, width).interval, 'larger text cannot add denser labels');
      }
    }
  }
});
