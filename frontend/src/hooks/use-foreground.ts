import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Pause audible/animated previews while the application is not in the foreground. */
export function useForeground() {
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);
  return foreground;
}
