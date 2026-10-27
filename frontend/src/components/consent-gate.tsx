import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { EdgeScrollView } from '@/components/edge-scroll-view';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { Policies, PolicyDetails } from '@/constants/policies';
import { GlowButton } from './glow-button';

export function PolicyReader({ onRead }: { onRead?: () => void }) {
  const s = useResponsiveStyles(baseStyles);
  const size = useRef({ viewport: 0, content: 0 });
  function checkFits() {
    if (size.current.viewport > 0 && size.current.content > 0 && size.current.content <= size.current.viewport + 2) onRead?.();
  }
  return <EdgeScrollView nestedScrollEnabled style={s.reader} contentContainerStyle={s.readerContent}
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
  const { scaleSize, availableHeight } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  // Keep the existing reader size when possible, without sacrificing its viewport
  // when text or a short landscape window needs the surrounding page to scroll.
  const surroundingHeight = headerHeight + footerHeight;
  const paperHeight = Math.max(scaleSize(160), Math.min(
    availableHeight - scaleSize(374),
    availableHeight - scaleSize(28) - surroundingHeight,
  ));
  return <View style={[s.screen, { paddingTop: insets.top + scaleSize(20), paddingBottom: insets.bottom + scaleSize(8) }]}>
    <StatusBar style="dark" />
    <ScrollView style={s.scroll} contentContainerStyle={s.page} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never">
      <View style={s.content}>
      <View onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}>
      <Text style={s.logo}>Little<Text style={{ color: C.lightBlue }}>Eye</Text></Text>
      <Text accessibilityRole="header" style={s.title}>A little care, first.</Text>
      <Text style={s.intro}>Before we begin, review our Terms and Privacy Policy.</Text>
      </View>
        <View style={[s.paper, { height: paperHeight }]}><PolicyReader onRead={() => setReady(true)} /></View>
      <View onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}>
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
      </View>
    </ScrollView>
  </View>;
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.white },
  scroll: { flex: 1 },
  // Keep the viewport full width so button shadows can fade into the page gutters.
  page: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 16 },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  logo: { fontFamily: F.extraBold, color: C.blue, fontSize: 27, marginTop: 6, marginBottom: 12 },
  title: { fontFamily: F.bold, color: C.blue, fontSize: T.title, lineHeight: 32 },
  intro: { fontFamily: F.regular, color: C.blue, fontSize: T.body, lineHeight: 22, marginTop: 8, marginBottom: 18 },
  documentHeading: { fontFamily: F.bold, color: C.blue, fontSize: T.section - 2, lineHeight: 24, marginBottom: 20 },
  paper: { flexShrink: 0, minHeight: 0, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(148,176,213,.45)', overflow: 'hidden', backgroundColor: C.white },
  reader: { flex: 1 }, readerContent: { padding: 20 }, kicker: { fontFamily: F.semiBold, color: C.blue, opacity: .6, fontSize: T.caption - 2, marginBottom: 22 },
  paragraph: { marginBottom: 22 }, section: { fontFamily: F.bold, color: C.blue, fontSize: T.label - 2, lineHeight: 19, marginBottom: 8 },
  body: { fontFamily: F.regular, color: C.blue, fontSize: T.body - 2, lineHeight: 20 }, end: { fontFamily: F.semiBold, color: C.blue, fontSize: T.caption - 2, marginBottom: 12 },
  hint: { fontFamily: F.regular, color: C.blue, fontSize: T.caption, lineHeight: 18, marginVertical: 10 },
  agreement: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, minHeight: 48 },
  agreementText: { flex: 1, fontFamily: F.semiBold, fontSize: T.caption, lineHeight: 18, color: C.blue },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: C.lightBlue, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: C.blue, borderColor: C.blue }, checkText: { color: C.white, fontFamily: F.bold },
  accept: { backgroundColor: C.blue, borderRadius: 26, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12, boxShadow: '0 8px 22px rgba(50,80,123,.22)' },
  acceptText: { color: C.white, fontFamily: F.bold, fontSize: 14 }, disabled: { opacity: .4 }, pressed: { opacity: .55 },
  decline: { alignItems: 'center', padding: 14 }, declineText: { color: C.blue, fontFamily: F.semiBold, fontSize: 12 },
});
