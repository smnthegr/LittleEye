import { EdgeScrollView } from '@/components/edge-scroll-view';
import { GlowButton } from '@/components/glow-button';
import { useAppSession } from '@/components/app-session';
import { useMascotImages } from '@/components/mascot-images';
import { Image } from 'expo-image';
import { BrandColors, BrandFonts } from '@/constants/brand';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const { accepted } = useAppSession();
  const mascotImages = useMascotImages();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const size = Math.min(width - insets.left - insets.right, 480);
  // Visible artwork bounds exclude the PNG's uneven transparent margins.
  const mascotScale = (size * 1.12) / 2085;
  const mascotHeight = 1432 * mascotScale - 18;
  const mascotLeft = (size - 2085 * mascotScale) / 2 - 624 * mascotScale;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <EdgeScrollView contentContainerStyle={[styles.page, { minHeight: height - insets.top }]} contentInsetAdjustmentBehavior="never">
        <View style={styles.content}>
          <Text accessibilityRole="header" style={styles.title} adjustsFontSizeToFit numberOfLines={1}>
            Little<Text style={styles.accent}>Eye</Text>
          </Text>
          <Text style={styles.tagline}>Catch the slip, skip panic</Text>
          <GlowButton
            accessibilityRole="button"
            onPress={() => router.push(accepted ? '/sign-in' : '/policies')}
            style={styles.button}>
            <Text style={styles.buttonText}>Get Started</Text>
          </GlowButton>
        </View>

        <View pointerEvents="none" style={[styles.mascotFrame, { width: size, height: mascotHeight }]}>
          <Image
            source={mascotImages.welcome}
            accessible={false}
            contentFit="contain" transition={0} cachePolicy="memory"
            style={{
              width: 3344 * mascotScale,
              height: 1880 * mascotScale,
              position: 'absolute',
              left: mascotLeft,
              bottom: -211 * mascotScale - 18,
            }}
          />
        </View>
      </EdgeScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.white },
  page: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', justifyContent: 'space-between' },
  content: { paddingHorizontal: 36, paddingTop: '30%', paddingBottom: 48 },
  title: { fontSize: 48, fontFamily: BrandFonts.extraBold, letterSpacing: -1.8, color: BrandColors.blue, textShadowColor: 'rgba(50,80,123,0.22)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 4 },
  accent: { color: BrandColors.lightBlue },
  tagline: { marginTop: 10, fontSize: 20, lineHeight: 28, fontFamily: BrandFonts.semiBold, color: BrandColors.blue },
  button: { alignSelf: 'flex-start', marginTop: 48, minHeight: 52, paddingHorizontal: 25, paddingVertical: 14, borderRadius: 30, backgroundColor: BrandColors.blue, justifyContent: 'center', alignItems: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 7 },
  buttonText: { color: BrandColors.white, fontSize: 19, fontFamily: BrandFonts.extraBold },
  mascotFrame: { alignSelf: 'center', overflow: 'hidden' },
});








