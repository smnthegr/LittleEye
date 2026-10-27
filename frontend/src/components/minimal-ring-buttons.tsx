import { useLayoutEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { MinimalRingArtwork } from '@/components/minimal-ring-artwork';
import { MinimalRingButtonRipple } from '@/components/minimal-ring-button-ripple';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { DPadFeedback } from '@/utils/dpad-feedback';
import { BUTTON_ART_PADDING, BUTTON_PRESS_SCALE, CONTROL_BOUNDS, type DPadControl } from '@/utils/minimal-ring-geometry';

function GlassButton({ control, pressed, feedback, size, disabled, reducedMotion }: {
  control: DPadControl; pressed: boolean; feedback: DPadFeedback; size: number; disabled: boolean; reducedMotion: boolean;
}) {
  const [depth] = useState(() => new Animated.Value(1));
  const motion = useMemo(() => ({
    translateY: depth.interpolate({ inputRange: [BUTTON_PRESS_SCALE, 1], outputRange: [1, 0] }),
  }), [depth]);

  useLayoutEffect(() => {
    depth.stopAnimation();
    depth.setValue(1);
    if (reducedMotion || disabled || control === 'center') return;
    let animation: Animated.CompositeAnimation | undefined;
    let pressedAt = 0;
    const pressDuration = 45;
    const compress = (duration: number) => Animated.timing(depth, { toValue: BUTTON_PRESS_SCALE,
      duration, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    const unsubscribe = feedback.subscribe(control, {
      press() {
        pressedAt = Date.now();
        animation?.stop();
        animation = compress(pressDuration);
        animation.start();
      },
      release() {
        animation?.stop();
        const remaining = Math.max(0, pressDuration - (Date.now() - pressedAt));
        const spring = Animated.spring(depth, { toValue: 1, stiffness: 280, damping: 17, mass: .6, useNativeDriver: true });
        // Even a tap shorter than a frame gets a visible dip; a new press interrupts it.
        animation = remaining > 0 ? Animated.sequence([compress(remaining), spring]) : spring;
        animation.start();
      },
    });
    return () => { unsubscribe(); animation?.stop(); depth.stopAnimation(); };
  }, [control, depth, disabled, feedback, reducedMotion]);

  const bounds = CONTROL_BOUNDS[control];
  const padding = BUTTON_ART_PADDING;
  const scale = size / 300;
  const width = (bounds.width + padding * 2) * scale;
  const height = (bounds.height + padding * 2) * scale;
  const viewBox = `${bounds.left - padding} ${bounds.top - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`;
  return <Animated.View pointerEvents="none" style={{ position: 'absolute',
    left: (bounds.left - padding) * scale, top: (bounds.top - padding) * scale, width, height,
    transform: [{ translateY: motion.translateY }, { scale: depth }] }}>
    <MinimalRingArtwork control={control} active={pressed ? control : null} disabled={disabled}
      viewBox={viewBox} />
    {control !== 'center' && <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <MinimalRingButtonRipple control={control} feedback={feedback} disabled={disabled}
        reducedMotion={reducedMotion} viewBox={viewBox} />
    </View>}
  </Animated.View>;
}

/** Animate each glass segment independently while the ring and hit regions stay fixed. */
export function MinimalRingButtons({ active, feedback, size, disabled }: {
  active: DPadControl | null; feedback: DPadFeedback; size: number; disabled: boolean;
}) {
  const reducedMotion = useReducedMotion();
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {(Object.keys(CONTROL_BOUNDS) as DPadControl[]).map(control => <GlassButton key={control}
      control={control} pressed={active === control} feedback={feedback} size={size} disabled={disabled} reducedMotion={reducedMotion} />)}
  </View>;
}

