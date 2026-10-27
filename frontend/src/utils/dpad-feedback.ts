import type { DPadDirection } from './minimal-ring-geometry';

type Listener = { press: () => void; release: () => void };

/** Deliver accepted touches directly to animations, independently of React batching. */
export function createDPadFeedback() {
  const listeners = new Map<DPadDirection, Set<Listener>>();
  let active: DPadDirection | null = null;
  return {
    set(control: DPadDirection | null) {
      if (control === active) return;
      if (active) listeners.get(active)?.forEach(listener => listener.release());
      active = control;
      if (active) listeners.get(active)?.forEach(listener => listener.press());
    },
    subscribe(control: DPadDirection, listener: Listener) {
      const group = listeners.get(control) ?? new Set<Listener>();
      listeners.set(control, group);
      group.add(listener);
      return () => { group.delete(listener); };
    },
  };
}

export type DPadFeedback = ReturnType<typeof createDPadFeedback>;
