import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';

import { BackButton } from '@/components/back-button';
import { ResponsiveBackground } from '@/components/responsive-background';
import { SettingsProfileButton } from '@/components/settings-profile-button';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';

export default function CallScreen() {
  const { scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const innerPulse = useSharedValue(0);
  const middlePulse = useSharedValue(0);
  const outerPulse = useSharedValue(0);
  const params = useLocalSearchParams<{ recipient?: string; phone?: string; kind?: string }>();
  const ringPlayer = useAudioPlayer(require('../../assets/audio/call-ring.wav'));
  const isFocused = useIsFocused();
  const recipient = Array.isArray(params.recipient) ? params.recipient[0] : params.recipient;
  const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone;
  const kind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const isHotline = kind === 'hotline';
  const displayRecipient = recipient || phone || 'Emergency Contact';

  useEffect(() => {
    if (isFocused) {
      // expo-audio player looping is configured only while the call route is focused.
      // eslint-disable-next-line react-hooks/immutability
      ringPlayer.loop = true;
      ringPlayer.volume = 0.38;
      ringPlayer.play();
      return;
    }

    ringPlayer.pause();
    void ringPlayer.seekTo(0);
  }, [isFocused, ringPlayer]);

  useEffect(() => {
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
  }, [innerPulse, middlePulse, outerPulse]);

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
    <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + scaleSize(40), paddingBottom: Math.max(insets.bottom, 16) + scaleSize(12) }]} showsVerticalScrollIndicator={false}>
      <View style={s.headerRow}>
        <BackButton accessibilityLabel="Back" onPress={endCall} />
        <SettingsProfileButton />
      </View>

      <View style={s.callDetails}>
        <Text accessibilityRole="header" adjustsFontSizeToFit numberOfLines={1} style={s.title}>Calling {displayRecipient}...</Text>
        <Text style={s.subtitle}>{isHotline ? 'Connecting you to the national' : 'Connecting you to your emergency'}</Text>
        <Text style={s.subtitle}>{isHotline ? 'emergency hotline.' : 'contact.'}</Text>
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

      <Pressable accessibilityRole="button" accessibilityLabel="End call" onPress={endCall} style={({ pressed }) => [s.endCallButton, pressed && s.endCallPressed]}>
        <SymbolView name={{ ios: 'phone.down.fill', android: 'call_end', web: 'call_end' }} size={scaleSize(21)} tintColor={C.white} />
        <Text style={s.endCallText}>End Call</Text>
      </Pressable>
    </ScrollView>
  </View>;
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#315780' },
  content: { flexGrow: 1, paddingHorizontal: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', transform: [{ translateY: -10 }] },
  callDetails: { alignItems: 'center', marginTop: 34 },
  title: { maxWidth: '100%', color: C.white, fontFamily: F.extraBold, fontSize: 28, lineHeight: 36, textAlign: 'center', marginBottom: 7 },
  subtitle: { color: C.white, fontFamily: F.regular, fontSize: 14, lineHeight: 18, textAlign: 'center' },
  callEffect: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 54 },
  outerRing: { width: 294, height: 294, alignItems: 'center', justifyContent: 'center', borderRadius: 147, backgroundColor: 'rgba(112,151,194,.14)' },
  pulseRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  outerPulseRing: { borderRadius: 147, backgroundColor: 'rgba(150,196,238,.18)', boxShadow: '0 0 30px 12px rgba(150,196,238,.48)' },
  middleRing: { width: 246, height: 246, alignItems: 'center', justifyContent: 'center', borderRadius: 123, backgroundColor: 'rgba(244,132,151,.22)' },
  middlePulseRing: { borderRadius: 123, backgroundColor: 'rgba(255,193,202,.18)', boxShadow: '0 0 26px 10px rgba(255,193,202,.46)' },
  innerRing: { width: 198, height: 198, alignItems: 'center', justifyContent: 'center', borderRadius: 99, backgroundColor: 'rgba(255,117,137,.3)' },
  innerPulseRing: { borderRadius: 99, backgroundColor: 'rgba(255,155,166,.2)', boxShadow: '0 0 24px 9px rgba(255,155,166,.5)' },
  phoneCircle: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', borderRadius: 75, backgroundColor: '#F33343' },
  endCallButton: { width: 165, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, alignSelf: 'center', marginTop: 82, paddingHorizontal: 12, borderRadius: 17, backgroundColor: 'rgba(126,164,209,.5)' },
  endCallPressed: { backgroundColor: '#E53935', transform: [{ scale: .97 }] },
  endCallText: { color: C.white, fontFamily: F.bold, fontSize: 16 },
});
