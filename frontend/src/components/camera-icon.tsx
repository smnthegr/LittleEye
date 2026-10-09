import { StyleSheet, View } from 'react-native';
import { BrandColors } from '@/constants/brand';

export function CameraIcon({ color = BrandColors.blue, size = 42 }: { color?: string; size?: number }) {
  return <View accessible={false} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={[s.body, { width: size * .8, height: size * .56, borderColor: color }]}>
      <View style={[s.lens, { width: size * .27, height: size * .27, borderColor: color }]} />
      <View style={[s.dot, { backgroundColor: color }]} />
    </View>
    <View style={{ width: size * .3, height: size * .1, backgroundColor: color, borderRadius: 3 }} />
  </View>;
}
const s = StyleSheet.create({
  body: { borderWidth: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  lens: { borderWidth: 2, borderRadius: 50 }, dot: { position: 'absolute', width: 3, height: 3, top: 4, right: 4, borderRadius: 3 },
});
