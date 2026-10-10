import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export function AuthBottomWave({ width, height }: { width: number; height: number }) {
  return <View pointerEvents="none" accessible={false} style={[styles.frame, { width, height }]}>
    <Image source={require('../../assets/images/sign-up-wave.svg')} accessible={false}
      contentFit="fill" transition={0} style={StyleSheet.absoluteFill} />
    <Image source={require('../../assets/images/auth-bottom-waves.svg')} accessible={false}
      contentFit="fill" transition={0} blurRadius={16}
      style={[StyleSheet.absoluteFill, styles.waves]} />
  </View>;
}

const styles = StyleSheet.create({
  frame: { position: 'absolute', bottom: 0, left: 0, overflow: 'hidden' },
  waves: { opacity: 0.7 },
});
