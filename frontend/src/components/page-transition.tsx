import { BrandColors } from '@/constants/brand';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View, type ColorValue } from 'react-native';

export function PageTransition({ children, backgroundColor = BrandColors.white }: {
  children: ReactNode;
  backgroundColor?: ColorValue;
}) {
  const [progress] = useState(() => new Animated.Value(0));

  useFocusEffect(useCallback(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1, duration: 280,
      easing: Easing.inOut(Easing.sin), useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress]));

  return (
    <View style={[styles.frame, { backgroundColor }]}>
      <Animated.View style={[styles.page, {
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
      }]}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  page: { flex: 1 },
});
