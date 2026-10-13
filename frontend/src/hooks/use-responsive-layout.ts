import { useMemo } from 'react';
import { useWindowDimensions, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getResponsiveMetrics, scaleStyles } from '@/utils/responsive';

export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableWidth = width - insets.left - insets.right;
  const metrics = useMemo(() => getResponsiveMetrics(availableWidth), [availableWidth]);
  return { ...metrics, height, fontScale, insets, availableHeight: height - insets.top - insets.bottom };
}

export function useResponsiveStyles<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(baseStyles: T): T {
  const { scale, textScale } = useResponsiveLayout();
  return useMemo(() => scaleStyles(baseStyles, scale, textScale), [baseStyles, scale, textScale]);
}
