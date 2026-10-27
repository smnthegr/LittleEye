import { BrandColors } from '@/constants/brand';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import './glow-button-focus';
import {
  Animated, AppState, Easing, Platform, Pressable, StyleSheet, View,
  type PressableProps,
} from 'react-native';

type GlowButtonProps = PressableProps & {
  background?: ReactNode;
  pressGlow?: boolean | 'soft';
  pressRippleScale?: number;
  pressRippleSize?: number;
  pressShimmer?: boolean;
};

export function GlowButton({
  children, background, style, onPressIn, onPressOut, pressGlow = true,
  pressRippleScale = 2.5, pressRippleSize = 140, pressShimmer = true, ...props
}: GlowButtonProps) {
  const reducedMotion = useReducedMotion();
  const [water] = useState(() => new Animated.Value(0));
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [pressActive, setPressActive] = useState(false);
  const feedbackAllowed = !reducedMotion && !props.disabled;
  const [previousFeedbackAllowed, setPreviousFeedbackAllowed] = useState(feedbackAllowed);
  // Clear React's visual state before committing changed motion/disabled settings.
  if (previousFeedbackAllowed !== feedbackAllowed) {
    setPreviousFeedbackAllowed(feedbackAllowed);
    if (!feedbackAllowed) {
      setFeedbackVisible(false);
      setPressActive(false);
    }
  }
  const feedbackEpoch = useRef(0);
  const resetFeedback = useCallback(() => {
    feedbackEpoch.current += 1;
    water.stopAnimation();
    water.setValue(0);
    setFeedbackVisible(false);
    setPressActive(false);
  }, [water]);
  const motion = useMemo(() => ({
    waveOpacity: water.interpolate({ inputRange: [0, 0.15, 0.6, 1], outputRange: [0, 0.6, 0.4, 0] }),
    waveScale: water.interpolate({ inputRange: [0, 1], outputRange: [0.2, pressRippleScale] }),
    waveRotation: water.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] }),
    shimmerOpacity: water.interpolate({ inputRange: [0, 0.25, 0.65, 1], outputRange: [0, 0.18, 0.1, 0] }),
    shimmerScale: water.interpolate({ inputRange: [0, 1], outputRange: [0.1, 2] }),
    shimmerRotation: water.interpolate({ inputRange: [0, 1], outputRange: ['15deg', '-15deg'] }),
  }), [pressRippleScale, water]);

  useEffect(() => {
    if (!feedbackAllowed) {
      feedbackEpoch.current += 1;
      water.stopAnimation();
      water.setValue(0);
    }
  }, [feedbackAllowed, water]);

  useEffect(() => {
    // A suspended native animation may resume without a matching press-out.
    const change = AppState.addEventListener('change', resetFeedback);
    const blur = Platform.OS === 'android' ? AppState.addEventListener('blur', resetFeedback) : undefined;
    const focus = Platform.OS === 'android' ? AppState.addEventListener('focus', resetFeedback) : undefined;
    return () => {
      change.remove();
      blur?.remove();
      focus?.remove();
      feedbackEpoch.current += 1;
      water.stopAnimation();
    };
  }, [resetFeedback, water]);

  return <Pressable {...props}
    {...(Platform.OS === 'web' ? { dataSet: { glowButton: 'true' } } : {})}
    onPressIn={event => {
      resetFeedback();
      setPressActive(true);
      if (!reducedMotion) {
        const epoch = feedbackEpoch.current;
        setFeedbackVisible(true);
        Animated.timing(water, {
          toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }).start(() => {
          if (feedbackEpoch.current !== epoch) return;
          setFeedbackVisible(false);
          water.setValue(0);
        });
      }
      onPressIn?.(event);
    }}
    onPressOut={event => {
      resetFeedback();
      onPressOut?.(event);
    }}
    style={state => {
      const resolvedStyle = typeof style === 'function' ? style(state) : style;
      const base = StyleSheet.flatten(resolvedStyle);
      // Keep caller positioning/rotation when applying the supplied press movement.
      const transform = typeof base?.transform === 'string' ? base.transform
        : [...(base?.transform ?? []), ...styles.pressSize.transform];
      return [resolvedStyle, state.pressed && pressActive && pressGlow && (pressGlow === 'soft' ? styles.softGlow : styles.glow),
        state.pressed && pressActive && !reducedMotion && { transform }];
    }}>
    {state => {
      const base = StyleSheet.flatten(typeof style === 'function' ? style(state) : style);
      return <>
        {background}
        {/* Unmount idle effects so native resume cannot expose a stale white shimmer. */}
        {feedbackVisible && !reducedMotion && !props.disabled && <View pointerEvents="none" accessible={false} style={[styles.clip, { borderRadius: base?.borderRadius ?? 30 }]}>
          {!reducedMotion && <Animated.View style={[styles.wave, {
            width: pressRippleSize, height: pressRippleSize,
            marginLeft: -pressRippleSize / 2, marginTop: -pressRippleSize / 2,
            opacity: motion.waveOpacity,
            transform: [{ scale: motion.waveScale }, { rotate: motion.waveRotation }],
          }]} />}
          {!reducedMotion && pressShimmer && <Animated.View style={[styles.wave, styles.shimmer, {
            opacity: motion.shimmerOpacity,
            transform: [{ scale: motion.shimmerScale }, { rotate: motion.shimmerRotation }],
          }]} />}
        </View>}
        {typeof children === 'function' ? children(state) : children}
      </>;
    }}
  </Pressable>;
}

const styles = StyleSheet.create({
  glow: { shadowOpacity: 0, elevation: 0, boxShadow: '0 0 30px 8px rgba(148,176,213,0.5), 0 8px 22px rgba(50,80,123,0.22)' },
  // Compact controls inside cards/lists need a halo that fits their surrounding padding.
  softGlow: { shadowOpacity: 0, elevation: 0, boxShadow: '0 0 8px 1px rgba(148,176,213,0.32), 0 2px 5px rgba(50,80,123,0.14)' },
  pressSize: { transform: [{ scale: 0.98 }, { translateY: 1 }] },
  clip: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' },
  wave: {
    position: 'absolute', width: 140, height: 80, left: '50%', top: '50%',
    marginLeft: -70, marginTop: -40, borderRadius: 1000,
    backgroundColor: 'rgba(148,176,213,0.45)',
    boxShadow: '0 0 20px 16px rgba(148,176,213,0.6)',
  },
  shimmer: {
    width: 100, height: 60, marginLeft: -50, marginTop: -30,
    backgroundColor: BrandColors.white, boxShadow: '0 0 18px 12px rgba(255,255,255,0.35)',
  },
});
