import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { NavigationBackdrop, NavigationIcon, NavigationMenuArtwork, NavigationMenuGlow } from '@/components/navigation-art';
import { navigateWithTransition } from '@/components/navigation-transition';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { getHomeNavigationLayout } from '@/utils/responsive';
import {
  AID_CONTOUR_DISTANCE,
  CONTOUR_LENGTH,
  CONTOUR_MARKER_LENGTH,
  HOME_CONTOUR_DISTANCE,
  NAVIGATION_CONTOUR_PATH,
} from '@/utils/navigation-contour';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  onOpenMenu: () => void;
  activeTab?: 'home' | 'first-aid';
  menuOpen?: boolean;
  visible?: boolean;
  onHomePress?: () => void;
  onFirstAidPress?: () => void;
};

export function HomeNavigationBar({
  onOpenMenu,
  activeTab = 'first-aid',
  menuOpen = false,
  visible = true,
  onHomePress,
  onFirstAidPress,
}: Props) {
  const { pageWidth, insets } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const layout = getHomeNavigationLayout(pageWidth, insets.bottom);
  const reducedMotion = useReducedMotion();
  const selectedIndex = activeTab === 'home' ? 0 : 1;
  const selection = useSharedValue(selectedIndex);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(selection);
    selection.set(reducedMotion ? selectedIndex : withSpring(selectedIndex, {
      duration: 300,
      dampingRatio: 1,
      clamp: { min: 0, max: 1 },
    }));
    return () => cancelAnimation(selection);
  }, [reducedMotion, selectedIndex, selection]);

  useEffect(() => {
    cancelAnimation(glowPulse);
    glowPulse.set(0);
    if (visible && !reducedMotion) {
      glowPulse.set(withRepeat(withTiming(1, {
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
      }), -1, true));
    }
    return () => cancelAnimation(glowPulse);
  }, [glowPulse, reducedMotion, visible]);

  // This changes the SVG dash's distance along the actual path on the UI thread.
  // Neither the navbar shape nor the fixed center control moves.
  const markerProps = useAnimatedProps(() => ({
    strokeDashoffset: CONTOUR_MARKER_LENGTH / 2 - interpolate(
      selection.get(), [0, 1], [HOME_CONTOUR_DISTANCE, AID_CONTOUR_DISTANCE],
    ),
  }));
  const homeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(selection.get(), [0, 1], [1, 0.55]),
    transform: [{ scale: interpolate(selection.get(), [0, 1], [1.03, 1]) }],
  }));
  const aidStyle = useAnimatedStyle(() => ({
    opacity: interpolate(selection.get(), [0, 1], [0.55, 1]),
    transform: [{ scale: interpolate(selection.get(), [0, 1], [1, 1.03]) }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.get(), [0, 1], [0.42, 0.62]),
    transform: [{ scale: interpolate(glowPulse.get(), [0, 1], [1, 1.035]) }],
  }));

  return <View pointerEvents="box-none" style={[s.fixedDock, { height: layout.height, paddingBottom: layout.sideBottom }]}>
    <View pointerEvents="none" accessible={false} style={[s.wave, { height: layout.artworkHeight }]}>
      <NavigationBackdrop width={pageWidth} height={layout.artworkHeight}>
        <AnimatedPath animatedProps={markerProps} d={NAVIGATION_CONTOUR_PATH} fill="none"
          stroke="#BEDFFF" strokeOpacity={0.2} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={[CONTOUR_MARKER_LENGTH, CONTOUR_LENGTH]} />
        <AnimatedPath animatedProps={markerProps} d={NAVIGATION_CONTOUR_PATH} fill="none"
          stroke="#D9EEFF" strokeOpacity={0.42} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={[CONTOUR_MARKER_LENGTH, CONTOUR_LENGTH]} />
        <AnimatedPath animatedProps={markerProps} d={NAVIGATION_CONTOUR_PATH} fill="none"
          stroke="#F2FAFF" strokeOpacity={0.95} strokeWidth={2.2} strokeLinecap="round"
          strokeDasharray={[CONTOUR_MARKER_LENGTH, CONTOUR_LENGTH]} />
      </NavigationBackdrop>
    </View>
    <View pointerEvents="none" style={[s.footerFill, { top: layout.artworkHeight - 1 }]} />

    <Pressable accessibilityRole="button" accessibilityLabel="Home"
      accessibilityState={{ selected: activeTab === 'home' }}
      onPress={() => {
        if (activeTab !== 'home') {
          if (onHomePress) onHomePress();
          else navigateWithTransition(() => router.dismissTo('/home'));
        }
      }} style={({ pressed }) => [s.sideButton, baseStyles.touchTarget, pressed && s.pressedButton]}>
      <Animated.View pointerEvents="none" style={[s.sideContent, homeStyle]}>
        <View style={s.iconSlot}><NavigationIcon name="home" size={layout.iconSize} /></View>
        <Text style={[s.label, { lineHeight: layout.labelHeight }]}>Home</Text>
      </Animated.View>
    </Pressable>

    <View pointerEvents="box-none" style={[s.mainPosition, { bottom: layout.mainBottom, height: layout.menuSize }]}>
      <Animated.View pointerEvents="none" accessible={false} style={[
        s.menuGlow,
        {
          width: layout.menuGlowWidth,
          height: layout.menuGlowHeight,
          marginLeft: -layout.menuGlowWidth / 2,
          top: (layout.menuSize - layout.menuGlowHeight) / 2,
        },
        glowStyle,
      ]}>
        <NavigationMenuGlow width={layout.menuGlowWidth} height={layout.menuGlowHeight} />
      </Animated.View>
      <Pressable accessibilityRole="button" accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
        accessibilityState={{ expanded: menuOpen }} onPress={onOpenMenu}
        style={({ pressed }) => [s.mainButton, {
          width: layout.menuSize, height: layout.menuSize, borderRadius: layout.menuSize / 2,
        }, pressed && s.pressedButton]}>
        <View pointerEvents="none"><NavigationMenuArtwork size={layout.menuSize} /></View>
      </Pressable>
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="First aid"
      accessibilityState={{ selected: activeTab === 'first-aid' }}
      onPress={() => {
        if (activeTab !== 'first-aid') {
          if (onFirstAidPress) onFirstAidPress();
          else navigateWithTransition(() => router.navigate('/first-aid-guidance'));
        }
      }} style={({ pressed }) => [s.sideButton, baseStyles.touchTarget, pressed && s.pressedButton]}>
      <Animated.View pointerEvents="none" style={[s.sideContent, aidStyle]}>
        <View style={s.iconSlot}><NavigationIcon name="first-aid" size={layout.iconSize} /></View>
        <Text style={[s.label, { lineHeight: layout.labelHeight }]}>First-Aid</Text>
      </Animated.View>
    </Pressable>
  </View>;
}

const baseStyles = StyleSheet.create({
  fixedDock: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 30,
  },
  wave: { position: 'absolute', top: 0, left: 0, right: 0 },
  footerFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.blue },
  sideButton: { zIndex: 2, width: 82, alignItems: 'center', justifyContent: 'flex-end' },
  touchTarget: { minWidth: 44, minHeight: 44 },
  sideContent: { alignItems: 'center', gap: 6 },
  iconSlot: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  label: { color: C.white, fontFamily: F.semiBold, fontSize: 13 },
  mainPosition: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 3 },
  menuGlow: { position: 'absolute', left: '50%' },
  mainButton: { alignItems: 'center', justifyContent: 'center' },
  pressedButton: { opacity: 0.78 },
});
