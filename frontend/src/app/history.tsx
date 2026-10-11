import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { GlowButton } from '@/components/glow-button';
import { SettingsProfileButton } from '@/components/settings-profile-button';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';

type HistoryTab = 'Playback' | 'Events';

type HistoryEntry = { date: string; detail: string; kind: 'playback' | 'event'; sample?: boolean };
const PLAYBACK_DURATION_SECONDS = 120;

function formatPlaybackTime(progress: number) {
  const seconds = Math.floor(progress * PLAYBACK_DURATION_SECONDS);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

// Demo footage keeps the Playback screen preview usable until real recordings are available.
const playbackEntries: HistoryEntry[] = [
  { date: '29/12/2026', detail: 'Sample playback footage', kind: 'playback', sample: true },
];
// Keep the fall-event card and footage UI ready for detected events; none exist yet.
const eventEntries: HistoryEntry[] = [];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<HistoryTab>('Playback');
  const [selectedRecording, setSelectedRecording] = useState<HistoryEntry | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0.32);
  const [isSeeking, setIsSeeking] = useState(false);
  const playbackProgressRef = useRef(0.32);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const playbackTime = formatPlaybackTime(playbackProgress);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const nextProgress = Math.min(1, playbackProgressRef.current + 1 / PLAYBACK_DURATION_SECONDS);
      playbackProgressRef.current = nextProgress;
      setPlaybackProgress(nextProgress);
      if (nextProgress >= 1) setIsPlaying(false);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  function seekPlayback(locationX: number) {
    if (!timelineWidth) return;
    const nextProgress = Math.max(0, Math.min(1, locationX / timelineWidth));
    playbackProgressRef.current = nextProgress;
    setPlaybackProgress(nextProgress);
  }

  async function toggleLandscape() {
    if (isLandscape) {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } catch {
        // Keep the in-app layout responsive if the platform rejects the orientation lock.
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

  function goBack() {
    if (selectedRecording) {
      if (isLandscape) void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      setSelectedRecording(null);
      setIsPlaying(false);
      setIsLandscape(false);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  const landscapeLayout = isLandscape && width > height;
  const currentEntries = activeTab === 'Playback' ? playbackEntries : eventEntries;

  return <>
    {landscapeLayout && selectedRecording ? <View style={s.landscapeScreen}>
      <StatusBar style="light" />
      <Image source={require('../../assets/images/footage-placeholder.png')} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
      <View style={[s.landscapeTopRow, { top: insets.top + 20, left: insets.left + 28, right: insets.right + 28 }]}>
        <View style={s.landscapeLiveBadge}>
          <View style={s.landscapeLiveDot} />
          <Text style={s.landscapeLiveText}>Recorded</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exit landscape footage"
          hitSlop={14}
          onPress={() => { void toggleLandscape(); }}
          style={s.landscapeExitButton}
        >
          <View style={s.landscapeExitLineOne} />
          <View style={s.landscapeExitLineTwo} />
        </Pressable>
      </View>
      <GlowButton accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause footage' : 'Play footage'} accessibilityState={{ selected: isPlaying }} onPress={() => setIsPlaying(value => !value)} style={s.playerToggle}>
        {isPlaying ? <View style={s.pauseGlyph}><View style={s.pauseBar} /><View style={s.pauseBar} /></View> : <View style={s.playerPlayGlyph} />}
      </GlowButton>
      <View style={[s.landscapeTimeRow, { bottom: insets.bottom + 62, left: insets.left + 28, right: insets.right + 28 }]} pointerEvents="none">
        <View style={s.landscapeTimeBadge}><Text style={s.landscapeTime}>07:15:32</Text></View>
        <View style={s.landscapeTimeBadge}><Text style={s.landscapeTime}>29/12/2026</Text></View>
      </View>
      <View style={[s.landscapePlaybackBar, { bottom: insets.bottom + 16, left: insets.left + 28, right: insets.right + 28 }]}>
        <Text style={s.playbackTimestamp}>{playbackTime}</Text>
        <View style={s.landscapeTrackWrap}>
        {isSeeking && <View pointerEvents="none" style={[s.seekTimeBubble, s.landscapeSeekTimeBubble, { left: `${Math.max(8, Math.min(92, playbackProgress * 100))}%` }]}><Text style={s.seekTimeText}>{playbackTime}</Text></View>}
        <View
          accessibilityRole="adjustable"
          accessibilityLabel="Playback position"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(playbackProgress * 100) }}
          onLayout={event => setTimelineWidth(event.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={event => { setIsPlaying(false); setIsSeeking(true); seekPlayback(event.nativeEvent.locationX); }}
          onResponderMove={event => seekPlayback(event.nativeEvent.locationX)}
          onResponderRelease={() => setIsSeeking(false)}
          onResponderTerminate={() => setIsSeeking(false)}
          style={s.landscapeTimelineTrack}
        >
          <View pointerEvents="none" style={[s.landscapeTimelineProgress, { width: `${playbackProgress * 100}%` }]} />
          <View pointerEvents="none" style={[s.landscapeTimelineThumb, { left: `${playbackProgress * 100}%` }]} />
        </View>
        </View>
        <Text style={s.playbackTimestamp}>02:00</Text>
      </View>
    </View> : <View style={s.screen}>
    <StatusBar style="light" />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}>
      <View style={s.page}>
        <Image pointerEvents="none" source={require('../../assets/images/history-background.svg')} contentFit="fill" transition={0} accessible={false} style={s.pageBackground} />
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <View style={s.headerInner}>
            <View style={s.topRow}>
              <BackButton accessibilityLabel={selectedRecording ? 'Back to History' : 'Back to Home'} onPress={goBack} />
              <SettingsProfileButton />
            </View>
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
              <Image source={require('../../assets/images/footage-placeholder.png')} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
              <View style={s.playerTopRow}>
                <View style={s.liveBadge}>
                  <View style={s.liveDot} />
                  <Text style={s.playerBadgeText}>Recorded</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isLandscape ? 'Exit landscape footage' : 'View footage in landscape'}
                  accessibilityState={{ selected: isLandscape }}
                  hitSlop={14}
                  onPress={() => { void toggleLandscape(); }}
                  style={s.landscapeButton}
                >
                  <View style={s.fullscreenBadge}>
                    <View style={[s.fullscreenCorner, s.fullscreenTopLeft]} />
                    <View style={[s.fullscreenCorner, s.fullscreenTopRight]} />
                    <View style={[s.fullscreenCorner, s.fullscreenBottomLeft]} />
                    <View style={[s.fullscreenCorner, s.fullscreenBottomRight]} />
                  </View>
                </Pressable>
              </View>
              <GlowButton accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause footage' : 'Play footage'} accessibilityState={{ selected: isPlaying }} onPress={() => setIsPlaying(value => !value)} style={s.playerToggle}>
                {isPlaying ? <View style={s.pauseGlyph}><View style={s.pauseBar} /><View style={s.pauseBar} /></View> : <View style={s.playerPlayGlyph} />}
              </GlowButton>
              <View style={s.playerTimeRow} pointerEvents="none">
                <View style={s.playerTimeBadge}><Text style={s.playerTime}>07:15:32</Text></View>
                <View style={s.playerTimeBadge}><Text style={s.playerTime}>29/12/2026</Text></View>
              </View>
            </View>
            <View style={s.timeline}>
              <View style={s.timelineTimes}>
                <Text style={s.timelineTime}>{playbackTime}</Text>
                <Text style={s.timelineTime}>02:00</Text>
              </View>
              <View style={s.timelineTrackWrap}>
              {isSeeking && <View pointerEvents="none" style={[s.seekTimeBubble, { left: `${Math.max(8, Math.min(92, playbackProgress * 100))}%` }]}><Text style={s.seekTimeText}>{playbackTime}</Text></View>}
              <View
                accessibilityRole="adjustable"
                accessibilityLabel="Playback position"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(playbackProgress * 100) }}
                onLayout={event => setTimelineWidth(event.nativeEvent.layout.width)}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={event => { setIsPlaying(false); setIsSeeking(true); seekPlayback(event.nativeEvent.locationX); }}
                onResponderMove={event => seekPlayback(event.nativeEvent.locationX)}
                onResponderRelease={() => setIsSeeking(false)}
                onResponderTerminate={() => setIsSeeking(false)}
                style={s.timelineTrack}
              >
                <View pointerEvents="none" style={[s.timelineProgress, { width: `${playbackProgress * 100}%` }]} />
                <View pointerEvents="none" style={[s.timelineThumb, { left: `${playbackProgress * 100}%` }]} />
              </View>
              </View>
            </View>
            <View style={s.recordingInfo}>
              {selectedRecording.kind === 'event' && <Text style={s.eventLabel}>Fall Detected</Text>}
              <Text style={s.recordingDate}>{selectedRecording.date}</Text>
              <Text style={s.recordingDetail}>{selectedRecording.detail}</Text>
            </View>
          </View> : currentEntries.length ? <View style={s.entryList}>
            {currentEntries.map(entry => <View key={`${entry.kind}-${entry.date}`} style={s.entryCard}>
              <Image source={entry.sample ? require('../../assets/images/footage-placeholder.png') : require('../../assets/images/home-camera-preview.png')} contentFit="cover" transition={0} accessible={false} style={s.thumbnail} />
              <View style={s.entryText}>
                {entry.kind === 'event' ? <>
                  <Text style={s.eventLabel}>Fall Detected</Text>
                  <Text style={s.eventDate}>{entry.date}</Text>
                </> : <>
                  <Text style={s.entryDate}>{entry.date}</Text>
                  <Text style={s.entryDetail}>{entry.detail}</Text>
                </>}
              </View>
              <GlowButton accessibilityRole="button" accessibilityLabel={`Play ${entry.kind === 'event' ? 'fall event' : 'recording'} from ${entry.date}`} onPress={() => { setSelectedRecording(entry); setIsPlaying(false); playbackProgressRef.current = 0.32; setPlaybackProgress(0.32); }} style={s.playButton}>
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
    </ScrollView>
    </View>}
  </>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.white },
  landscapeScreen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'transparent', overflow: 'hidden' },
  page: { flexGrow: 1, position: 'relative', backgroundColor: C.white },
  pageBackground: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: 340, zIndex: 0 },
  header: { position: 'relative', zIndex: 2, paddingBottom: 36, backgroundColor: 'transparent', overflow: 'visible' },
  headerInner: { width: '100%', maxWidth: 440, paddingHorizontal: 28, alignSelf: 'center', zIndex: 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { alignItems: 'center', marginTop: 8 },
  title: { color: C.white, fontFamily: F.extraBold, fontSize: 20, lineHeight: 28 },
  subtitle: { marginTop: 6, color: C.white, fontFamily: F.regular, fontSize: 10 },
  mascot: { position: 'absolute', width: 300, height: 169, top: -103.5, right: -83, zIndex: 0, transform: [{ rotate: '16deg' }] },
  playbackMascot: { position: 'absolute', width: 760, height: 428, left: '50%', marginLeft: -356, bottom: 0, zIndex: 0, transform: [{ rotate: '0deg' }] },
  content: { position: 'relative', width: '100%', maxWidth: 440, alignSelf: 'center', flex: 1, paddingHorizontal: 24, paddingTop: 1, paddingBottom: 24, marginTop: 10, zIndex: 3, backgroundColor: C.white, borderTopLeftRadius: 56, borderTopRightRadius: 56 },
  landscapeContent: { maxWidth: '100%', paddingHorizontal: 16, marginTop: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  segmentedControl: { zIndex: 1, width: 260, height: 50, alignSelf: 'center', flexDirection: 'row', gap: 5, padding: 2, borderRadius: 26, backgroundColor: '#7297C1', borderWidth: 1, borderColor: 'rgba(211,229,249,.72)', boxShadow: '0 6px 12px rgba(50,80,123,.3)' },
  tab: { flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  activeTab: { backgroundColor: '#F7FAFE', boxShadow: '0 3px 8px rgba(50,80,123,.28)' },
  inactiveTab: { backgroundColor: 'rgba(50,80,123,.13)', boxShadow: '0 0 10px rgba(148,176,213,.49)' },
  tabLabel: { color: C.white, fontFamily: F.semiBold, fontSize: 10 },
  activeTabLabel: { color: C.blue },
  entryList: { gap: 9, marginTop: 16 },
  entryCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, borderRadius: 21, backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(148,176,213,.2)', boxShadow: '0 0 14px rgba(23,111,216,.46), 0 5px 15px rgba(89,132,189,.13)' },
  thumbnail: { width: 76, height: 68, borderRadius: 15, backgroundColor: '#D9E3F0' },
  entryText: { flex: 1, minWidth: 0, gap: 2 },
  entryDate: { color: C.blue, fontFamily: F.bold, fontSize: 12, lineHeight: 16 },
  entryDetail: { color: '#667B98', fontFamily: F.regular, fontSize: 10, lineHeight: 14 },
  eventLabel: { color: '#F04444', fontFamily: F.bold, fontSize: 10, lineHeight: 13 },
  eventDate: { color: C.blue, fontFamily: F.regular, fontSize: 9, lineHeight: 12 },
  playButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue },
  playGlyph: { width: 0, height: 0, marginLeft: 2, borderTopWidth: 7, borderBottomWidth: 7, borderLeftWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: C.white },
  playbackView: { gap: 14, marginTop: 16 },
  playerFrame: { height: 238, position: 'relative', justifyContent: 'space-between', overflow: 'hidden', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(148,176,213,.48)', backgroundColor: C.blue, boxShadow: '0 0 16px rgba(23,111,216,.32), 0 7px 18px rgba(50,80,123,.18)' },
  playerTopRow: { position: 'absolute', top: 18, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 },
  liveBadge: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, borderRadius: 7, backgroundColor: 'rgba(0,0,0,.21)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' },
  playerBadgeText: { color: C.white, fontFamily: F.bold, fontSize: 11 },
  landscapeButton: { width: 50, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(0,0,0,.21)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' },
  fullscreenBadge: { width: 21, height: 21, position: 'relative' },
  fullscreenCorner: { position: 'absolute', width: 7, height: 7, borderColor: C.white },
  fullscreenTopLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  fullscreenTopRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  fullscreenBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  fullscreenBottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  playerToggle: { position: 'absolute', top: '50%', left: '50%', width: 58, height: 58, marginLeft: -29, marginTop: -29, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,.9)', boxShadow: '0 4px 14px rgba(15,35,58,.32)' },
  playerPlayGlyph: { width: 0, height: 0, marginLeft: 4, borderTopWidth: 11, borderBottomWidth: 11, borderLeftWidth: 16, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: C.blue },
  pauseGlyph: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pauseBar: { width: 6, height: 21, borderRadius: 2, backgroundColor: C.blue },
  playerTimeRow: { position: 'absolute', bottom: 14, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  playerTimeBadge: { minHeight: 22, justifyContent: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9, backgroundColor: 'rgba(0,0,0,.21)' },
  playerTime: { color: C.white, fontFamily: 'VT323_400Regular', fontSize: 13, lineHeight: 16, letterSpacing: 0.8 },
  landscapeTopRow: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 },
  landscapeLiveBadge: { minWidth: 90, minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderRadius: 7, backgroundColor: 'rgba(0,0,0,.21)', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)' },
  landscapeLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },
  landscapeLiveText: { color: C.white, fontFamily: F.bold, fontSize: 16 },
  landscapeExitButton: { width: 40, height: 40, position: 'relative', alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(0,0,0,.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,.35)' },
  landscapeExitLineOne: { position: 'absolute', width: 21, height: 2.5, borderRadius: 2, backgroundColor: C.white, transform: [{ rotate: '45deg' }] },
  landscapeExitLineTwo: { position: 'absolute', width: 21, height: 2.5, borderRadius: 2, backgroundColor: C.white, transform: [{ rotate: '-45deg' }] },
  landscapeTimeRow: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  landscapeTimeBadge: { minHeight: 28, justifyContent: 'center', paddingHorizontal: 9, paddingVertical: 2, borderRadius: 7, backgroundColor: 'rgba(0,0,0,.21)' },
  landscapeTime: { color: C.white, fontFamily: 'VT323_400Regular', fontSize: 18, lineHeight: 21, letterSpacing: 1 },
  playbackTimestamp: { color: C.white, fontFamily: F.semiBold, fontSize: 11, lineHeight: 15, fontVariant: ['tabular-nums'] },
  landscapePlaybackBar: { position: 'absolute', zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(0,0,0,.42)' },
  landscapeTrackWrap: { flex: 1, height: 18, position: 'relative', justifyContent: 'center' },
  landscapeSeekTimeBubble: { top: -22 },
  landscapeTimelineTrack: { width: '100%', height: 6, position: 'relative', justifyContent: 'center', borderRadius: 3, backgroundColor: 'rgba(255,255,255,.48)', overflow: 'visible' },
  landscapeTimelineProgress: { height: 6, borderRadius: 3, backgroundColor: C.white },
  landscapeTimelineThumb: { position: 'absolute', top: -3, width: 12, height: 12, marginLeft: -6, borderRadius: 6, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.blue },
  timeline: { gap: 4, paddingHorizontal: 2 },
  timelineTimes: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineTime: { color: '#667B98', fontFamily: F.semiBold, fontSize: 10, fontVariant: ['tabular-nums'] },
  timelineTrackWrap: { height: 30, position: 'relative', justifyContent: 'flex-end' },
  timelineTrack: { height: 8, position: 'relative', justifyContent: 'center', borderRadius: 4, backgroundColor: 'rgba(148,176,213,.42)', overflow: 'visible' },
  seekTimeBubble: { position: 'absolute', top: 0, minWidth: 42, height: 20, marginLeft: -21, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderRadius: 10, backgroundColor: C.blue, zIndex: 3 },
  seekTimeText: { color: C.white, fontFamily: F.semiBold, fontSize: 10, lineHeight: 13, fontVariant: ['tabular-nums'] },
  timelineProgress: { height: 8, borderRadius: 4, backgroundColor: C.blue },
  timelineThumb: { position: 'absolute', top: -2, width: 12, height: 12, marginLeft: -6, borderRadius: 6, backgroundColor: C.white, borderWidth: 2, borderColor: C.lightBlue },
  recordingInfo: { gap: 4, padding: 16, borderRadius: 18, backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(148,176,213,.3)', boxShadow: '0 0 14px rgba(23,111,216,.18)' },
  recordingDate: { color: C.blue, fontFamily: F.bold, fontSize: 15 },
  recordingDetail: { color: '#667B98', fontFamily: F.regular, fontSize: 12 },
  emptyState: { minHeight: 210, marginTop: 16, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, borderRadius: 24, backgroundColor: C.white, boxShadow: '0 0 14px rgba(23,111,216,.46), 0 5px 15px rgba(89,132,189,.12)' },
  emptyIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9F1FA', marginBottom: 5 },
  emptyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.lightBlue, marginBottom: 3 },
  emptyLine: { width: 18, height: 13, borderWidth: 2, borderColor: C.lightBlue, borderRadius: 4 },
  emptyTitle: { color: C.blue, fontFamily: F.bold, fontSize: 13 },
  emptyBody: { color: '#71839B', fontFamily: F.regular, fontSize: 10, textAlign: 'center' },
});
