import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

/** Slide video overlays out without unmounting them or interrupting the feed. */
export function useVideoOverlayControls() {
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [progress] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();
  const motion = useMemo(() => ({
    top: progress.interpolate({ inputRange: [0, 1], outputRange: [-160, 0] }),
    bottom: progress.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }),
  }), [progress]);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0, duration: reducedMotion ? 0 : 260,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    animation.start(({ finished }) => { if (finished && !visible) setHidden(true); });
    return () => animation.stop();
  }, [progress, reducedMotion, visible]);

  const toggle = useCallback(() => {
    setHidden(false);
    setVisible(value => !value);
  }, []);
  const show = useCallback(() => { setHidden(false); setVisible(true); }, []);

  return { visible, hidden: hidden && !visible, progress, motion, toggle, show };
}
