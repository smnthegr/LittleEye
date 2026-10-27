import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';

import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { useTimelineWheel } from '@/hooks/use-timeline-wheel';
import {
  clampPlaybackSeconds, clampTimelineRange, formatPlaybackTime, FULL_TIMELINE_RANGE, getTimelineSecondsAtPosition,
  getTimelineTicks, getTimelineViewportForTime, panTimelineViewport, PLAYBACK_DURATION_SECONDS,
  zoomTimelineViewport, type TimelineViewport, type TimelineRange,
} from '@/utils/playback-timeline';

type Props = { seconds: number; onSeek: (seconds: number) => void; onScrubChange: (scrubbing: boolean) => void; compact?: boolean; recordingDate?: string; availableUntil?: number; range?: TimelineRange; highlightAt?: number };
type Drag = { mode: 'seek' | 'pan'; x: number; localX: number; anchorSeconds: number; selectedSeconds: number;
  viewport: TimelineViewport; moved: boolean; onHandle: boolean };
type Pinch = { mode: 'pinch'; distance: number; viewport: TimelineViewport; seconds: number; lifted: boolean };

function pinchDistance(event: GestureResponderEvent) {
  const [first, second] = event.nativeEvent.touches;
  return first && second ? Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY) : 0;
}

/** Pinch the filmstrip to change its scale; drag the marker or scroll the zoomed footage. */
export function PlaybackTimeline({ seconds, onSeek: requestSeek, onScrubChange, compact = false, recordingDate, availableUntil = PLAYBACK_DURATION_SECONDS, range, highlightAt }: Props) {
  const { fontScale } = useWindowDimensions();
  const rangeStart = range?.start ?? FULL_TIMELINE_RANGE.start;
  const rangeEnd = range?.end ?? FULL_TIMELINE_RANGE.end;
  const bounds = useMemo(() => clampTimelineRange({ start: rangeStart, end: rangeEnd }), [rangeStart, rangeEnd]);
  const limit = Math.max(bounds.start, Math.min(bounds.end, clampPlaybackSeconds(availableUntil)));
  const onSeek = useCallback((value: number) => requestSeek(Math.max(bounds.start, Math.min(limit, clampPlaybackSeconds(value)))), [bounds.start, limit, requestSeek]);
  const [scrubbing, setScrubbing] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [viewport, setViewport] = useState<TimelineViewport>(() => ({ start: bounds.start, span: bounds.end - bounds.start }));
  const width = useRef(0);
  const gesture = useRef<Drag | Pinch | null>(null);
  const view = getTimelineViewportForTime(viewport, seconds, bounds);
  const progress = Math.max(0, Math.min(1, (seconds - view.start) / view.span));
  const availableProgress = Math.max(0, Math.min(1, (limit - view.start) / view.span));
  const usableWidth = Math.max(0, trackWidth - 20);
  const bubbleWidth = Math.min(trackWidth, Math.max(88, Math.ceil(8 * 12 * 0.65 * fontScale + 12)));
  const bubbleLeft = Math.max(bubbleWidth / 2, Math.min(trackWidth - bubbleWidth / 2, 10 + progress * usableWidth));
  const { ticks, labels, labelWidth } = getTimelineTicks(view, usableWidth, bounds, fontScale);
  const rulerHeight = Math.max(25, Math.ceil(12 * fontScale + 13));
  const rulerGrowth = rulerHeight - 25;
  const frameWidth = Math.min(120, 56 * Math.sqrt((bounds.end - bounds.start) / view.span));
  const frameOffset = -(view.start / view.span * usableWidth % frameWidth);
  const frameCount = Math.ceil(usableWidth / frameWidth) + 2;

  const wheelZoom = useCallback((scale: number) => {
    onSeek(seconds);
    setViewport(previous => zoomTimelineViewport(getTimelineViewportForTime(previous, seconds, bounds), scale, seconds, bounds));
  }, [bounds, onSeek, seconds]);
  const wheelRef = useTimelineWheel(wheelZoom);

  function beginPinch(event: GestureResponderEvent) {
    const distance = pinchDistance(event);
    if (distance < 1) return false;
    gesture.current = { mode: 'pinch', distance, viewport: view, seconds, lifted: false };
    return true;
  }
  function begin(event: GestureResponderEvent) {
    if (width.current <= 0) return;
    setScrubbing(true); onScrubChange(true); onSeek(seconds);
    if (beginPinch(event)) return;
    const { pageX, locationX } = event.nativeEvent;
    const localX = locationX - 10;
    const onHandle = Math.abs(localX - progress * width.current) <= 20;
    gesture.current = {
      mode: !onHandle && view.span < bounds.end - bounds.start ? 'pan' : 'seek',
      x: pageX, localX, viewport: view, selectedSeconds: seconds, moved: false, onHandle,
      anchorSeconds: onHandle ? seconds : getTimelineSecondsAtPosition(localX, width.current, view, bounds),
    };
  }
  function move(event: GestureResponderEvent) {
    const current = gesture.current;
    if (!current) return;
    if (event.nativeEvent.touches.length >= 2) {
      if (current.mode !== 'pinch') { beginPinch(event); return; }
      if (current.lifted) return;
      const distance = pinchDistance(event);
      if (distance >= 1) setViewport(zoomTimelineViewport(current.viewport, distance / current.distance, current.seconds, bounds));
      return;
    }
    // Lifting one finger after a pinch must not turn the remaining finger into a seek.
    if (current.mode === 'pinch') return;
    const deltaX = event.nativeEvent.pageX - current.x;
    if (Math.abs(deltaX) < 3 && !current.moved) return;
    current.moved = true;
    if (current.mode === 'pan') {
      const next = panTimelineViewport(current.viewport, deltaX, width.current, bounds);
      setViewport(next);
      onSeek(clampPlaybackSeconds(current.selectedSeconds + next.start - current.viewport.start));
    } else {
      const nextSeconds = getTimelineSecondsAtPosition(
        (current.anchorSeconds - current.viewport.start) / current.viewport.span * width.current + deltaX,
        width.current, current.viewport, bounds,
      );
      setViewport(getTimelineViewportForTime(current.viewport, nextSeconds, bounds));
      onSeek(nextSeconds);
    }
  }
  function finish(cancelled = false) {
    const current = gesture.current;
    if (!cancelled && current && current.mode !== 'pinch' && !current.moved && !current.onHandle) {
      onSeek(getTimelineSecondsAtPosition(current.localX, width.current, current.viewport, bounds));
    }
    gesture.current = null; setScrubbing(false); onScrubChange(false);
  }
  function zoomBy(scale: number) { setViewport(zoomTimelineViewport(view, scale, seconds, bounds)); }

  return <View pointerEvents="box-none" style={[s.container, compact && s.landscape]}>
    <View pointerEvents="none" style={s.times}>
      <Text style={[s.time, compact && s.lightTime]}>{formatPlaybackTime(seconds)}</Text>
      {recordingDate && <Text numberOfLines={1} style={[s.recordingDate, { minWidth: Math.min(usableWidth, 80 * fontScale) }, compact && s.lightTime]}>{recordingDate}</Text>}
      <Text style={[s.time, compact && s.lightTime]}>{formatPlaybackTime(limit)}</Text>
    </View>
    <View ref={wheelRef} accessible accessibilityRole="adjustable" accessibilityLabel="Playback position"
      accessibilityHint="Pinch to zoom the timeline. Drag the marker to seek, or drag zoomed footage to scroll."
      accessibilityValue={{ min: bounds.start, max: limit, now: Math.min(seconds, limit), text: formatPlaybackTime(seconds) }}
      accessibilityActions={[{ name: 'increment', label: 'Forward' + (highlightAt === undefined ? ' one minute' : ' one second') }, { name: 'decrement', label: 'Back' + (highlightAt === undefined ? ' one minute' : ' one second') },
        { name: 'zoomIn', label: 'Zoom in timeline' }, { name: 'zoomOut', label: 'Zoom out timeline' }]}
      onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === 'increment') onSeek(seconds + (highlightAt === undefined ? 60 : 1));
        if (event.nativeEvent.actionName === 'decrement') onSeek(seconds - (highlightAt === undefined ? 60 : 1));
        if (event.nativeEvent.actionName === 'zoomIn') zoomBy(2);
        if (event.nativeEvent.actionName === 'zoomOut') zoomBy(0.5);
      }}
      {...(Platform.OS === 'web' ? { tabIndex: 0, onKeyDown: (event: { key: string; preventDefault: () => void }) => {
        const step = highlightAt === undefined ? 60 : 1;
        const offset = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[event.key];
        if (['+', '=', '-', '_'].includes(event.key)) {
          event.preventDefault(); zoomBy(event.key === '+' || event.key === '=' ? 2 : 0.5);
        } else if (offset !== undefined || event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          onSeek(clampPlaybackSeconds(event.key === 'Home' ? bounds.start : event.key === 'End' ? limit : seconds + (offset ?? 0)));
        }
      } } : {})}
      onLayout={event => { const measured = event.nativeEvent.layout.width; setTrackWidth(measured); width.current = Math.max(0, measured - 20); }}
      onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false} onResponderGrant={begin}
      onResponderStart={event => {
        if (event.nativeEvent.touches.length >= 2) beginPinch(event);
      }}
      onResponderMove={move}
      onResponderEnd={event => {
        if (gesture.current?.mode === 'pinch' && event.nativeEvent.touches.length < 2) gesture.current.lifted = true;
      }}
      onResponderRelease={() => finish()} onResponderTerminate={() => finish(true)}
      style={[s.touchArea, compact && s.compactTouchArea, { height: (compact ? 96 : 124) + rulerGrowth }, Platform.OS === 'web' && s.webTouchArea]}>
      {scrubbing && <View pointerEvents="none" style={[s.bubble, compact && s.compactBubble, { left: bubbleLeft, width: bubbleWidth, marginLeft: -bubbleWidth / 2 }]}>
        <Text numberOfLines={1} style={s.bubbleTime}>{formatPlaybackTime(seconds)}</Text>
      </View>}
      <View pointerEvents="none" style={[s.trackArea, compact && s.compactTrackArea, { height: 76 + rulerGrowth }]}>
        <View style={[s.track, compact && s.darkTrack, { height: 76 + rulerGrowth }]}>
          <View style={[s.filmstrip, { top: rulerHeight, left: frameOffset, width: frameCount * frameWidth }]}>
            {Array.from({ length: frameCount }, (_, index) => <View key={index}
              style={[s.frame, { width: frameWidth, backgroundColor: index % 2 ? '#36516F' : '#2E4662' }]} />)}
          </View>
          <View style={[s.fill, { top: rulerHeight, width: `${progress * 100}%` }, compact && s.lightFill]} />
          {limit < PLAYBACK_DURATION_SECONDS && <View style={[s.unavailable, { top: rulerHeight, left: `${availableProgress * 100}%` }]} />}
          <View style={[s.ruler, { height: rulerHeight }]}>
            {ticks.map(tick => <View key={tick.seconds} style={[s.rulerMark, { left: `${tick.fraction * 100}%` }]} />)}
            {labels.map(tick => <Text key={tick.seconds} numberOfLines={1} style={[s.rulerText, {
              width: labelWidth, left: tick.left,
            }]}>{tick.label}</Text>)}
          </View>
        </View>
        <View style={[s.thumb, { height: 92 + rulerGrowth, left: `${progress * 100}%` }, scrubbing && s.thumbActive]}>
          <View style={s.grip} />
        </View>
        {highlightAt !== undefined && highlightAt >= view.start && highlightAt <= view.start + view.span && <View
          style={[s.eventMarker, { height: 76 + rulerGrowth, left: `${(highlightAt - view.start) / view.span * 100}%` }]}>
          <View style={s.eventMarkerCap} />
        </View>}
      </View>
    </View>
  </View>;
}

const s = StyleSheet.create({
  container: { marginHorizontal: -16 },
  landscape: { marginHorizontal: 0, paddingHorizontal: 8, paddingTop: 6, paddingBottom: 0, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.52)' },
  times: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 10 },
  time: { color: '#667B98', fontFamily: F.semiBold, fontSize: 12, lineHeight: 18, fontVariant: ['tabular-nums'] },
  lightTime: { color: C.white },
  recordingDate: { flex: 1, minWidth: 0, marginHorizontal: 12, textAlign: 'center', color: '#667B98', fontFamily: F.semiBold, fontSize: 12, lineHeight: 18 },
  touchArea: { height: 124, justifyContent: 'center' },
  compactTouchArea: { height: 96 },
  webTouchArea: { touchAction: 'none', userSelect: 'none' },
  trackArea: { position: 'absolute', left: 10, right: 10, top: 30, height: 76 },
  compactTrackArea: { top: 8 },
  track: { height: 76, borderRadius: 8, overflow: 'hidden', backgroundColor: '#233C5E', borderWidth: 1, borderColor: '#94B0D5', boxShadow: '0 3px 10px rgba(50,80,123,.12)' },
  darkTrack: { borderWidth: 0 },
  filmstrip: { position: 'absolute', top: 25, bottom: 0, flexDirection: 'row', opacity: 0.78 },
  frame: { height: '100%', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,.2)' },
  fill: { position: 'absolute', top: 25, bottom: 0, backgroundColor: 'rgba(148,176,213,.35)' },
  lightFill: { backgroundColor: 'rgba(148,176,213,.45)' },
  unavailable: { position: 'absolute', top: 25, bottom: 0, right: 0, backgroundColor: 'rgba(10,22,39,.75)' },
  ruler: { position: 'absolute', top: 0, left: 0, right: 0, height: 25, backgroundColor: '#233C5E' },
  rulerText: { position: 'absolute', top: 2, width: 36, textAlign: 'center', color: '#E4EDF9', fontFamily: F.semiBold, fontSize: 9, lineHeight: 12, fontVariant: ['tabular-nums'] },
  rulerMark: { position: 'absolute', bottom: 0, width: 1, height: 7, backgroundColor: '#E4EDF9' },
  thumb: { position: 'absolute', top: -8, width: 20, height: 92, marginLeft: -10, borderRadius: 5, backgroundColor: C.white, borderWidth: 2, borderColor: C.blue, boxShadow: '0 3px 9px rgba(15,35,58,.3)', alignItems: 'center', justifyContent: 'center' },
  thumbActive: { boxShadow: '0 0 0 4px rgba(148,176,213,.35), 0 3px 9px rgba(15,35,58,.3)' },
  grip: { height: 42, width: 3, borderRadius: 1, backgroundColor: C.blue },
  bubble: { position: 'absolute', top: -3, marginLeft: -44, width: 88, minHeight: 24, paddingVertical: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(0,0,0,.45)', boxShadow: '0 3px 10px rgba(50,80,123,.15)' },
  eventMarker: { position: 'absolute', top: 0, height: 76, width: 2, marginLeft: -1, backgroundColor: '#FF4D5E', zIndex: 3 },
  eventMarkerCap: { position: 'absolute', top: -4, left: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4D5E' },
  compactBubble: { top: -54 },
  bubbleTime: { color: C.white, fontFamily: F.bold, fontSize: 12, lineHeight: 17, fontVariant: ['tabular-nums'] },
});
