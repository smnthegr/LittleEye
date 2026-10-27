import { useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { VideoView, type VideoSource } from 'expo-video';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

import { VideoEmptyState } from '@/components/video-empty-state';
import { VideoFullscreen } from '@/components/video-fullscreen';
import { VideoBadge, VideoCloseButton, VideoOverlayButton } from '@/components/video-overlay-controls';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { severityLevels, type Severity } from '@/constants/first-aid';
import { useFirstAidVideo } from '@/hooks/use-first-aid-video';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import type { useVideoFullscreen } from '@/hooks/use-video-fullscreen';
import { useVideoOverlayControls } from '@/hooks/use-video-overlay-controls';

type Props = { severity: Severity; source: VideoSource; fullscreen: ReturnType<typeof useVideoFullscreen>; onEnterFullscreen: () => void };

export function FirstAidVideo({ severity, source, fullscreen, onEnterFullscreen }: Props) {
  const video = useFirstAidVideo(source);
  const { scaleSize } = useResponsiveLayout();
  const overlays = useVideoOverlayControls();
  const severityColor = severityLevels.find(level => level.label === severity)!.color;

  function toggleFullscreen() {
    if (fullscreen.transitioning) return;
    overlays.show();
    if (!fullscreen.visible) onEnterFullscreen();
    video.prepareForTransfer();
    void fullscreen.toggle();
  }

  function footage() {
    if (source === null || video.error) return <VideoEmptyState
      title={video.error ? 'Video could not load' : 'Instructional video unavailable'}
      detail={video.error ? 'Please try again later. Written guidance is available below.' : 'Video guidance will appear here when available.'} />;
    return <>
      <VideoView player={video.player} nativeControls={false} contentFit="contain" surfaceType="textureView"
        playsInline fullscreenOptions={{ enable: false }} allowsPictureInPicture={false}
        style={StyleSheet.absoluteFill} />
      {(video.status === 'loading' || video.status === 'idle') && <View pointerEvents="none" style={s.loading}>
        <ActivityIndicator color={C.white} accessibilityLabel="Loading instructional video" />
      </View>}
    </>;
  }

  function controls(insets?: EdgeInsets) {
    return <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Pressable accessibilityRole="button"
        accessibilityLabel={overlays.visible ? 'Hide first-aid video controls' : 'Show first-aid video controls'}
        accessibilityState={{ expanded: overlays.visible }}
        disabled={fullscreen.transitioning} onPress={overlays.toggle} style={StyleSheet.absoluteFill} />
      <View pointerEvents={overlays.visible ? 'box-none' : 'none'} accessibilityElementsHidden={!overlays.visible}
        importantForAccessibility={overlays.visible ? 'auto' : 'no-hide-descendants'}
        style={[StyleSheet.absoluteFill, overlays.hidden && s.hiddenControls]}>
        <Animated.View pointerEvents="box-none" style={[s.topRow, insets ? {
          top: (insets.top ?? 0) + scaleSize(20), left: (insets.left ?? 0) + scaleSize(8), right: (insets.right ?? 0) + scaleSize(8),
        } : s.portraitTopRow, { opacity: overlays.progress, transform: [{ translateY: overlays.motion.top }] }]}>
          <VideoBadge label={`${severity} · First Aid`} color={severityColor} />
          {insets ? <VideoCloseButton accessibilityLabel="Exit landscape first-aid video"
            accessibilityHint="Exits landscape and returns to the selected severity."
            accessibilityState={{ disabled: fullscreen.transitioning }}
            disabled={fullscreen.transitioning} onPress={toggleFullscreen} />
            : <VideoOverlayButton accessibilityLabel="View first-aid video in landscape"
              accessibilityHint="Opens a fullscreen video with a close button."
              accessibilityState={{ disabled: fullscreen.transitioning }} disabled={fullscreen.transitioning}
              onPress={toggleFullscreen}>
              <View pointerEvents="none" style={s.fullscreenBadge}>
                <View style={[s.fullscreenCorner, s.fullscreenTopLeft]} /><View style={[s.fullscreenCorner, s.fullscreenTopRight]} />
                <View style={[s.fullscreenCorner, s.fullscreenBottomLeft]} /><View style={[s.fullscreenCorner, s.fullscreenBottomRight]} />
              </View>
            </VideoOverlayButton>}
        </Animated.View>
        {source !== null && !video.error && <>
          <Animated.View pointerEvents="box-none" style={[s.playPosition, { opacity: overlays.progress }]}>
            <VideoOverlayButton accessibilityLabel={video.isPlaying ? 'Pause first-aid video' : 'Play first-aid video'}
              accessibilityState={{ selected: video.isPlaying }} onPress={video.togglePlayback} style={s.playButton}>
              {video.isPlaying ? <View pointerEvents="none" style={s.pauseGlyph}><View style={s.pauseBar} /><View style={s.pauseBar} /></View>
                : <View pointerEvents="none" style={s.playGlyph} />}
            </VideoOverlayButton>
          </Animated.View>
          <Animated.View pointerEvents="box-none" style={[s.playbackRow, {
            bottom: (insets?.bottom ?? 0) + 4, left: (insets?.left ?? 0) + 8, right: (insets?.right ?? 0) + 8,
            opacity: overlays.progress, transform: [{ translateY: overlays.motion.bottom }],
          }]}>
            <ClipTimeline seconds={video.seconds} duration={video.duration} onSeek={video.seek} />
            <VideoOverlayButton accessibilityLabel={video.muted ? 'Unmute first-aid video' : 'Mute first-aid video'} onPress={video.toggleMuted}>
              <SymbolView name={video.muted
                ? { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' }
                : { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }} size={20} tintColor={C.white} />
            </VideoOverlayButton>
          </Animated.View>
        </>}
      </View>
    </View>;
  }

  return <>
    {!fullscreen.visible && footage()}
    {!fullscreen.visible && controls()}
    <VideoFullscreen controller={fullscreen} onClose={toggleFullscreen}
      footage={fullscreen.visible ? footage() : null}>
      {insets => controls(insets)}
    </VideoFullscreen>
  </>;
}

function clipTime(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function ClipTimeline({ seconds, duration, onSeek }: { seconds: number; duration: number; onSeek: (seconds: number) => void }) {
  const [width, setWidth] = useState(0);
  const position = Math.max(0, Math.min(duration, seconds));
  return <View style={s.timeline}>
    <Text style={s.timestamp}>{clipTime(position)} / {clipTime(duration)}</Text>
    <Pressable accessibilityRole="adjustable" accessibilityLabel="First-aid video playback position"
      accessibilityValue={{ min: 0, max: duration, now: position, text: `${clipTime(position)} of ${clipTime(duration)}` }}
      accessibilityActions={[{ name: 'increment', label: 'Forward 10 seconds' }, { name: 'decrement', label: 'Back 10 seconds' }]}
      onAccessibilityAction={event => onSeek(position + (event.nativeEvent.actionName === 'increment' ? 10 : -10))}
      disabled={duration <= 0}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      onPress={event => { if (width > 0) onSeek(event.nativeEvent.locationX / width * duration); }}
      style={s.timelineTouch}>
      <View pointerEvents="none" style={s.timelineTrack}>
        <View style={[s.timelineProgress, { width: `${duration > 0 ? position / duration * 100 : 0}%` }]} />
      </View>
    </Pressable>
  </View>;
}

const s = StyleSheet.create({
  topRow: { position: 'absolute', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, zIndex: 2 },
  portraitTopRow: { top: 6, left: 6, right: 6 },
  fullscreenBadge: { width: 18, height: 18, position: 'relative' },
  fullscreenCorner: { position: 'absolute', width: 6, height: 6, borderColor: C.white },
  fullscreenTopLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  fullscreenTopRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  fullscreenBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  fullscreenBottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  hiddenControls: { display: 'none' },
  playPosition: { position: 'absolute', top: '50%', left: '50%', marginTop: -28, marginLeft: -28 },
  playButton: { width: 56, height: 56, minHeight: 56, borderRadius: 28 },
  playGlyph: { width: 0, height: 0, marginLeft: 4, borderTopWidth: 10, borderBottomWidth: 10, borderLeftWidth: 16, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: C.white },
  pauseGlyph: { flexDirection: 'row', gap: 6 },
  pauseBar: { width: 5, height: 20, borderRadius: 2, backgroundColor: C.white },
  playbackRow: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.45)', paddingHorizontal: 8 },
  timeline: { flex: 1, minWidth: 0, gap: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  timestamp: { maxWidth: '100%', color: C.white, fontFamily: F.semiBold, fontSize: 11, fontVariant: ['tabular-nums'] },
  timelineTouch: { flex: 1, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  timelineTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.4)', overflow: 'hidden' },
  timelineProgress: { height: '100%', backgroundColor: C.white },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
