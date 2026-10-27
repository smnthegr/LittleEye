import { StyleSheet, Text } from 'react-native';
import { BrandFonts } from '@/constants/brand';
import { useResponsiveStyles } from '@/hooks/use-responsive-layout';

/** Shared validation feedback, legible on both light and dark form surfaces. */
export function FormError({ children }: { children?: string }) {
  const s = useResponsiveStyles(styles);
  if (!children) return null;

  return <Text accessibilityRole="alert" accessibilityLiveRegion="polite"
    style={s.message}>{children}</Text>;
}

const styles = StyleSheet.create({
  message: { alignSelf: 'stretch', marginVertical: 8, fontFamily: BrandFonts.bold, fontSize: 13, lineHeight: 20, color: '#F46E79' },
});
