import '@/global.css';
import { MascotImagesProvider } from '@/components/mascot-images';
import { PageTransition } from '@/components/page-transition';
import { ResponsiveScreen } from '@/components/responsive-screen';
import { BrandColors } from '@/constants/brand';
import { useFonts } from 'expo-font';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { BackHandler, Platform, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppSessionProvider, useAppSession } from '@/components/app-session';
import { FallAlertProvider } from '@/components/fall-alert';
import { BottomNavigationHost, BottomNavigationProvider } from '@/components/bottom-navigation';
import { NAVIGATION_TRANSITION_MS } from '@/components/navigation-transition';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useSessionNavigation } from '@/hooks/use-session-navigation';


SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Regular': require('../../assets/fonts/Montserrat_400Regular.ttf'),
    'Montserrat-SemiBold': require('../../assets/fonts/Montserrat_600SemiBold.ttf'),
    'Montserrat-Bold': require('../../assets/fonts/Montserrat_700Bold.ttf'),
    'Montserrat-ExtraBold': require('../../assets/fonts/Montserrat_800ExtraBold.ttf'),
    VT323_400Regular,
  });

  if (!fontsLoaded && !fontError) return null;
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MascotImagesProvider>
        <AppSessionProvider>
          <FallAlertProvider>
            <AnimatedSplashOverlay />
            <BottomNavigationProvider>
              <AppNavigator />
            </BottomNavigationProvider>
          </FallAlertProvider>
        </AppSessionProvider>
      </MascotImagesProvider>
    </ThemeProvider>
  );
}

function AppNavigator() {
  const session = useAppSession();
  const reducedMotion = useReducedMotion();
  const pathname = usePathname();
  useSessionNavigation();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // Android reports edge-back gestures and its Back button as the same event.
    // Re-register after navigation so this takes priority over the router's handler.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [pathname]);

  return (
    <View style={{ flex: 1 }}>
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false, animation: reducedMotion ? 'none' : 'fade', animationDuration: NAVIGATION_TRANSITION_MS }}
      screenLayout={({ children, route }) => {
        const backgroundColor =
          ['home', 'sign-in', 'sign-up', 'set-up', 'connect-camera'].includes(route.name)
            ? BrandColors.blue
            : route.name === 'first-aid-guidance'
              ? '#315780'
              : BrandColors.white;
        return <ResponsiveScreen backgroundColor={backgroundColor} allowLandscape={['home', 'history', 'first-aid-guidance'].includes(route.name)}>
          <PageTransition backgroundColor={backgroundColor} animateOnMount={false}>{children}</PageTransition>
        </ResponsiveScreen>;
      }}>
      <Stack.Protected guard={!session.signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="policies" />
        <Stack.Protected guard={session.accepted}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="set-up" />
          <Stack.Screen name="forgot-password" />
        </Stack.Protected>
      </Stack.Protected>
      <Stack.Protected guard={session.signedIn && session.accepted}>
        <Stack.Screen name="connect-camera" />
        <Stack.Protected guard={!!session.camera}>
          <Stack.Screen name="home" />
        </Stack.Protected>
      </Stack.Protected>
      {/* Remove account screens and their history on sign-out in every build. */}
      <Stack.Protected guard={session.signedIn && session.accepted}>
        <Stack.Screen name="settings" />
        <Stack.Screen name="settings-pages" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="profile-child" />
        <Stack.Screen name="profile-account" />
        <Stack.Screen name="history" />
        <Stack.Screen name="emergency-hotline" />
        <Stack.Screen name="emergency-services" />
        <Stack.Screen name="emergency-contacts" />
        <Stack.Screen name="call" />
        <Stack.Screen name="first-aid-guidance" />
      </Stack.Protected>
      <Stack.Protected guard={false}>
        <Stack.Screen name="explore" />
      </Stack.Protected>
    </Stack>
    <BottomNavigationHost />
    </View>
  );
}



