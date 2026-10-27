import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createSampleVideoClock, SAMPLE_VIDEO_DURATION, SAMPLE_VIDEO_START } from '../src/utils/sample-video-clock.ts';

test('sample timeline follows real media time and stays continuous across clip loops', () => {
  const clock = createSampleVideoClock();
  assert.equal(clock.update(8.5), SAMPLE_VIDEO_START + 0.5);
  clock.update(SAMPLE_VIDEO_DURATION - 0.1);
  const beforeLoop = clock.seconds;
  assert.ok(Math.abs(clock.update(0.15) - beforeLoop - 0.25) < 0.0001);
});

test('every minute of the demo day seeks to a valid sample frame', () => {
  const clock = createSampleVideoClock();
  for (let time = 0; time <= 86400; time += 60) {
    const mediaTime = clock.seek(time);
    assert.ok(mediaTime >= 0 && mediaTime < SAMPLE_VIDEO_DURATION);
    assert.equal(clock.seconds, time);
    assert.ok(Math.abs(clock.update(mediaTime + 0.01) - time - 0.01) < 0.00001);
  }
});

test('late frames after a seek cannot jump playback to the previous position', () => {
  const clock = createSampleVideoClock();
  clock.update(8);
  const mediaTime = clock.seek(SAMPLE_VIDEO_START + 20);
  assert.equal(clock.update(8.2), SAMPLE_VIDEO_START + 20);
  assert.ok(Math.abs(clock.update(mediaTime + 0.25) - SAMPLE_VIDEO_START - 20.25) < 0.00001);
  assert.equal(clock.update(Number.NaN), clock.seconds);
});

test('transferring a paused player between portrait and fullscreen preserves its position', () => {
  const clock = createSampleVideoClock();
  clock.update(8.75);
  const before = clock.seconds;
  const mediaTime = clock.seek(clock.seconds);
  assert.equal(clock.update(0), before);
  assert.equal(clock.update(mediaTime), before);
});

function* boxes(bytes) {
  let offset = 0;
  while (offset + 8 <= bytes.length) {
    const size = bytes.readUInt32BE(offset);
    assert.ok(size >= 8 && offset + size <= bytes.length, 'valid MP4 atom');
    yield [bytes.toString('ascii', offset + 4, offset + 8), bytes.subarray(offset + 8, offset + size)];
    offset += size;
  }
}

test('bundled MP4 includes both video and audio and matches the demo clock duration', () => {
  const file = readFileSync(new URL('../assets/sample-video.mp4', import.meta.url));
  const moov = [...boxes(file)].find(([type]) => type === 'moov')[1];
  const atoms = [...boxes(moov)];
  const header = atoms.find(([type]) => type === 'mvhd')[1];
  assert.equal(header.readUInt32BE(16) / header.readUInt32BE(12), SAMPLE_VIDEO_DURATION);
  const tracks = atoms.filter(([type]) => type === 'trak').map(([, track]) => {
    const media = [...boxes(track)].find(([type]) => type === 'mdia')[1];
    const handler = [...boxes(media)].find(([type]) => type === 'hdlr')[1];
    return handler.toString('ascii', 8, 12);
  });
  assert.ok(tracks.includes('vide'));
  assert.ok(tracks.includes('soun'));
});
