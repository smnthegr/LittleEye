import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  NavigationBackdrop,
  NavigationBackdropShadow,
  NavigationIcon,
  NavigationMenuArtwork,
  NavigationMenuAccents,
  NavigationSideTapEffect,
  NavigationSurfaceSheen,
} from '@/components/navigation-art';
import { navigateWithTransition } from '@/components/navigation-transition';
import '@/components/glow-button-focus';
import { useAppSession } from '@/components/app-session';
import { getHomeDestination } from '@/utils/session-navigation';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { getHomeNavigationLayout } from '@/utils/responsive';
import { HomeAmbientColors } from '@/components/home-ambient-background';

function useTapFeedback(visible: boolean, reducedMotion: boolean) {
  const pressure = useSharedValue(0);
  const halo = useSharedValue(0);
  const ripple = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(pressure);
    cancelAnimation(halo);
    cancelAnimation(ripple);
    pressure.set(0);
    halo.set(0);
    ripple.set(0);
    return () => {
      cancelAnimation(pressure);
      cancelAnimation(halo);
      cancelAnimation(ripple);
    };
  }, [halo, pressure, reducedMotion, ripple, visible]);

  function pressIn() {
    cancelAnimation(ripple);
    ripple.set(0);
    if (!reducedMotion) ripple.set(withTiming(1, {
      duration: 750, easing: Easing.linear, reduceMotion: ReduceMotion.Never,
    }));
    cancelAnimation(pressure);
    cancelAnimation(halo);
    pressure.set(reducedMotion ? 0 : withTiming(1, {
      duration: 100, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never,
    }));
    halo.set(reducedMotion ? 1 : withTiming(1, {
      duration: 100, reduceMotion: ReduceMotion.Never,
    }));
  }

  function pressOut() {
    pressure.set(reducedMotion ? 0 : withSpring(0, {
      stiffness: 340, damping: 18, mass: 0.65, reduceMotion: ReduceMotion.Never,
    }));
    halo.set(reducedMotion ? 0 : withTiming(0, {
      duration: 380, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never,
    }));
  }

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressure.get() * 0.09 }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: halo.get(),
    transform: [{ scale: reducedMotion ? 1 : 1.12 - pressure.get() * 0.24 }],
  }));
  return { pressIn, pressOut, contentStyle, haloStyle, haloProgress: halo, rippleProgress: ripple };
}

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
  const session = useAppSession();
  const { pageWidth, insets, scaleSize, fontScale } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const layout = getHomeNavigationLayout(pageWidth, insets.bottom, fontScale);
  const reducedMotion = useReducedMotion();
  const selectedIndex = activeTab === 'home' ? 0 : 1;
  const selection = useSharedValue(selectedIndex);
  const glowPulse = useSharedValue(0.5);
  const menuFloat = useSharedValue(0);
  const menuGloss = useSharedValue(0);
  const homeTap = useTapFeedback(visible, reducedMotion);
  const aidTap = useTapFeedback(visible, reducedMotion);
  const {
    pressIn: menuPressIn, pressOut: menuPressOut, contentStyle: menuContentStyle,
    haloProgress: menuPressProgress,
  } = useTapFeedback(visible, reducedMotion);
  const floatDistance = scaleSize(4);
  const sideTouchHeight = Math.max(44, layout.iconSlotSize);
  const sideBottom = layout.sideBottom + (layout.iconSlotSize + layout.iconGap + layout.labelHeight - sideTouchHeight) / 2;

  useEffect(() => {
    cancelAnimation(selection);
    selection.set(selectedIndex);
    return () => cancelAnimation(selection);
  }, [reducedMotion, selectedIndex, selection]);

  useEffect(() => {
    cancelAnimation(glowPulse);
    cancelAnimation(menuFloat);
    cancelAnimation(menuGloss);
    menuGloss.set(0);
    // Keep a steady light while hidden or when the phone requests less motion.
    glowPulse.set(visible && !reducedMotion ? 0 : 0.5);
    menuFloat.set(0);
    if (visible && !reducedMotion) {
      // The live preference above controls this loop; Reanimated's startup
      // snapshot must not leave it stopped after the preference changes.
      glowPulse.set(withRepeat(withTiming(1, {
        duration: 1800,
        easing: Easing.inOut(Easing.sin),
        reduceMotion: ReduceMotion.Never,
      }), -1, true, undefined, ReduceMotion.Never));
      menuFloat.set(withRepeat(withTiming(1, {
        duration: 2400,
        easing: Easing.inOut(Easing.sin),
        reduceMotion: ReduceMotion.Never,
      }), -1, true, undefined, ReduceMotion.Never));
    }
    return () => {
      cancelAnimation(glowPulse);
      cancelAnimation(menuFloat);
      cancelAnimation(menuGloss);
    };
  }, [glowPulse, menuFloat, menuGloss, reducedMotion, visible]);

  const homeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(selection.get(), [0, 1], [1, 0.55]),
    transform: [{ scale: interpolate(selection.get(), [0, 1], [1.03, 1]) }],
  }));
  const aidStyle = useAnimatedStyle(() => ({
    opacity: interpolate(selection.get(), [0, 1], [0.55, 1]),
    transform: [{ scale: interpolate(selection.get(), [0, 1], [1, 1.03]) }],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.get(), [0, 1], [0.32, 0.78]) * (activeTab === 'home' ? .4 : 1),
  }));
  const menuFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(menuFloat.get(), [0, 1], [0, -floatDistance]) }],
  }));
  const menuGlowStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, interpolate(glowPulse.get(), [0, 1], [0.3, 0.75]) + menuPressProgress.get() * 0.65)
      * (activeTab === 'home' ? 0.45 : 1),
  }));
  const menuPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: visible && !reducedMotion
      ? interpolate(glowPulse.get(), [0, 1], [0.98, 1.06]) : 1 }],
  }));

  return <View pointerEvents="box-none" style={[s.fixedDock, {
    height: layout.height, paddingBottom: sideBottom, paddingHorizontal: layout.sideInset,
  }]}>
    <View pointerEvents="none" accessible={false} style={[s.wave, {
      top: layout.artworkTop, height: layout.artworkHeight,
    }]}>
      <Animated.View style={[StyleSheet.absoluteFill, shadowStyle]}>
        <NavigationBackdropShadow width={pageWidth} height={layout.artworkHeight} />
      </Animated.View>
      <NavigationBackdrop width={pageWidth} height={layout.artworkHeight} homeAmbient={activeTab === 'home'}>
        <NavigationSurfaceSheen progress={glowPulse} />
      </NavigationBackdrop>
    </View>
    <View pointerEvents="none" style={[s.footerFill, { top: layout.artworkHeight - 1 },
      activeTab === 'home' && { backgroundColor: HomeAmbientColors.navigationBottom }]} />
    <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
      <NavigationSideTapEffect width={pageWidth} height={layout.height}
        artworkHeight={layout.artworkHeight} home={homeTap.haloProgress} aid={aidTap.haloProgress}
        homeRipple={homeTap.rippleProgress} aidRipple={aidTap.rippleProgress}
        sideCenter={layout.sideCenterInset * 390 / pageWidth} />
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="Home"
      accessibilityState={{ selected: activeTab === 'home' }}
      onPressIn={homeTap.pressIn}
      onPressOut={homeTap.pressOut}
      onPress={() => {
        if (activeTab !== 'home') {
          if (onHomePress) onHomePress();
          else navigateWithTransition(() => router.dismissTo(getHomeDestination(session)));
        }
      }} style={[s.sideButton, baseStyles.touchTarget]}>
      <Animated.View pointerEvents="none" style={homeTap.contentStyle}>
        <Animated.View pointerEvents="none" style={[s.sideContent, homeStyle]}>
          <View style={s.iconSlot}><NavigationIcon name="home" size={scaleSize(31)} /></View>
        </Animated.View>
      </Animated.View>
    </Pressable>

    <View pointerEvents="box-none" style={[s.mainPosition, {
      bottom: layout.mainBottom, height: layout.menuSize + floatDistance, paddingTop: floatDistance,
    }]}>
      <Animated.View style={menuFloatStyle}>
        <View pointerEvents="none" accessible={false} style={{
          position: 'absolute', left: -layout.menuSize * 0.3, top: -layout.menuSize * 0.2,
        }}>
          <NavigationMenuAccents size={layout.menuSize} />
        </View>
        <Animated.View style={menuPulseStyle}>
          <Animated.View style={menuContentStyle}>
            {/* Keep the shadow source inside the artwork and share every transform. */}
            <Animated.View pointerEvents="none" accessible={false} style={[s.menuHalo, {
              width: layout.menuSize * 0.92, height: layout.menuSize * 0.92, borderRadius: layout.menuSize / 2,
              left: layout.menuSize * 0.04, top: layout.menuSize * 0.04,
            }, menuGlowStyle]} />
            <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
              <NavigationMenuArtwork size={layout.menuSize} glossOpacity={menuGloss} />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
              {...(Platform.OS === 'web' ? { dataSet: { glowButton: 'true' } } : {})}
              accessibilityState={{ expanded: menuOpen }} onPress={onOpenMenu}
              onPressIn={() => {
                menuPressIn();
                cancelAnimation(menuGloss);
                // Flash at full strength immediately, including on very quick taps.
                menuGloss.set(1);
                if (!reducedMotion) menuGloss.set(withTiming(0, {
                  duration: 350, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.Never,
                }));
              }}
              onPressOut={() => {
                menuPressOut();
                if (reducedMotion) menuGloss.set(0);
              }}
              style={[s.mainButton, {
                width: layout.menuSize, height: layout.menuSize, borderRadius: layout.menuSize / 2,
              }]}>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="First aid"
      accessibilityState={{ selected: activeTab === 'first-aid' }}
      onPressIn={aidTap.pressIn}
      onPressOut={aidTap.pressOut}
      onPress={() => {
        if (activeTab !== 'first-aid') {
          if (onFirstAidPress) onFirstAidPress();
          else navigateWithTransition(() => router.navigate('/first-aid-guidance'));
        }
      }} style={[s.sideButton, baseStyles.touchTarget]}>
      <Animated.View pointerEvents="none" style={aidTap.contentStyle}>
        <Animated.View pointerEvents="none" style={[s.sideContent, aidStyle]}>
          <View style={s.iconSlot}><NavigationIcon name="first-aid" size={scaleSize(31)} /></View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  </View>;
}

const baseStyles = StyleSheet.create({
  fixedDock: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  wave: { position: 'absolute', top: 0, left: 0, right: 0 },
  footerFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#295D94' },
  sideButton: { zIndex: 2, width: 82, alignItems: 'center', justifyContent: 'center' },
  touchTarget: { minWidth: 44, minHeight: 44 },
  sideContent: { alignItems: 'center' },
  iconSlot: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  mainPosition: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 3 },
  mainButton: { alignItems: 'center', justifyContent: 'center' },
  menuHalo: {
    position: 'absolute', backgroundColor: '#376FA9',
    boxShadow: '-7px -4px 29px 5px rgba(45,155,255,.48), 8px 3px 35px 7px rgba(55,130,255,.4), -3px 9px 42px 6px rgba(90,175,255,.3)',
  },
});
