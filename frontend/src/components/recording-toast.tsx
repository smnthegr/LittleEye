import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';

import { BrandFonts } from '@/constants/brand';
import type { RecordingNotice } from '@/hooks/use-sample-recording';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function RecordingToast({ notice, active, bottom }: { notice: RecordingNotice | null; active: boolean; bottom: number }) {
  const [progress] = useState(() => new Animated.Value(0));
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    progress.setValue(0);
    if (!notice || !active) return;
    const remaining = Math.max(0, notice.expiresAt - Date.now());
    const duration = reducedMotion ? 0 : Math.min(160, remaining / 2);
    const animation = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(Math.max(0, remaining - duration * 2)),
      Animated.timing(progress, { toValue: 0, duration, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [active, notice, progress, reducedMotion]);
  if (!notice || !active) return null;
  return <Animated.View pointerEvents="none" accessible accessibilityLiveRegion="polite" accessibilityLabel={notice.text}
    style={[s.position, { bottom, opacity: progress, transform: [{ translateY: reducedMotion ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
    <Text style={s.message}>{notice.text}</Text>
  </Animated.View>;
}

const s = StyleSheet.create({
  position: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 30 },
  message: { maxWidth: 360, color: '#FFF', fontFamily: BrandFonts.semiBold, fontSize: 12, lineHeight: 18,
    textAlign: 'center', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.85)' },
});
