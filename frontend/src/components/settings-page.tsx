import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import type { ReactNode } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FixedPageHeader } from './fixed-page-header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { getPageHeaderLayout } from '@/utils/responsive';

export function SettingsPage({ title, children, white = false, fallback = 'settings' }: {
  title?: string; children: ReactNode; white?: boolean; fallback?: 'settings' | 'about';
}) {
  const { pageWidth, scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const { contentTop } = getPageHeaderLayout(pageWidth, insets.top);
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const previewParams = __DEV__ && preview === 'connected' ? { preview: 'connected' } : {};
  function back() {
    if (router.canGoBack()) router.back();
    else if (fallback === 'about') router.replace({ pathname: '/settings-pages/[section]', params: { section: 'about', ...previewParams } });
    else router.replace({ pathname: '/settings', params: previewParams });
  }
  return <View style={s.screen}>
    <StatusBar style={white ? 'dark' : 'light'} />
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + scaleSize(32) }}>
      <View style={[s.header, white && s.whiteHeader, { paddingTop: contentTop }]}>
        {!white && <><View pointerEvents="none" style={s.blob} /><View pointerEvents="none" style={s.wave} /></>}
        <View style={s.headerInner}>
          {!!title && <Text accessibilityRole="header" style={[s.title, white && { color: C.blue }]}>{title}</Text>}
        </View>
      </View>
      <View style={[s.content, !white && s.overlap]}>{children}</View>
    </ScrollView>
    <FixedPageHeader onBack={back} light={white} />
  </View>;
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.white },
  header: { backgroundColor: '#2C527F', paddingBottom: 68, overflow: 'hidden' }, whiteHeader: { backgroundColor: C.white, paddingBottom: 12 },
  headerInner: { width: '100%', paddingHorizontal: 24, alignSelf: 'center' },
  title: { fontFamily: F.extraBold, fontSize: T.title, lineHeight: 32, color: C.white },
  blob: { position: 'absolute', width: 280, height: 260, borderRadius: 85, right: -100, top: -50, backgroundColor: 'rgba(148,176,213,.14)', transform: [{ rotate: '25deg' }] },
  wave: { position: 'absolute', width: '120%', height: 66, left: '-10%', bottom: -40, borderRadius: '50%', backgroundColor: C.white, transform: [{ rotate: '4deg' }] },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 24 }, overlap: { marginTop: -30 },
});
