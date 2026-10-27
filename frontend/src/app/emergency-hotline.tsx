import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FixedPageHeader } from '@/components/fixed-page-header';
import { ResponsiveBackground } from '@/components/responsive-background';
import { GlowButton } from '@/components/glow-button';
import { useAppSession } from '@/components/app-session';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { getEmergencyHotlineLayout } from '@/utils/responsive';
import { useEmergencyHotlines } from '@/hooks/use-emergency-hotlines';
import { EmergencyAreaCard } from '@/components/emergency-area-card';
import { SOS_HOTLINE } from '@/constants/emergency-hotlines';
import { openEmergencyDialer } from '@/services/emergency-dialer';

const rowIcons = {
  services: { ios: 'phone.fill', android: 'call', web: 'call' },
  contacts: { ios: 'person.2.fill', android: 'groups', web: 'groups' },
} satisfies Record<string, SymbolViewProps['name']>;

export default function EmergencyHotlineScreen() {
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const { pageWidth, scaleSize, height, fontScale } = useResponsiveLayout();
  const { profilePhoto } = useAppSession();
  const { address: currentAddress, addressLocation, localityCode, choice, directory, canEdit, changeArea } = useEmergencyHotlines();
  const layout = getEmergencyHotlineLayout(pageWidth, height, insets.top, insets.bottom, fontScale);
  const sosScale = layout.sosDiameter / scaleSize(204);
  const isFocused = useIsFocused();
  const [showAddress, setShowAddress] = useState(false);
  const [opening, setOpening] = useState(false);
  const calling = useRef(false);

  async function call911() {
    if (!isFocused || calling.current) return;
    calling.current = true;
    setOpening(true);
    try { await openEmergencyDialer(SOS_HOTLINE); }
    finally { calling.current = false; setOpening(false); }
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  return <View style={s.screen}>
    <StatusBar style="dark" />
    <ResponsiveBackground source={require('../../assets/images/emergency-hotline-background.svg')} />
    <FixedPageHeader light onBack={goBack} />
    <ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
      scrollEnabled={layout.scrollRequired} showsVerticalScrollIndicator={false}
      contentContainerStyle={[s.content, { width: pageWidth, minHeight: layout.minPageHeight, paddingTop: layout.contentTop, paddingBottom: layout.bottomPadding }]}>
      <View style={[s.heading, { height: layout.headingHeight }]}>
        <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.25} style={[s.title, { fontSize: T.title * layout.textScale, lineHeight: 32 * layout.textScale, marginBottom: 8 * layout.spacingScale }]}>Emergency Hotline</Text>
        <Text numberOfLines={2} adjustsFontSizeToFit maxFontSizeMultiplier={1.25} style={[s.subtitle, { fontSize: T.body * layout.textScale, lineHeight: 20 * layout.textScale }]}>Tap SOS to call 911.{'\n'}Police, fire or medical emergency.</Text>
      </View>

      <View style={[s.sosArea, { flex: 1, minHeight: layout.sosDiameter, marginTop: layout.gap, marginBottom: layout.gap }]}>
        <View style={[s.sosOuterRing, { transform: [{ scale: sosScale }] }]}>
          <View style={s.sosMiddleRing}>
            <GlowButton
              accessibilityRole="button"
              accessibilityLabel="SOS. Call 911"
              accessibilityHint="Starts the emergency call through your phone. Your phone may ask you to confirm."
              accessibilityState={{ disabled: opening }}
              disabled={opening}
              onPress={call911}
              style={s.sosButton}
            >
              <Text maxFontSizeMultiplier={1.25} style={s.sosText}>SOS</Text>
              <Text maxFontSizeMultiplier={1.25} style={s.sosCallText}>{opening ? 'Opening…' : 'Call 911'}</Text>
            </GlowButton>
          </View>
        </View>
      </View>

      <GlowButton accessibilityRole="button" accessibilityLabel={`Your saved address: ${currentAddress || 'No address yet'}`} accessibilityHint="View full address and hotline area" disabled={!currentAddress} onPress={() => setShowAddress(true)} style={[s.addressCard, { height: layout.addressHeight, minHeight: 0, paddingVertical: 14 * layout.spacingScale, paddingLeft: 12 * layout.spacingScale, paddingRight: 20 * layout.spacingScale }]}>
        <View style={[s.addressAvatar, { width: 58 * layout.spacingScale, height: 58 * layout.spacingScale }]}>
          {profilePhoto ? <Image source={{ uri: profilePhoto }} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} /> :
            <Image source={require('../../assets/images/profile-guardian-child-mascots-4k.png')} contentFit="contain" transition={0} accessible={false} style={s.addressPhotoPlaceholder} />}
        </View>
        <View style={s.addressCopy}>
          <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.25} style={[s.addressTitle, { fontSize: T.label * layout.textScale, lineHeight: 20 * layout.textScale }]}>Your Saved Address</Text>
          <Text numberOfLines={2} ellipsizeMode="tail" maxFontSizeMultiplier={1.25} style={[s.addressText, { fontSize: T.body * layout.textScale, lineHeight: 20 * layout.textScale }]}>{currentAddress || 'No address yet'}</Text>
        </View>
        {!!currentAddress && <View style={s.chevron} />}
      </GlowButton>

      <View style={[s.actions, { gap: layout.gap, marginTop: layout.gap }]}>
        <ActionRow
          icon="services"
          title="Emergency Services"
          subtitle={`Other services · ${directory.areaName}`}
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
    </ScrollView>
    <Modal visible={showAddress} supportedOrientations={['portrait', 'landscape']} transparent animationType="fade" onRequestClose={() => setShowAddress(false)}>
      <View style={[s.hotlineOverlay, {
        paddingTop: insets.top + scaleSize(16), paddingBottom: insets.bottom + scaleSize(16),
        paddingLeft: insets.left + scaleSize(12), paddingRight: insets.right + scaleSize(12),
      }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close full address" onPress={() => setShowAddress(false)} style={StyleSheet.absoluteFill} />
        <ScrollView accessibilityViewIsModal style={s.hotlinePanel} contentContainerStyle={s.hotlinePanelContent}>
          <View style={s.hotlineHeader}>
            <Text accessibilityRole="header" style={[s.hotlineTitle, { flex: 1 }]}>Your Saved Address</Text>
            <GlowButton accessibilityRole="button" accessibilityLabel="Close full address" onPress={() => setShowAddress(false)} style={s.hotlineClose}>
              <View style={s.closeLineOne} /><View style={s.closeLineTwo} />
            </GlowButton>
          </View>
          <Text selectable style={[s.addressText, { marginTop: 16, lineHeight: 24 }]}>{currentAddress}</Text>
          {addressLocation && <Text selectable style={[s.addressText, { marginTop: 12, lineHeight: 24 }]}>Saved GPS estimate: {addressLocation.latitude.toFixed(6)}, {addressLocation.longitude.toFixed(6)}{'\n'}Accuracy: ±{Math.ceil(addressLocation.accuracyMeters)} m</Text>}
          <View style={{ marginTop: scaleSize(16) }}><EmergencyAreaCard address={currentAddress} localityCode={localityCode} choice={choice} onChange={canEdit ? changeArea : undefined} /></View>
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
  content: { flexGrow: 1, alignSelf: 'center', paddingHorizontal: 24 },
  heading: { flexShrink: 0, alignItems: 'center' },
  title: { color: C.blue, fontFamily: F.extraBold, fontSize: T.title, lineHeight: 32, marginBottom: 8, textAlign: 'center' },
  subtitle: { color: C.blue, fontFamily: F.regular, fontSize: T.body, lineHeight: 20, textAlign: 'center' },
  sosArea: { alignItems: 'center', justifyContent: 'center', marginTop: 25, marginBottom: 12 },
  sosOuterRing: { position: 'absolute', width: 204, height: 204, borderRadius: 102, backgroundColor: 'rgba(255,53,65,.18)', alignItems: 'center', justifyContent: 'center' },
  sosMiddleRing: { width: 178, height: 178, borderRadius: 89, backgroundColor: 'rgba(255,53,65,.34)', alignItems: 'center', justifyContent: 'center' },
  sosButton: { width: 148, height: 148, borderRadius: 74, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF292F', boxShadow: '0 5px 13px rgba(205,25,35,.22)' },
  sosText: { color: C.white, fontFamily: F.extraBold, fontSize: 24, letterSpacing: -.4 },
  sosCallText: { color: C.white, fontFamily: F.semiBold, fontSize: 14, marginTop: 5 },
  addressCard: { flexShrink: 0, minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 9, borderRadius: 32, backgroundColor: C.white, borderWidth: 1, borderColor: '#C7D8EB', boxShadow: '0 4px 12px rgba(0,0,0,.32)' },
  addressAvatar: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', backgroundColor: '#EAF1F8', alignItems: 'center', justifyContent: 'center' },
  addressPhotoPlaceholder: { position: 'absolute', width: 135, height: 76, top: -5, left: -5 },
  addressCopy: { flex: 1, gap: 5 },
  addressTitle: { color: C.blue, fontFamily: F.bold, fontSize: T.label, lineHeight: 20 },
  addressText: { color: '#344861', fontFamily: F.regular, fontSize: T.body, lineHeight: 20 },
  actions: { flexShrink: 0, gap: 8, marginTop: 8 },
  actionRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 11, borderRadius: 24, backgroundColor: C.white, borderWidth: 1, borderColor: '#C7D8EB', boxShadow: '0 0 14px 2px rgba(148,176,213,.38), 0 4px 12px rgba(0,0,0,.24)' },
  actionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue },
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
});
