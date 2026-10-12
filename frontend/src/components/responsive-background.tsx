import { Image, type ImageProps } from 'expo-image';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

/** Keep the 390 x 844 artwork aligned with content on short and tall phones. */
export function ResponsiveBackground({ source }: { source: ImageProps['source'] }) {
  const { scaleSize, insets } = useResponsiveLayout();
  return <Image pointerEvents="none" source={source} contentFit="fill" transition={0} accessible={false}
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: insets.top + scaleSize(844) }} />;
}
