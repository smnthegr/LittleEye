import { StyleSheet, Text, View } from 'react-native';
import { BrandFonts } from '@/constants/brand';

export function VideoEmptyState({ title = 'No live feed', detail = 'Video will appear when a camera stream is available.' }: { title?: string; detail?: string }) {
  return <View pointerEvents="none" style={s.panel}>
    <View style={s.camera}><View style={s.lens} /></View>
    <Text style={s.title}>{title}</Text>
    <Text style={s.detail}>{detail}</Text>
  </View>;
}

const s = StyleSheet.create({
  panel: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8, backgroundColor: '#142234' },
  camera: { width: 36, height: 26, borderRadius: 7, borderWidth: 1.5, borderColor: '#8DA3BD', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  lens: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#8DA3BD' },
  title: { color: '#EEF4FB', fontFamily: BrandFonts.semiBold, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  detail: { color: '#A3B4CA', fontFamily: BrandFonts.regular, fontSize: 11, lineHeight: 17, textAlign: 'center', maxWidth: 300 },
});
