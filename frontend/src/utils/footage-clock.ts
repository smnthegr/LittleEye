/** Map actual media time without generating or looping demo footage. */
export function createFootageClock(initialSeconds = 0) {
  let seconds = initialSeconds;
  return {
    get seconds() { return seconds; },
    get mediaTime() { return seconds; },
    seek(time: number) { seconds = time; return time; },
    update(time: number) {
      if (Number.isFinite(time)) seconds = Math.max(0, time);
      return seconds;
    },
  };
}
