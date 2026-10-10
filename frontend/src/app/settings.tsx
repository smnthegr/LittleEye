import { useState } from 'react';
import { BackButton } from '@/components/back-button';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSession } from '@/components/app-session';
import { CameraIcon } from '@/components/camera-icon';
import { SettingsSignOut } from '@/components/settings-sign-out';
import { SettingsProfileButton } from '@/components/settings-profile-button';
import { SettingsDetails } from '@/components/settings-details';
import { type SettingsSection } from '@/constants/settings';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { useSettingsCamera } from '@/hooks/use-settings-camera';

const groups = [
  { title: 'SYSTEM', items: [
    { title: 'Device Information', subtitle: 'View device details and status', icon: 'device', page: 'device-information' },
    { title: 'Network & Connection', subtitle: 'Wi-Fi, signal and network settings', icon: 'wifi', page: 'network-connection' },
  ] },
  { title: 'MONITORING', items: [
    { title: 'Image & Sound Settings', subtitle: 'Video quality, audio and camera settings', icon: 'camera', page: 'image-sound' },
    { title: 'Fall Detection & Alerts', subtitle: 'Monitor movement and get alerts', icon: 'alert', page: 'fall-detection' },
  ] },
  { title: 'NOTIFICATIONS', items: [
    { title: 'Notification Preferences', subtitle: 'Manage push notifications and sounds', icon: 'bell', page: 'notifications' },
  ] },
  { title: 'SECURITY', items: [
    { title: 'Security & Access', subtitle: 'Account password and access', icon: 'security', page: 'security' },
  ] },
  { title: 'ABOUT & SUPPORT', items: [
    { title: 'Instructions & Help', subtitle: 'Guides and FAQs', icon: 'help', page: 'help' },
    { title: 'About LittleEye', subtitle: 'App version, system and privacy information', icon: 'about', page: 'about' },
  ] },
] as const;

function SettingIcon({ kind }: { kind: string }) {
  return <View accessible={false} style={s.icon}>
    {kind === 'camera' ? <CameraIcon size={25} color={C.white} /> :
      kind === 'device' ? <View style={s.phone}><View style={s.phoneDot} /></View> :
      kind === 'wifi' ? <Image source={require('../../assets/images/settings-wifi.svg')}
        accessible={false} contentFit="contain" transition={0} style={s.wifi} /> :
      kind === 'bell' ? <View><View style={s.bell} /><View style={s.bellDot} /></View> :
      kind === 'security' ? <View><View style={s.lockLoop} /><View style={s.lockBody} /></View> :
      <Text style={s.iconText}>{kind === 'help' ? '?' : kind === 'about' ? 'i' : '!'}</Text>}
  </View>;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const session = useAppSession();
  const { camera, isPreview } = useSettingsCamera();
  const [showNotifications, setShowNotifications] = useState(false);
  function openPage(section: SettingsSection) {
    if (section === 'notifications') {
      setShowNotifications(true);
      return;
    }
    router.push({ pathname: '/settings-pages/[section]', params: { section, ...(isPreview && { preview: 'connected' }) } });
  }
  const name = camera?.name || 'No camera connected';
  const status = isPreview ? 'Online (preview)' : camera?.status === 'connected' ? 'Online' : camera ? 'Pending connection' : 'Connect a camera to get started';
  const visibleGroups = groups.filter(group => !!camera || !['SYSTEM', 'MONITORING'].includes(group.title));
  function openCamera() {
    if (camera) openPage('device-information');
    else if (session.signedIn && session.accepted) router.navigate('/connect-camera');
    else router.replace('/');
  }
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(session.signedIn && session.accepted ? '/connect-camera' : '/');
  }
  return <View style={s.screen}>
    <StatusBar style="light" />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <View pointerEvents="none" style={s.headerBlob}>
          <Image source={require('../../assets/images/settings-header-wave-blob.svg')}
            accessible={false} contentFit="fill" transition={0} style={StyleSheet.absoluteFill} />
        </View>
        <View style={s.headerContent}>
          <View style={s.topRow}>
            <BackButton onPress={goBack} />
            <SettingsProfileButton />
          </View>
          <Text accessibilityRole="header" style={s.title}>Settings</Text>
          <Text style={s.subtitle}>Make LittleEye work the way you need.</Text>
        </View>
        <View pointerEvents="none" style={s.wave} />
      </View>
      <View style={s.body}>
        <Pressable accessibilityRole="button" accessibilityLabel={camera ? `${name}, ${status}. View device information` : 'Connect a camera'}
          onPress={openCamera} style={({ pressed }) => [s.deviceCard, pressed && s.pressed]}>
          <View pointerEvents="none" style={s.cameraFrame}>
            <View style={s.cameraGlow} />
            <View style={s.cameraArt}>
              <Image source={require('../../assets/images/littleeye-camera-4k.png')}
                accessible={false} contentFit="contain" transition={0} style={s.cameraImage} />
            </View>
          </View>
          <View style={s.deviceText}><Text style={s.deviceName}>{name}</Text><View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: camera?.status === 'connected' ? '#42D52B' : C.lightBlue }]} />
            <Text style={s.status}>{status}</Text>
          </View></View><View style={s.chevron} />
        </Pressable>
        {!camera && <Text style={s.noCameraNote}>Manage your account and preferences here. Camera settings will appear after you add a camera.</Text>}
        <View style={s.groups}>{visibleGroups.map(group => <View key={group.title} style={s.group}>
          <Text accessibilityRole="header" style={s.groupTitle}>{group.title}</Text>
          {group.items.map(item => <Pressable key={item.title} accessibilityRole="button" onPress={() => openPage(item.page)}
            style={({ pressed }) => [s.row, pressed && s.pressed]}>
            <SettingIcon kind={item.icon} /><View style={s.rowText}><Text style={s.rowTitle}>{item.title}</Text><Text style={s.rowSubtitle}>{item.subtitle}</Text></View><View style={s.smallChevron} />
          </Pressable>)}
        </View>)}</View>
        <SettingsSignOut />
      </View>
    </ScrollView>
    <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
      <View style={[s.modalBackdrop, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View accessibilityViewIsModal style={s.modalCard}>
          <Text accessibilityRole="header" style={s.modalTitle}>Notification Preferences</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            {showNotifications && <SettingsDetails section="Notification Preferences" />}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={() => setShowNotifications(false)}
            style={({ pressed }) => [s.close, pressed && s.pressed]}><Text style={s.closeText}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.white },
  header: { backgroundColor: '#2C527F', paddingBottom: 84, overflow: 'hidden' },
  headerContent: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 28 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  back: { width: 44, height: 44, borderRadius: 17, backgroundColor: 'rgba(148,176,213,.42)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { width: 10, height: 10, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: C.white, transform: [{ rotate: '45deg' }], marginLeft: 4 },
  title: { fontFamily: F.extraBold, fontSize: 29, color: C.white },
  subtitle: { fontFamily: F.regular, fontSize: 13, lineHeight: 21, color: C.white, marginTop: 2 },
  headerBlob: { position: 'absolute', width: '90%', height: '130%', right: -16, top: '-15%', opacity: .11 },
  wave: { position: 'absolute', bottom: -29, left: '-10%', width: '120%', height: 46, borderRadius: '50%', backgroundColor: C.white, transform: [{ rotate: '3deg' }] },
  body: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 28 },
  deviceCard: { marginTop: -67, minHeight: 104, borderRadius: 36, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', gap: 14, boxShadow: '0 10px 24px rgba(111,160,235,.42)' },
  cameraFrame: { width: 76, height: 80 },
  cameraGlow: { position: 'absolute', width: 58, height: 58, left: 9, top: 12, borderRadius: 29, backgroundColor: 'rgba(111,160,235,.22)', boxShadow: '0 0 20px 8px rgba(111,160,235,.58)' },
  cameraArt: { width: 76, height: 80, overflow: 'hidden' },
  // Offset the transparent 16:9 canvas so the whole camera fills the card's artwork area.
  cameraImage: { position: 'absolute', width: 180, height: 101.25, left: -62, top: -14 },
  deviceText: { flex: 1 }, deviceName: { fontFamily: F.bold, color: C.blue, fontSize: 13, lineHeight: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }, statusDot: { width: 9, height: 9, borderRadius: 5 }, status: { fontFamily: F.regular, fontSize: 12, color: C.blue },
  chevron: { width: 10, height: 10, borderRightWidth: 2, borderTopWidth: 2, borderColor: C.blue, transform: [{ rotate: '45deg' }], marginRight: 8 },
  groups: { paddingHorizontal: 8, paddingTop: 32 }, group: { marginBottom: 17 },
  noCameraNote: { fontFamily: F.regular, color: C.blue, fontSize: 11, lineHeight: 19, paddingHorizontal: 8, marginTop: 24 },
  groupTitle: { fontFamily: F.bold, fontSize: 12, letterSpacing: .4, color: C.blue, marginBottom: 8 },
  row: { minHeight: 56, borderRadius: 30, borderWidth: 1, borderColor: '#BED1EF', backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 14, gap: 12, marginBottom: 5, boxShadow: '0 8px 18px rgba(104,124,245,.12)' },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2E5684', alignItems: 'center', justifyContent: 'center' },
  iconText: { color: C.white, fontFamily: F.bold, fontSize: 25 },
  lockLoop: { width: 12, height: 11, borderWidth: 2, borderColor: C.white, borderTopLeftRadius: 7, borderTopRightRadius: 7, alignSelf: 'center', marginBottom: -2 },
  lockBody: { width: 19, height: 13, borderRadius: 3, backgroundColor: C.white },
  phone: { width: 12, height: 20, borderWidth: 2, borderColor: C.white, borderRadius: 2 }, phoneDot: { position: 'absolute', bottom: 1, left: 3, width: 2, height: 2, backgroundColor: C.white },
  wifi: { width: 24, height: 24 },
  bell: { width: 16, height: 18, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: C.white }, bellDot: { width: 5, height: 3, borderRadius: 2, alignSelf: 'center', marginTop: 2, backgroundColor: C.white },
  rowText: { flex: 1 }, rowTitle: { fontFamily: F.bold, fontSize: 10, lineHeight: 15, color: C.blue }, rowSubtitle: { fontFamily: F.regular, fontSize: 9, lineHeight: 14, color: C.blue },
  smallChevron: { width: 7, height: 7, borderRightWidth: 1.5, borderTopWidth: 1.5, borderColor: C.blue, transform: [{ rotate: '45deg' }], marginRight: 5 }, pressed: { opacity: .65 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20,37,60,.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  modalCard: { width: '100%', maxWidth: 440, maxHeight: '100%', flexShrink: 1, padding: 26, borderRadius: 28, backgroundColor: C.white, boxShadow: '0 10px 28px rgba(50,80,123,.2)' },
  modalTitle: { fontFamily: F.bold, color: C.blue, fontSize: 20, marginBottom: 12 },
  close: { minHeight: 46, padding: 14, borderRadius: 24, backgroundColor: C.blue, alignItems: 'center' },
  closeText: { fontFamily: F.semiBold, color: C.white, fontSize: 13 },
});
