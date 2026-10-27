import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';

import { formatLiveTimestamp } from '@/utils/live-timestamp';

export function useLiveTimestamp(enabled = true) {
  const [now, setNow] = useState(() => new Date());

  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const refresh = () => setNow(new Date());
    const stop = () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      stop();
      timer = setInterval(refresh, 1000);
    };
    const initialRefresh = setTimeout(refresh, 0);
    if (AppState.currentState !== 'background' && AppState.currentState !== 'inactive') start();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
        start();
      } else stop();
    });
    return () => {
      clearTimeout(initialRefresh);
      stop();
      subscription.remove();
    };
  }, [enabled]));

  return formatLiveTimestamp(now);
}
