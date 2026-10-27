import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useCallback, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { Alert, Animated, Pressable, StyleSheet, Text, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { MenuSheet, MenuSheetMascot } from '@/components/menu-sheet';
import { useVideoFullscreen } from '@/hooks/use-video-fullscreen';
import { VideoFullscreen } from '@/components/video-fullscreen';
import { FootageVideo } from '@/components/footage-video';
import { VideoEmptyState } from '@/components/video-empty-state';
import { useFootageVideo } from '@/hooks/use-footage-video';
import { useLiveTimestamp } from '@/hooks/use-live-timestamp';
import { useVideoOverlayControls } from '@/hooks/use-video-overlay-controls';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlowButton } from '@/components/glow-button';
import { CameraDirectionPad } from '@/components/camera-direction-pad';
import { HomeAmbientBackground, HomeAmbientColors, HomeControlsAmbient } from '@/components/home-ambient-background';
import { ZoomButtonArtwork, ZoomPillArtwork } from '@/components/zoom-control-artwork';
import { PlaybackTimeline } from '@/components/playback-timeline';
import { VideoCloseButton, VideoOverlayButton, VideoStatusBadge, VideoTimelineButton } from '@/components/video-overlay-controls';
import { EdgeScrollView } from '@/components/edge-scroll-view';
import { useBottomNavigationMenu } from '@/components/bottom-navigation';
import { FixedPageHeader } from '@/components/fixed-page-header';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { navigateWithTransition } from '@/components/navigation-transition';
import { getHomeNavigationLayout, getPageHeaderLayout } from '@/utils/responsive';
import { clampPlaybackSeconds, formatPlaybackTime } from '@/utils/playback-timeline';

export default function HomeScreen() {
  const { scaleSize, pageWidth, fontScale } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // The camera adapter will supply a real source when available.
  const video = useFootageVideo({ source: null, autoPlay: true, publishTime: false });
  const liveTimestamp = useLiveTimestamp(video.available);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [liveSeeking, setLiveSeeking] = useState(false);
  const [rewind, setRewind] = useState<{ date: string; offset: number } | null>(null);
  const [liveHours, liveMinutes, liveSeconds] = liveTimestamp.time.split(':').map(Number);
  const liveEdge = liveHours * 3600 + liveMinutes * 60 + liveSeconds;
  const rewindOffset = rewind?.date === liveTimestamp.date ? rewind.offset : 0;
  const viewingLive = rewindOffset === 0;
  const livePosition = viewingLive ? liveEdge : video.seconds;
  const { muted } = video;
  const [zoom, setZoom] = useState(1);
  const [previewOffset, setPreviewOffset] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(current => !current), []);
  const fullscreen = useVideoFullscreen();
  const { visible: isFullscreen, transitioning, toggle: toggleFullscreen } = fullscreen;
  const liveOverlays = useVideoOverlayControls();
  useBottomNavigationMenu(openMenu, menuOpen, isFullscreen);
  const navigationLayout = getHomeNavigationLayout(pageWidth, insets.bottom, fontScale);
  const headerLayout = getPageHeaderLayout(pageWidth, insets.top);
  const contentFrameWidth = pageWidth - scaleSize(48);
  const sideControlSize = Math.max(44, scaleSize(50));
  const sideControlDimensions = { width: sideControlSize, height: sideControlSize };
  const zoomPillWidth = scaleSize(60);
  const zoomPillPadding = (zoomPillWidth - sideControlSize) / 2;
  const zoomPillGap = scaleSize(10);
  const zoomPillHeight = sideControlSize * 2 + zoomPillGap + zoomPillPadding * 2;
  const compact = height < 720;
  const previewWidth = pageWidth - scaleSize(32);
  const previewHeight = previewWidth * .74;
  const contentTopOverlap = scaleSize(27);
  const headerHeight = headerLayout.top + scaleSize(44 + 10 + 26) * Math.max(1, fontScale) + scaleSize(35);
  const [ambientCanvasHeight, setAmbientCanvasHeight] = useState(height);
  const [ambientControls, setAmbientControls] = useState<{ centerY: number; height: number } | null>(null);
  const contentTop = headerHeight - contentTopOverlap;
  // Keep the original blue curve reaching below the Control Panel.
  const transitionHeight = (contentTop + previewHeight + Math.max(44, scaleSize(48)) + scaleSize(12 + 124)) / 0.886;
  const measureAmbientCanvas = useCallback((_width: number, nextHeight: number) => {
    setAmbientCanvasHeight(nextHeight);
  }, []);
  const measureAmbientControls = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    // onLayout reports the untransformed frame; follow the existing visual offset.
    const next = { centerY: layout.y + layout.height / 2 - scaleSize(66), height: layout.height };
    setAmbientControls(current => current?.centerY === next.centerY && current.height === next.height ? current : next);
  }, [scaleSize]);

  async function toggleLiveFullscreen() {
    if (transitioning) return;
    liveOverlays.show();
    if (isFullscreen) { goLive(); setLiveSeeking(false); }
    await toggleFullscreen();
  }

  function seekLiveTimeline(seconds: number) {
    if (!video.available) return;
    const target = Math.min(liveEdge, clampPlaybackSeconds(seconds));
    video.seek(target, { pause: false });
    setRewind(target === liveEdge ? null : { date: liveTimestamp.date, offset: liveEdge - target });
  }

  function goLive() {
    if (!video.available) return;
    setRewind(null);
    video.seek(liveEdge, { pause: false });
    video.play();
  }

  function scrubLiveTimeline(scrubbing: boolean) {
    if (!video.available) return;
    setLiveSeeking(scrubbing);
    if (scrubbing) video.pause();
    else video.play();
  }

  function toggleLiveTimeline() {
    liveOverlays.show();
    if (!isFullscreen) {
      setTimelineVisible(true);
      void toggleLiveFullscreen();
    } else { setLiveSeeking(false); setTimelineVisible(value => !value); }
  }

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
    // Move the image opposite the viewing direction to reveal that side of the scene.
    setPreviewOffset(current => ({
      x: Math.max(-maxOffset, Math.min(maxOffset, current.x - dx)),
      y: Math.max(-maxOffset, Math.min(maxOffset, current.y - dy)),
    }));
  }

  const previewStyle = useMemo(() => ({
    transform: [{ scale: zoom }, { translateX: previewOffset.x }, { translateY: previewOffset.y }],
  }), [previewOffset.x, previewOffset.y, zoom]);

  function goToFirstAid() {
    navigateWithTransition(() => router.push('/first-aid-guidance'));
  }

  return <View style={s.screen}>
    <StatusBar style="light" hidden={isFullscreen} />
    <NavigationBar hidden />
    <EdgeScrollView topColor={HomeAmbientColors.top} bottomColor={HomeAmbientColors.bottom} showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
      onContentSizeChange={measureAmbientCanvas}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: navigationLayout.scrollPadding }}>
      <HomeAmbientBackground canvasHeight={ambientCanvasHeight} feedBottom={contentTop + previewHeight}
        transitionHeight={transitionHeight}
        controlsCenter={contentTop + (ambientControls?.centerY ?? previewHeight + scaleSize(189))}
        controlsHeight={ambientControls?.height ?? scaleSize(350)} />
      <View style={{ flex: 1 }}>
      <View style={[s.header, { paddingTop: headerLayout.top, minHeight: headerHeight }]}>
        <View style={[s.headerInner, { width: contentFrameWidth }]}>
          <View style={[s.titleRow, { paddingRight: headerLayout.buttonSize + scaleSize(12) }]}>
            <View style={{ flex: 1 }}>
              <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit style={s.brand}>Little<Text style={s.brandAccent}>Eye</Text></Text>
              <Text style={s.pageLabel}>Home</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[s.content, { width: contentFrameWidth, marginTop: -contentTopOverlap }]}>
        <View accessibilityLabel="Camera preview" style={[s.feed, { width: previewWidth, height: previewHeight }]}>
          {video.available && !isFullscreen ? <FootageVideo player={video.player} style={previewStyle} /> : <VideoEmptyState />}
          {video.error && <Text accessibilityRole="alert" style={s.videoError}>Video could not load. Reopen this page to retry.</Text>}
          <View pointerEvents="none" style={s.feedShade} />
          <Pressable accessibilityRole="button" accessibilityLabel={liveOverlays.visible ? 'Hide live camera overlays' : 'Show live camera overlays'}
            accessibilityState={{ expanded: liveOverlays.visible }} onPress={liveSeeking ? undefined : liveOverlays.toggle} style={StyleSheet.absoluteFill} />
          <View pointerEvents={liveOverlays.visible ? 'box-none' : 'none'} accessibilityElementsHidden={!liveOverlays.visible}
            importantForAccessibility={liveOverlays.visible ? 'auto' : 'no-hide-descendants'}
            style={[StyleSheet.absoluteFill, liveOverlays.hidden && s.hiddenOverlays]}>
          <Animated.View pointerEvents="box-none" style={[s.feedTop, { opacity: liveOverlays.progress, transform: [{ translateY: liveOverlays.motion.top }] }]}>
            <View pointerEvents="box-none" style={s.statusStack}>
              <VideoStatusBadge label={video.available ? "LIVE" : "Offline"} active={video.available && liveOverlays.visible && !isFullscreen} />
            </View>
            <View pointerEvents="box-none" style={s.feedActions}>
            <VideoTimelineButton label="live playback" expanded={false} onPress={toggleLiveTimeline} />
            <VideoOverlayButton accessibilityLabel="View camera preview fullscreen" accessibilityState={{ selected: isFullscreen, disabled: transitioning }} disabled={transitioning} onPress={() => { void toggleLiveFullscreen(); }}>
              <View style={s.fullscreenBadge}>
                <View style={[s.fullscreenCorner, s.fullscreenTopLeft]} /><View style={[s.fullscreenCorner, s.fullscreenTopRight]} />
                <View style={[s.fullscreenCorner, s.fullscreenBottomLeft]} /><View style={[s.fullscreenCorner, s.fullscreenBottomRight]} />
              </View>
            </VideoOverlayButton>
            </View>
          </Animated.View>
          {video.available && <Animated.View style={[s.feedBottom, { opacity: liveOverlays.progress, transform: [{ translateY: liveOverlays.motion.bottom }] }]} pointerEvents="none">
            <View style={s.feedMetaBadge}><Text style={s.feedMeta}>{liveTimestamp.time}</Text></View>
            <View style={s.feedMetaBadge}><Text style={s.feedMeta}>{liveTimestamp.date}</Text></View>
          </Animated.View>}
          </View>
        </View>

        <GlowButton accessibilityRole="button" onPress={() => router.push('/settings')} style={s.panelButton}>
          <Text style={s.panelLabel}>Control Panel</Text>
        </GlowButton>


        <View onLayout={measureAmbientControls} style={[s.controls, compact && s.controlsCompact, {
          width: pageWidth - scaleSize(24),
          minHeight: scaleSize(350 + Math.max(0, fontScale - 1) * 72),
        }]}>
          <HomeControlsAmbient />
          <View pointerEvents="box-none" style={s.soundColumn}>
            <GlowButton accessibilityRole="button" accessibilityLabel={muted ? 'Unmute camera audio' : 'Mute camera audio'} onPress={video.toggleMuted} style={[s.soundButton, sideControlDimensions]}>
              <View style={s.speakerIconWrap}>
                <Image source={require('../../assets/images/speaker.svg')} contentFit="contain" transition={0} accessible={false} style={s.speakerIcon} />
                {muted && <View pointerEvents="none" style={s.speakerOffSlash} />}
              </View>
            </GlowButton>
            <GlowButton accessibilityRole="button" accessibilityLabel="Start recording"
              onPress={() => Alert.alert('Recording unavailable', 'Camera recording is not available yet.')}
              style={[s.recordButton, sideControlDimensions]}>
              <View style={s.recordRing}><View style={s.recordIndicator} /></View>
            </GlowButton>
          </View>
          <CameraDirectionPad onMove={movePreview}
            disabled={menuOpen || isFullscreen} />
          <View pointerEvents="box-none" style={s.zoomColumn}><Text numberOfLines={1} adjustsFontSizeToFit style={s.zoomCaption}>Zoom In</Text>
            <View style={[s.zoomPill, { width: zoomPillWidth, height: zoomPillHeight }]}>
              <ZoomPillArtwork width={zoomPillWidth} height={zoomPillHeight} />
              <GlowButton accessibilityRole="button" accessibilityLabel={`Zoom in (level ${zoom}x)`} onPress={() => setPreviewZoom(zoom + 1)} background={<ZoomButtonArtwork size={sideControlSize} />} style={[s.zoomButton, sideControlDimensions, { left: zoomPillPadding, top: zoomPillPadding }]}>
                <View pointerEvents="none" accessible={false} style={s.zoomIcon}><View style={s.zoomLine} /><View style={[s.zoomLine, s.zoomVertical]} /></View>
              </GlowButton>
              <GlowButton accessibilityRole="button" accessibilityLabel={`Zoom out (level ${zoom}x)`} onPress={() => setPreviewZoom(zoom - 1)} background={<ZoomButtonArtwork size={sideControlSize} />} style={[s.zoomButton, sideControlDimensions, { left: zoomPillPadding, top: zoomPillPadding + sideControlSize + zoomPillGap }]}>
                <View pointerEvents="none" accessible={false} style={s.zoomIcon}><View style={s.zoomLine} /></View>
              </GlowButton>
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={s.zoomCaption}>Zoom Out</Text>
          </View>
        </View>

      </View>
      </View>
    </EdgeScrollView>
    <FixedPageHeader />
    <MenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} artwork={<MenuSheetMascot />}
      sheetStyle={[s.menuSheet, { paddingBottom: Math.max(insets.bottom, 18) + scaleSize(36) }]}>
          <View style={s.menuOptions}>
            <MenuOption icon="profile" label="Profile" onPress={() => { setMenuOpen(false); router.push('/profile'); }} />
            <MenuOption icon="hotline" label="Emergency Hotline" onPress={() => { setMenuOpen(false); router.push('/emergency-hotline'); }} />
            <MenuOption icon="firstAid" label="First-aid Guidance" onPress={() => { setMenuOpen(false); goToFirstAid(); }} />
            <MenuOption icon="history" label="History" onPress={() => { setMenuOpen(false); router.push('/history'); }} />
            <MenuOption icon="settings" label="Settings" onPress={() => { setMenuOpen(false); router.push('/settings'); }} />
          </View>
    </MenuSheet>
    <VideoFullscreen controller={fullscreen} onClose={() => { void toggleLiveFullscreen(); }}
      footage={video.available && isFullscreen ? <FootageVideo player={video.player} style={previewStyle} /> : <VideoEmptyState />}>
      {fullscreenInsets => <View style={s.landscapeScreen}>
        <Pressable accessibilityRole="button" accessibilityLabel={liveOverlays.visible ? 'Hide live camera overlays' : 'Show live camera overlays'}
          accessibilityState={{ expanded: liveOverlays.visible }} onPress={liveSeeking ? undefined : liveOverlays.toggle} style={StyleSheet.absoluteFill} />
        <View pointerEvents={liveOverlays.visible ? 'box-none' : 'none'} accessibilityElementsHidden={!liveOverlays.visible}
          importantForAccessibility={liveOverlays.visible ? 'auto' : 'no-hide-descendants'}
          style={[StyleSheet.absoluteFill, liveOverlays.hidden && s.hiddenOverlays]}>
        <Animated.View pointerEvents="box-none" style={[s.landscapeTopRow, {
          top: fullscreenInsets.top + scaleSize(20), left: fullscreenInsets.left + scaleSize(8), right: fullscreenInsets.right + scaleSize(8),
          opacity: liveOverlays.progress, transform: [{ translateY: liveOverlays.motion.top }],
        }]}>
          <View pointerEvents="box-none" style={s.statusStack}>
          <VideoStatusBadge label={!video.available ? 'Offline' : viewingLive ? 'LIVE' : 'Recorded'}
            active={video.available && isFullscreen && liveOverlays.visible && (viewingLive || !liveSeeking)}
            onPress={!video.available || viewingLive ? undefined : goLive} hint={!video.available || viewingLive ? undefined : 'Go live'} />
          </View>
          <View pointerEvents="box-none" style={s.feedActions}>
          <VideoTimelineButton label="live playback" expanded={timelineVisible} onPress={toggleLiveTimeline} />
          <VideoCloseButton accessibilityLabel="Exit fullscreen camera preview" accessibilityState={{ disabled: transitioning }}
            disabled={transitioning} onPress={() => { void toggleLiveFullscreen(); }} />
          </View>
        </Animated.View>
        {video.available && <Animated.View style={[s.landscapeTimeRow, {
          bottom: fullscreenInsets.bottom + scaleSize(4), left: fullscreenInsets.left + scaleSize(8), right: fullscreenInsets.right + scaleSize(8),
          opacity: liveOverlays.progress, transform: [{ translateY: liveOverlays.motion.bottom }],
        }, timelineVisible && s.hiddenOverlays]} pointerEvents="none">
          <View style={s.landscapeTimeBadge}><Text style={s.landscapeTime}>{formatPlaybackTime(livePosition)}</Text></View>
          <View style={s.landscapeTimeBadge}><Text style={s.landscapeTime}>{liveTimestamp.date}</Text></View>
        </Animated.View>}
        {video.available && <Animated.View pointerEvents="box-none" style={[s.liveTimelinePanel, {
          bottom: Math.max(fullscreenInsets.bottom, 6), left: fullscreenInsets.left + 8, right: fullscreenInsets.right + 8,
          opacity: liveOverlays.progress, transform: [{ translateY: liveOverlays.motion.bottom }],
        }, !timelineVisible && s.hiddenOverlays]}>
          <PlaybackTimeline seconds={livePosition} availableUntil={liveEdge} onSeek={seekLiveTimeline}
            onScrubChange={scrubLiveTimeline} recordingDate={liveTimestamp.date} compact />
        </Animated.View>}
        </View>
      </View>}
    </VideoFullscreen>
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
  screen: { flex: 1, backgroundColor: HomeAmbientColors.bottom },
  statusStack: { flexShrink: 1, minWidth: 0, alignItems: 'flex-start', gap: 6 },
  videoError: { position: 'absolute', left: 12, right: 12, top: '45%', color: C.white, fontFamily: F.semiBold, fontSize: 12, textAlign: 'center', backgroundColor: 'rgba(0,0,0,.7)', padding: 12, borderRadius: 8 },
  hiddenOverlays: { display: 'none' },
  landscapeScreen: { flex: 1, overflow: 'hidden' },
  menuSheet: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: C.white, borderTopLeftRadius: 64, borderTopRightRadius: 64, overflow: 'hidden' },
  menuOptions: { gap: 15, paddingBottom: 4 },
  menuOption: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 20, paddingRight: 12, paddingVertical: 8, borderRadius: 30, backgroundColor: 'rgba(255,255,255,.55)', borderWidth: 1, borderColor: 'rgba(148,176,213,.62)', boxShadow: '0 4px 12px rgba(98,142,204,.18)' },
  menuOptionIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue },
  menuOptionLabel: { flex: 1, color: '#172333', fontFamily: F.semiBold, fontSize: T.label },
  header: { zIndex: 1, backgroundColor: 'transparent', overflow: 'visible', paddingBottom: 35 },
  headerInner: { alignSelf: 'center' }, titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: C.white, fontFamily: F.extraBold, fontSize: 36, lineHeight: 44, letterSpacing: -.8 }, brandAccent: { color: C.lightBlue }, pageLabel: { color: C.white, fontFamily: F.semiBold, fontSize: T.section, lineHeight: 26, marginTop: 10 },
  content: { zIndex: 1, alignSelf: 'center', flex: 1, paddingBottom: 4 },
  feed: { alignSelf: 'center', borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(148,176,213,.88)', backgroundColor: C.blue, boxShadow: '0 0 18px 3px rgba(112,169,222,.18), 0 8px 20px rgba(24,50,80,.2)' },
  feedShade: { ...StyleSheet.absoluteFill, opacity: 0, backgroundColor: 'rgba(13,30,46,.18)' },
  feedTop: { position: 'absolute', top: 6, left: 6, right: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedActions: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7 },
  liveTimelinePanel: { position: 'absolute', zIndex: 2 },
  fullscreenBadge: { width: 18, height: 18, position: 'relative' },
  fullscreenCorner: { position: 'absolute', width: 6, height: 6, borderColor: C.white },
  fullscreenTopLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 }, fullscreenTopRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  fullscreenBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 }, fullscreenBottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  feedBottom: { position: 'absolute', bottom: 5, left: 6, right: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedMetaBadge: { minHeight: 18, justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 9, backgroundColor: 'rgba(0,0,0,.14)' },
  feedMeta: { color: C.white, fontFamily: 'VT323_400Regular', fontSize: 12, lineHeight: 14, letterSpacing: .5 },
  landscapeTopRow: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  landscapeTimeRow: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  landscapeTimeBadge: { minHeight: 30, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(0,0,0,.14)' },
  landscapeTime: { color: C.white, fontFamily: 'VT323_400Regular', fontSize: 18, lineHeight: 23, letterSpacing: 1 },
  panelButton: { alignSelf: 'center', position: 'relative', top: 6, minHeight: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'rgba(147,180,220,.42)', borderColor: 'rgba(255,255,255,.82)', borderWidth: 2, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, marginTop: 12, boxShadow: '0 4px 18px rgba(147,180,220,.28), inset 0 1px 4px rgba(255,255,255,.3)' },
  panelLabel: { color: C.white, fontFamily: F.bold, fontSize: T.label, textShadowColor: 'rgba(50,80,123,.48)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  controls: { position: 'relative', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingHorizontal: 1, minHeight: 350, transform: [{ translateY: -66 }] }, controlsCompact: { minHeight: 350, marginTop: 20 },
  soundColumn: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, alignItems: 'center', justifyContent: 'center', gap: 10 },
  soundButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 14px rgba(50,80,123,.3), inset 0 2px 4px rgba(255,255,255,.16)' }, speakerIconWrap: { width: 33, height: 33, alignItems: 'center', justifyContent: 'center' }, speakerIcon: { width: 33, height: 33 }, speakerOffSlash: { position: 'absolute', width: 36, height: 4, borderRadius: 2, backgroundColor: C.white, borderWidth: 1, borderColor: C.blue, transform: [{ rotate: '-45deg' }] },
  recordButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 14px rgba(50,80,123,.3), inset 0 2px 4px rgba(255,255,255,.16)' }, recordRing: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, borderColor: C.white, alignItems: 'center', justifyContent: 'center' }, recordIndicator: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.white }, recordIndicatorActive: { backgroundColor: '#F36B7D' },
  zoomColumn: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, alignItems: 'center', justifyContent: 'center', gap: 4 }, zoomCaption: { color: C.white, fontFamily: F.semiBold, fontSize: 10, lineHeight: 18, width: '100%', textAlign: 'center' }, zoomPill: { borderRadius: 30, backgroundColor: 'transparent', boxShadow: '0 5px 14px rgba(27,55,88,.22)' }, zoomButton: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  zoomIcon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  zoomLine: { position: 'absolute', width: 22, height: 3, borderRadius: 1.5, backgroundColor: C.white, boxShadow: '0 0 1.5px 0.5px rgba(255,255,255,.3)' },
  zoomVertical: { width: 3, height: 22 },
});
