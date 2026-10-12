import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions, type ColorValue } from 'react-native';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

/** Give every route the same centered, safe-area-aware phone canvas. */
export function ResponsiveScreen({ children, backgroundColor, allowLandscape = false }: {
  children: ReactNode; backgroundColor: ColorValue; allowLandscape?: boolean;
}) {
  const { pageWidth, insets } = useResponsiveLayout();
  const { width, height } = useWindowDimensions();
  const canvasWidth = allowLandscape && width > height ? width - insets.left - insets.right : pageWidth;
  return <View style={[styles.screen, { backgroundColor, paddingLeft: insets.left, paddingRight: insets.right }]}>
    <View style={[styles.page, { width: canvasWidth }]}>{children}</View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  page: { flex: 1, alignSelf: 'center' },
});
