import { Image } from 'expo-image';
import { BrandColors } from '@/constants/brand';

export function SettingsIcon({ size = 28, color = BrandColors.white }: { size?: number; color?: string }) {
  return <Image accessible={false} source={require('../../assets/images/settings-gear.svg')}
    contentFit="contain" transition={0} tintColor={color} style={{ width: size, height: size }} />;
}
