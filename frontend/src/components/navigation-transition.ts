import { Animated, Easing } from 'react-native';

export const navBubbleProgress = new Animated.Value(0);
export const navBubbleScale = new Animated.Value(1);
export const navBubbleOpacity = new Animated.Value(0);

export function animateNavBubble(target: 0 | 1, onComplete: () => void) {
  navBubbleOpacity.setValue(1);
  navBubbleScale.setValue(1);
  onComplete();

  Animated.parallel([
    Animated.timing(navBubbleProgress, { toValue: target, duration: 280, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    Animated.sequence([
      Animated.timing(navBubbleScale, { toValue: 1.08, duration: 90, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(navBubbleScale, { toValue: 1.16, duration: 100, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(navBubbleScale, { toValue: 0.01, duration: 100, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]),
    Animated.sequence([
      Animated.delay(190),
      Animated.timing(navBubbleOpacity, { toValue: 0, duration: 100, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]),
  ]).start(({ finished }) => {
    if (!finished) navBubbleOpacity.setValue(0);
  });
}
