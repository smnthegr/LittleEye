import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FixedPageHeader } from '@/components/fixed-page-header';
import { ResponsiveBackground } from '@/components/responsive-background';
import { GlowButton } from '@/components/glow-button';
import { useAppSession } from '@/components/app-session';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { getEmergencyHotlineLayout } from '@/utils/responsive';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const rowIcons = {
  services: { ios: 'phone.fill', android: 'call', web: 'call' },
  contacts: { ios: 'person.2.fill', android: 'groups', web: 'groups' },
} satisfies Record<string, SymbolViewProps['name']>;

const emergencyHotlines = [
  { name: 'National Emergency Hotline', number: '911' },
  { name: 'Quezon City Helpline', number: '122' },
  { name: 'Red Cross', number: '(02) 8527-0000' },
];

export default function EmergencyHotlineScreen() {
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const { pageWidth, scaleSize, height, fontScale } = useResponsiveLayout();
  const { profile, profilePhoto } = useAppSession();
  const layout = getEmergencyHotlineLayout(pageWidth, height, insets.top, insets.bottom, fontScale);
  const sosScale = layout.sosDiameter / scaleSize(204);
  const { service } = useLocalSearchParams<{ service?: string }>();
  const selectedService = emergencyHotlines.find(hotline => hotline.number === service);
  const isFocused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const currentAddress = profile?.guardian.address.trim() ?? '';
  const [showHotlines, setShowHotlines] = useState(false);
  const [pulse] = useState(() => new Animated.Value(0));
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    pulse.stopAnimation();
    pulse.setValue(holding && isFocused ? 1 : 0);
    if (!holding || !isFocused || reducedMotion) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.25, duration: 260, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 260, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    animation.start();
    return () => { animation.stop(); pulse.stopAnimation(); pulse.setValue(0); };
  }, [holding, isFocused, pulse, reducedMotion]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  function callHotline(number: string) {
    setShowHotlines(false);
    router.push({ pathname: '/call', params: { recipient: number, phone: number, kind: 'hotline' } });
  }

  return <View style={s.screen}>
    <StatusBar style="dark" />
    <ResponsiveBackground source={require('../../assets/images/emergency-hotline-background.svg')} />
    <FixedPageHeader light onBack={goBack} />
    <View style={[s.content, { width: pageWidth, paddingTop: layout.contentTop, paddingBottom: layout.bottomPadding }]}>
      <View style={[s.heading, { height: layout.headingHeight }]}>
        <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.25} style={[s.title, { fontSize: T.title * layout.textScale, lineHeight: 32 * layout.textScale, marginBottom: 8 * layout.spacingScale }]}>Emergency Hotline</Text>
        <Text accessibilityLiveRegion="polite" numberOfLines={2} adjustsFontSizeToFit maxFontSizeMultiplier={1.25} style={[s.subtitle, { fontSize: T.body * layout.textScale, lineHeight: 20 * layout.textScale }]}>{selectedService
          ? `Hold SOS for 2 seconds to call ${selectedService.name}.`
          : 'Press and hold SOS for 2 seconds to choose a hotline.'}</Text>
      </View>

      <View style={[s.sosArea, { flex: 1, minHeight: layout.sosDiameter, marginTop: layout.gap, marginBottom: layout.gap }]}>
        <View style={[s.sosOuterRing, { transform: [{ scale: sosScale }] }]}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.holdPulse, {
            opacity: pulse, transform: [{ scale: reducedMotion ? 1 : pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
          }]} />
          <View style={s.sosMiddleRing}>
            <GlowButton
              accessibilityRole="button"
              accessibilityLabel="Press and hold SOS for two seconds to open emergency hotlines"
              accessibilityState={{ selected: holding }}
              delayLongPress={2000}
              onPressIn={() => setHolding(true)}
              onPressOut={() => setHolding(false)}
              onLongPress={() => { if (!isFocused) return; setHolding(false); setShowHotlines(true); }}
              style={[s.sosButton, holding && s.sosButtonHolding]}
            >
              <Text maxFontSizeMultiplier={1.25} style={s.sosText}>SOS</Text>
            </GlowButton>
          </View>
        </View>
      </View>

      <View style={[s.addressCard, { height: layout.addressHeight, minHeight: 0, padding: 9 * layout.spacingScale }]}>
        <View style={[s.addressAvatar, { width: 58 * layout.spacingScale, height: 58 * layout.spacingScale }]}>
          {profilePhoto ? <Image source={{ uri: profilePhoto }} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} /> :
            <Image source={require('../../assets/images/profile-guardian-child-mascots-4k.png')} contentFit="contain" transition={0} accessible={false} style={s.addressPhotoPlaceholder} />}
        </View>
        <View style={s.addressCopy}>
          <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.25} style={[s.addressTitle, { fontSize: T.label * layout.textScale, lineHeight: 20 * layout.textScale }]}>Your Current Address</Text>
          <Text numberOfLines={2} adjustsFontSizeToFit maxFontSizeMultiplier={1.25} style={[s.addressText, { fontSize: T.body * layout.textScale, lineHeight: 20 * layout.textScale }]}>{currentAddress || 'No address yet'}</Text>
        </View>
      </View>

      <View style={[s.actions, { gap: layout.gap, marginTop: layout.gap }]}>
        <ActionRow
          icon="services"
          title="Emergency Services"
          subtitle="View local emergency services"
          height={layout.actionHeight}
          textScale={layout.textScale}
          onPress={() => router.push('/emergency-services')}
        />
        <ActionRow
          icon="contacts"
          title="Emergency Contacts"
          subtitle="Call or manage your trusted contacts"
          height={layout.actionHeight}
          textScale={layout.textScale}
          onPress={() => router.push('/emergency-contacts')}
        />
      </View>
    </View>
    <Modal visible={showHotlines} transparent animationType="fade" onRequestClose={() => setShowHotlines(false)}>
      <View style={[s.hotlineOverlay, {
        paddingTop: insets.top + scaleSize(16), paddingBottom: insets.bottom + scaleSize(16),
        paddingLeft: insets.left + scaleSize(12), paddingRight: insets.right + scaleSize(12),
      }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close emergency hotlines" onPress={() => setShowHotlines(false)} style={StyleSheet.absoluteFill} />
        <ScrollView accessibilityViewIsModal style={s.hotlinePanel} contentContainerStyle={s.hotlinePanelContent} showsVerticalScrollIndicator={false}>
          <View style={s.hotlineHeader}>
            <Text accessibilityRole="header" style={s.hotlineTitle}>Hotlines</Text>
            <GlowButton accessibilityRole="button" accessibilityLabel="Close emergency hotlines" onPress={() => setShowHotlines(false)} style={[s.hotlineClose, { width: Math.max(44, scaleSize(44)), height: Math.max(44, scaleSize(44)), minWidth: 44, minHeight: 44 }]}>
              <View style={s.closeLineOne} /><View style={s.closeLineTwo} />
            </GlowButton>
          </View>
          <Text style={s.hotlineSubtitle}>Tap to call emergency hotlines</Text>
          <View style={s.hotlineList}>
            {emergencyHotlines.map(hotline => <GlowButton
              key={hotline.number}
              accessibilityRole="button"
              accessibilityLabel={`Call ${hotline.name}, ${hotline.number}`}
              onPress={() => callHotline(hotline.number)}
              style={[s.hotlineCard, selectedService?.number === hotline.number && s.selectedHotline]}
            >
              <Image source={require('../../assets/images/emergency-hotline-shield.svg')} contentFit="contain" transition={0} accessible={false} style={s.hotlineBadgeIcon} />
              <View style={s.hotlineCopy}>
                <Text style={s.hotlineName}>{hotline.name}</Text>
            <Text style={s.hotlineNumber}>{hotline.number}</Text>
              </View>
              <View style={s.phoneCircle}><SymbolView name={{ ios: 'phone.fill', android: 'call', web: 'call' }} size={scaleSize(19)} tintColor={C.white} /></View>
            </GlowButton>)}
          </View>
        </ScrollView>
      </View>
    </Modal>
  </View>;
}

function ActionRow({ icon, title, subtitle, onPress, height, textScale }: { icon: keyof typeof rowIcons; title: string; subtitle: string; onPress: () => void; height: number; textScale: number }) {
  const { scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  return <GlowButton accessibilityRole="button" accessibilityLabel={`${title}. ${subtitle}`} onPress={onPress} style={[s.actionRow, { height, minHeight: 0 }]}>
    <View style={s.actionIcon}><SymbolView name={rowIcons[icon]} size={scaleSize(18)} tintColor={C.white} /></View>
    <View style={s.actionCopy}>
      <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.25} style={[s.actionTitle, { fontSize: T.label * textScale, lineHeight: 20 * textScale }]}>{title}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.25} style={[s.actionSubtitle, { fontSize: Math.max(12, T.caption * textScale), lineHeight: 18 }]}>{subtitle}</Text>
    </View>
    <View style={s.chevron} />
  </GlowButton>;
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.white },
  content: { flex: 1, alignSelf: 'center', paddingHorizontal: 24 },
  heading: { alignItems: 'center' },
  title: { color: C.blue, fontFamily: F.extraBold, fontSize: T.title, lineHeight: 32, marginBottom: 8, textAlign: 'center' },
  subtitle: { color: C.blue, fontFamily: F.regular, fontSize: T.body, lineHeight: 20, textAlign: 'center' },
  sosArea: { alignItems: 'center', justifyContent: 'center', marginTop: 25, marginBottom: 12 },
  sosOuterRing: { width: 204, height: 204, borderRadius: 102, backgroundColor: 'rgba(255,53,65,.18)', alignItems: 'center', justifyContent: 'center' },
  holdPulse: { borderRadius: 102, backgroundColor: 'rgba(255,70,82,.22)', boxShadow: '0 0 22px 6px rgba(255,41,47,.4)' },
  sosMiddleRing: { width: 178, height: 178, borderRadius: 89, backgroundColor: 'rgba(255,53,65,.34)', alignItems: 'center', justifyContent: 'center' },
  sosButton: { width: 148, height: 148, borderRadius: 74, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF292F', boxShadow: '0 5px 13px rgba(205,25,35,.22)' },
  sosButtonHolding: { backgroundColor: '#E91924', boxShadow: '0 0 24px 8px rgba(255,41,47,.55), 0 5px 13px rgba(205,25,35,.3)' },
  sosText: { color: C.white, fontFamily: F.extraBold, fontSize: 24, letterSpacing: -.4 },
  addressCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 9, borderRadius: 32, backgroundColor: C.white, borderWidth: 1, borderColor: '#C7D8EB', boxShadow: '0 4px 12px rgba(0,0,0,.32)' },
  addressAvatar: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', backgroundColor: '#EAF1F8', alignItems: 'center', justifyContent: 'center' },
  addressPhotoPlaceholder: { position: 'absolute', width: 135, height: 76, top: -5, left: -5 },
  addressCopy: { flex: 1, gap: 2 },
  addressTitle: { color: C.blue, fontFamily: F.bold, fontSize: T.label, lineHeight: 20 },
  addressText: { color: '#344861', fontFamily: F.regular, fontSize: T.body, lineHeight: 20 },
  actions: { gap: 8, marginTop: 8 },
  actionRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 11, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: '#C7D8EB', boxShadow: '0 4px 12px rgba(0,0,0,.32)' },
  actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue },
  actionCopy: { flex: 1, gap: 1 },
  actionTitle: { color: C.blue, fontFamily: F.bold, fontSize: T.label, lineHeight: 20 },
  actionSubtitle: { color: '#74859A', fontFamily: F.regular, fontSize: T.caption, lineHeight: 18 },
  chevron: { width: 8, height: 8, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: C.blue, transform: [{ rotate: '45deg' }], marginRight: 3 },
  hotlineOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.44)' },
  hotlinePanel: { width: '100%', maxWidth: 440, maxHeight: '100%', flexGrow: 0, flexShrink: 1, borderRadius: 32, backgroundColor: C.white, overflow: 'hidden' },
  hotlinePanelContent: { flexGrow: 0, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 },
  hotlineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hotlineTitle: { color: C.blue, fontFamily: F.bold, fontSize: T.section, lineHeight: 26 },
  hotlineClose: { width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: 22, backgroundColor: '#EDF3FA', alignItems: 'center', justifyContent: 'center' },
  closeLineOne: { position: 'absolute', width: 15, height: 1.5, borderRadius: 1, backgroundColor: '#526F92', transform: [{ rotate: '45deg' }] },
  closeLineTwo: { position: 'absolute', width: 15, height: 1.5, borderRadius: 1, backgroundColor: '#526F92', transform: [{ rotate: '-45deg' }] },
  hotlineSubtitle: { marginTop: 1, color: '#6F829B', fontFamily: F.regular, fontSize: 12 },
  hotlineList: { alignItems: 'stretch', gap: 20, marginTop: 22 },
  hotlineCard: { width: '100%', minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 30, backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(148,176,213,.45)', boxShadow: '0 4px 12px rgba(0,0,0,.25)' },
  selectedHotline: { backgroundColor: '#EDF3FA', borderColor: C.blue },
  hotlineBadgeIcon: { width: 27, height: 30 },
  hotlineCopy: { flex: 1, alignItems: 'flex-start', gap: 1 },
  hotlineName: { color: C.blue, fontFamily: F.bold, fontSize: T.label, lineHeight: 20, textAlign: 'left' },
  hotlineNumber: { color: '#71839B', fontFamily: F.regular, fontSize: T.body, lineHeight: 20 },
  phoneCircle: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#218517' },
});
