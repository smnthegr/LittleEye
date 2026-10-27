import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { BackButton } from '@/components/back-button';
import { SettingsProfileButton } from '@/components/settings-profile-button';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { getPageHeaderLayout } from '@/utils/responsive';

/** Keep route controls outside scrolling content and clear of the phone's notch. */
export function FixedPageHeader({ onBack, light = false, profile = true, children, backLabel }: {
  onBack?: () => void;
  light?: boolean;
  profile?: boolean;
  children?: ReactNode;
  backLabel?: string;
}) {
  const { pageWidth, insets } = useResponsiveLayout();
  const layout = getPageHeaderLayout(pageWidth, insets.top);
  return <View pointerEvents="box-none" style={styles.header}>
    <View pointerEvents="box-none" style={[styles.row, {
      top: layout.top, width: pageWidth, height: layout.buttonSize,
      left: '50%', marginLeft: -pageWidth / 2, paddingHorizontal: layout.horizontalInset,
    }]}>
      {onBack && <BackButton light={light} accessibilityLabel={backLabel} onPress={onBack} style={{
        width: layout.buttonSize, height: layout.buttonSize, borderRadius: layout.buttonSize / 2,
      }} />}
      <View pointerEvents="box-none" style={styles.middle}>{children}</View>
      {profile && <SettingsProfileButton />}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 20 },
  row: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 12 },
  middle: { flex: 1 },
});
