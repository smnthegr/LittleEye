import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { BufferSource, EncodedPacketSink, Input, MP4 } from 'mediabunny';
import { exportSampleRecording } from '../src/utils/export-sample-recording.ts';

const sample = readFileSync(new URL('../assets/sample-video.mp4', import.meta.url));

async function inspectRecording(start, duration) {
  const result = await exportSampleRecording(sample, start, duration);
  assert.ok(result.length > 1000);
  const input = new Input({ source: new BufferSource(result), formats: [MP4] });
  try {
    assert.ok(Math.abs(await input.computeDuration() - duration) < 0.12, 'export matches the recorded interval');
    const video = await input.getPrimaryVideoTrack();
    const audio = await input.getPrimaryAudioTrack();
    assert.equal(video.codec, 'avc');
    assert.equal(audio.codec, 'aac');
    assert.equal((await new EncodedPacketSink(video).getFirstPacket()).type, 'key', 'decoder preroll is retained');
    for (const track of [video, audio]) {
      let lastTime = -Infinity;
      let count = 0;
      for await (const packet of new EncodedPacketSink(track).packets()) {
        assert.ok(packet.data.length > 0);
        if (track.type === 'audio') assert.ok(packet.timestamp >= lastTime, 'audio is chronological');
        lastTime = packet.timestamp;
        count++;
      }
      assert.ok(count > 0);
      assert.ok(Math.abs(lastTime - duration) < 0.15, 'audio/video stay in sync at the end');
    }
    assert.match((await input.getMetadataTags()).comment, /Blender Foundation/);
  } finally { input.dispose(); }
}

test('Stop produces a short MP4 with picture and audio, rather than copying the entire sample', async () => {
  await inspectRecording(8.35, 3.5);
});

test('a recording crossing the loop boundary remains one continuous playable MP4', async () => {
  await inspectRecording(50, 8);
  await inspectRecording(51.9, 0.5);
});

test('multiple sample loops retain the recorded duration and synchronized audio', async () => {
  await inspectRecording(5, 120);
});

test('invalid, empty, and oversized recordings fail instead of claiming a successful save', async () => {
  for (const [start, duration] of [[0, 0], [-1, 5], [NaN, 5], [0, 302]]) {
    await assert.rejects(exportSampleRecording(sample, start, duration));
  }
});

test('export yields to timers so navigation and touch handling can run during packet processing', async () => {
  let uiTurns = 0;
  const timer = setInterval(() => { uiTurns++; }, 0);
  try {
    await exportSampleRecording(sample, 8, 20);
    assert.ok(uiTurns >= 5, 'export must not monopolize the JavaScript thread');
  } finally { clearInterval(timer); }
});
