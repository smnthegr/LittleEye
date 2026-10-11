import { BrandColors } from '@/constants/brand';
import { type ReactNode } from 'react';
import { Image } from 'expo-image';
import { Animated, StyleSheet, View, useWindowDimensions, type ColorValue } from 'react-native';
import { navBubbleOpacity, navBubbleProgress, navBubbleScale } from '@/components/navigation-transition';

export function PageTransition({ children, backgroundColor = BrandColors.white }: {
  children: ReactNode;
  backgroundColor?: ColorValue;
}) {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.frame, { backgroundColor }]}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.navBubble, {
        left: width * .18 - 34,
        opacity: navBubbleOpacity,
        transform: [
          { translateX: navBubbleProgress.interpolate({ inputRange: [0, 1], outputRange: [0, width * .64 + 10] }) },
          { scale: navBubbleScale },
        ],
      }]}>
        <Image source={require('../../assets/images/nav-transition-bubble.svg')} contentFit="contain" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  navBubble: { position: 'absolute', zIndex: 20, bottom: 54, width: 58, height: 58, borderRadius: 30, backgroundColor: 'transparent', boxShadow: '0 0 17px rgba(148,218,255,.28), 0 3px 10px rgba(50,80,123,.16)' },
});
