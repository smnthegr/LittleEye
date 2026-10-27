import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Animated, AppState, Easing, StyleSheet, View } from 'react-native';

import { AMBIENT_GLOW_DISABLED_OPACITY, AMBIENT_GLOW_MAX_OPACITY, AMBIENT_GLOW_MIN_OPACITY,
  MinimalRingGlowArtwork, PRESS_BLOOM_OPACITY } from '@/components/minimal-ring-glow-artwork';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { DPadDirection } from '@/utils/minimal-ring-geometry';
import type { DPadFeedback } from '@/utils/dpad-feedback';

const controls: DPadDirection[] = ['up', 'right', 'down', 'left'];

function ButtonBloom({ control, feedback, disabled, reducedMotion }: {
  control: DPadDirection; feedback: DPadFeedback; disabled: boolean; reducedMotion: boolean;
}) {
  const [brightness] = useState(() => new Animated.Value(0));
  useLayoutEffect(() => {
    brightness.stopAnimation();
    brightness.setValue(0);
    if (disabled) return;
    const unsubscribe = feedback.subscribe(control, {
      press() { brightness.stopAnimation(); brightness.setValue(PRESS_BLOOM_OPACITY); },
      release() {
        Animated.timing(brightness, { toValue: 0, duration: reducedMotion ? 0 : 380,
          easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      },
    });
    return () => { unsubscribe(); brightness.stopAnimation(); };
  }, [brightness, control, disabled, feedback, reducedMotion]);
  return <Animated.View pointerEvents="none" style={[styles.glowExtent, { opacity: brightness }]}>
    <MinimalRingGlowArtwork control={control} />
  </Animated.View>;
}

/** Only the blurred light expands. The controller, ring and buttons stay stationary. */
export function MinimalRingEffects({ feedback, disabled }: { feedback: DPadFeedback; disabled: boolean }) {
  const reducedMotion = useReducedMotion();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [pulse] = useState(() => new Animated.Value(0));
  const motion = useMemo(() => ({
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [AMBIENT_GLOW_MIN_OPACITY, AMBIENT_GLOW_MAX_OPACITY] }),
    scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [.98, 1.085] }),
  }), [pulse]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription?.remove();
  }, []);
  useEffect(() => {
    pulse.setValue(0);
    if (reducedMotion || disabled || !foreground) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [disabled, foreground, pulse, reducedMotion]);
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Animated.View style={[styles.glowExtent, { opacity: disabled ? AMBIENT_GLOW_DISABLED_OPACITY : motion.opacity,
      transform: [{ scale: motion.scale }] }]}>
      <MinimalRingGlowArtwork />
    </Animated.View>
    {controls.map(control => <ButtonBloom key={control} control={control} feedback={feedback}
      disabled={disabled} reducedMotion={reducedMotion} />)}
  </View>;
}

const styles = StyleSheet.create({ glowExtent: { position: 'absolute', left: '-12%', top: '-12%', width: '124%', height: '124%' } });
