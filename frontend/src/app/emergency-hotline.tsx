import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ResponsiveBackground } from '@/components/responsive-background';
import { GlowButton } from '@/components/glow-button';
import { useAppSession } from '@/components/app-session';
import { SettingsProfileButton } from '@/components/settings-profile-button';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';

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
  const { height } = useWindowDimensions();
  const { pageWidth, scaleSize } = useResponsiveLayout();
  const { profile, profilePhoto } = useAppSession();
  const sosScale = Math.min(2, (pageWidth - scaleSize(24)) / scaleSize(204)) * .95 * .9;
  const currentAddress = profile?.guardian.address.trim() ?? '';
  const [showHotlines, setShowHotlines] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  useEffect(() => () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);

  function startEmergencyHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      setHolding(false);
      setShowHotlines(true);
    }, 3000);
  }

  function cancelEmergencyHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHolding(false);
  }

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
    <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + scaleSize(18), paddingBottom: Math.max(insets.bottom, 16) + scaleSize(12) }]} showsVerticalScrollIndicator={false}>
      <View style={s.headerRow}>
        <BackButton light accessibilityLabel="Back" onPress={goBack} />
        <SettingsProfileButton />
      </View>

      <View style={s.heading}>
        <Text accessibilityRole="header" style={s.title}>Emergency Hotline</Text>
        <Text style={s.subtitle}>Press and hold the button below for 3 seconds to</Text>
        <Text style={s.subtitle}>confirm and activate Emergency Assistance.</Text>
      </View>

      <View style={[s.sosArea, { height: scaleSize(204) * sosScale }]}>
        <View style={[s.sosOuterRing, { transform: [{ scale: sosScale }] }]}>
          <View style={s.sosMiddleRing}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Press and hold SOS for three seconds to activate emergency assistance"
              accessibilityState={{ selected: holding }}
              delayLongPress={3000}
              onPressIn={startEmergencyHold}
              onPressOut={cancelEmergencyHold}
              onLongPress={() => {}}
              style={[s.sosButton, holding && s.sosButtonHolding]}
            >
              <Text style={[s.sosText, holding && s.sosTextHolding]}>SOS</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={s.addressCard}>
        <View style={s.addressAvatar}>
          {profilePhoto ? <Image source={{ uri: profilePhoto }} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} /> :
            <Image source={require('../../assets/images/profile-guardian-child-mascots-4k.png')} contentFit="contain" transition={0} accessible={false} style={s.addressPhotoPlaceholder} />}
        </View>
        <View style={s.addressCopy}>
          <Text style={s.addressTitle}>Your Current Address</Text>
          <Text style={s.addressText}>{currentAddress || 'No address yet'}</Text>
        </View>
      </View>

      <View style={s.actions}>
        <ActionRow
          icon="services"
          title="Emergency Services"
          subtitle="View local emergency services"
          onPress={() => router.push('/emergency-services')}
        />
        <ActionRow
          icon="contacts"
          title="Emergency Contacts"
          subtitle="Call or manage your trusted contacts"
          onPress={() => router.push('/emergency-contacts')}
        />
      </View>
    </ScrollView>
    <Modal visible={showHotlines} transparent animationType="fade" onRequestClose={() => setShowHotlines(false)}>
      <View style={s.hotlineOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close emergency hotlines" onPress={() => setShowHotlines(false)} style={StyleSheet.absoluteFill} />
        <ScrollView style={[s.hotlinePanel, { maxHeight: height * .84 }]} contentContainerStyle={s.hotlinePanelContent} showsVerticalScrollIndicator={false}>
          <View style={s.hotlineHeader}>
            <Text accessibilityRole="header" style={s.hotlineTitle}>Hotlines</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close emergency hotlines" onPress={() => setShowHotlines(false)} style={s.hotlineClose}>
              <View style={s.closeLineOne} /><View style={s.closeLineTwo} />
            </Pressable>
          </View>
          <Text style={s.hotlineSubtitle}>Tap to call emergency hotlines</Text>
          <View style={s.hotlineList}>
            {emergencyHotlines.map(hotline => <GlowButton
              key={hotline.number}
              accessibilityRole="button"
              accessibilityLabel={`Call ${hotline.name}, ${hotline.number}`}
              onPress={() => callHotline(hotline.number)}
              style={s.hotlineCard}
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

function ActionRow({ icon, title, subtitle, onPress }: { icon: keyof typeof rowIcons; title: string; subtitle: string; onPress: () => void }) {
  const { scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  return <GlowButton accessibilityRole="button" accessibilityLabel={`${title}. ${subtitle}`} onPress={onPress} style={s.actionRow}>
    <View style={s.actionIcon}><SymbolView name={rowIcons[icon]} size={scaleSize(18)} tintColor={C.white} /></View>
    <View style={s.actionCopy}>
      <Text style={s.actionTitle}>{title}</Text>
      <Text style={s.actionSubtitle}>{subtitle}</Text>
    </View>
    <View style={s.chevron} />
  </GlowButton>;
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.white },
  content: { flexGrow: 1, paddingHorizontal: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { alignItems: 'center', marginTop: 20 },
  title: { color: C.blue, fontFamily: F.extraBold, fontSize: 20, lineHeight: 28, marginBottom: 8 },
  subtitle: { color: C.blue, fontFamily: F.regular, fontSize: 10, lineHeight: 14, textAlign: 'center' },
  sosArea: { alignItems: 'center', justifyContent: 'center', marginTop: 25, marginBottom: 12 },
  sosOuterRing: { width: 204, height: 204, borderRadius: 102, backgroundColor: 'rgba(255,53,65,.18)', alignItems: 'center', justifyContent: 'center' },
  sosMiddleRing: { width: 178, height: 178, borderRadius: 89, backgroundColor: 'rgba(255,53,65,.34)', alignItems: 'center', justifyContent: 'center' },
  sosButton: { width: 148, height: 148, borderRadius: 74, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF292F', boxShadow: '0 5px 13px rgba(205,25,35,.22)' },
  sosButtonHolding: { backgroundColor: '#E91924', boxShadow: '0 0 24px 8px rgba(255,41,47,.55), 0 5px 13px rgba(205,25,35,.3)' },
  sosText: { color: C.white, fontFamily: F.extraBold, fontSize: 24, letterSpacing: -.4 },
  sosTextHolding: { fontSize: 20 },
  addressCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 9, borderRadius: 32, backgroundColor: C.white, borderWidth: 1, borderColor: '#C7D8EB', boxShadow: '0 4px 12px rgba(0,0,0,.32)' },
  addressAvatar: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', backgroundColor: '#EAF1F8', alignItems: 'center', justifyContent: 'center' },
  addressPhotoPlaceholder: { position: 'absolute', width: 135, height: 76, top: -5, left: -5 },
  addressCopy: { flex: 1, gap: 2 },
  addressTitle: { color: C.blue, fontFamily: F.bold, fontSize: 11 },
  addressText: { color: '#344861', fontFamily: F.regular, fontSize: 9, lineHeight: 11 },
  actions: { gap: 8, marginTop: 8 },
  actionRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 11, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: '#C7D8EB', boxShadow: '0 4px 12px rgba(0,0,0,.32)' },
  actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue },
  actionCopy: { flex: 1, gap: 1 },
  actionTitle: { color: C.blue, fontFamily: F.bold, fontSize: 11 },
  actionSubtitle: { color: '#74859A', fontFamily: F.regular, fontSize: 9 },
  chevron: { width: 8, height: 8, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: C.blue, transform: [{ rotate: '45deg' }], marginRight: 3 },
  hotlineOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,.44)' },
  hotlinePanel: { width: '86%', maxWidth: 360, flexGrow: 0, flexShrink: 1, borderRadius: 24, backgroundColor: C.white, overflow: 'hidden' },
  hotlinePanelContent: { flexGrow: 0, paddingHorizontal: 16, paddingTop: 22, paddingBottom: 22 },
  hotlineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hotlineTitle: { color: C.blue, fontFamily: F.bold, fontSize: 19, lineHeight: 23 },
  hotlineClose: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#7992B1', alignItems: 'center', justifyContent: 'center' },
  closeLineOne: { position: 'absolute', width: 11, height: 1.5, borderRadius: 1, backgroundColor: '#526F92', transform: [{ rotate: '45deg' }] },
  closeLineTwo: { position: 'absolute', width: 11, height: 1.5, borderRadius: 1, backgroundColor: '#526F92', transform: [{ rotate: '-45deg' }] },
  hotlineSubtitle: { marginTop: 1, color: '#6F829B', fontFamily: F.regular, fontSize: 12 },
  hotlineList: { alignItems: 'stretch', gap: 10, marginTop: 13 },
  hotlineCard: { width: '100%', minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 28, backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(148,176,213,.45)', boxShadow: '0 4px 12px rgba(0,0,0,.25)' },
  hotlineBadgeIcon: { width: 27, height: 30 },
  hotlineCopy: { flex: 1, alignItems: 'flex-start', gap: 1 },
  hotlineName: { color: C.blue, fontFamily: F.bold, fontSize: 12, textAlign: 'left' },
  hotlineNumber: { color: '#71839B', fontFamily: F.regular, fontSize: 12 },
  phoneCircle: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#218517' },
});
