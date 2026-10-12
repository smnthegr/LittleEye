export const NAVIGATION_TRANSITION_MS = 350;

let pendingNavigation: ReturnType<typeof setTimeout> | undefined;

/** Let the native stack animate once, and prevent rapid taps from stacking routes. */
export function navigateWithTransition(navigate: () => void): boolean {
  if (pendingNavigation !== undefined) return false;
  pendingNavigation = setTimeout(() => {
    pendingNavigation = undefined;
  }, NAVIGATION_TRANSITION_MS);

  try {
    navigate();
    return true;
  } catch (error) {
    clearTimeout(pendingNavigation);
    pendingNavigation = undefined;
    throw error;
  }
}
