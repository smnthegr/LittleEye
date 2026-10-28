import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FixedPageHeader } from '@/components/fixed-page-header';
import { useAppSession } from '@/components/app-session';
import { EdgeScrollView } from '@/components/edge-scroll-view';
import { GlowButton } from '@/components/glow-button';
import { PlaybackTimeline } from '@/components/playback-timeline';
import { VideoBadge, VideoCloseButton, VideoOverlayButton, VideoTimelineButton } from '@/components/video-overlay-controls';
import { VideoFullscreen } from '@/components/video-fullscreen';
import { useVideoFullscreen } from '@/hooks/use-video-fullscreen';
import { FootageVideo } from '@/components/footage-video';
import { VideoEmptyState } from '@/components/video-empty-state';
import { useFootageVideo } from '@/hooks/use-footage-video';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { getPageHeaderLayout } from '@/utils/responsive';
import { clampPlaybackSeconds, formatPlaybackTime } from '@/utils/playback-timeline';

import { getRecordingInitialTime, getRecordingRange, type HistoryEntry } from '@/utils/recorded-footage';

type HistoryTab = 'Playback' | 'Events';


function formatPlaybackDate(date: string | undefined) {
  if (!date) return '';
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date);
  if (!match) return date;
  const [, day, month, year] = match;
  const dateValue = new Date(Number(year), Number(month) - 1, Number(day));
  if (dateValue.getFullYear() !== Number(year) || dateValue.getMonth() !== Number(month) - 1 || dateValue.getDate() !== Number(day)) return date;
  return dateValue.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Filled only by actual recordings.
const playbackEntries: HistoryEntry[] = [];

export default function HistoryScreen() {
  const { fallEvents } = useAppSession();
  const eventEntries = fallEvents;
  const { pageWidth, scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<HistoryTab>('Playback');
  const [selection, setSelectedRecording] = useState<HistoryEntry | null>(null);
  // Resolve by ID so replaced incident metadata/URLs do not leave a stale viewer.
  const selectedRecording = selection?.kind === 'event' && selection.id
    ? eventEntries.find(entry => entry.id === selection.id) ?? null : selection;
  const footageDate = formatPlaybackDate(selectedRecording?.date);
  const playbackRange = getRecordingRange(selectedRecording);
  const video = useFootageVideo({ source: selectedRecording?.uri ?? null, range: playbackRange });
  const isPlaying = video.available && video.isPlaying;
  const playbackReady = video.available && !video.error && video.status === 'readyToPlay';
  const fullscreen = useVideoFullscreen();
  const { visible: isLandscape, transitioning } = fullscreen;
  const [landscapeControlsVisible, setLandscapeControlsVisible] = useState(true);
  const [controlsHidden, setControlsHidden] = useState(false);
  const [controlsProgress] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();
  const playbackSeconds = video.seconds;
  const [isSeeking, setIsSeeking] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(true);
  const footageTime = formatPlaybackTime(playbackSeconds);
  const fallAt = selectedRecording?.kind === 'event' ? getRecordingInitialTime(selectedRecording) : undefined;
  const controlsMotion = useMemo(() => ({
    top: controlsProgress.interpolate({ inputRange: [0, 1], outputRange: [-(insets.top + 100), 0] }),
    bottom: controlsProgress.interpolate({ inputRange: [0, 1], outputRange: [insets.bottom + 180, 0] }),
  }), [controlsProgress, insets.bottom, insets.top]);

  useEffect(() => {
    const animation = Animated.timing(controlsProgress, {
      toValue: landscapeControlsVisible ? 1 : 0,
      duration: reducedMotion ? 0 : 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !landscapeControlsVisible) setControlsHidden(true);
    });
    return () => animation.stop();
  }, [controlsProgress, landscapeControlsVisible, reducedMotion]);

  function toggleLandscapeControls() {
    setControlsHidden(false);
    setLandscapeControlsVisible(value => !value);
  }

  function seekPlayback(seconds: number) {
    if (!playbackReady) return;
    const nextSeconds = Math.max(playbackRange.start, Math.min(playbackRange.end, clampPlaybackSeconds(seconds)));
    video.seek(nextSeconds);
  }

  function togglePlayback() {
    if (isPlaying) video.pause();
    else {
      if (!playbackReady) return;
      if (playbackSeconds >= playbackRange.end) video.seek(playbackRange.start);
      video.play();
    }
  }

  function openRecording(entry: HistoryEntry) {
    setSelectedRecording(entry);
    video.pause();
    setIsSeeking(false);
    setTimelineVisible(true);
    setControlsHidden(false);
    setLandscapeControlsVisible(true);
    const initialTime = getRecordingInitialTime(entry);
    video.seek(initialTime);
  }

  async function toggleLandscape() {
    if (transitioning) return;
    setIsSeeking(false);
    setControlsHidden(false);
    setLandscapeControlsVisible(true);
    await fullscreen.toggle();
  }

  function goBack() {
    if (selectedRecording) {
      setSelectedRecording(null);
      video.pause();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  const landscapeLayout = width > height;
  const currentEntries = activeTab === 'Playback' ? playbackEntries : eventEntries;

  function footage(active: boolean) {
    if (!active || !video.available) return <VideoEmptyState title="Recording unavailable" detail="This recording has no available video source." />;
    if (video.error || video.status === 'error') return <View accessibilityRole="alert" style={StyleSheet.absoluteFill}>
      <VideoEmptyState title="Video could not load" detail="Return to the recording list and reopen this video to retry." />
    </View>;
    return <>
      <FootageVideo player={video.player} />
      {(video.status === 'loading' || video.status === 'idle') && <View pointerEvents="none" style={s.loading}>
        <ActivityIndicator color={C.white} accessibilityLabel="Loading recording" />
      </View>}
    </>;
  }

  return <>
    <VideoFullscreen controller={fullscreen} onClose={() => { void toggleLandscape(); }}
      footage={footage(isLandscape)}>
      {fullscreenInsets => selectedRecording && <View style={s.landscapeScreen}>
      <Pressable accessibilityRole="button"
        accessibilityLabel={landscapeControlsVisible ? 'Hide playback controls' : 'Show playback controls'}
        accessibilityState={{ expanded: landscapeControlsVisible }}
        onPress={toggleLandscapeControls} style={StyleSheet.absoluteFill} />
      {/* Keep the timeline mounted while hidden so its zoom and scroll position are preserved. */}
      <View pointerEvents={landscapeControlsVisible ? 'box-none' : 'none'}
        accessibilityElementsHidden={!landscapeControlsVisible}
        importantForAccessibility={landscapeControlsVisible ? 'auto' : 'no-hide-descendants'}
        style={[StyleSheet.absoluteFill, controlsHidden && !landscapeControlsVisible && s.hiddenControls]}>
      <Animated.View pointerEvents="box-none" style={[s.landscapeTopRow, {
        top: fullscreenInsets.top + scaleSize(20), left: fullscreenInsets.left + scaleSize(8), right: fullscreenInsets.right + scaleSize(8),
        opacity: controlsProgress, transform: [{ translateY: controlsMotion.top }],
      }]}>
        <VideoBadge label="Recorded" color="#E53935" active={isPlaying && landscapeControlsVisible} />
        <View pointerEvents="box-none" style={s.overlayActions}>
        <VideoTimelineButton expanded={timelineVisible} onPress={() => setTimelineVisible(value => !value)} />
        <VideoCloseButton accessibilityLabel="Exit landscape footage" disabled={transitioning}
          accessibilityState={{ disabled: transitioning }} onPress={() => { void toggleLandscape(); }} />
        </View>
      </Animated.View>
      {landscapeControlsVisible && (playbackReady || isPlaying) && <GlowButton accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause footage' : 'Play footage'} accessibilityState={{ selected: isPlaying }} onPress={togglePlayback} style={s.playerToggle}>
        {isPlaying ? <View style={s.pauseGlyph}><View style={s.pauseBar} /><View style={s.pauseBar} /></View> : <View style={s.playerPlayGlyph} />}
      </GlowButton>}
      <Animated.View pointerEvents="box-none" style={[s.landscapePlaybackBar, {
        bottom: Math.max(fullscreenInsets.bottom, 6), left: fullscreenInsets.left + 8, right: fullscreenInsets.right + 8,
        opacity: controlsProgress, transform: [{ translateY: controlsMotion.bottom }],
      }, !timelineVisible && s.hiddenControls]}>
        <PlaybackTimeline seconds={playbackSeconds} onSeek={seekPlayback} onScrubChange={setIsSeeking} recordingDate={footageDate} range={playbackRange} highlightAt={fallAt} compact />
      </Animated.View>
      </View>
      </View>}
    </VideoFullscreen>
    <View style={s.screen} pointerEvents={isLandscape || transitioning ? 'none' : 'auto'}
      accessibilityElementsHidden={isLandscape} importantForAccessibility={isLandscape ? 'no-hide-descendants' : 'auto'}>
    <StatusBar style="light" hidden={isLandscape} />
    <FixedPageHeader onBack={goBack} />
    <EdgeScrollView topColor={C.blue} bottomColor={C.white} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
      showsVerticalScrollIndicator={false} scrollEnabled={!isSeeking} contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + scaleSize(24) }}>
      <View style={[s.page, { width: pageWidth }]}>
        <Image pointerEvents="none" source={require('../../assets/images/history-background.svg')} contentFit="fill" transition={0} accessible={false} style={s.pageBackground} />
        <View style={[s.header, { paddingTop: getPageHeaderLayout(pageWidth, insets.top).contentTop }]}>
          <View style={s.headerInner}>
            <View style={s.heading}>
              <Text accessibilityRole="header" style={s.title}>{selectedRecording ? activeTab === 'Events' ? 'Recorded Footage' : 'Playback' : activeTab === 'Events' ? 'Recorded Footage' : 'History'}</Text>
              <Text style={s.subtitle}>{selectedRecording ? activeTab === 'Events' ? 'Fall detected footage' : 'Recorded footage' : activeTab === 'Events' ? 'Access Fall Detection History' : 'Access past recorded footage'}</Text>
            </View>
          </View>
        </View>

        <View style={[s.content, landscapeLayout && s.landscapeContent]}>
          <Image pointerEvents="none" source={require('../../assets/images/history-mascot.png')} contentFit="contain" transition={0} accessible={false} style={selectedRecording ? [s.playbackMascot, { bottom: -(insets.bottom + 138) }] : s.mascot} />
          {!selectedRecording && <View style={s.segmentedControl} accessibilityRole="tablist">
            {(['Playback', 'Events'] as const).map(tab => {
              const selected = activeTab === tab;
              return <GlowButton key={tab} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setActiveTab(tab)} style={[s.tab, selected ? s.activeTab : s.inactiveTab]}>
                <Text style={[s.tabLabel, selected && s.activeTabLabel]}>{tab}</Text>
              </GlowButton>;
            })}
          </View>}
          {selectedRecording ? <View style={s.playbackView}>
            <View style={[s.playerFrame, landscapeLayout && { height: Math.max(180, Math.min(height - insets.top - insets.bottom - 40, width * 0.5625)) }]}>
              {footage(!isLandscape)}
              <Pressable accessibilityRole="button" accessibilityLabel={landscapeControlsVisible ? 'Hide playback controls' : 'Show playback controls'}
                accessibilityState={{ expanded: landscapeControlsVisible }} onPress={toggleLandscapeControls} style={StyleSheet.absoluteFill} />
              <View pointerEvents={landscapeControlsVisible ? 'box-none' : 'none'} accessibilityElementsHidden={!landscapeControlsVisible}
                importantForAccessibility={landscapeControlsVisible ? 'auto' : 'no-hide-descendants'}
                style={[StyleSheet.absoluteFill, controlsHidden && !landscapeControlsVisible && s.hiddenControls]}>
              <Animated.View pointerEvents="box-none" style={[s.playerTopRow, { opacity: controlsProgress, transform: [{ translateY: controlsMotion.top }] }]}>

                <VideoBadge label="Recorded" color="#E53935" active={isPlaying && !isLandscape} />
                <View pointerEvents="box-none" style={s.overlayActions}>
                <VideoTimelineButton expanded={timelineVisible} onPress={() => setTimelineVisible(value => !value)} />
                <VideoOverlayButton
                  accessibilityLabel={isLandscape ? 'Exit landscape footage' : 'View footage in landscape'}
                  accessibilityState={{ selected: isLandscape, disabled: transitioning }} disabled={transitioning}
                  onPress={() => { void toggleLandscape(); }}
                >
                  <View style={s.fullscreenBadge}>
                    <View style={[s.fullscreenCorner, s.fullscreenTopLeft]} />
                    <View style={[s.fullscreenCorner, s.fullscreenTopRight]} />
                    <View style={[s.fullscreenCorner, s.fullscreenBottomLeft]} />
                    <View style={[s.fullscreenCorner, s.fullscreenBottomRight]} />
                  </View>
                </VideoOverlayButton>
                </View>
              </Animated.View>
              {landscapeControlsVisible && (playbackReady || isPlaying) && <GlowButton accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause footage' : 'Play footage'} accessibilityState={{ selected: isPlaying }} onPress={togglePlayback} style={s.playerToggle}>
                {isPlaying ? <View style={s.pauseGlyph}><View style={s.pauseBar} /><View style={s.pauseBar} /></View> : <View style={s.playerPlayGlyph} />}
              </GlowButton>}
              <Animated.View style={[s.playerTimeRow, { opacity: controlsProgress, transform: [{ translateY: controlsMotion.bottom }] }]} pointerEvents="none">
                <View style={s.playerTimeBadge}><Text style={s.playerTime}>{selectedRecording.kind === 'event' && selectedRecording.trimmedClip ? `Clip ${footageTime}` : footageTime}</Text></View>
                <View style={s.playerTimeBadge}><Text style={s.playerTime}>{footageDate}</Text></View>
              </Animated.View>
              </View>
            </View>
            <View pointerEvents="box-none" style={!timelineVisible && s.hiddenControls}>
              <PlaybackTimeline seconds={playbackSeconds} onSeek={seekPlayback} onScrubChange={setIsSeeking} range={playbackRange} highlightAt={fallAt} />
            </View>
            <View style={s.recordingInfo}>
              {selectedRecording.kind === 'event' && <>
                <Text style={s.eventLabel}>Fall Detected at {formatPlaybackTime(selectedRecording.fallAtSeconds)}</Text>
                <Text style={s.recordingDetail}>Highlight: {formatPlaybackTime(playbackRange.start)} to {formatPlaybackTime(playbackRange.end)}</Text>
              </>}
              <Text style={s.recordingDate}>{formatPlaybackDate(selectedRecording.date)}</Text>
              <Text style={s.recordingDetail}>{selectedRecording.detail}</Text>
            </View>
          </View> : currentEntries.length ? <View style={s.entryList}>
            {currentEntries.map((entry, index) => <View key={entry.id ?? `${entry.kind}-${entry.date}-${entry.kind === 'event' ? entry.fallAtSeconds : 'daily'}-${index}`} style={s.entryCard}>
              <View style={s.thumbnail}>{entry.thumbnailUri && <Image source={{ uri: entry.thumbnailUri }} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} />}</View>
              <View style={s.entryText}>
                {entry.kind === 'event' ? <>
                  <Text style={s.eventLabel}>Fall Detected</Text>
                  <Text style={s.eventDate}>{formatPlaybackDate(entry.date)}</Text>
                  <Text style={s.entryDetail}>{formatPlaybackTime(entry.fallAtSeconds)}</Text>
                </> : <>
                  <Text style={s.entryDate}>{formatPlaybackDate(entry.date)}</Text>
                  <Text style={s.entryDetail}>{entry.detail}</Text>
                </>}
              </View>
              <GlowButton accessibilityRole="button" accessibilityLabel={`Play ${entry.kind === 'event' ? `fall event at ${formatPlaybackTime(entry.fallAtSeconds)}` : 'recording'} from ${formatPlaybackDate(entry.date)}`} onPress={() => openRecording(entry)} style={s.playButton}>
                <View style={s.playGlyph} />
              </GlowButton>
            </View>)}
          </View> : <View style={s.emptyState}>
            <View style={s.emptyIcon}><View style={s.emptyDot} /><View style={s.emptyLine} /></View>
            <Text style={s.emptyTitle}>{activeTab === 'Playback' ? 'No playback recorded yet' : 'No events recorded yet'}</Text>
            <Text style={s.emptyBody}>{activeTab === 'Playback' ? 'Recorded footage will appear here when it becomes available.' : 'Fall detection recordings will appear here.'}</Text>
          </View>}
        </View>
      </View>
    </EdgeScrollView>
    </View>
  </>;
}

const baseStyles = StyleSheet.create({
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1, backgroundColor: C.white },
  videoError: { position: 'absolute', left: 12, right: 12, top: '30%', color: C.white, fontFamily: F.semiBold, fontSize: 12, textAlign: 'center', backgroundColor: 'rgba(0,0,0,.7)', padding: 12, borderRadius: 8 },
  landscapeScreen: { flex: 1, overflow: 'hidden' },
  page: { flexGrow: 1, alignSelf: 'center', position: 'relative', backgroundColor: C.white },
  pageBackground: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: 340, zIndex: 0 },
  header: { position: 'relative', zIndex: 2, paddingBottom: 24, backgroundColor: 'transparent', overflow: 'visible' },
  headerInner: { width: '100%', paddingHorizontal: 24, alignSelf: 'center', zIndex: 2 },
  heading: { alignItems: 'center' },
  title: { color: C.white, fontFamily: F.extraBold, fontSize: T.title, lineHeight: 32, textAlign: 'center' },
  subtitle: { marginTop: 8, color: C.white, fontFamily: F.regular, fontSize: T.body, lineHeight: 20, textAlign: 'center' },
  mascot: { position: 'absolute', width: 300, height: 169, top: -103.5, right: -83, zIndex: 0, transform: [{ rotate: '16deg' }] },
  playbackMascot: { position: 'absolute', width: 760, height: 428, left: '50%', marginLeft: -356, bottom: 0, zIndex: 0, transform: [{ rotate: '0deg' }] },
  content: { position: 'relative', width: '100%', alignSelf: 'center', flex: 1, paddingHorizontal: 24, paddingTop: 1, paddingBottom: 24, marginTop: 0, zIndex: 1, backgroundColor: C.white, borderTopLeftRadius: 56, borderTopRightRadius: 56 },
  landscapeContent: { maxWidth: '100%', paddingHorizontal: 16, marginTop: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  segmentedControl: { zIndex: 1, width: '100%', maxWidth: 320, minHeight: 50, alignSelf: 'center', flexDirection: 'row', gap: 5, padding: 2, borderRadius: 26, backgroundColor: '#7297C1', borderWidth: 1, borderColor: 'rgba(211,229,249,.72)', boxShadow: '0 6px 12px rgba(50,80,123,.3)' },
  tab: { flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  activeTab: { backgroundColor: '#F7FAFE', boxShadow: '0 3px 8px rgba(50,80,123,.28)' },
  inactiveTab: { backgroundColor: 'rgba(50,80,123,.13)', boxShadow: '0 0 10px rgba(148,176,213,.49)' },
  tabLabel: { color: C.white, fontFamily: F.semiBold, fontSize: T.label, lineHeight: 20 },
  activeTabLabel: { color: C.blue },
  entryList: { position: 'relative', zIndex: 1, gap: 9, marginTop: 16 },
  entryCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, borderRadius: 21, backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(148,176,213,.2)', boxShadow: '0 0 14px rgba(23,111,216,.46), 0 5px 15px rgba(89,132,189,.13)' },
  thumbnail: { width: 76, height: 68, borderRadius: 15, backgroundColor: '#D9E3F0' },
  entryText: { flex: 1, minWidth: 0, gap: 2 },
  entryDate: { color: C.blue, fontFamily: F.bold, fontSize: T.label, lineHeight: 20 },
  entryDetail: { color: '#667B98', fontFamily: F.regular, fontSize: T.caption, lineHeight: 18 },
  eventLabel: { color: '#F04444', fontFamily: F.bold, fontSize: T.caption, lineHeight: 18 },
  eventDate: { color: C.blue, fontFamily: F.regular, fontSize: T.body, lineHeight: 20 },
  playButton: { minWidth: 44, minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue },
  playGlyph: { width: 0, height: 0, marginLeft: 2, borderTopWidth: 7, borderBottomWidth: 7, borderLeftWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: C.white },
  playbackView: { position: 'relative', zIndex: 1, gap: 14, marginTop: 16 },
  playerFrame: { height: 238, position: 'relative', justifyContent: 'space-between', overflow: 'hidden', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(148,176,213,.48)', backgroundColor: C.blue, boxShadow: '0 0 16px rgba(23,111,216,.32), 0 7px 18px rgba(50,80,123,.18)' },
  playerTopRow: { position: 'absolute', top: 6, left: 6, right: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 },
  fullscreenBadge: { width: 21, height: 21, position: 'relative' },
  fullscreenCorner: { position: 'absolute', width: 7, height: 7, borderColor: C.white },
  fullscreenTopLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  fullscreenTopRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  fullscreenBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  fullscreenBottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  playerToggle: { position: 'absolute', top: '50%', left: '50%', width: 58, height: 58, marginLeft: -29, marginTop: -29, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.8)', boxShadow: '0 4px 14px rgba(15,35,58,.32)' },
  playerPlayGlyph: { width: 0, height: 0, marginLeft: 4, borderTopWidth: 11, borderBottomWidth: 11, borderLeftWidth: 16, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: C.white },
  pauseGlyph: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pauseBar: { width: 6, height: 21, borderRadius: 2, backgroundColor: C.white },
  playerTimeRow: { position: 'absolute', bottom: 5, left: 6, right: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  playerTimeBadge: { minHeight: 22, justifyContent: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9, backgroundColor: 'rgba(0,0,0,.14)' },
  playerTime: { color: C.white, fontFamily: 'VT323_400Regular', fontSize: 13, lineHeight: 16, letterSpacing: 0.8 },
  hiddenControls: { display: 'none' },
  overlayActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  landscapeTopRow: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  landscapePlaybackBar: { position: 'absolute', zIndex: 2 },
  recordingInfo: { gap: 4, padding: 16, borderRadius: 18, backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(148,176,213,.3)', boxShadow: '0 0 14px rgba(23,111,216,.18)' },
  recordingDate: { color: C.blue, fontFamily: F.bold, fontSize: T.label, lineHeight: 20 },
  recordingDetail: { color: '#667B98', fontFamily: F.regular, fontSize: T.body, lineHeight: 20 },
  emptyState: { position: 'relative', zIndex: 1, minHeight: 210, marginTop: 16, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, borderRadius: 24, backgroundColor: C.white, boxShadow: '0 0 14px rgba(23,111,216,.46), 0 5px 15px rgba(89,132,189,.12)' },
  emptyIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9F1FA', marginBottom: 5 },
  emptyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.lightBlue, marginBottom: 3 },
  emptyLine: { width: 18, height: 13, borderWidth: 2, borderColor: C.lightBlue, borderRadius: 4 },
  emptyTitle: { color: C.blue, fontFamily: F.bold, fontSize: T.section, lineHeight: 26, textAlign: 'center' },
  emptyBody: { color: '#71839B', fontFamily: F.regular, fontSize: T.body, lineHeight: 20, textAlign: 'center' },
});
