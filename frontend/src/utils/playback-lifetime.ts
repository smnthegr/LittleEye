/** Stop before Expo's passive cleanup releases the native player; ignore later callbacks. */
export function createPlaybackLifetime(player: { pause: () => void }) {
  let active = false;
  return {
    get active() { return active; },
    mount() { active = true; },
    pause() { if (active) player.pause(); },
    unmount() {
      if (!active) return;
      active = false;
      player.pause();
    },
  };
}
