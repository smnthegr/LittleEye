import { useEffect, useRef, type ComponentRef } from 'react';
import type { View } from 'react-native';

/** Capture wheel/trackpad pinch on the timeline without zooming the browser page. */
export function useTimelineWheel(onZoom: (scale: number) => void) {
  const ref = useRef<ComponentRef<typeof View> | null>(null);
  useEffect(() => {
    const element = ref.current as unknown as HTMLElement | null;
    if (!element) return;
    function wheel(event: WheelEvent) {
      if (!event.deltaY) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element!.clientHeight : 1);
      onZoom(Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.005));
    }
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [onZoom]);
  return ref;
}
