import type { ReactNode } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackButton } from './back-button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { SettingsProfileButton } from './settings-profile-button';

export function SettingsPage({ title, children, white = false, fallback = 'settings' }: {
  title?: string; children: ReactNode; white?: boolean; fallback?: 'settings' | 'about';
}) {
  const insets = useSafeAreaInsets();
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
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      <View style={[s.header, white && s.whiteHeader, { paddingTop: insets.top + 20 }]}>
        {!white && <><View pointerEvents="none" style={s.blob} /><View pointerEvents="none" style={s.wave} /></>}
        <View style={s.headerInner}>
          <View style={s.topRow}>
            <BackButton light={white} accessibilityLabel={fallback === 'about' ? 'Back to About LittleEye' : 'Back to Settings'} onPress={back} />
            <SettingsProfileButton />
          </View>
          {!!title && <Text accessibilityRole="header" style={[s.title, white && { color: C.blue }]}>{title}</Text>}
        </View>
      </View>
      <View style={[s.content, !white && s.overlap]}>{children}</View>
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.white },
  header: { backgroundColor: '#2C527F', paddingBottom: 68, overflow: 'hidden' }, whiteHeader: { backgroundColor: C.white, paddingBottom: 12 },
  headerInner: { width: '100%', maxWidth: 440, paddingHorizontal: 28, alignSelf: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  back: { width: 44, height: 44, borderRadius: 17, backgroundColor: 'rgba(148,176,213,.42)', justifyContent: 'center', alignItems: 'center' },
  whiteBack: { backgroundColor: '#E8EFF8' }, arrow: { width: 10, height: 10, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: C.white, transform: [{ rotate: '45deg' }], marginLeft: 4 },
  title: { fontFamily: F.extraBold, fontSize: 22, lineHeight: 30, color: C.white },
  blob: { position: 'absolute', width: 280, height: 260, borderRadius: 85, right: -100, top: -50, backgroundColor: 'rgba(148,176,213,.14)', transform: [{ rotate: '25deg' }] },
  wave: { position: 'absolute', width: '120%', height: 66, left: '-10%', bottom: -40, borderRadius: '50%', backgroundColor: C.white, transform: [{ rotate: '4deg' }] },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 26 }, overlap: { marginTop: -30 },
});
