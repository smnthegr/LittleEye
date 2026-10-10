import { forwardRef } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { BrandColors } from '@/constants/brand';

type EdgeScrollViewProps = ScrollViewProps & {
  topColor?: string;
  bottomColor?: string;
};

/** Keep edge colors behind the native scroll view, including its bounce/stretch. */
export const EdgeScrollView = forwardRef<ScrollView, EdgeScrollViewProps>(function EdgeScrollView({
  topColor = BrandColors.white,
  bottomColor = BrandColors.white,
  style,
  contentContainerStyle,
  children,
  ...props
}, ref) {
  const contentStyle = StyleSheet.flatten(contentContainerStyle);
  return <View style={[
    { flex: 1, width: '100%', maxWidth: contentStyle?.maxWidth, alignSelf: 'center' },
    style,
    { backgroundColor: bottomColor, overflow: 'hidden' },
  ]}>
    <View pointerEvents="none" accessible={false} style={[
      styles.topBackground, { backgroundColor: topColor },
    ]} />
    <ScrollView
      {...props}
      ref={ref}
      style={styles.scroll}
      contentContainerStyle={[{ flexGrow: 1, backgroundColor: bottomColor }, contentContainerStyle]}
      endFillColor={bottomColor}
    >
      {children}
    </ScrollView>
  </View>;
});

const styles = StyleSheet.create({
  topBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  scroll: { flex: 1, backgroundColor: 'transparent' },
});
