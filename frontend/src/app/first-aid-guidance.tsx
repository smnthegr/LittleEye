import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useCallback, useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { FixedPageHeader } from '@/components/fixed-page-header';
import { MenuSheet, MenuSheetMascot } from '@/components/menu-sheet';
import { ResponsiveBackground } from '@/components/responsive-background';
import { GlowButton } from '@/components/glow-button';
import { useBottomNavigationMenu } from '@/components/bottom-navigation';
import { useDemoLandscape } from '@/hooks/use-demo-landscape';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { guidanceBySeverity, severityLevels, type Severity } from '@/constants/first-aid';
import { getHomeNavigationLayout, getPageHeaderLayout } from '@/utils/responsive';
import { advanceDemoPlayback, DEMO_DURATION_SECONDS, formatDemoTime, getDemoSecondsAtPosition } from '@/utils/demo-playback';

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
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoSeconds, setDemoSeconds] = useState(0);
  const [signsOpen, setSignsOpen] = useState(false);
  const { landscape, opacity, transitioning, toggle } = useDemoLandscape();
  useBottomNavigationMenu(openMenu, menuOpen, landscape);
  useFocusEffect(useCallback(() => () => setDemoPlaying(false), []));

  // The supplied demonstration is a playback preview over placeholder footage.
  useEffect(() => {
    if (!demoPlaying || signsOpen || menuOpen) return;
    const timer = setTimeout(() => {
      const next = advanceDemoPlayback(demoSeconds);
      setDemoSeconds(next.seconds);
      setDemoPlaying(next.playing);
    }, 1000);
    return () => clearTimeout(timer);
  }, [demoPlaying, demoSeconds, menuOpen, signsOpen]);

  function handleBack() {
    setSignsOpen(false);
    setDemoPlaying(false);
    if (selectedSeverity) {
      setSelectedSeverity(null);
      setDemoSeconds(0);
    } else if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  function togglePlayback() {
    if (demoSeconds >= DEMO_DURATION_SECONDS) setDemoSeconds(0);
    setDemoPlaying(value => !value);
  }

  function seekDemo(seconds: number) {
    setDemoPlaying(false);
    setDemoSeconds(Math.max(0, Math.min(DEMO_DURATION_SECONDS, seconds)));
  }

  const selectedColor = severityLevels.find(level => level.label === selectedSeverity)?.color;
  if (landscape && selectedSeverity) return <View style={[s.landscapeScreen, {
    position: 'absolute', top: 0, bottom: 0, left: -insets.left, right: -insets.right,
  }]}>
    <StatusBar style="light" />
    <NavigationBar hidden />
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <Image source={require('../../assets/images/footage-placeholder.png')} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
      <View style={[s.landscapeTopRow, { top: insets.top + scaleSize(20), left: scaleSize(24), right: scaleSize(24) }]}>
        <View style={s.landscapeTitleRow}>
          <View style={[s.landscapeSeverityDot, { backgroundColor: selectedColor }]} />
          <Text style={s.landscapeSeverity}>{selectedSeverity} First-Aid Guidance</Text>
        </View>
        <GlowButton accessibilityRole="button" accessibilityLabel="Exit landscape footage"
          disabled={transitioning} onPress={() => { void toggle(); }} style={s.landscapeExitButton}>
          <View style={s.landscapeExitLineOne} /><View style={s.landscapeExitLineTwo} />
        </GlowButton>
      </View>
      <GlowButton accessibilityRole="button" accessibilityLabel={demoPlaying ? 'Pause demonstration' : 'Play demonstration'}
        accessibilityState={{ selected: demoPlaying }} onPress={togglePlayback} style={s.videoPlayButton}>
        {demoPlaying ? <View style={s.playerPauseGlyph}><View style={s.playerPauseBar} /><View style={s.playerPauseBar} /></View> : <View style={s.playerPlayGlyph} />}
      </GlowButton>
      <View style={[s.landscapePlayback, { bottom: insets.bottom + scaleSize(16), left: scaleSize(24), right: scaleSize(24) }]}>
        <DemoTimeline seconds={demoSeconds} onSeek={seekDemo} compact />
      </View>
    </Animated.View>
  </View>;

  const videoHeight = Math.min(scaleSize(210), Math.max(scaleSize(145), height * 0.3));
  const scrollSelectedPage = fontScale > 1.3
    || height - headerLayout.contentTop - navigationLayout.height < videoHeight + scaleSize(220);
  const demo = <View style={s.selectedFixedContent}>
    <View style={[s.demoVideo, { height: videoHeight }]}>
      <Image source={require('../../assets/images/footage-placeholder.png')} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={s.videoDim} />
      <GlowButton accessibilityRole="button" accessibilityLabel={demoPlaying ? 'Pause first aid demonstration' : 'Play first aid demonstration'}
        accessibilityState={{ selected: demoPlaying }} onPress={togglePlayback} style={s.videoPlayButton}>
        {demoPlaying ? <View style={s.playerPauseGlyph}><View style={s.playerPauseBar} /><View style={s.playerPauseBar} /></View> : <View style={s.playerPlayGlyph} />}
      </GlowButton>
      <GlowButton accessibilityRole="button" accessibilityLabel="View video in landscape"
        disabled={transitioning} onPress={() => { void toggle(); }} style={s.videoLandscapeButton}>
        <View style={s.fullscreenBadge}>
          <View style={[s.fullscreenCorner, s.fullscreenTopLeft]} /><View style={[s.fullscreenCorner, s.fullscreenTopRight]} />
          <View style={[s.fullscreenCorner, s.fullscreenBottomLeft]} /><View style={[s.fullscreenCorner, s.fullscreenBottomRight]} />
        </View>
      </GlowButton>
      <View style={s.portraitPlaybackBar}><DemoTimeline seconds={demoSeconds} onSeek={seekDemo} /></View>
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
    <StatusBar style="light" />
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
          onPress={() => { setSelectedSeverity(level.label); setDemoSeconds(0); setDemoPlaying(false); setSignsOpen(true); }}
          style={s.severityButton}>
          <View style={[s.severityDot, { backgroundColor: level.color }]} /><Text style={s.severityLabel}>{level.label}</Text>
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={scaleSize(17)} tintColor={C.white} />
        </GlowButton>)}
      </View>
    </ScrollView> : <View style={[s.selectedPage, { paddingTop: headerLayout.contentTop }]}>
      <View style={[s.heading, s.selectedHeading]}>
        <Text accessibilityRole="header" style={[s.title, s.selectedTitle]}>First-Aid Guidance</Text>
        <Text style={[s.subtitle, s.selectedSeverityLabel, { color: selectedColor }]}>{selectedSeverity}</Text>
      </View>
      {scrollSelectedPage ? <ScrollView key={selectedSeverity} style={s.selectedScroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: navigationLayout.scrollPadding }}>
        {demo}{steps}
      </ScrollView> : <>
        {demo}
        <ScrollView key={selectedSeverity} style={s.selectedScroll} showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: navigationLayout.scrollPadding }}>
          {steps}
        </ScrollView>
      </>}
    </View>}
    <FixedPageHeader onBack={handleBack} />
    <Modal visible={signsOpen && !!selectedSeverity} transparent animationType="fade" onRequestClose={() => setSignsOpen(false)}>
      <View style={[s.signsOverlay, {
        paddingTop: insets.top + scaleSize(16), paddingBottom: insets.bottom + scaleSize(16),
        paddingLeft: insets.left + scaleSize(24), paddingRight: insets.right + scaleSize(24),
      }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close signs" onPress={() => setSignsOpen(false)} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={s.signsCard}>
          <Image pointerEvents="none" source={require('../../assets/images/first-aid-signs-mascot.png')} contentFit="contain" transition={0} accessible={false} style={s.signsMascot} />
          <Text accessibilityRole="header" style={s.signsTitle}>Signs</Text>
          <ScrollView style={s.signsScroll} contentContainerStyle={s.signsList} showsVerticalScrollIndicator={false}>
            {selectedSeverity && guidanceBySeverity[selectedSeverity].signs.map(sign => <View key={sign} style={s.signRow}>
              <View style={s.signBullet} /><Text style={s.signsDetail}>{sign}</Text>
            </View>)}
          </ScrollView>
          <GlowButton accessibilityRole="button" onPress={() => setSignsOpen(false)} style={s.signsContinue}><Text style={s.signsContinueText}>Continue</Text></GlowButton>
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

function DemoTimeline({ seconds, onSeek, compact = false }: { seconds: number; onSeek: (seconds: number) => void; compact?: boolean }) {
  const { scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const [width, setWidth] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const progress = seconds / DEMO_DURATION_SECONDS * 100;
  return <View style={s.timeline}>
    <Text style={s.portraitTimestamp}>{formatDemoTime(seconds)}</Text>
    <View accessibilityRole="adjustable" accessibilityLabel="Demonstration playback position"
      accessibilityValue={{ min: 0, max: DEMO_DURATION_SECONDS, now: seconds }}
      accessibilityActions={[{ name: 'increment', label: 'Forward 10 seconds' }, { name: 'decrement', label: 'Back 10 seconds' }]}
      onAccessibilityAction={event => onSeek(Math.max(0, Math.min(DEMO_DURATION_SECONDS, seconds + (event.nativeEvent.actionName === 'increment' ? 10 : -10))))}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
      onResponderGrant={event => { setSeeking(true); onSeek(getDemoSecondsAtPosition(event.nativeEvent.locationX, width)); }}
      onResponderMove={event => onSeek(getDemoSecondsAtPosition(event.nativeEvent.locationX, width))}
      onResponderRelease={() => setSeeking(false)} onResponderTerminate={() => setSeeking(false)}
      style={[s.timelineTouch, { minHeight: compact ? scaleSize(26) : Math.max(44, scaleSize(44)) }]}>
      {seeking && <View pointerEvents="none" style={[s.seekTimeBubble, { left: `${Math.max(8, Math.min(92, progress))}%` }]}>
        <Text style={s.seekTimeText}>{formatDemoTime(seconds)}</Text>
      </View>}
      <View pointerEvents="none" style={s.timelineTrack}>
        <View style={[s.timelineProgress, { width: `${progress}%` }]} />
        <View style={[s.timelineThumb, { left: `${progress}%` }]} />
      </View>
    </View>
    <Text style={s.portraitTimestamp}>{formatDemoTime(DEMO_DURATION_SECONDS)}</Text>
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
  selectedPage: { flex: 1, paddingHorizontal: 24 },
  heading: { alignItems: 'center', marginTop: 8 },
  title: { color: C.white, fontFamily: F.extraBold, fontSize: T.title, lineHeight: 32, textAlign: 'center' },
  subtitle: { marginTop: 6, color: C.white, fontFamily: F.regular, fontSize: T.body, lineHeight: 21, textAlign: 'center' },
  selectedHeading: { marginTop: 19 },
  selectedTitle: { fontSize: T.title, lineHeight: 32 },
  selectedSeverityLabel: { marginTop: 5, fontFamily: F.semiBold, fontSize: 14, lineHeight: 18 },
  selectedFixedContent: { gap: 10, marginTop: 12, marginBottom: 12 },
  signsButton: { minWidth: 132, minHeight: 44, paddingVertical: 10, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, borderRadius: 24, backgroundColor: C.blue, boxShadow: '0 0 16px 4px rgba(106,215,244,.48), 0 0 26px rgba(148,176,213,.32)' },
  buttonPressed: { opacity: .82, transform: [{ scale: .96 }] },
  signsButtonText: { color: C.white, fontFamily: F.bold, fontSize: T.label },
  signsCard: { position: 'relative', overflow: 'hidden', width: '100%', maxWidth: 400, maxHeight: '100%', flexShrink: 1, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, borderRadius: 24, backgroundColor: C.blue, boxShadow: '0 10px 28px rgba(0,0,0,.48), 0 0 18px rgba(50,80,123,.28)' },
  signsMascot: { position: 'absolute', right: -4, bottom: -24, width: 200, height: 300, opacity: .22 },
  signsTitle: { color: C.white, fontFamily: F.bold, fontSize: T.section, lineHeight: 26, marginTop: 10, marginBottom: 10, textAlign: 'center' },
  signsList: { gap: 8, paddingVertical: 10 },
  signRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.5)', boxShadow: '0 2px 6px rgba(0,0,0,.24)' },
  signBullet: { width: 7, height: 7, marginTop: 6, borderRadius: 4, backgroundColor: C.white },
  signsDetail: { flex: 1, color: C.white, fontFamily: F.regular, fontSize: T.body, lineHeight: 21 },
  signsOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.52)' },
  signsContinue: { alignSelf: 'center', minWidth: 132, minHeight: 44, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingHorizontal: 20, borderRadius: 22, backgroundColor: '#9bbbe0', boxShadow: '0 4px 10px rgba(0,0,0,.32)' },
  signsContinueText: { color: C.blue, fontFamily: F.bold, fontSize: 14 },
  demoVideo: { height: 210, position: 'relative', overflow: 'hidden', borderRadius: 15, borderWidth: 1.5, borderColor: '#A9E8FF', backgroundColor: '#182C42', boxShadow: '0 0 24px rgba(106,215,244,.72), 0 0 42px rgba(106,215,244,.38), 0 6px 12px rgba(8,34,61,.22)' },
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
  guidanceSteps: { gap: 8 },
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
