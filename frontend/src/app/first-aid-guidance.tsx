import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { FixedPageHeader } from '@/components/fixed-page-header';
import { MenuSheet, MenuSheetMascot } from '@/components/menu-sheet';
import { ResponsiveBackground } from '@/components/responsive-background';
import { GlowButton } from '@/components/glow-button';
import { useBottomNavigationMenu } from '@/components/bottom-navigation';
import { FirstAidVideo } from '@/components/first-aid-video';
import { useVideoFullscreen } from '@/hooks/use-video-fullscreen';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { guidanceBySeverity, severityLevels, type Severity } from '@/constants/first-aid';
import { firstAidVideos } from '@/constants/first-aid-videos';
import { getHomeNavigationLayout, getPageHeaderLayout } from '@/utils/responsive';

const menuIcons = {
  profile: { ios: 'person.fill', android: 'person', web: 'person' },
  hotline: { ios: 'phone.fill', android: 'call', web: 'call' },
  firstAid: { ios: 'cross.case.fill', android: 'medical_services', web: 'medical_services' },
  history: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
} satisfies Record<string, SymbolViewProps['name']>;

export default function FirstAidGuidanceScreen() {
  const { scaleSize, pageWidth, height, fontScale, insets } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const navigationLayout = getHomeNavigationLayout(pageWidth, insets.bottom, fontScale);
  const headerLayout = getPageHeaderLayout(pageWidth, insets.top);
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(current => !current), []);
  const [signsOpen, setSignsOpen] = useState(false);
  const [fullscreenScroll, setFullscreenScroll] = useState(false);
  const fullscreen = useVideoFullscreen();
  useBottomNavigationMenu(openMenu, menuOpen, fullscreen.visible);

  function handleBack() {
    setSignsOpen(false);
    setSelectedSeverity(null);
  }

  const selectedColor = severityLevels.find(level => level.label === selectedSeverity)?.color;
  const videoHeight = Math.min(scaleSize(210), Math.max(scaleSize(145), height * 0.3));
  const needsPageScroll = fontScale > 1.3
    || height - headerLayout.contentTop - navigationLayout.height < videoHeight + scaleSize(220);
  // Preserve the player's position in the tree while the fullscreen modal rotates.
  const scrollSelectedPage = fullscreen.visible ? fullscreenScroll : needsPageScroll;
  const selectedHeading = <View style={[s.heading, s.selectedHeading]}>
    <Text accessibilityRole="header" style={[s.title, s.selectedTitle]}>First-Aid Guidance</Text>
    <Text style={[s.subtitle, s.selectedSeverityLabel, { color: selectedColor }]}>{selectedSeverity}</Text>
  </View>;
  const videoPanel = <View style={s.selectedFixedContent}>
    <View style={[s.videoFrame, { height: videoHeight }]}>
      {selectedSeverity && <FirstAidVideo key={selectedSeverity} severity={selectedSeverity}
        source={firstAidVideos[selectedSeverity]} fullscreen={fullscreen}
        onEnterFullscreen={() => setFullscreenScroll(scrollSelectedPage)} />}
    </View>
    <GlowButton accessibilityRole="button" accessibilityLabel="View signs for this severity"
      onPress={() => setSignsOpen(true)} style={s.signsButton}>
      <Text style={s.signsButtonText}>Signs</Text>
    </GlowButton>
  </View>;
  const steps = selectedSeverity && <View style={s.guidanceSteps}>
    {guidanceBySeverity[selectedSeverity].steps.map((step, index) => <View key={step.title} style={s.guidanceCard}>
      <View style={s.stepNumber}><Text style={s.stepNumberText}>{index + 1}</Text></View>
      <View style={s.stepCopy}><Text style={s.stepTitle}>{step.title}</Text><Text style={s.stepDetail}>{step.detail}</Text></View>
    </View>)}
  </View>;

  return <View style={s.screen}>
    <StatusBar style="light" hidden={fullscreen.visible} />
    <NavigationBar hidden />
    <ResponsiveBackground source={selectedSeverity ? require('../../assets/images/first-aid-severity-background.svg') : require('../../assets/images/first-aid-guidance-background.svg')} />
    {!selectedSeverity && <Image pointerEvents="none" source={require('../../assets/images/first-aid-guidance-mascot.png')} contentFit="contain" transition={0} accessible={false} style={s.mascot} />}
    {!selectedSeverity ? <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[s.content, { paddingTop: headerLayout.contentTop, paddingBottom: navigationLayout.scrollPadding }]}>
      <View style={s.heading}>
        <Text accessibilityRole="header" style={s.title}>First-Aid Guidance</Text>
        <Text style={s.subtitle}>Quick guidance on what to do when a child falls</Text>
      </View>
      <View style={s.severityPanel}><Text style={s.severityTitle}>Select Severity Level</Text></View>
      <View style={s.severityList}>
        {severityLevels.map(level => <GlowButton key={level.label} accessibilityRole="button"
          accessibilityLabel={level.label + ' fall severity'}
          onPress={() => { setSelectedSeverity(level.label); setSignsOpen(true); }}
          style={s.severityButton}>
          <View style={[s.severityDot, { backgroundColor: level.color }]} /><Text style={s.severityLabel}>{level.label}</Text>
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={scaleSize(17)} tintColor={C.white} />
        </GlowButton>)}
      </View>
    </ScrollView> : <View style={[s.selectedPage, { paddingTop: headerLayout.contentTop }]}>
      {scrollSelectedPage ? <ScrollView key={selectedSeverity} style={s.selectedScroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: navigationLayout.scrollPadding }}>
        {selectedHeading}{videoPanel}{steps}
      </ScrollView> : <>
        {selectedHeading}
        {videoPanel}
        <ScrollView key={selectedSeverity} style={s.selectedScroll} showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: navigationLayout.scrollPadding }}>
          {steps}
        </ScrollView>
      </>}
    </View>}
    <FixedPageHeader onBack={selectedSeverity ? handleBack : undefined} />
    <Modal visible={signsOpen && !!selectedSeverity} supportedOrientations={['portrait', 'landscape']} transparent animationType="fade" onRequestClose={() => setSignsOpen(false)}>
      <View style={[s.signsOverlay, {
        paddingTop: insets.top + scaleSize(16), paddingBottom: insets.bottom + scaleSize(16),
        paddingLeft: insets.left + scaleSize(24), paddingRight: insets.right + scaleSize(24),
      }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close signs" onPress={() => setSignsOpen(false)} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={s.signsCard}>
          <View pointerEvents="none" style={[s.signsAccent, { backgroundColor: selectedColor }]} />
          <Image pointerEvents="none" source={require('../../assets/images/first-aid-signs-mascot.png')} contentFit="contain" transition={0} accessible={false} style={s.signsMascot} />
          <View style={s.signsBadge}>
            <View style={[s.severityDot, { backgroundColor: selectedColor }]} />
            <Text style={s.signsBadgeText}>{selectedSeverity} severity</Text>
          </View>
          <Text accessibilityRole="header" style={s.signsTitle}>Signs to look for</Text>
          <ScrollView style={s.signsScroll} contentContainerStyle={s.signsList} showsVerticalScrollIndicator={false}>
            {selectedSeverity && guidanceBySeverity[selectedSeverity].signs.map(sign => <View key={sign} style={s.signRow}>
              <View style={[s.signBullet, { backgroundColor: selectedColor }]} /><Text style={s.signsDetail}>{sign}</Text>
            </View>)}
          </ScrollView>
          <GlowButton accessibilityRole="button" onPress={() => setSignsOpen(false)} style={s.signsContinue}><Text style={s.signsContinueText}>View first-aid steps</Text>
            <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={scaleSize(16)} tintColor={C.blue} />
          </GlowButton>
        </View>
      </View>
    </Modal>
    <MenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} artwork={<MenuSheetMascot />}
      sheetStyle={[s.menuSheet, { paddingBottom: Math.max(insets.bottom, 18) + scaleSize(36) }]}>
          <View style={s.menuOptions}>
            <MenuOption icon="profile" label="Profile" onPress={() => { setMenuOpen(false); router.push('/profile'); }} />
            <MenuOption icon="hotline" label="Emergency Hotline" onPress={() => { setMenuOpen(false); router.push('/emergency-hotline'); }} />
            <MenuOption icon="firstAid" label="First-Aid Guidance" onPress={() => setMenuOpen(false)} />
            <MenuOption icon="history" label="History" onPress={() => { setMenuOpen(false); router.push('/history'); }} />
            <MenuOption icon="settings" label="Settings" onPress={() => { setMenuOpen(false); router.push('/settings'); }} />
          </View>
    </MenuSheet>
  </View>;
}

function MenuOption({ icon, label, onPress }: { icon: keyof typeof menuIcons; label: string; onPress: () => void }) {
  const { scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  return <GlowButton accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.menuOption}>
    <View style={s.menuOptionIcon}><SymbolView name={menuIcons[icon]} size={scaleSize(20)} tintColor={C.white} /></View>
    <Text style={s.menuOptionLabel}>{label}</Text>
    <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={scaleSize(14)} tintColor="#A9BBD0" />
  </GlowButton>;
}


const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#315780' },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  selectedPage: { flex: 1 },
  heading: { alignItems: 'center', marginTop: 8 },
  title: { color: C.white, fontFamily: F.extraBold, fontSize: T.title, lineHeight: 32, textAlign: 'center' },
  subtitle: { marginTop: 6, color: C.white, fontFamily: F.regular, fontSize: T.body, lineHeight: 21, textAlign: 'center' },
  selectedHeading: { marginTop: 1, paddingHorizontal: 24 },
  selectedTitle: { fontSize: T.title, lineHeight: 32 },
  selectedSeverityLabel: { marginTop: 5, fontFamily: F.semiBold, fontSize: 14, lineHeight: 18 },
  selectedFixedContent: { gap: 10, marginTop: 12, marginBottom: 12, marginHorizontal: 24 },
  signsButton: { minWidth: 132, minHeight: 44, paddingVertical: 10, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, borderRadius: 24, backgroundColor: C.blue, boxShadow: '0 0 16px 4px rgba(106,215,244,.48), 0 0 26px rgba(148,176,213,.32)' },
  buttonPressed: { opacity: .82, transform: [{ scale: .96 }] },
  signsButtonText: { color: C.white, fontFamily: F.bold, fontSize: T.label },
  signsCard: { position: 'relative', overflow: 'hidden', width: '100%', maxWidth: 400, maxHeight: '100%', flexShrink: 1, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, borderRadius: 24, backgroundColor: C.blue, boxShadow: '0 10px 28px rgba(0,0,0,.48), 0 0 18px rgba(50,80,123,.28)' },
  signsMascot: { position: 'absolute', right: -4, bottom: -24, width: 200, height: 300, opacity: .22 },
  signsAccent: { position: 'absolute', width: 150, height: 150, borderRadius: 75, top: -100, right: -35, opacity: .18 },
  signsBadge: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.1)' },
  signsBadgeText: { color: C.white, fontFamily: F.semiBold, fontSize: T.caption, lineHeight: 18 },
  signsTitle: { color: C.white, fontFamily: F.bold, fontSize: 23, lineHeight: 30, marginTop: 12, marginBottom: 12, textAlign: 'center' },
  signsList: { gap: 8, paddingVertical: 10 },
  signRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(196,219,247,.22)' },
  signBullet: { width: 7, height: 7, marginTop: 6, borderRadius: 4, backgroundColor: C.white },
  signsDetail: { flex: 1, color: C.white, fontFamily: F.regular, fontSize: T.body, lineHeight: 21 },
  signsOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.52)' },
  signsContinue: { alignSelf: 'stretch', flexDirection: 'row', gap: 10, minHeight: 48, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingHorizontal: 20, borderRadius: 24, backgroundColor: '#D5E7FA', boxShadow: '0 3px 10px rgba(0,0,0,.2)' },
  signsContinueText: { color: C.blue, fontFamily: F.bold, fontSize: 14 },
  videoFrame: { height: 210, position: 'relative', overflow: 'hidden', borderRadius: 15, borderWidth: 1.5, borderColor: '#A9E8FF', backgroundColor: '#182C42', boxShadow: '0 0 24px rgba(106,215,244,.72), 0 0 42px rgba(106,215,244,.38), 0 6px 12px rgba(8,34,61,.22)' },
  videoDim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(8,20,33,.22)' },
  videoPlayButton: { position: 'absolute', top: '50%', left: '50%', width: 58, height: 58, marginLeft: -29, marginTop: -29, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: 'rgba(255,255,255,.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,.9)', boxShadow: '0 4px 14px rgba(15,35,58,.32)' },
  videoLandscapeButton: { position: 'absolute', top: 10, right: 10, width: 44, height: 44, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(0,0,0,.21)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' },
  fullscreenBadge: { width: 18, height: 18, position: 'relative' },
  fullscreenCorner: { position: 'absolute', width: 6, height: 6, borderColor: C.white },
  fullscreenTopLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  fullscreenTopRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  fullscreenBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  fullscreenBottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  portraitPlaybackBar: { position: 'absolute', left: 10, right: 10, bottom: 10, gap: 1 },
  portraitTimestamp: { color: C.white, fontFamily: F.semiBold, fontSize: T.caption, lineHeight: 18, fontVariant: ['tabular-nums'] },
  seekTimeBubble: { position: 'absolute', top: -20, minWidth: 46, minHeight: 24, marginLeft: -23, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 12, backgroundColor: C.blue, zIndex: 3 },
  seekTimeText: { color: C.white, fontFamily: F.semiBold, fontSize: T.caption, lineHeight: 18, fontVariant: ['tabular-nums'] },
  landscapeScreen: { flex: 1, position: 'relative', backgroundColor: '#101820' },
  landscapeTopRow: { position: 'absolute', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
  landscapeTitleRow: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(50,80,123,.9)' },
  landscapeSeverityDot: { width: 9, height: 9, borderRadius: 5 },
  landscapeSeverity: { flexShrink: 1, color: C.white, fontFamily: F.regular, fontSize: T.body, lineHeight: 21 },
  landscapeExitButton: { width: 44, height: 44, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(0,0,0,.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' },
  landscapeExitLineOne: { position: 'absolute', width: 19, height: 2, borderRadius: 1, backgroundColor: C.white, transform: [{ rotate: '45deg' }] },
  landscapeExitLineTwo: { position: 'absolute', width: 19, height: 2, borderRadius: 1, backgroundColor: C.white, transform: [{ rotate: '-45deg' }] },
  landscapePlayback: { position: 'absolute', zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.42)' },
  landscapeTimestamp: { color: C.white, fontFamily: F.semiBold, fontSize: T.caption, lineHeight: 18, fontVariant: ['tabular-nums'] },
  playerPlayGlyph: { width: 0, height: 0, marginLeft: 4, borderTopWidth: 11, borderBottomWidth: 11, borderLeftWidth: 16, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: C.blue },
  playerPauseGlyph: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playerPauseBar: { width: 6, height: 21, borderRadius: 2, backgroundColor: C.blue },
  // Keep shadow space inside the scroll viewport instead of clipping at card edges.
  guidanceSteps: { gap: 8, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  guidanceCard: { width: '100%', minHeight: 75, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(148,176,213,.4)', backgroundColor: C.white, boxShadow: '0 4px 12px rgba(8,34,61,.12), 0 1px 3px rgba(8,34,61,.05)' },
  stepNumber: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: C.blue },
  stepNumberText: { color: C.white, fontFamily: F.bold, fontSize: 20, lineHeight: 24 },
  stepCopy: { flex: 1, gap: 1, paddingTop: 1 },
  stepTitle: { color: C.blue, fontFamily: F.bold, fontSize: T.label, lineHeight: 21 },
  stepDetail: { color: '#627995', fontFamily: F.regular, fontSize: T.body, lineHeight: 21 },
  severityPanel: { width: '86%', minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 32, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(213,228,246,.75)', backgroundColor: 'rgba(255,255,255,.08)' },
  severityTitle: { color: C.white, fontFamily: F.bold, fontSize: T.section, lineHeight: 26, textAlign: 'center' },
  severityList: { width: '68%', alignSelf: 'center', alignItems: 'center', gap: 15, marginTop: 34 },
  severityButton: { width: '100%', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderRadius: 23, backgroundColor: 'rgba(14,48,82,.88)', boxShadow: '0 5px 10px rgba(15,39,68,.18)' },
  severitySelected: { borderWidth: 1, borderColor: 'rgba(222,235,251,.82)' },
  severityPressed: { opacity: .84 },
  severityDot: { width: 10, height: 10, borderRadius: 5 },
  severityLabel: { flex: 1, color: C.white, fontFamily: F.regular, fontSize: T.body, lineHeight: 21 },
  mascot: { position: 'absolute', right: -20, bottom: 0, width: 340, height: 569, zIndex: 0 },
  menuSheet: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: C.white, borderTopLeftRadius: 64, borderTopRightRadius: 64, overflow: 'hidden' },
  menuOptions: { gap: 15, paddingBottom: 4 },
  menuOption: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 20, paddingRight: 12, paddingVertical: 8, borderRadius: 30, backgroundColor: 'rgba(255,255,255,.55)', borderWidth: 1, borderColor: 'rgba(148,176,213,.62)', boxShadow: '0 4px 12px rgba(98,142,204,.18)' },
  menuOptionIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue },
  menuOptionLabel: { flex: 1, color: '#172333', fontFamily: F.semiBold, fontSize: T.label },
  selectedScroll: { flex: 1 },
  signsScroll: { flexGrow: 0, flexShrink: 1 },
  timeline: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineTouch: { flex: 1, minHeight: 44, justifyContent: 'center', position: 'relative' },
  timelineTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.48)' },
  timelineProgress: { height: '100%', borderRadius: 3, backgroundColor: C.white },
  timelineThumb: { position: 'absolute', top: -3, width: 12, height: 12, marginLeft: -6, borderRadius: 6, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.blue },
});
