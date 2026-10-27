import type { DPadControl, DPadDirection } from './minimal-ring-geometry';

/** One owner per gesture. A second finger cannot replace or release its owner. */
type Callbacks = {
  start: (direction: DPadDirection) => void;
  stop: (direction: DPadDirection) => void;
  feedback: (control: DPadDirection | null) => void;
};
export function createDPadInteraction(callbacks: Callbacks) {
  let active: { control: DPadDirection; pointer: number | string } | null = null;
  function cancel() {
    if (!active) return;
    const { control } = active;
    active = null;
    callbacks.feedback(null);
    callbacks.stop(control);
  }
  return {
    updateCallbacks(next: Callbacks) { callbacks = next; },
    get active() { return active; },
    begin(control: DPadControl | null, pointer: number | string) {
      if (!control || control === 'center' || active) return false;
      active = { control, pointer };
      callbacks.feedback(control);
      callbacks.start(control);
      return true;
    },
    move(control: DPadControl | null, pointer: number | string) {
      if (active?.pointer === pointer && control !== active.control) cancel();
    },
    end(pointer: number | string) {
      if (!active || active.pointer !== pointer) return;
      cancel();
    },
    cancel,
  };
}
