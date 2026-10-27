import { useEventListener } from 'expo';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';

import type { useSampleVideo } from '@/hooks/use-sample-video';
import { requestRecordingSavePermission, saveSampleRecording } from '@/services/save-recording';

type Video = ReturnType<typeof useSampleVideo>;
type Recording = { timeline: number; media: number };
export type RecordingPhase = 'idle' | 'recording' | 'saving' | 'saved' | 'error';
export type RecordingNotice = { text: string; expiresAt: number };

/** Record the played portion of the bundled source and save its picture and audio locally. */
export function useSampleRecording(video: Video) {
  const [phase, setPhase] = useState<RecordingPhase>('idle');
  const [startedAt, setStartedAt] = useState(0);
  const [notice, setNotice] = useState<RecordingNotice | null>(null);
  const current = useRef<Recording | null>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const focused = useRef(false);
  const latest = useRef(video);
  useLayoutEffect(() => { latest.current = video; });

  const notify = useCallback((text: string) => {
    setNotice({ text, expiresAt: Date.now() + 3200 });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), Math.max(0, notice.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [notice]);

  const finish = useCallback(async () => {
    const start = current.current;
    if (!start || busy.current) return;
    current.current = null;
    busy.current = true;
    const duration = Math.min(300, latest.current.getRecordingPosition().timeline - start.timeline);
    if (mounted.current) { setPhase('saving'); notify('Recording stopped · Saving…'); }
    try {
      if (duration < 0.25) throw new Error('The clip was too short. Let the video play for a moment before stopping.');
      const result = await saveSampleRecording(start.media, duration);
      if (mounted.current) { setPhase('saved'); notify(`Recording stopped · ${result}`); }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'The recording could not be saved. Please try again.';
      if (mounted.current) {
        setPhase('error');
        notify('Recording stopped · Not saved');
        Alert.alert('Could not save recording', detail);
      } else console.warn('Could not save recording:', detail);
    } finally {
      busy.current = false;
    }
  }, [notify]);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void finish();
    };
  }, [finish]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    const listener = AppState.addEventListener('change', state => {
      if (state !== 'active') void finish();
    });
    return () => {
      focused.current = false;
      listener.remove();
      void finish();
    };
  }, [finish]));

  useEventListener(video.player, 'timeUpdate', () => {
    const start = current.current;
    if (start && latest.current.getRecordingPosition().timeline - start.timeline >= 300) void finish();
  });

  async function toggle() {
    if (busy.current) return;
    if (current.current) { await finish(); return; }
    if (latest.current.status !== 'readyToPlay') {
      Alert.alert('Video not ready', 'Wait for the sample video to load before recording.');
      return;
    }
    busy.current = true;
    try {
      await requestRecordingSavePermission();
      if (!mounted.current || !focused.current) return;
      latest.current.play();
      current.current = latest.current.getRecordingPosition();
      setStartedAt(current.current.timeline);
      setPhase('recording');
      notify('Recording started');
    } catch (error) {
      if (mounted.current) Alert.alert('Recording unavailable', error instanceof Error ? error.message : 'Could not start recording.');
    } finally {
      busy.current = false;
    }
  }

  return { recording: phase === 'recording', saving: phase === 'saving', phase, startedAt, notice, toggle };
}
