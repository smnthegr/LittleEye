/* eslint-disable react-hooks/immutability -- Expo VideoPlayer is an imperative native object with documented currentTime and muted setters. */
import { useEvent, useEventListener } from 'expo';
import { useFocusEffect, useIsFocused } from 'expo-router';
import { useVideoPlayer, type VideoSource } from 'expo-video';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { createFootageClock } from '@/utils/footage-clock';
import { FULL_TIMELINE_RANGE, type TimelineRange } from '@/utils/playback-timeline';
import { createPlaybackLifetime } from '@/utils/playback-lifetime';
import { createMediaSourceQueue } from '@/utils/media-source-queue';

/** A real media player; the demo timeline advances only when the media advances. */
export function useFootageVideo({ source, enabled = true, autoPlay = false, initialSeconds = 0, publishTime = true, range = FULL_TIMELINE_RANGE }: { source: VideoSource; enabled?: boolean; autoPlay?: boolean; initialSeconds?: number; publishTime?: boolean; range?: TimelineRange }) {
  const isFocused = useIsFocused();
  const available = source !== null;
  const shouldLoad = available && enabled && isFocused;
  const [clock] = useState(() => createFootageClock(initialSeconds));
  const [seconds, setSeconds] = useState(initialSeconds);
  const [muted, setMuted] = useState(autoPlay);
  const focused = useRef(false);
  const wantsPlayback = useRef(autoPlay);
  const [loadError, setLoadError] = useState<Error>();
  // Loading a source in the constructor can stall navigation on iOS. Load asynchronously after focus.
  const player = useVideoPlayer(Platform.OS === 'web' && shouldLoad ? source : null, player => {
    player.loop = false;
    player.muted = autoPlay;
    player.volume = 0.65;
    player.timeUpdateEventInterval = Platform.OS === 'web' && shouldLoad ? 1 : 0;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const lifetime = useMemo(() => createPlaybackLifetime(player), [player]);
  const loadSource = useMemo(() => createMediaSourceQueue(
    (next: VideoSource) => {
      player.timeUpdateEventInterval = next === null ? 0 : 1;
      return player.replaceAsync(next);
    }, () => lifetime.active,
  ), [lifetime, player]);
  const sourceRequested = useRef(false);

  useLayoutEffect(() => {
    lifetime.mount();
    // Layout cleanup runs before useVideoPlayer releases its native object in passive cleanup.
    return () => {
      // Also stop the web player's interval before transferring/releasing its view.
      if (lifetime.active) player.timeUpdateEventInterval = 0;
      lifetime.unmount();
    };
  }, [lifetime, player]);

  useEffect(() => {
    // Browser source loading is already asynchronous. Recreate its empty player on blur
    // instead of replaceAsync(), whose web implementation automatically starts playback.
    if (Platform.OS === 'web') return;
    // An empty viewer never loads a decoder or media data.
    if (!shouldLoad && !sourceRequested.current) return;
    sourceRequested.current = shouldLoad;
    let cancelled = false;
    void loadSource(shouldLoad ? source : null).then(() => {
      if (!cancelled && lifetime.active) setLoadError(undefined);
    }, error => {
      if (!cancelled && lifetime.active) setLoadError(error instanceof Error ? error : new Error('Video could not load.'));
    });
    return () => { cancelled = true; };
  }, [lifetime, loadSource, shouldLoad, source]);

  const resume = useCallback(() => {
    if (!lifetime.active || !shouldLoad || !focused.current || AppState.currentState === 'background' || AppState.currentState === 'inactive') return;
    // A new web video element is created when transferring to/from the fullscreen modal.
    const restored = Math.max(range.start, Math.min(range.end, clock.seconds));
    player.currentTime = clock.seek(restored);
    if (publishTime) setSeconds(previous => previous === restored ? previous : restored);
    if (wantsPlayback.current) player.play();
  }, [clock, lifetime, player, publishTime, range.start, range.end, shouldLoad]);

  useEventListener(player, 'sourceLoad', resume);
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (!lifetime.active || !shouldLoad || !focused.current || !wantsPlayback.current || !player.playing) return;
    const next = clock.update(Math.max(range.start, Math.min(range.end, currentTime)));
    const atEnd = currentTime >= range.end;
    // The UI displays whole seconds. The precise media clock stays in memory for seeking/recording.
    if (publishTime) setSeconds(previous => atEnd ? next : Math.floor(previous) === Math.floor(next) ? previous : Math.floor(next));
    if (atEnd) {
      wantsPlayback.current = false;
      lifetime.pause();
      player.currentTime = range.end;
    }
  });

  useEventListener(player, 'playToEnd', () => {
    if (!lifetime.active || !shouldLoad || !focused.current) return;
    wantsPlayback.current = false;
    const end = clock.update(Math.max(range.start, Math.min(range.end, player.currentTime)));
    if (publishTime) setSeconds(end);
  });

  useFocusEffect(useCallback(() => {
    focused.current = true;
    if (autoPlay) wantsPlayback.current = true;
    resume();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') resume();
      else lifetime.pause();
    });
    return () => {
      focused.current = false;
      if (!autoPlay) wantsPlayback.current = false;
      subscription.remove();
      // This is also called on unmount, after Expo may have released the player.
      lifetime.pause();
    };
  }, [autoPlay, lifetime, resume]));

  function seek(time: number, { pause = true } = {}) {
    if (!lifetime.active) return;
    const target = Number.isFinite(time) ? Math.max(range.start, Math.min(range.end, time)) : range.start;
    if (pause) {
      wantsPlayback.current = false;
      lifetime.pause();
    }
    const mediaTime = clock.seek(target);
    setSeconds(target);
    if (shouldLoad) player.currentTime = mediaTime;
  }

  function play() {
    if (!lifetime.active || !shouldLoad || !focused.current) return;
    wantsPlayback.current = true;
    player.play();
  }

  function pause() {
    wantsPlayback.current = false;
    lifetime.pause();
  }

  function toggleMuted() {
    if (!lifetime.active) return;
    const next = !muted;
    player.muted = next;
    setMuted(next);
    // Call play in the same user gesture, so browsers can allow audible playback.
    if (autoPlay || wantsPlayback.current) play();
  }

  function getRecordingPosition() {
    if (!lifetime.active || !shouldLoad) return { timeline: clock.seconds, media: clock.mediaTime };
    const media = player.currentTime;
    return { timeline: clock.update(media), media };
  }

  return { available, player, seconds, isPlaying, muted, toggleMuted, seek, play, pause, getRecordingPosition, status, error: loadError ?? error };
}
