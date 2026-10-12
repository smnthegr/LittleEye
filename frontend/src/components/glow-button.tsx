import { BrandColors } from '@/constants/brand';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { getPressTransform } from '@/utils/button-motion';
import { useEffect, useState } from 'react';
import {
  Animated, Easing, Pressable, StyleSheet, View,
  type PressableProps,
} from 'react-native';

type GlowButtonProps = PressableProps & {
  pressGlow?: boolean;
  pressRippleScale?: number;
  pressRippleSize?: number;
  pressShimmer?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlowButton({
  children, style, onPressIn, onPressOut, onHoverIn, onHoverOut, onFocus, onBlur, pressGlow = true,
  pressRippleScale = 2.5, pressRippleSize = 140, pressShimmer = true, ...props
}: GlowButtonProps) {
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressScale] = useState(() => new Animated.Value(1));
  const [feedback] = useState(() => new Animated.Value(0));
  const [water] = useState(() => new Animated.Value(0));
  const [waterOpacity] = useState(() => new Animated.Value(0));
  const state = { pressed: props.testOnly_pressed === true || pressed, hovered, focused };
  const resolvedStyle = typeof style === 'function' ? style(state) : style;
  const base = StyleSheet.flatten(resolvedStyle);
  // Keep positioning and rotation supplied by callers when adding press feedback.
  // String transforms are left intact; they cannot be composed by the native driver.
  const transform = getPressTransform(base?.transform, pressScale, reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      pressScale.stopAnimation();
      pressScale.setValue(1);
      water.stopAnimation();
      waterOpacity.stopAnimation();
      waterOpacity.setValue(0);
    }
  }, [pressScale, reducedMotion, water, waterOpacity]);

  useEffect(() => () => {
    pressScale.stopAnimation();
    feedback.stopAnimation();
    water.stopAnimation();
    waterOpacity.stopAnimation();
  }, [feedback, pressScale, water, waterOpacity]);

  function animatePress(active: boolean) {
    if (reducedMotion) {
      feedback.setValue(active ? 1 : 0);
      return;
    }
    Animated.spring(pressScale, {
      toValue: active ? 0.975 : 1,
      stiffness: 420, damping: 32, mass: 0.7,
      overshootClamping: true,
      useNativeDriver: true, isInteraction: false,
    }).start();
    Animated.timing(feedback, {
      toValue: active ? 1 : 0,
      duration: active ? 100 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true, isInteraction: false,
    }).start();
  }

  return (
    <AnimatedPressable {...props}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onPressIn={(event) => {
        setPressed(true);
        animatePress(true);
        if (!reducedMotion) {
          water.stopAnimation();
          water.setValue(0);
          Animated.timing(water, {
            toValue: 1, duration: 460,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true, isInteraction: false,
          }).start();
          Animated.sequence([
            Animated.timing(waterOpacity, {
              toValue: 1, duration: 80,
              useNativeDriver: true, isInteraction: false,
            }),
            Animated.timing(waterOpacity, {
              toValue: 0, duration: 380,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true, isInteraction: false,
            }),
          ]).start();
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        animatePress(false);
        // Continue the wave's expansion while its opacity eases away.
        if (!reducedMotion) {
          Animated.timing(waterOpacity, {
            toValue: 0, duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true, isInteraction: false,
          }).start();
        }
        onPressOut?.(event);
      }}
      style={[resolvedStyle, { transform }]}>
      {(pressState) => (
        <>
          <View pointerEvents="none" accessible={false} style={[styles.clip, { borderRadius: base?.borderRadius ?? 30 }]}>
            {pressGlow && <Animated.View style={[StyleSheet.absoluteFill, styles.highlight, {
              opacity: feedback.interpolate({ inputRange: [0, 1], outputRange: [0, 0.09] }),
            }]} />}
            {!reducedMotion && <Animated.View style={[styles.wave, {
              width: pressRippleSize,
              height: pressRippleSize,
              marginLeft: -pressRippleSize / 2,
              marginTop: -pressRippleSize / 2,
              opacity: waterOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.36] }),
              transform: [{ scale: water.interpolate({ inputRange: [0, 1], outputRange: [0.2, pressRippleScale] }) }],
            }]} />}
            {!reducedMotion && pressShimmer && <Animated.View style={[styles.wave, styles.shimmer, {
              opacity: waterOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14] }),
              transform: [{ scale: water.interpolate({ inputRange: [0, 1], outputRange: [0.1, 2] }) }],
            }]} />}
          </View>
          {typeof children === 'function' ? children(pressState) : children}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  clip: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' },
  highlight: { backgroundColor: BrandColors.white },
  wave: { position: 'absolute', left: '50%', top: '50%', borderRadius: 1000, backgroundColor: 'rgba(148,176,213,0.5)' },
  shimmer: { width: 100, height: 60, marginLeft: -50, marginTop: -30, backgroundColor: BrandColors.white },
});
