import {
  BufferSource, BufferTarget, EncodedAudioPacketSource, EncodedPacketSink, EncodedVideoPacketSource,
  Input, MP4, Mp4OutputFormat, Output,
} from 'mediabunny';

const yieldToUI = () => new Promise<void>(resolve => setTimeout(resolve, 0));

/** Copy compressed picture/audio packets into a real MP4; no microphone or server is involved. */
export async function exportSampleRecording(bytes: Uint8Array, start: number, duration: number) {
  if (!Number.isFinite(start) || start < 0 || !Number.isFinite(duration) || duration < 0.25 || duration > 301) {
    throw new Error('Record at least a moment and no more than five minutes.');
  }
  const input = new Input({ source: new BufferSource(bytes), formats: [MP4] });
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });
  try {
    const video = await input.getPrimaryVideoTrack();
    const audio = await input.getPrimaryAudioTrack();
    if (!video?.codec || !audio?.codec) throw new Error('The sample must contain video and audio.');
    const clipDuration = await input.computeDuration();
    const videoSink = new EncodedPacketSink(video);
    const audioSink = new EncodedPacketSink(audio);
    const videoPackets = [];
    const audioPackets = [];
    for await (const packet of videoSink.packets()) {
      videoPackets.push(packet);
      if (videoPackets.length % 128 === 0) await yieldToUI();
    }
    for await (const packet of audioSink.packets()) {
      audioPackets.push(packet);
      if (audioPackets.length % 128 === 0) await yieldToUI();
    }
    const videoSource = new EncodedVideoPacketSource(video.codec);
    const audioSource = new EncodedAudioPacketSource(audio.codec);
    output.addVideoTrack(videoSource, { rotation: video.rotation });
    output.addAudioTrack(audioSource);
    output.setMetadataTags({
      title: 'LittleEye sample recording', artist: 'Blender Foundation',
      comment: 'Excerpt from Sintel trailer. (c) Blender Foundation | durian.blender.org | CC BY 3.0 https://creativecommons.org/licenses/by/3.0/',
    });
    await output.start();
    const videoConfig = await video.getDecoderConfig();
    const audioConfig = await audio.getDecoderConfig();
    let offset = 0;
    let written = 0;
    while (offset < duration - 0.0001) {
      const segmentStart = (start + offset) % clipDuration;
      const length = Math.min(duration - offset, clipDuration - segmentStart);
      const segmentEnd = segmentStart + length;
      const key = await videoSink.getKeyPacket(segmentStart) ?? videoPackets[0];
      const first = videoPackets.findIndex(packet => packet.sequenceNumber === key.sequenceNumber);
      // Include reference frames needed by the last B-frame, keeping decode order intact.
      let last = first;
      for (let i = first; i < videoPackets.length; i++) {
        if (videoPackets[i].timestamp < segmentEnd) last = i;
      }
      for (let i = first; i <= last; i++) {
        const packet = videoPackets[i];
        // Negative timestamps retain decoder preroll; MP4 edit lists hide it from playback.
        await videoSource.add(packet.clone({ timestamp: offset + packet.timestamp - segmentStart }), {
          decoderConfig: videoConfig ?? undefined,
        });
        if (++written % 64 === 0) await yieldToUI();
      }
      for (const packet of audioPackets) {
        if (packet.timestamp + packet.duration <= segmentStart || packet.timestamp >= segmentEnd) continue;
        await audioSource.add(packet.clone({ timestamp: offset + packet.timestamp - segmentStart }), {
          decoderConfig: audioConfig ?? undefined,
        });
        if (++written % 64 === 0) await yieldToUI();
      }
      offset += length;
    }
    videoSource.close();
    audioSource.close();
    await output.finalize();
    if (!target.buffer) throw new Error('The recording file could not be created.');
    return new Uint8Array(target.buffer);
  } catch (error) {
    await output.cancel().catch(() => {});
    throw error;
  } finally {
    input.dispose();
  }
}
