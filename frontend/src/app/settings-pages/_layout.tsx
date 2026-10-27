import { Stack } from 'expo-router';
import { NAVIGATION_TRANSITION_MS } from '@/components/navigation-transition';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export default function SettingsLayout() {
  const reducedMotion = useReducedMotion();
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false, animation: reducedMotion ? 'none' : 'fade', animationDuration: NAVIGATION_TRANSITION_MS }} />;
}
