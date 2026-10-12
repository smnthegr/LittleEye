import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlowButton } from '@/components/glow-button';
import { EdgeScrollView } from '@/components/edge-scroll-view';
import { useBottomNavigationMenu } from '@/components/bottom-navigation';
import { ProfileAvatar } from '@/components/profile-avatar';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { useFallAlert } from '@/components/fall-alert';
import { navigateWithTransition } from '@/components/navigation-transition';
import { getHomeNavigationLayout } from '@/utils/responsive';

export default function HomeScreen() {
  const { scaleSize, pageWidth } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [muted, setMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [previewOffset, setPreviewOffset] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(current => !current), []);
  const { showFallAlert } = useFallAlert();
  const [isLandscape, setIsLandscape] = useState(false);
  useBottomNavigationMenu(openMenu, menuOpen, isLandscape && width > height);
  const navigationLayout = getHomeNavigationLayout(pageWidth, insets.bottom);
  const contentFrameWidth = pageWidth - scaleSize(38);
  const compact = height < 720;
  const previewHeight = contentFrameWidth * .63;
  const contentTopOverlap = scaleSize(27);
  const headerHeight = insets.top + scaleSize(12 + 64 + 35);
  // The blue wave should reach below the Control Panel pill, not stop at the feed.
  const controlPanelHeight = scaleSize(10 + 12 + 11);
  const backgroundHeight = (headerHeight - contentTopOverlap + previewHeight + controlPanelHeight + scaleSize(124)) / .886;

  function setPreviewZoom(nextZoom: number) {
    const next = Math.max(1, Math.min(5, nextZoom));
    setZoom(next);
    const maxOffset = (next - 1) * 36;
    setPreviewOffset(current => ({
      x: Math.max(-maxOffset, Math.min(maxOffset, current.x)),
      y: Math.max(-maxOffset, Math.min(maxOffset, current.y)),
    }));
  }

  function movePreview(dx: number, dy: number) {
    const maxOffset = (zoom - 1) * 36;
    setPreviewOffset(current => ({
      x: Math.max(-maxOffset, Math.min(maxOffset, current.x + dx)),
      y: Math.max(-maxOffset, Math.min(maxOffset, current.y + dy)),
    }));
  }

  const previewTransform = [{ scale: zoom }, { translateX: previewOffset.x }, { translateY: previewOffset.y }];

  async function toggleLandscape() {
    if (isLandscape) {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } catch {
        // Keep the inline preview usable if the platform rejects the orientation lock.
      }
      setIsLandscape(false);
      return;
    }

    setIsLandscape(true);
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } catch {
      setIsLandscape(false);
    }
  }

  function goToFirstAid() {
    navigateWithTransition(() => router.push('/first-aid-guidance'));
  }

  const landscapeLayout = isLandscape && width > height;

  if (landscapeLayout) return <View style={s.landscapeScreen}>
    <StatusBar style="light" />
    <NavigationBar hidden />
    <Image source={require('../../assets/images/footage-placeholder.png')} contentFit="cover" transition={0} accessible={false} style={[StyleSheet.absoluteFill, { transform: previewTransform }]} />
    <View style={[s.landscapeTopRow, { top: insets.top + scaleSize(20), left: insets.left + scaleSize(28), right: insets.right + scaleSize(28) }]}>
      <View style={s.landscapeLiveBadge}><View style={s.landscapeLiveDot} /><Text style={s.landscapeLiveText}>LIVE</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Exit landscape camera preview" hitSlop={14} onPress={() => { void toggleLandscape(); }} style={s.landscapeExitButton}>
        <View style={s.landscapeExitLineOne} /><View style={s.landscapeExitLineTwo} />
      </Pressable>
    </View>
    <View style={[s.landscapeTimeRow, { bottom: insets.bottom + scaleSize(20), left: insets.left + scaleSize(28), right: insets.right + scaleSize(28) }]} pointerEvents="none">
      <View style={s.landscapeTimeBadge}><Text style={s.landscapeTime}>07:16:32</Text></View>
      <View style={s.landscapeTimeBadge}><Text style={s.landscapeTime}>29/12/2026</Text></View>
    </View>
  </View>;

  return <View style={s.screen}>
    <StatusBar style="light" />
    <NavigationBar hidden />
    <EdgeScrollView topColor={C.blue} bottomColor={C.white} showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: navigationLayout.scrollPadding }}>
      <View pointerEvents="none" style={[s.backdropShape, { height: backgroundHeight }]}>
        <Image source={require('../../assets/images/home-background.svg')} contentFit="fill" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
      </View>
      <View style={{ flex: 1, transform: [{ translateY: scaleSize(18) }] }}>
      <View style={[s.header, { paddingTop: insets.top + scaleSize(12), minHeight: compact ? scaleSize(111) : scaleSize(132) }]}>
        <View style={[s.headerInner, { width: contentFrameWidth }]}>
          <View style={s.titleRow}>
            <View>
              <Text accessibilityRole="header" style={s.brand}>Little<Text style={s.brandAccent}>Eye</Text></Text>
              <Text style={s.pageLabel}>Home</Text>
            </View>
            <GlowButton accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={s.avatarGlow}>
              <ProfileAvatar size={46} />
            </GlowButton>
          </View>
        </View>
      </View>

      <View style={[s.content, { width: contentFrameWidth, marginTop: -contentTopOverlap }]}>
        <View accessibilityLabel="Camera preview" style={[s.feed, { height: previewHeight }]}>
          <Image source={require('../../assets/images/footage-placeholder.png')} contentFit="cover" transition={0} accessible={false} style={[StyleSheet.absoluteFill, { transform: previewTransform }]} />
          <View pointerEvents="none" style={s.feedShade} />
          <View style={s.feedTop}><View style={s.live}><View style={s.liveDot} /><Text style={s.liveText}>LIVE</Text></View>
            <View style={s.feedActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Trigger fall detected alert" hitSlop={10} onPress={showFallAlert} style={s.alertTrigger}>
              <Text style={s.alertTriggerMark}>!</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="View camera preview in landscape" accessibilityState={{ selected: isLandscape }} hitSlop={12} onPress={() => { void toggleLandscape(); }} style={s.fullscreen}>
              <View style={s.fullscreenBadge}>
                <View style={[s.fullscreenCorner, s.fullscreenTopLeft]} /><View style={[s.fullscreenCorner, s.fullscreenTopRight]} />
                <View style={[s.fullscreenCorner, s.fullscreenBottomLeft]} /><View style={[s.fullscreenCorner, s.fullscreenBottomRight]} />
              </View>
            </Pressable>
            </View>
          </View>
          <View style={s.feedBottom} pointerEvents="none">
            <View style={s.feedMetaBadge}><Text style={s.feedMeta}>07:16:32</Text></View>
            <View style={s.feedMetaBadge}><Text style={s.feedMeta}>29/12/2026</Text></View>
          </View>
        </View>

        <GlowButton accessibilityRole="button" onPress={() => router.push('/settings')} style={s.panelButton}>
          <Text style={s.panelLabel}>Control Panel</Text>
        </GlowButton>

        <View style={[s.controls, compact && s.controlsCompact]}>
          <View style={s.soundColumn}>
            <GlowButton accessibilityRole="button" accessibilityLabel={muted ? 'Unmute camera audio' : 'Mute camera audio'} onPress={() => setMuted(value => !value)} style={s.soundButton}>
              <View style={s.speakerIconWrap}>
                <Image source={require('../../assets/images/speaker.svg')} contentFit="contain" transition={0} accessible={false} style={s.speakerIcon} />
                {muted && <View pointerEvents="none" style={s.speakerOffSlash} />}
              </View>
            </GlowButton>
            <GlowButton accessibilityRole="button" accessibilityLabel={recording ? 'Stop recording' : 'Start recording'} accessibilityState={{ selected: recording }} onPress={() => setRecording(value => !value)} style={s.recordButton}>
              <View style={s.recordRing}><View style={[s.recordIndicator, recording && s.recordIndicatorActive]} /></View>
            </GlowButton>
          </View>
          <View style={s.dpadOuter}>
            <Image pointerEvents="none" source={require('../../assets/images/home-dpad-glass.png')} contentFit="contain" transition={0} accessible={false} style={s.dpadGlass} />
            <GlowButton accessibilityRole="button" accessibilityLabel="Move camera preview up" onPress={() => movePreview(0, -12)} style={[s.direction, s.up]}><Image source={require('../../assets/images/direction-arrow.svg')} contentFit="contain" transition={0} accessible={false} style={[s.directionGlyph, s.arrowUp]} /></GlowButton>
            <GlowButton accessibilityRole="button" accessibilityLabel="Move camera preview left" onPress={() => movePreview(-12, 0)} style={[s.direction, s.left]}><Image source={require('../../assets/images/direction-arrow.svg')} contentFit="contain" transition={0} accessible={false} style={[s.directionGlyph, s.arrowLeft]} /></GlowButton>
            <GlowButton accessibilityRole="button" accessibilityLabel="Reset camera preview position and zoom" onPress={() => { setPreviewOffset({ x: 0, y: 0 }); setZoom(1); }} style={s.dpadCenter} />
            <GlowButton accessibilityRole="button" accessibilityLabel="Move camera preview right" onPress={() => movePreview(12, 0)} style={[s.direction, s.right]}><Image source={require('../../assets/images/direction-arrow.svg')} contentFit="contain" transition={0} accessible={false} style={[s.directionGlyph, s.arrowRight]} /></GlowButton>
            <GlowButton accessibilityRole="button" accessibilityLabel="Move camera preview down" onPress={() => movePreview(0, 12)} style={[s.direction, s.down]}><Image source={require('../../assets/images/direction-arrow.svg')} contentFit="contain" transition={0} accessible={false} style={[s.directionGlyph, s.arrowDown]} /></GlowButton>
          </View>
          <View style={s.zoomColumn}><Text style={s.zoomCaption}>Zoom In</Text>
            <View style={s.zoomPill}>
              <GlowButton accessibilityRole="button" accessibilityLabel={`Zoom in (level ${zoom}x)`} onPress={() => setPreviewZoom(zoom + 1)} style={s.zoomButton}>
                <View pointerEvents="none" accessible={false} style={s.zoomIcon}><View style={s.zoomLine} /><View style={[s.zoomLine, s.zoomVertical]} /></View>
              </GlowButton>
              <GlowButton accessibilityRole="button" accessibilityLabel={`Zoom out (level ${zoom}x)`} onPress={() => setPreviewZoom(zoom - 1)} style={s.zoomButton}>
                <View pointerEvents="none" accessible={false} style={s.zoomIcon}><View style={s.zoomLine} /></View>
              </GlowButton>
            </View>
            <Text style={s.zoomCaption}>Zoom Out</Text>
          </View>
        </View>

      </View>
      </View>
    </EdgeScrollView>
    <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
      <View style={s.menuModal}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setMenuOpen(false)} style={StyleSheet.absoluteFill} />
        <View style={[s.menuSheet, { paddingBottom: Math.max(insets.bottom, 18) + scaleSize(36) }]}>
          <Image pointerEvents="none" source={require('../../assets/images/menu-mascot.png')} contentFit="contain" transition={0} accessible={false} style={s.menuMascot} />
          <View style={s.menuHandle} />
          <View style={s.menuOptions}>
            <MenuOption icon="profile" label="Profile" onPress={() => { setMenuOpen(false); router.push('/profile'); }} />
            <MenuOption icon="hotline" label="Emergency Hotline" onPress={() => { setMenuOpen(false); router.push('/emergency-hotline'); }} />
            <MenuOption icon="firstAid" label="First-aid Guidance" onPress={() => { setMenuOpen(false); goToFirstAid(); }} />
            <MenuOption icon="history" label="History" onPress={() => { setMenuOpen(false); router.push('/history'); }} />
            <MenuOption icon="settings" label="Settings" onPress={() => { setMenuOpen(false); router.push('/settings'); }} />
          </View>
        </View>
      </View>
    </Modal>
  </View>;
}

const menuIcons = {
  profile: { ios: 'person.fill', android: 'person', web: 'person' },
  hotline: { ios: 'phone.fill', android: 'call', web: 'call' },
  firstAid: { ios: 'cross.case.fill', android: 'medical_services', web: 'medical_services' },
  history: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
} satisfies Record<string, SymbolViewProps['name']>;

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
  screen: { flex: 1, backgroundColor: C.white },
  landscapeScreen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#000', overflow: 'hidden' },
  menuModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.32)' },
  menuSheet: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: 30, paddingHorizontal: 30, backgroundColor: C.white, borderTopLeftRadius: 64, borderTopRightRadius: 64, overflow: 'hidden' },
  menuMascot: { position: 'absolute', width: 700, height: 394, top: 8, right: -296 },
  menuHandle: { alignSelf: 'center', width: 37, height: 3, borderRadius: 2, backgroundColor: '#A5B8D1', marginBottom: 23, transform: [{ translateY: -10 }] },
  menuOptions: { gap: 15, paddingBottom: 4 },
  menuOption: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.55)', borderWidth: 1, borderColor: 'rgba(148,176,213,.62)', boxShadow: '0 5px 14px rgba(98,142,204,.18)' },
  menuOptionIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue },
  menuOptionLabel: { flex: 1, color: '#172333', fontFamily: F.regular, fontSize: 13 },
  header: { zIndex: 1, backgroundColor: 'transparent', overflow: 'visible', paddingBottom: 35 },
  backdropShape: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 },
  headerInner: { alignSelf: 'center' }, titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: C.white, fontFamily: F.extraBold, fontSize: 32.9, letterSpacing: -.8 }, brandAccent: { color: C.lightBlue }, pageLabel: { color: C.white, fontFamily: F.semiBold, fontSize: 14.4, marginTop: 9 },
  avatarGlow: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(148,176,213,.22)', borderWidth: 1, borderColor: 'rgba(148,176,213,.45)', alignItems: 'center', justifyContent: 'center' },
  content: { zIndex: 1, alignSelf: 'center', flex: 1, paddingBottom: 4 },
  feed: { width: '100%', borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(148,176,213,.88)', backgroundColor: C.blue, boxShadow: '0 0 26px 9px rgba(92,225,230,.7), 0 8px 20px rgba(50,80,123,.28)' },
  feedShade: { ...StyleSheet.absoluteFill, opacity: 0, backgroundColor: 'rgba(13,30,46,.18)' },
  feedTop: { position: 'absolute', top: 8, left: 9, right: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  alertTrigger: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(255,48,58,.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,.8)', boxShadow: '0 0 12px 3px rgba(255,48,58,.65)' },
  alertTriggerMark: { color: C.white, fontFamily: F.extraBold, fontSize: 21, lineHeight: 25 },
  live: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: 'rgba(0,0,0,.55)', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 12 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00FF00' }, liveText: { color: C.white, fontFamily: F.bold, fontSize: 8 },
  fullscreen: { width: 34, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.21)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' },
  fullscreenBadge: { width: 18, height: 18, position: 'relative' },
  fullscreenCorner: { position: 'absolute', width: 6, height: 6, borderColor: C.white },
  fullscreenTopLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 }, fullscreenTopRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  fullscreenBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 }, fullscreenBottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  feedBottom: { position: 'absolute', bottom: 7, left: 9, right: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedMetaBadge: { minHeight: 18, justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 9, backgroundColor: 'rgba(0,0,0,.21)' },
  feedMeta: { color: C.white, fontFamily: 'VT323_400Regular', fontSize: 12, lineHeight: 14, letterSpacing: .5 },
  landscapeTopRow: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 },
  landscapeLiveBadge: { minWidth: 84, minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: 7, backgroundColor: 'rgba(0,0,0,.21)', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)' },
  landscapeLiveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#00FF00' }, landscapeLiveText: { color: C.white, fontFamily: F.bold, fontSize: 16 },
  landscapeExitButton: { width: 44, height: 44, position: 'relative', alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(0,0,0,.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,.35)' },
  landscapeExitLineOne: { position: 'absolute', width: 23, height: 3, borderRadius: 2, backgroundColor: C.white, transform: [{ rotate: '45deg' }] }, landscapeExitLineTwo: { position: 'absolute', width: 23, height: 3, borderRadius: 2, backgroundColor: C.white, transform: [{ rotate: '-45deg' }] },
  landscapeTimeRow: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  landscapeTimeBadge: { minHeight: 30, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(0,0,0,.21)' },
  landscapeTime: { color: C.white, fontFamily: 'VT323_400Regular', fontSize: 19, lineHeight: 23, letterSpacing: 1 },
  panelButton: { alignSelf: 'center', position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(147,180,220,.42)', borderColor: 'rgba(255,255,255,.82)', borderWidth: 2, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 6, marginTop: 16, boxShadow: '0 4px 22px rgba(147,180,220,.66), inset 0 1px 4px rgba(255,255,255,.45)' },
  panelLabel: { color: C.white, fontFamily: F.bold, fontSize: 11, textShadowColor: 'rgba(50,80,123,.48)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  controls: { position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingHorizontal: 1, minHeight: 350, transform: [{ translateY: -58 }] }, controlsCompact: { minHeight: 350, marginTop: 20 },
  soundColumn: { position: 'absolute', left: 0, top: '50%', transform: [{ translateY: -55 }], alignItems: 'center', gap: 10 },
  soundButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 14px rgba(50,80,123,.3), inset 0 2px 4px rgba(255,255,255,.16)' }, speakerIconWrap: { width: 33, height: 33, alignItems: 'center', justifyContent: 'center' }, speakerIcon: { width: 33, height: 33 }, speakerOffSlash: { position: 'absolute', width: 36, height: 4, borderRadius: 2, backgroundColor: C.white, borderWidth: 1, borderColor: C.blue, transform: [{ rotate: '-45deg' }] },
  recordButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 14px rgba(50,80,123,.3), inset 0 2px 4px rgba(255,255,255,.16)' }, recordRing: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, borderColor: C.white, alignItems: 'center', justifyContent: 'center' }, recordIndicator: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.white }, recordIndicatorActive: { backgroundColor: '#F36B7D' },
  dpadOuter: { position: 'absolute', left: '50%', top: '50%', marginLeft: -105, marginTop: -105, width: 210, height: 210, borderRadius: 105, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  dpadGlass: { position: 'absolute', width: 346, height: 346, top: -68, left: -68 },
  direction: { position: 'absolute', width: 70, height: 70, borderRadius: 36, backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.9)', boxShadow: '0 4px 9px rgba(50,80,123,.12), inset 0 2px 5px rgba(255,255,255,.9)' }, up: { top: 0 }, down: { bottom: 0 }, left: { left: 0 }, right: { right: 0 }, directionGlyph: { width: 50, height: 50 }, arrowUp: { marginTop: -6, transform: [{ rotate: '90deg' }] }, arrowLeft: { marginLeft: -6 }, arrowRight: { marginLeft: 6, transform: [{ rotate: '180deg' }] }, arrowDown: { marginTop: 6, transform: [{ rotate: '270deg' }] }, dpadCenter: { width: 54, height: 54, borderRadius: 27, backgroundColor: C.lightBlue, borderWidth: 1, borderColor: 'rgba(255,255,255,.65)', boxShadow: '0 5px 10px rgba(50,80,123,.25), inset 0 2px 5px rgba(255,255,255,.45)' },
  zoomColumn: { position: 'absolute', right: 0, top: '50%', transform: [{ translateY: -77 }], width: 60, alignItems: 'center', gap: 4 }, zoomCaption: { color: C.blue, fontFamily: F.semiBold, fontSize: 9 }, zoomPill: { width: 60, alignItems: 'center', gap: 10, paddingVertical: 8, borderRadius: 30, backgroundColor: 'rgba(148,176,213,.38)', boxShadow: '0 8px 20px rgba(50,80,123,.28), 0 0 14px rgba(148,176,213,.28), inset 0 2px 5px rgba(255,255,255,.65)' }, zoomButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 9px rgba(50,80,123,.2)' },
  zoomIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  zoomLine: { position: 'absolute', width: 24, height: 3, borderRadius: 1.5, backgroundColor: C.white },
  zoomVertical: { width: 3, height: 24 },
});
