import { Image } from 'expo-image';
import { BrandColors } from '@/constants/brand';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

export function SettingsIcon({ size: designSize = 28, color = BrandColors.white }: { size?: number; color?: string }) {
  const { scaleSize } = useResponsiveLayout();
  const size = scaleSize(designSize);
  return <Image accessible={false} source={require('../../assets/images/settings-gear.svg')}
    contentFit="contain" transition={0} tintColor={color} style={{ width: size, height: size }} />;
}
