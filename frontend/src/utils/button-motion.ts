import type { Animated, ViewStyle } from 'react-native';

export function getPressTransform(transform: ViewStyle['transform'], pressScale: Animated.Value, reducedMotion: boolean) {
  if (typeof transform === 'string' || reducedMotion) return transform;
  return [...(transform ?? []), { scale: pressScale }];
}
