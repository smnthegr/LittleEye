import { useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { GlowButton } from '@/components/glow-button';
import { HomeNavigationBar } from '@/components/home-navigation-bar';
import { SettingsProfileButton } from '@/components/settings-profile-button';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';

const severityLevels = [
  { label: 'Mild', color: '#F5C06F' },
  { label: 'Medium', color: '#FF791F' },
  { label: 'Severe', color: '#FF3946' },
];

const guidanceBySeverity: Record<string, { title: string; detail: string }[]> = {
  Mild: [
    { title: 'Check the child', detail: 'Stay calm and check if the child is conscious and breathing normally.' },
    { title: 'Keep them still', detail: 'Avoid unnecessary movement, especially if a head, neck, or back injury is possible.' },
    { title: 'Watch for changes', detail: 'Stay with the child and get medical help if their condition worsens.' },
  ],
  Medium: [
    { title: 'Check the child', detail: 'Stay calm and check if the child is conscious and breathing normally.' },
    { title: 'Keep them still', detail: 'Do not move the child unnecessarily, especially if a head, neck, or back injury is suspected.' },
    { title: 'Get medical help', detail: 'Call emergency services if symptoms worsen or you are concerned about an injury.' },
  ],
  Severe: [
    { title: 'Call emergency services', detail: 'Call 911 if the child is unresponsive, not breathing normally, or seriously injured.' },
    { title: 'Check breathing', detail: 'If they are unresponsive and not breathing normally, follow the dispatcher’s instructions.' },
    { title: 'Keep them still', detail: 'Do not move them if a head, neck, or spine injury is possible, unless the area is unsafe.' },
  ],
};

const menuIcons = {
  profile: { ios: 'person.fill', android: 'person', web: 'person' },
  hotline: { ios: 'phone.fill', android: 'call', web: 'call' },
  firstAid: { ios: 'cross.case.fill', android: 'medical_services', web: 'medical_services' },
  history: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
} satisfies Record<string, SymbolViewProps['name']>;

export default function FirstAidGuidanceScreen() {
  const insets = useSafeAreaInsets();
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoPlaying, setDemoPlaying] = useState(false);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  function handleBack() {
    if (selectedSeverity) setSelectedSeverity(null);
    else goBack();
  }

  return <View style={s.screen}>
    <StatusBar style="light" />
    <NavigationBar hidden />
    <Image pointerEvents="none" source={selectedSeverity ? require('../../assets/images/first-aid-severity-background.svg') : require('../../assets/images/first-aid-guidance-background.svg')} contentFit="fill" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
    {!selectedSeverity && <Image pointerEvents="none" source={require('../../assets/images/first-aid-guidance-mascot.png')} contentFit="contain" transition={0} accessible={false} style={s.mascot} />}

    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingTop: insets.top + 8, paddingBottom: 170 + insets.bottom }]}>
      <View style={s.headerRow}>
        <BackButton accessibilityLabel={selectedSeverity ? 'Back to severity selection' : 'Back'} onPress={handleBack} />
        <SettingsProfileButton />
      </View>

      <View style={[s.heading, selectedSeverity && s.selectedHeading]}>
        <Text accessibilityRole="header" style={[s.title, selectedSeverity && s.selectedTitle]}>First-Aid Guidance</Text>
        {selectedSeverity ? <Text style={[s.subtitle, s.selectedSeverityLabel, { color: severityLevels.find(level => level.label === selectedSeverity)?.color }]}>{selectedSeverity}</Text> : <>
          <Text style={s.subtitle}>Quick guidance on what to do when a</Text>
          <Text style={s.subtitle}>child falls</Text>
        </>}
      </View>

      {!selectedSeverity ? <>
        <View style={s.severityPanel}>
          <Text style={s.severityTitle}>Select Severity Level</Text>
        </View>

        <View style={s.severityList}>
          {severityLevels.map(level => <Pressable
            key={level.label}
            accessibilityRole="button"
            accessibilityLabel={`${level.label} fall severity`}
            onPress={() => setSelectedSeverity(level.label)}
            style={({ pressed }) => [s.severityButton, pressed && s.severityPressed]}
          >
            <View style={[s.severityDot, { backgroundColor: level.color }]} />
            <Text style={s.severityLabel}>{level.label}</Text>
            <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={17} tintColor={C.white} />
          </Pressable>)}
        </View>
      </> : <View style={s.selectedContent}>
        <View style={s.demoVideo}>
          <Image source={require('../../assets/images/footage-placeholder.png')} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={s.videoDim} />
          <Pressable accessibilityRole="button" accessibilityLabel={demoPlaying ? 'Pause first aid demonstration' : 'Play first aid demonstration'} accessibilityState={{ selected: demoPlaying }} onPress={() => setDemoPlaying(value => !value)} style={s.videoPlayButton}>
            {demoPlaying ? <View style={s.videoPauseGlyph}><View style={s.videoPauseBar} /><View style={s.videoPauseBar} /></View> : <View style={s.videoPlayGlyph} />}
          </Pressable>
        </View>
        <View style={s.guidanceSteps}>
          {guidanceBySeverity[selectedSeverity].map((step, index) => <View key={`${selectedSeverity}-${index}`} style={s.guidanceCard}>
            <View style={s.stepNumber}><Text style={s.stepNumberText}>{index + 1}</Text></View>
            <View style={s.stepCopy}>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepDetail}>{step.detail}</Text>
            </View>
          </View>)}
        </View>
      </View>}
    </ScrollView>

    <HomeNavigationBar onOpenMenu={() => setMenuOpen(true)} />

    <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
      <View style={s.menuOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setMenuOpen(false)} style={StyleSheet.absoluteFill} />
        <View style={[s.menuSheet, { paddingBottom: Math.max(insets.bottom, 18) + 36 }]}>
          <Image pointerEvents="none" source={require('../../assets/images/menu-mascot.png')} contentFit="contain" transition={0} accessible={false} style={s.menuMascot} />
          <View style={s.menuHandle} />
          <View style={s.menuOptions}>
            <MenuOption icon="profile" label="Profile" onPress={() => { setMenuOpen(false); router.push('/profile'); }} />
            <MenuOption icon="hotline" label="Emergency Hotline" onPress={() => { setMenuOpen(false); router.push('/emergency-hotline'); }} />
            <MenuOption icon="firstAid" label="First-Aid Guidance" onPress={() => setMenuOpen(false)} />
            <MenuOption icon="history" label="History" onPress={() => { setMenuOpen(false); router.push('/history'); }} />
            <MenuOption icon="settings" label="Settings" onPress={() => { setMenuOpen(false); router.push('/settings'); }} />
          </View>
        </View>
      </View>
    </Modal>
  </View>;
}

function MenuOption({ icon, label, onPress }: { icon: keyof typeof menuIcons; label: string; onPress: () => void }) {
  return <GlowButton accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.menuOption}>
    <View style={s.menuOptionIcon}><SymbolView name={menuIcons[icon]} size={20} tintColor={C.white} /></View>
    <Text style={s.menuOptionLabel}>{label}</Text>
    <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={14} tintColor="#A9BBD0" />
  </GlowButton>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#315780' },
  content: { flexGrow: 1, paddingHorizontal: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: -1, transform: [{ translateY: 1 }] },
  heading: { alignItems: 'center', marginTop: 25 },
  title: { color: C.white, fontFamily: F.extraBold, fontSize: 20, lineHeight: 28 },
  subtitle: { marginTop: 6, color: C.white, fontFamily: F.regular, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  selectedHeading: { marginTop: 19 },
  selectedTitle: { fontSize: 17, lineHeight: 22 },
  selectedSeverityLabel: { marginTop: 5, fontFamily: F.semiBold, fontSize: 14, lineHeight: 18 },
  selectedContent: { marginTop: 43, marginHorizontal: -13, gap: 20 },
  demoVideo: { height: 210, position: 'relative', overflow: 'hidden', borderRadius: 15, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.82)', backgroundColor: '#182C42', boxShadow: '0 0 16px rgba(106,215,244,.42), 0 6px 12px rgba(8,34,61,.22)' },
  videoDim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(8,20,33,.22)' },
  videoPlayButton: { position: 'absolute', top: '50%', left: '50%', width: 42, height: 42, marginLeft: -21, marginTop: -21, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: 'rgba(13,28,44,.38)' },
  videoPlayGlyph: { width: 0, height: 0, marginLeft: 3, borderTopWidth: 9, borderBottomWidth: 9, borderLeftWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'rgba(255,255,255,.9)' },
  videoPauseGlyph: { flexDirection: 'row', gap: 4 },
  videoPauseBar: { width: 4, height: 15, borderRadius: 1, backgroundColor: 'rgba(255,255,255,.95)' },
  guidanceSteps: { gap: 8 },
  guidanceCard: { minHeight: 75, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(148,176,213,.74)', backgroundColor: C.white, boxShadow: '0 5px 11px rgba(0,0,0,.24)' },
  stepNumber: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: C.blue },
  stepNumberText: { color: C.white, fontFamily: F.bold, fontSize: 20, lineHeight: 24 },
  stepCopy: { flex: 1, gap: 1, paddingTop: 1 },
  stepTitle: { color: C.blue, fontFamily: F.bold, fontSize: 11, lineHeight: 14 },
  stepDetail: { color: '#627995', fontFamily: F.regular, fontSize: 10, lineHeight: 13 },
  severityPanel: { width: '76%', height: 38, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 44, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(213,228,246,.75)', backgroundColor: 'rgba(255,255,255,.08)' },
  severityTitle: { color: C.white, fontFamily: F.bold, fontSize: 20, lineHeight: 24 },
  severityList: { width: '68%', alignSelf: 'center', alignItems: 'center', gap: 15, marginTop: 34 },
  severityButton: { width: '100%', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderRadius: 23, backgroundColor: 'rgba(14,48,82,.88)', boxShadow: '0 5px 10px rgba(15,39,68,.18)' },
  severitySelected: { borderWidth: 1, borderColor: 'rgba(222,235,251,.82)' },
  severityPressed: { opacity: .84 },
  severityDot: { width: 10, height: 10, borderRadius: 5 },
  severityLabel: { flex: 1, color: C.white, fontFamily: F.regular, fontSize: 17, lineHeight: 21 },
  mascot: { position: 'absolute', right: -20, bottom: 0, width: 340, height: 569, zIndex: 0 },
  fixedDock: { position: 'absolute', bottom: -21, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 30 },
  floatBubbles: { position: 'absolute', top: -28, left: '50%', marginLeft: -75, width: 150, height: 150 },
  fixedSide: { zIndex: 2, width: 82, height: 82, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  fixedMainPosition: { position: 'absolute', left: 0, right: 0, top: -5, alignItems: 'center', zIndex: 3 },
  fixedMain: { width: 108, height: 108, borderRadius: 56, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  menuGlassMask: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 54, overflow: 'hidden' },
  menuGlassImage: { position: 'absolute', width: 144, height: 144, top: -18, left: -18 },
  gridIcon: { width: 44, height: 44, flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignContent: 'center', justifyContent: 'center' },
  gridTile: { width: 19, height: 19, borderRadius: 4, backgroundColor: C.white },
  fixedLabel: { color: C.white, fontFamily: F.semiBold, fontSize: 7 },
  aidIcon: { width: 48, height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(148,176,213,.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,.65)', boxShadow: '0 0 14px rgba(148,176,213,.68)' },
  aidHandle: { position: 'absolute', top: 7, width: 16, height: 8, borderWidth: 2, borderColor: C.white, borderRadius: 3 },
  aidCase: { width: 25, height: 21, marginTop: 8, borderRadius: 4, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  aidCrossVertical: { position: 'absolute', width: 4, height: 14, borderRadius: 2, backgroundColor: '#F35E6A' },
  aidCrossHorizontal: { position: 'absolute', width: 14, height: 4, borderRadius: 2, backgroundColor: '#F35E6A' },
  menuOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.32)' },
  menuSheet: { width: '100%', paddingTop: 30, paddingHorizontal: 30, backgroundColor: C.white, borderTopLeftRadius: 64, borderTopRightRadius: 64, overflow: 'hidden' },
  menuMascot: { position: 'absolute', width: 700, height: 394, top: 8, right: -296 },
  menuHandle: { alignSelf: 'center', width: 37, height: 3, borderRadius: 2, backgroundColor: '#A5B8D1', marginBottom: 23, transform: [{ translateY: -10 }] },
  menuOptions: { gap: 15, paddingBottom: 4 },
  menuOption: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.55)', borderWidth: 1, borderColor: 'rgba(148,176,213,.62)', boxShadow: '0 5px 14px rgba(98,142,204,.18)' },
  menuOptionIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue },
  menuOptionLabel: { flex: 1, color: '#172333', fontFamily: F.regular, fontSize: 13 },
});
