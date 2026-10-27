export const SAMPLE_VIDEO_DURATION = 52.209;
export const SAMPLE_VIDEO_START = 7 * 3600 + 15 * 60;

/** Repeat the short sample on the demo day without speeding up its picture or audio. */
export function createSampleVideoClock(initialSeconds = SAMPLE_VIDEO_START) {
  let seconds = initialSeconds;
  let previous = 0;
  let base = 0;
  let seeking = true;
  const mediaTimeAt = (time: number) => ((time - SAMPLE_VIDEO_START + 8) % SAMPLE_VIDEO_DURATION + SAMPLE_VIDEO_DURATION) % SAMPLE_VIDEO_DURATION;
  function seek(time: number) {
    seconds = time;
    previous = mediaTimeAt(time);
    base = time - previous;
    seeking = true;
    return previous;
  }
  seek(initialSeconds);
  return {
    get seconds() { return seconds; },
    get mediaTime() { return mediaTimeAt(seconds); },
    seek,
    update(mediaTime: number) {
      if (!Number.isFinite(mediaTime)) return seconds;
      // Discard the previous frame's event while an asynchronous native seek completes.
      if (seeking && Math.abs(mediaTime - previous) > 1) return seconds;
      seeking = false;
      if (mediaTime < previous - SAMPLE_VIDEO_DURATION / 2) base += SAMPLE_VIDEO_DURATION;
      previous = mediaTime;
      seconds = base + mediaTime;
      return seconds;
    },
  };
}
