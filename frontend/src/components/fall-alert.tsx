import { GlowButton } from '@/components/glow-button';
import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';

import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';

type FallAlertContextValue = { showFallAlert: () => void };

const FallAlertContext = createContext<FallAlertContextValue | null>(null);
const AnimatedImage = Animated.createAnimatedComponent(Image);

export function FallAlertProvider({ children }: { children: ReactNode }) {
  const { scaleSize, insets } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const [visible, setVisible] = useState(false);
  const alertPulse = useSharedValue(0.32);
  const alertSound = useAudioPlayer(require('../../assets/audio/fall-alert.wav'));
  const alertPulseStyle = useAnimatedStyle(() => ({ opacity: alertPulse.value }));

  useEffect(() => {
    if (visible) {
      // expo-audio player properties are intentionally configured when the alert becomes visible.
      // eslint-disable-next-line react-hooks/immutability
      alertSound.loop = true;
      alertSound.volume = 0.75;
      alertSound.play();
    } else {
      alertSound.pause();
      void alertSound.seekTo(0);
    }

    return () => alertSound.pause();
  }, [visible, alertSound]);

  useEffect(() => {
    if (!visible) {
      cancelAnimation(alertPulse);
      return;
    }

    // Reanimated shared values are intentionally updated here to start the pulse only while the modal is visible.
    // eslint-disable-next-line react-hooks/immutability
    alertPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 430, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 430, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    return () => cancelAnimation(alertPulse);
  }, [visible, alertPulse]);

  return <FallAlertContext.Provider value={{ showFallAlert: () => setVisible(true) }}>
    {children}
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={[s.overlay, {
        paddingTop: insets.top + scaleSize(16), paddingBottom: insets.bottom + scaleSize(16),
        paddingLeft: insets.left + scaleSize(16), paddingRight: insets.right + scaleSize(16),
      }]}>
        <ScrollView accessibilityViewIsModal style={s.card} contentContainerStyle={s.cardContent} showsVerticalScrollIndicator={false}>
          <View style={s.iconArea}>
            <Image source={require('../../assets/images/fall-alert-glow.svg')} contentFit="fill" transition={0} accessible={false} style={s.iconGlow} />
            <Image source={require('../../assets/images/alert-icon.png')} contentFit="contain" transition={0} blurRadius={2} accessible={false} style={s.iconEcho} />
            <AnimatedImage source={require('../../assets/images/alert-icon.png')} contentFit="contain" transition={0} accessible={false} style={[s.iconArtwork, alertPulseStyle]} />
          </View>
          <Text accessibilityRole="header" style={s.title}>Fall Detected!</Text>
          <Text style={s.message}>Please check on the child immediately.</Text>
          <View style={s.actions}>
            <GlowButton accessibilityRole="button" onPress={() => {
              setVisible(false);
              router.push({ pathname: '/call', params: { recipient: '911', phone: '911', kind: 'hotline' } });
            }} style={s.callButton}>
              <Text style={s.callText}>Call 911</Text>
            </GlowButton>
            <GlowButton accessibilityRole="button" onPress={() => setVisible(false)} style={s.declineButton}>
              <Text style={s.declineText}>Decline</Text>
            </GlowButton>
          </View>
        </ScrollView>
      </View>
    </Modal>
  </FallAlertContext.Provider>;
}

export function useFallAlert() {
  const context = useContext(FallAlertContext);
  if (!context) throw new Error('useFallAlert must be used inside FallAlertProvider');
  return context;
}

const baseStyles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.48)' },
  card: { width: '90%', maxWidth: 320, maxHeight: '100%', flexGrow: 0, flexShrink: 1, borderRadius: 24, backgroundColor: '#315780', overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,.22)' },
  cardContent: { minHeight: 323, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingTop: 0, paddingBottom: 24 },
  iconArea: { width: '100%', height: 137, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  iconGlow: { position: 'absolute', top: -34, width: 360, height: 205 },
  iconEcho: { position: 'absolute', top: 0, width: 410, height: 230, maxWidth: '145%', opacity: .3, transform: [{ translateX: 6 }, { scale: 1.045 }] },
  iconArtwork: { position: 'absolute', top: 0, width: 410, height: 230, maxWidth: '145%', transform: [{ translateX: 6 }] },
  title: { color: '#FF414A', fontFamily: F.extraBold, fontSize: T.title, lineHeight: 32, textAlign: 'center', marginBottom: 10 },
  message: { color: C.white, fontFamily: F.regular, fontSize: T.body, lineHeight: 20, textAlign: 'center' },
  actions: { width: '100%', flexDirection: 'row', gap: 12, paddingHorizontal: 8, marginTop: 40 },
  callButton: { flex: 1, minHeight: 44, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: C.white, boxShadow: '0 4px 9px rgba(0,0,0,.18)' },
  callText: { maxWidth: '100%', color: '#315780', fontFamily: F.bold, fontSize: T.label, lineHeight: 20, textAlign: 'center' },
  declineButton: { flex: 1, minHeight: 44, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#20466F', boxShadow: '0 4px 9px rgba(0,0,0,.16)' },
  declineText: { maxWidth: '100%', color: C.white, fontFamily: F.bold, fontSize: T.label, lineHeight: 20, textAlign: 'center' },
});
