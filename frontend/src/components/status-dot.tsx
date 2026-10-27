import { useCallback, useMemo, useState } from 'react';
import { Animated, AppState, Easing, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function StatusDot({ color, size = 6, active = true }: { color: string; size?: number; active?: boolean }) {
  const reducedMotion = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(0));
  const motion = useMemo(() => ({
    opacity: pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.6, 1] }),
    haloOpacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
    haloScale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }),
  }), [pulse]);

  useFocusEffect(useCallback(() => {
    if (!active || reducedMotion) { pulse.setValue(0); return; }
    const animation = Animated.loop(Animated.timing(pulse, {
      toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true, isInteraction: false,
    }));
    function update(state: string | null) {
      animation.stop(); animation.reset(); pulse.setValue(0);
      if (state === 'active' || state === null) animation.start();
    }
    update(AppState.currentState);
    const subscription = AppState.addEventListener('change', update);
    return () => { subscription.remove(); animation.stop(); pulse.setValue(0); };
  }, [active, pulse, reducedMotion]));

  const dot = { backgroundColor: color, borderRadius: size / 2 };
  return <View pointerEvents="none" accessible={false} style={{ width: size, height: size }}>
    {active && !reducedMotion && <Animated.View style={[StyleSheet.absoluteFill, dot, {
      opacity: motion.haloOpacity, transform: [{ scale: motion.haloScale }],
    }]} />}
    <Animated.View style={[StyleSheet.absoluteFill, dot, { opacity: motion.opacity }]} />
  </View>;
}
