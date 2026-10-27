/* eslint-disable react-hooks/immutability -- Expo VideoPlayer is an imperative native object with documented currentTime and muted setters. */
import { useEvent, useEventListener } from 'expo';
import { useFocusEffect, useIsFocused } from 'expo-router';
import { useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { createSampleVideoClock, SAMPLE_VIDEO_START } from '@/utils/sample-video-clock';
import { PLAYBACK_DURATION_SECONDS } from '@/utils/playback-timeline';
import { createPlaybackLifetime } from '@/utils/playback-lifetime';
import { createMediaSourceQueue } from '@/utils/media-source-queue';

const source = require('../../assets/sample-video.mp4');

/** A real media player; the demo timeline advances only when the media advances. */
export function useSampleVideo({ enabled = true, autoPlay = false, initialSeconds = SAMPLE_VIDEO_START, publishTime = true } = {}) {
  const isFocused = useIsFocused();
  const shouldLoad = enabled && isFocused;
  const [clock] = useState(() => createSampleVideoClock(initialSeconds));
  const [seconds, setSeconds] = useState(initialSeconds);
  const [muted, setMuted] = useState(autoPlay);
  const focused = useRef(false);
  const wantsPlayback = useRef(autoPlay);
  const [loadError, setLoadError] = useState<Error>();
  // Loading a source in the constructor can stall navigation on iOS. Load asynchronously after focus.
  const player = useVideoPlayer(Platform.OS === 'web' && shouldLoad ? source : null, player => {
    player.loop = true;
    player.muted = autoPlay;
    player.volume = 0.65;
    player.timeUpdateEventInterval = Platform.OS === 'web' && shouldLoad ? 1 : 0;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const lifetime = useMemo(() => createPlaybackLifetime(player), [player]);
  const loadSource = useMemo(() => createMediaSourceQueue(
    (next: number | null) => {
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
    // A History list without a selected recording never loads a decoder or its video data.
    if (!shouldLoad && !sourceRequested.current) return;
    sourceRequested.current = shouldLoad;
    let cancelled = false;
    void loadSource(shouldLoad ? source : null).then(() => {
      if (!cancelled && lifetime.active) setLoadError(undefined);
    }, error => {
      if (!cancelled && lifetime.active) setLoadError(error instanceof Error ? error : new Error('Video could not load.'));
    });
    return () => { cancelled = true; };
  }, [lifetime, loadSource, shouldLoad]);

  const resume = useCallback(() => {
    if (!lifetime.active || !shouldLoad || !focused.current || AppState.currentState === 'background' || AppState.currentState === 'inactive') return;
    // A new web video element is created when transferring to/from the fullscreen modal.
    player.currentTime = clock.seek(clock.seconds);
    if (wantsPlayback.current) player.play();
  }, [clock, lifetime, player, shouldLoad]);

  useEventListener(player, 'sourceLoad', resume);
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (!lifetime.active || !shouldLoad || !focused.current || !wantsPlayback.current || !player.playing) return;
    const next = Math.min(PLAYBACK_DURATION_SECONDS, clock.update(currentTime));
    // The UI displays whole seconds. The precise media clock stays in memory for seeking/recording.
    if (publishTime) setSeconds(previous => Math.floor(previous) === Math.floor(next) ? previous : Math.floor(next));
    if (next >= PLAYBACK_DURATION_SECONDS) {
      wantsPlayback.current = false;
      lifetime.pause();
    }
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
    const target = Math.max(0, Math.min(PLAYBACK_DURATION_SECONDS, time));
    if (pause) {
      wantsPlayback.current = false;
      lifetime.pause();
    }
    const mediaTime = clock.seek(target);
    setSeconds(target);
    player.currentTime = mediaTime;
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

  return { player, seconds, isPlaying, muted, toggleMuted, seek, play, pause, getRecordingPosition, status, error: loadError ?? error };
}
