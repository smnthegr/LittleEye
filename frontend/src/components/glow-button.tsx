import { BrandColors } from '@/constants/brand';
import { useEffect, useState } from 'react';
import {
  Animated, Easing, Pressable, StyleSheet, View,
  type PressableProps,
} from 'react-native';

export function GlowButton({ children, style, onPressIn, onPressOut, ...props }: PressableProps) {
  const [water] = useState(() => new Animated.Value(0));

  useEffect(() => () => water.stopAnimation(), [water]);

  return (
    <Pressable {...props}
      onPressIn={(event) => {
        water.stopAnimation();
        water.setValue(0);
        Animated.timing(water, {
          toValue: 1, duration: 400,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }).start();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        water.stopAnimation();
        water.setValue(0);
        onPressOut?.(event);
      }}
      style={(state) => [typeof style === 'function' ? style(state) : style,
        state.pressed && styles.glow,
        state.pressed && styles.pressSize]}>
      {(state) => {
        const base = StyleSheet.flatten(typeof style === 'function' ? style(state) : style);
        return (
          <>
            <View pointerEvents="none" style={[styles.clip, { borderRadius: base?.borderRadius ?? 30 }]}>
              <Animated.View style={[styles.wave, {
                opacity: water.interpolate({ inputRange: [0, 0.15, 0.6, 1], outputRange: [0, 0.6, 0.4, 0] }),
                transform: [
                  { scale: water.interpolate({ inputRange: [0, 1], outputRange: [0.2, 2.5] }) },
                  { rotate: water.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] }) },
                ],
              }]} />
              <Animated.View style={[styles.wave, styles.shimmer, {
                opacity: water.interpolate({ inputRange: [0, 0.25, 0.65, 1], outputRange: [0, 0.18, 0.1, 0] }),
                transform: [
                  { scale: water.interpolate({ inputRange: [0, 1], outputRange: [0.1, 2] }) },
                  { rotate: water.interpolate({ inputRange: [0, 1], outputRange: ['15deg', '-15deg'] }) },
                ],
              }]} />
            </View>
            {typeof children === 'function' ? children(state) : children}
          </>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glow: { shadowOpacity: 0, elevation: 0, boxShadow: '0 0 30px 8px rgba(148,176,213,0.5), 0 8px 22px rgba(50,80,123,0.22)' },
  pressSize: { transform: [{ scale: 0.98 }, { translateY: 1 }] },
  clip: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' },
  wave: { position: 'absolute', width: 140, height: 80, left: '50%', top: '50%', marginLeft: -70, marginTop: -40, borderRadius: 1000, backgroundColor: 'rgba(148,176,213,0.45)', boxShadow: '0 0 20px 16px rgba(148,176,213,0.6)' },
  shimmer: { width: 100, height: 60, marginLeft: -50, marginTop: -30, backgroundColor: BrandColors.white, boxShadow: '0 0 18px 12px rgba(255,255,255,0.35)' },
});
