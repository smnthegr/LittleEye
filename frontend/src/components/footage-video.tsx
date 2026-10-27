import { memo } from 'react';
import { VideoView, type VideoPlayer } from 'expo-video';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

export const FootageVideo = memo(function FootageVideo({ player, style }: { player: VideoPlayer; style?: StyleProp<ViewStyle> }) {
  return <VideoView player={player} nativeControls={false} contentFit="cover" surfaceType="textureView"
    fullscreenOptions={{ enable: false }} allowsPictureInPicture={false} accessible={false}
    pointerEvents="none" style={[StyleSheet.absoluteFill, style]} />;
});
