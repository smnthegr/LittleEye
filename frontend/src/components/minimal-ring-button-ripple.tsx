import { useLayoutEffect } from 'react';
import { Circle } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

import { MinimalRingRippleArtwork, RIPPLE_FILL_OPACITY, RIPPLE_MID_OPACITY, RIPPLE_PEAK_OPACITY } from '@/components/minimal-ring-ripple-artwork';
import { CONTROL_BOUNDS, type DPadDirection } from '@/utils/minimal-ring-geometry';
import type { DPadFeedback } from '@/utils/dpad-feedback';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function MinimalRingButtonRipple({ control, feedback, disabled, reducedMotion, viewBox }: {
  control: DPadDirection; feedback: DPadFeedback; disabled: boolean; reducedMotion: boolean; viewBox: string;
}) {
  const wave = useSharedValue(1);
  const bounds = CONTROL_BOUNDS[control];
  const radius = Math.min(bounds.width, bounds.height) / 2;
  const props = useAnimatedProps(() => ({
    r: radius * (.3 + wave.get() * 1.35),
    opacity: interpolate(wave.get(), [0, .12, .6, 1], [0, RIPPLE_PEAK_OPACITY, RIPPLE_MID_OPACITY, 0]),
  }));
  useLayoutEffect(() => {
    cancelAnimation(wave);
    wave.set(1);
    if (disabled || reducedMotion) return;
    const unsubscribe = feedback.subscribe(control, {
      press() {
        cancelAnimation(wave);
        // Start already visible so fast repeats cannot keep resetting an invisible wave.
        wave.set(.08);
        wave.set(withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) }));
      },
      release() {}, // Finish the wave after release; the next tap restarts it immediately.
    });
    return () => { unsubscribe(); cancelAnimation(wave); };
  }, [control, disabled, feedback, reducedMotion, wave]);
  return <MinimalRingRippleArtwork control={control} viewBox={viewBox}>
    <AnimatedCircle animatedProps={props} cx={bounds.left + bounds.width / 2} cy={bounds.top + bounds.height / 2}
      stroke="#6EBDFF" strokeWidth={8} fill="#4097FF" fillOpacity={RIPPLE_FILL_OPACITY} />
  </MinimalRingRippleArtwork>;
}
