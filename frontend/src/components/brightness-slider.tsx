import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { BrandColors as C } from '@/constants/brand';

export type BrightnessSliderProps = { value: number; onValueChange: (value: number) => void };

export function BrightnessSlider({ value, onValueChange }: BrightnessSliderProps) {
  const width = useRef(0);
  const [dragging, setDragging] = useState(false);
  function update(event: GestureResponderEvent) {
    if (width.current <= 20) return;
    const percent = Math.round((event.nativeEvent.locationX - 10) / (width.current - 20) * 100);
    onValueChange(Math.max(0, Math.min(100, percent)));
  }
  return <View accessible accessibilityRole="adjustable" accessibilityLabel="Brightness (preview)"
    accessibilityValue={{ min: 0, max: 100, now: value, text: `${value}%` }}
    accessibilityActions={[{ name: 'increment', label: 'Increase brightness' }, { name: 'decrement', label: 'Decrease brightness' }]}
    onAccessibilityAction={event => {
      if (event.nativeEvent.actionName === 'increment') onValueChange(Math.min(100, value + 5));
      if (event.nativeEvent.actionName === 'decrement') onValueChange(Math.max(0, value - 5));
    }}
    onLayout={event => { width.current = event.nativeEvent.layout.width; }}
    onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
    onResponderGrant={event => { setDragging(true); update(event); }} onResponderMove={update}
    onResponderRelease={() => setDragging(false)} onResponderTerminate={() => setDragging(false)}
    onResponderTerminationRequest={() => false} style={s.touchArea}>
    <View pointerEvents="none" style={s.track}>
      <View style={[s.fill, { width: `${value}%` }]} />
    </View>
    <View pointerEvents="none" style={s.thumbArea}><View style={[s.thumb, { left: `${value}%` }, dragging && s.dragging]} /></View>
  </View>;
}

const s = StyleSheet.create({
  touchArea: { height: 44, justifyContent: 'center' },
  track: { height: 22, borderRadius: 11, backgroundColor: '#F8F9FC', borderWidth: 1, borderColor: '#C5CFDC', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(50,80,123,.08)' },
  fill: { height: '100%', backgroundColor: '#C5DDF5' },
  thumbArea: { position: 'absolute', left: 10, right: 10, top: 12, height: 20 },
  thumb: { position: 'absolute', width: 20, height: 20, marginLeft: -10, borderRadius: 10, backgroundColor: C.blue, borderWidth: 1, borderColor: C.blue, boxShadow: '0 2px 5px rgba(50,80,123,.25)' },
  dragging: { borderColor: C.blue, boxShadow: '0 0 0 3px rgba(50,80,123,.18)' },
});
