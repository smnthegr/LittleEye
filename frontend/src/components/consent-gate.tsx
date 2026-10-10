import { EdgeScrollView } from '@/components/edge-scroll-view';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { Policies, PolicyDetails } from '@/constants/policies';
import { GlowButton } from './glow-button';

export function PolicyReader({ onRead }: { onRead?: () => void }) {
  const size = useRef({ viewport: 0, content: 0 });
  function checkFits() {
    if (size.current.viewport > 0 && size.current.content > 0 && size.current.content <= size.current.viewport + 2) onRead?.();
  }
  return <EdgeScrollView style={s.reader} contentContainerStyle={s.readerContent}
    onLayout={(e) => { size.current.viewport = e.nativeEvent.layout.height; checkFits(); }}
    onContentSizeChange={(_, height) => { size.current.content = height; checkFits(); }}
    scrollEventThrottle={16} onScroll={(e) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 12) onRead?.();
    }}>
    <Text style={s.kicker}>{PolicyDetails.version} · {PolicyDetails.operator}</Text>
    {(['terms', 'privacy'] as const).map((policy) => <View key={policy}>
      <Text accessibilityRole="header" style={s.documentHeading}>{policy === 'terms' ? 'Terms of Use' : 'Privacy Policy'}</Text>
      {Policies[policy].map(([heading, body]) => <View key={heading} style={s.paragraph}>
        <Text accessibilityRole="header" style={s.section}>{heading}</Text><Text style={s.body}>{body}</Text>
      </View>)}
    </View>)}
    <Text style={s.end}>You’ve reached the end of this notice.</Text>
  </EdgeScrollView>;
}

export function ConsentGate({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [agreed, setAgreed] = useState(false);
  return <View style={[s.screen, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
    <StatusBar style="dark" />
    <View pointerEvents="none" style={s.halo} />
    <View style={s.page}>
      <Text style={s.logo}>Little<Text style={{ color: C.lightBlue }}>Eye</Text></Text>
      <Text accessibilityRole="header" style={s.title}>A little care, first.</Text>
      <Text style={s.intro}>Before we begin, review our Terms and Privacy Policy.</Text>
        <View style={s.paper}><PolicyReader onRead={() => setReady(true)} /></View>
        <Text accessibilityLiveRegion="polite" style={s.hint}>{ready ? 'Terms and Privacy reviewed. You can now agree.' : 'Scroll to the end to review the Terms and Privacy Policy.'}</Text>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agreed, disabled: !ready }} disabled={!ready}
          onPress={() => setAgreed((value) => !value)} style={({ pressed }) => [s.agreement, !ready && s.disabled, pressed && s.pressed]}>
          <View style={[s.check, agreed && s.checked]}><Text style={s.checkText}>{agreed ? '✓' : ''}</Text></View>
          <Text style={s.agreementText}>I have read and agree to the Terms and Privacy Policy.</Text>
        </Pressable>
        <GlowButton accessibilityRole="button" accessibilityState={{ disabled: !ready || !agreed }} disabled={!ready || !agreed}
          onPress={() => { if (ready && agreed) onAccept(); }} style={[s.accept, (!ready || !agreed) && s.disabled]}>
          <Text style={s.acceptText}>Agree & continue</Text>
        </GlowButton>
        <Pressable accessibilityRole="button" onPress={onDecline} style={({ pressed }) => [s.decline, pressed && s.pressed]}><Text style={s.declineText}>Decline & exit</Text></Pressable>
    </View>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.white, paddingHorizontal: 24 },
  page: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  halo: { position: 'absolute', width: 270, height: 270, borderRadius: 200, right: -120, top: -90, backgroundColor: 'rgba(148,176,213,.18)', boxShadow: '0 0 70px 35px rgba(148,176,213,.12)' },
  logo: { fontFamily: F.extraBold, color: C.blue, fontSize: 25, marginBottom: 20 },
  title: { fontFamily: F.bold, color: C.blue, fontSize: 27 },
  intro: { fontFamily: F.regular, color: C.blue, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 18 },
  documentHeading: { fontFamily: F.bold, color: C.blue, fontSize: 20, marginBottom: 20 },
  paper: { flex: 1, minHeight: 100, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(148,176,213,.45)', overflow: 'hidden', backgroundColor: C.white },
  reader: { flex: 1 }, readerContent: { padding: 20 }, kicker: { fontFamily: F.semiBold, color: C.blue, opacity: .6, fontSize: 11, marginBottom: 22 },
  paragraph: { marginBottom: 22 }, section: { fontFamily: F.bold, color: C.blue, fontSize: 15, marginBottom: 8 },
  body: { fontFamily: F.regular, color: C.blue, fontSize: 13, lineHeight: 22 }, end: { fontFamily: F.semiBold, color: C.blue, fontSize: 12, marginBottom: 12 },
  hint: { fontFamily: F.regular, color: C.blue, fontSize: 11, lineHeight: 17, marginVertical: 10 },
  agreement: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, minHeight: 48 },
  agreementText: { flex: 1, fontFamily: F.semiBold, fontSize: 11, lineHeight: 17, color: C.blue },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: C.lightBlue, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: C.blue, borderColor: C.blue }, checkText: { color: C.white, fontFamily: F.bold },
  accept: { backgroundColor: C.blue, borderRadius: 26, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12, boxShadow: '0 8px 22px rgba(50,80,123,.22)' },
  acceptText: { color: C.white, fontFamily: F.bold, fontSize: 14 }, disabled: { opacity: .4 }, pressed: { opacity: .55 },
  decline: { alignItems: 'center', padding: 14 }, declineText: { color: C.blue, fontFamily: F.semiBold, fontSize: 12 },
});
