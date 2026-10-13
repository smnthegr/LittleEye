import { useEffect, useRef } from 'react';
import { router, useRootNavigationState } from 'expo-router';
import { useAppSession } from '@/components/app-session';
import { getHomeDestination } from '@/utils/session-navigation';

/** Navigate after the new session's protected routes have committed. */
export function useSessionNavigation() {
  const session = useAppSession();
  const navigationState = useRootNavigationState();
  const previousSignedIn = useRef(session.signedIn);
  const destination = getHomeDestination(session);

  useEffect(() => {
    if (!navigationState?.key || previousSignedIn.current === session.signedIn) return;
    previousSignedIn.current = session.signedIn;
    router.replace(destination);
  }, [destination, navigationState?.key, session.signedIn]);
}
