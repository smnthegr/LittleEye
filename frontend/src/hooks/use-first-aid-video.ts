/* eslint-disable react-hooks/immutability -- Expo VideoPlayer exposes imperative setters. */
import { useEvent, useEventListener } from 'expo';
import { useFocusEffect } from 'expo-router';
import { useVideoPlayer, type VideoSource } from 'expo-video';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { createPlaybackLifetime } from '@/utils/playback-lifetime';

/** One instructional clip, with its real duration and playback position. */
export function useFirstAidVideo(source: VideoSource) {
  const [loadError, setLoadError] = useState<Error>();
  const [seconds, setSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const focused = useRef(false);
  const transfer = useRef<{ seconds: number; playing: boolean } | null>(null);
  const player = useVideoPlayer(Platform.OS === 'web' ? source : null, player => {
    player.timeUpdateEventInterval = source === null ? 0 : 0.25;
  });
  const lifetime = useMemo(() => createPlaybackLifetime(player), [player]);
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { muted } = useEvent(player, 'mutedChange', { muted: player.muted });

  useLayoutEffect(() => {
    lifetime.mount();
    player.timeUpdateEventInterval = source === null ? 0 : 0.25;
    return () => {
      player.timeUpdateEventInterval = 0;
      lifetime.unmount();
    };
  }, [lifetime, player, source]);

  useEffect(() => {
    if (Platform.OS === 'web' || source === null) return;
    let cancelled = false;
    // Avoid synchronous asset loading on the iOS UI thread.
    void player.replaceAsync(source).catch(error => {
      if (!cancelled && lifetime.active) setLoadError(error instanceof Error ? error : new Error('Video could not load.'));
    });
    return () => { cancelled = true; };
  }, [lifetime, player, source]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        if (transfer.current) transfer.current.playing = false;
        lifetime.pause();
      }
    });
    return () => {
      focused.current = false;
      transfer.current = null;
      subscription.remove();
      lifetime.pause();
    };
  }, [lifetime]));

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (lifetime.active) setSeconds(currentTime);
  });

  useEventListener(player, 'sourceLoad', ({ duration }) => {
    if (!lifetime.active) return;
    setDuration(Number.isFinite(duration) ? Math.max(0, duration) : 0);
    if (!focused.current || AppState.currentState === 'background' || AppState.currentState === 'inactive') {
      lifetime.pause();
      return;
    }
    // Web creates a new HTML video element when switching modal surfaces.
    const snapshot = transfer.current;
    if (Platform.OS === 'web' && snapshot) {
      transfer.current = null;
      player.currentTime = snapshot.seconds;
      if (snapshot.playing) player.play();
      else lifetime.pause();
    }
  });

  function prepareForTransfer() {
    if (Platform.OS !== 'web' || !lifetime.active || source === null) return;
    transfer.current = { seconds: player.currentTime, playing: player.playing };
    lifetime.pause();
  }

  function togglePlayback() {
    if (!lifetime.active || !focused.current || source === null) return;
    if (player.playing) lifetime.pause();
    else {
      if (duration > 0 && player.currentTime >= duration) player.currentTime = 0;
      player.play();
    }
  }

  function seek(next: number) {
    if (!lifetime.active || !focused.current || duration <= 0) return;
    const target = Math.max(0, Math.min(duration, next));
    player.currentTime = target;
    setSeconds(target);
  }

  function toggleMuted() {
    if (lifetime.active) player.muted = !player.muted;
  }

  return { player, status, seconds, duration, isPlaying, muted, togglePlayback, seek, toggleMuted,
    error: loadError ?? error, prepareForTransfer };
}
