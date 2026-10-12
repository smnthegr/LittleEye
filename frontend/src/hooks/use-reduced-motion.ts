import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

// Share the OS query and listener between all buttons and screen transitions.
// Motion stays off until the first preference read has completed.
let reducedMotion = true;
let preferenceVersion = 0;
let subscription: ReturnType<typeof AccessibilityInfo.addEventListener> | undefined;
const listeners = new Set<() => void>();

function updatePreference(enabled: boolean) {
  if (reducedMotion === enabled) return;
  reducedMotion = enabled;
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      preferenceVersion += 1;
      updatePreference(enabled);
    });
    const version = ++preferenceVersion;
    void AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (version === preferenceVersion) updatePreference(enabled);
    }).catch(() => {
      // Keep the last known preference when a platform cannot report it.
    });
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      preferenceVersion += 1;
      subscription?.remove();
      subscription = undefined;
    }
  };
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => reducedMotion, () => true);
}
