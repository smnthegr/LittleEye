import { useRef, type ComponentRef } from 'react';
import type { View } from 'react-native';

export function useTimelineWheel(_onZoom: (scale: number) => void) {
  return useRef<ComponentRef<typeof View> | null>(null);
}
