import { useRef } from 'react';
import type { View } from 'react-native';

export function useTimelineWheel(_onZoom: (scale: number) => void) {
  return useRef<View | null>(null);
}
