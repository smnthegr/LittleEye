import { BrandColors } from '@/constants/brand';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, StyleSheet, type ColorValue } from 'react-native';

export function PageTransition({ children, backgroundColor = BrandColors.white, animateOnMount = true }: {
  children: ReactNode;
  backgroundColor?: ColorValue;
  animateOnMount?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [entrance] = useState(() => new Animated.Value(animateOnMount && !reducedMotion ? 0 : 1));

  useEffect(() => {
    if (!animateOnMount || reducedMotion) {
      entrance.stopAnimation();
      entrance.setValue(1);
      return;
    }
    const animation = Animated.timing(entrance, {
      toValue: 1, duration: 180, easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animateOnMount, entrance, reducedMotion]);

  return (
    <Animated.View style={[styles.frame, {
      backgroundColor,
      opacity: entrance,
      transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
});
