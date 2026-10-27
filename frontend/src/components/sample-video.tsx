import { VideoView, type VideoPlayer } from 'expo-video';
import { memo } from 'react';
import { Linking, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BrandColors, BrandFonts } from '@/constants/brand';

export const SampleVideo = memo(function SampleVideo({ player, style }: { player: VideoPlayer; style?: StyleProp<ViewStyle> }) {
  return <VideoView player={player} nativeControls={false} contentFit="cover" surfaceType="textureView"
    fullscreenOptions={{ enable: false }} allowsPictureInPicture={false} accessible={false}
    pointerEvents="none" style={[StyleSheet.absoluteFill, style]} />;
});

export const SampleVideoCredit = memo(function SampleVideoCredit() {
  return <View style={s.credit}>
    <Text style={s.note}>Sample video with audio · 52-second clip repeats on the demo timeline.</Text>
    <Text accessibilityRole="link" onPress={() => { void Linking.openURL('https://durian.blender.org/sharing/'); }} style={s.attribution}>
      Sintel trailer · © Blender Foundation · CC BY 3.0
    </Text>
  </View>;
});

const s = StyleSheet.create({
  credit: { paddingTop: 8, paddingHorizontal: 8, gap: 3, alignItems: 'center' },
  note: { color: BrandColors.blue, fontFamily: BrandFonts.regular, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  attribution: { color: '#667B98', fontFamily: BrandFonts.regular, fontSize: 10, lineHeight: 15, textAlign: 'center', textDecorationLine: 'underline' },
});
