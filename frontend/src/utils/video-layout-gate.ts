/** Wait for the fullscreen surface and its safe areas to stop changing before revealing it. */
export function createVideoLayoutGate(quietMs = 100, timeoutMs = 850) {
  let width = 0;
  let height = 0;
  let pending: { schedule: () => void; finish: () => void } | undefined;

  return {
    update(nextWidth: number, nextHeight: number) {
      width = nextWidth;
      height = nextHeight;
      pending?.schedule();
    },
    invalidate() { pending?.schedule(); },
    reset() {
      pending?.finish();
      width = height = 0;
    },
    cancel() { pending?.finish(); },
    wait(landscape?: boolean) {
      pending?.finish();
      return new Promise<void>(resolve => {
        let quietTimer: ReturnType<typeof setTimeout> | undefined;
        const timeout = setTimeout(finish, timeoutMs);
        function finish() {
          clearTimeout(timeout);
          clearTimeout(quietTimer);
          if (pending?.finish === finish) pending = undefined;
          resolve();
        }
        function schedule() {
          clearTimeout(quietTimer);
          if (width > 0 && height > 0 && (landscape === undefined || (width > height) === landscape)) {
            quietTimer = setTimeout(finish, quietMs);
          }
        }
        pending = { schedule, finish };
        schedule();
      });
    },
  };
}
