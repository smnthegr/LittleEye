import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import type { ReactNode } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { EdgeScrollView } from './edge-scroll-view';
import { FixedPageHeader } from './fixed-page-header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { getPageHeaderLayout } from '@/utils/responsive';

export function SettingsPage({ title, children, white = false, fallback = 'settings', keyboardAware = false }: {
  title?: string; children: ReactNode; white?: boolean; fallback?: 'settings' | 'about'; keyboardAware?: boolean;
}) {
  const { pageWidth, scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const { contentTop } = getPageHeaderLayout(pageWidth, insets.top);
  const { preview, from } = useLocalSearchParams<{ preview?: string; from?: string }>();
  const fromProfile = from === 'profile';
  const settingsParams = {
    ...(__DEV__ && preview === 'connected' && { preview: 'connected' }),
    ...(fromProfile && { from: 'profile' }),
  };
  function back() {
    if (router.canGoBack()) router.back();
    else if (fallback === 'about') router.replace({ pathname: '/settings-pages/[section]', params: { section: 'about', ...settingsParams } });
    else router.replace({ pathname: '/settings', params: settingsParams });
  }
  return <View style={s.screen}>
    <StatusBar style={white ? 'dark' : 'light'} />
    <EdgeScrollView topColor={white ? C.white : '#2C527F'} bottomColor={C.white} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={keyboardAware}
      contentContainerStyle={{ paddingBottom: insets.bottom + scaleSize(32) }}>
      <View style={[s.header, white && s.whiteHeader, { paddingTop: contentTop }]}>
        {!white && <><View pointerEvents="none" style={s.blob} /><View pointerEvents="none" style={s.wave} /></>}
        <View style={s.headerInner}>
          {!!title && <Text accessibilityRole="header" style={[s.title, white && { color: C.blue }]}>{title}</Text>}
        </View>
      </View>
      <View style={[s.content, !white && s.overlap]}>{children}</View>
    </EdgeScrollView>
    <FixedPageHeader onBack={back} light={white} profile={!fromProfile} />
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
