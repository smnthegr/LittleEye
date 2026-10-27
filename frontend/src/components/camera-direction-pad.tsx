import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { MinimalRingDPad } from '@/components/minimal-ring-dpad';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import type { DPadDirection } from '@/utils/minimal-ring-geometry';

const deltas = { up: [0, -3], right: [3, 0], down: [0, 3], left: [-3, 0] } as const;

/** Frontend preview adapter. No camera, network, or playback commands. */
export function CameraDirectionPad({ onMove, disabled = false }: {
  onMove: (dx: number, dy: number) => void; disabled?: boolean;
}) {
  const { scaleSize } = useResponsiveLayout();
  const size = scaleSize(246);
  const [focused, setFocused] = useState(true);
  const move = useRef(onMove);
  useLayoutEffect(() => { move.current = onMove; }, [onMove]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = useCallback(() => {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
  }, []);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => { stop(); setFocused(false); };
  }, [stop]));
  useEffect(() => stop, [stop]);

  function start(direction: DPadDirection) {
    stop();
    const [dx, dy] = deltas[direction];
    move.current(dx * 4, dy * 4);
    timer.current = setInterval(() => move.current(dx, dy), 60);
  }

  return <View pointerEvents="box-none" style={[styles.position, {
    width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2,
  }]}>
    <MinimalRingDPad size={size} onDirectionStart={start} onDirectionStop={stop}
      disabled={disabled || !focused} />
  </View>;
}

const styles = StyleSheet.create({ position: { position: 'absolute', left: '50%', top: '50%' } });
