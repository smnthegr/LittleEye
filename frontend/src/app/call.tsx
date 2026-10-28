import { GlowButton } from '@/components/glow-button';
import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Redirect, router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';

import { FixedPageHeader } from '@/components/fixed-page-header';
import { ResponsiveBackground } from '@/components/responsive-background';
import { BrandColors as C, BrandFonts as F, PageTypography } from '@/constants/brand';
import { getPageHeaderLayout } from '@/utils/responsive';
import { useEmergencyHotlines } from '@/hooks/use-emergency-hotlines';
import { EmergencyHotlineList } from '@/components/emergency-hotline-list';
import { useAppSession } from '@/components/app-session';
import { isValidPhoneNumber } from '@/utils/contact-validation';
import { getHomeDestination } from '@/utils/session-navigation';
import { useForeground } from '@/hooks/use-foreground';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export default function CallScreen() {
  const params = useLocalSearchParams<{ kind?: string; phone?: string }>();
  const session = useAppSession();
  const kind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone;
  // Old hotline links must never enter the simulated contact ringing screen.
  if (kind === 'hotline') return <HotlineCallOptions />;
  // A fallback or incomplete link is not an instruction to start ringing.
  if (kind !== 'contact' || !isValidPhoneNumber(phone ?? '')) {
    return <Redirect href={getHomeDestination(session)} />;
  }
  return <ContactCallPreview />;
}

function HotlineCallOptions() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const { directory } = useEmergencyHotlines();
  const { pageWidth, scaleSize, insets } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const selected = directory.hotlines.find(entry => entry.number === phone || entry.dialNumber === phone);
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/emergency-hotline');
  }
  return <View style={s.screen}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={[s.content, { paddingTop: getPageHeaderLayout(pageWidth, insets.top).contentTop, paddingBottom: insets.bottom + scaleSize(24) }]}>
      <Text accessibilityRole="header" style={s.title}>Emergency calling options</Text>
      <Text style={[s.subtitle, { marginBottom: scaleSize(24) }]}>Tap Call for the service you need. LittleEye has not placed a call.</Text>
      <EmergencyHotlineList hotlines={selected ? [selected] : directory.hotlines} />
    </ScrollView>
    <FixedPageHeader onBack={back} />
  </View>;
}

function ContactCallPreview() {
  const { pageWidth, scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const header = getPageHeaderLayout(pageWidth, insets.top);
  const innerPulse = useSharedValue(0);
  const middlePulse = useSharedValue(0);
  const outerPulse = useSharedValue(0);
  const params = useLocalSearchParams<{ recipient?: string; phone?: string; kind?: string }>();
  const ringPlayer = useAudioPlayer(require('../../assets/audio/call-ring.wav'));
  const isFocused = useIsFocused();
  const foreground = useForeground();
  const reducedMotion = useReducedMotion();
  const recipient = Array.isArray(params.recipient) ? params.recipient[0] : params.recipient;
  const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone;
  const displayRecipient = recipient || phone || 'Emergency Contact';

  useEffect(() => {
    if (isFocused && foreground) {
      // expo-audio player looping is configured only while the call route is focused.
      // eslint-disable-next-line react-hooks/immutability
      ringPlayer.loop = true;
      ringPlayer.volume = 0.38;
      ringPlayer.play();
      return;
    }

    ringPlayer.pause();
    void ringPlayer.seekTo(0).catch(() => {});
  }, [isFocused, foreground, ringPlayer]);

  useEffect(() => {
    if (!isFocused || !foreground || reducedMotion) {
      cancelAnimation(innerPulse); cancelAnimation(middlePulse); cancelAnimation(outerPulse);
      innerPulse.value = middlePulse.value = outerPulse.value = 0;
      return;
    }
    const pulse = (delay: number) => withRepeat(
      withDelay(delay, withSequence(
        withTiming(1, { duration: 320, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 520, easing: Easing.in(Easing.ease) }),
        withDelay(420, withTiming(0, { duration: 1 })),
      )),
      -1,
      false,
    );
    innerPulse.value = pulse(0);
    middlePulse.value = pulse(180);
    outerPulse.value = pulse(360);
    return () => { cancelAnimation(innerPulse); cancelAnimation(middlePulse); cancelAnimation(outerPulse); };
  }, [isFocused, foreground, reducedMotion, innerPulse, middlePulse, outerPulse]);

  const innerGlowStyle = useAnimatedStyle(() => ({ opacity: innerPulse.value, transform: [{ scale: 1 + innerPulse.value * .1 }] }));
  const middleGlowStyle = useAnimatedStyle(() => ({ opacity: middlePulse.value, transform: [{ scale: 1 + middlePulse.value * .08 }] }));
  const outerGlowStyle = useAnimatedStyle(() => ({ opacity: outerPulse.value, transform: [{ scale: 1 + outerPulse.value * .06 }] }));

  function endCall() {
    if (router.canGoBack()) router.back();
    else router.replace('/emergency-hotline');
  }

  return <View style={s.screen}>
    <StatusBar style="light" />
    <ResponsiveBackground source={require('../../assets/images/call-background.svg')} />
    <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={[s.content, { paddingTop: header.contentTop, paddingBottom: Math.max(insets.bottom, 16) + scaleSize(24) }]} showsVerticalScrollIndicator={false}>
      <View style={s.callDetails}>
        <Text accessibilityRole="header" style={s.title}>Call preview: {displayRecipient}</Text>
        <Text style={s.subtitle}>This is a preview. No call has been placed.</Text>
        <Text style={s.subtitle}>Use your phone app to call this contact.</Text>
      </View>

      <View style={s.callEffect}>
        <View style={s.outerRing}>
          <Animated.View pointerEvents="none" style={[s.pulseRing, s.outerPulseRing, outerGlowStyle]} />
          <View style={s.middleRing}>
            <Animated.View pointerEvents="none" style={[s.pulseRing, s.middlePulseRing, middleGlowStyle]} />
            <View style={s.innerRing}>
              <Animated.View pointerEvents="none" style={[s.pulseRing, s.innerPulseRing, innerGlowStyle]} />
              <View style={s.phoneCircle}>
                <SymbolView name={{ ios: 'phone.fill', android: 'call', web: 'call' }} size={scaleSize(64)} tintColor={C.white} />
              </View>
            </View>
          </View>
        </View>
      </View>

      <GlowButton accessibilityRole="button" accessibilityLabel="Close call preview" onPress={endCall} style={[s.endCallButton]}>
        <SymbolView name={{ ios: 'phone.down.fill', android: 'call_end', web: 'call_end' }} size={scaleSize(21)} tintColor={C.white} />
        <Text style={s.endCallText}>Close preview</Text>
      </GlowButton>
    </ScrollView>
    <FixedPageHeader onBack={endCall} />
  </View>;
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#315780' },
  content: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24 },
  callDetails: { alignItems: 'center', marginTop: 16 },
  title: { maxWidth: '100%', color: C.white, fontFamily: F.extraBold, fontSize: PageTypography.title, lineHeight: 32, textAlign: 'center', marginBottom: 8 },
  subtitle: { color: C.white, fontFamily: F.regular, fontSize: 14, lineHeight: 18, textAlign: 'center' },
  callEffect: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  outerRing: { width: 294, height: 294, alignItems: 'center', justifyContent: 'center', borderRadius: 147, backgroundColor: 'rgba(112,151,194,.14)' },
  pulseRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  outerPulseRing: { borderRadius: 147, backgroundColor: 'rgba(150,196,238,.18)', boxShadow: '0 0 30px 12px rgba(150,196,238,.48)' },
  middleRing: { width: 246, height: 246, alignItems: 'center', justifyContent: 'center', borderRadius: 123, backgroundColor: 'rgba(244,132,151,.22)' },
  middlePulseRing: { borderRadius: 123, backgroundColor: 'rgba(255,193,202,.18)', boxShadow: '0 0 26px 10px rgba(255,193,202,.46)' },
  innerRing: { width: 198, height: 198, alignItems: 'center', justifyContent: 'center', borderRadius: 99, backgroundColor: 'rgba(255,117,137,.3)' },
  innerPulseRing: { borderRadius: 99, backgroundColor: 'rgba(255,155,166,.2)', boxShadow: '0 0 24px 9px rgba(255,155,166,.5)' },
  phoneCircle: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', borderRadius: 75, backgroundColor: '#F33343' },
  endCallButton: { width: 165, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, alignSelf: 'center', marginTop: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 17, backgroundColor: 'rgba(126,164,209,.5)' },
  endCallPressed: { backgroundColor: '#E53935', transform: [{ scale: .97 }] },
  endCallText: { color: C.white, fontFamily: F.bold, fontSize: PageTypography.label },
});
