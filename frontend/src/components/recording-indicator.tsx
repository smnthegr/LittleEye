import { useEventListener } from 'expo';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StatusDot } from '@/components/status-dot';
import { BrandFonts } from '@/constants/brand';
import type { RecordingPhase } from '@/hooks/use-sample-recording';
import type { useSampleVideo } from '@/hooks/use-sample-video';

type Props = {
  phase: RecordingPhase; startedAt: number; active: boolean;
  video: ReturnType<typeof useSampleVideo>;
};

/** The elapsed timer updates only this small badge, not the video screen. */
export function RecordingIndicator({ phase, startedAt, active, video }: Props) {
  const [progress, setProgress] = useState({ start: -1, seconds: 0 });
  useEventListener(video.player, 'timeUpdate', () => {
    if (!active || phase !== 'recording') return;
    const seconds = Math.max(0, Math.floor(video.getRecordingPosition().timeline - startedAt));
    setProgress(previous => previous.start === startedAt && previous.seconds === seconds ? previous : { start: startedAt, seconds });
  });
  if (phase !== 'recording') return null;
  const seconds = progress.start === startedAt ? progress.seconds : 0;
  const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <View pointerEvents="none" accessible accessibilityLiveRegion="polite"
    accessibilityLabel="Recording in progress"
    style={s.badge}>
    <View style={s.row}>
      <StatusDot color="#FF5B69" size={7} active={active} />
      <Text style={s.title}>{`REC  ${elapsed}`}</Text>
    </View>
    <Text style={s.subtitle}>With audio</Text>
  </View>;
}

const s = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 1, backgroundColor: 'rgba(0,0,0,.45)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { color: '#FFF', fontFamily: BrandFonts.bold, fontSize: 11, lineHeight: 16 },
  subtitle: { color: '#DCE7F4', fontFamily: BrandFonts.regular, fontSize: 10, lineHeight: 14 },
});
