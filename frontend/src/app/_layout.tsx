import { MascotImagesProvider } from '@/components/mascot-images';
import { PageTransition } from '@/components/page-transition';
import { ResponsiveScreen } from '@/components/responsive-screen';
import { BrandColors } from '@/constants/brand';
import { useFonts } from 'expo-font';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppSessionProvider, useAppSession } from '@/components/app-session';
import { FallAlertProvider } from '@/components/fall-alert';
import { BottomNavigationHost, BottomNavigationProvider } from '@/components/bottom-navigation';
import { NAVIGATION_TRANSITION_MS } from '@/components/navigation-transition';
import { useReducedMotion } from '@/hooks/use-reduced-motion';


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
  return (
    <View style={{ flex: 1 }}>
    <Stack screenOptions={{ headerShown: false, animation: reducedMotion ? 'none' : 'fade', animationDuration: NAVIGATION_TRANSITION_MS }}
      screenLayout={({ children, route }) => {
        const backgroundColor =
          ['home', 'sign-in', 'sign-up', 'set-up', 'connect-camera'].includes(route.name)
            ? BrandColors.blue
            : route.name === 'first-aid-guidance'
              ? '#315780'
              : BrandColors.white;
        return <ResponsiveScreen backgroundColor={backgroundColor} allowLandscape={['home', 'history'].includes(route.name)}>
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
      {/* Keep Settings after the entry screens so sign-in falls back to camera setup.
          Direct development links remain available while Home is being built. */}
      <Stack.Protected guard={__DEV__ || (session.signedIn && session.accepted)}>
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



