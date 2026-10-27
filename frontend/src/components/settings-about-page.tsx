import { GlowButton } from '@/components/glow-button';
import { useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SettingsPage } from './settings-page';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import type { SettingsSection } from '@/constants/settings';
import appPackage from '../../package.json';
import { useSettingsCamera } from '@/hooks/use-settings-camera';

const links: { title: string; subtitle?: string; icon: string; page: SettingsSection }[] = [
  { title: 'App Version', subtitle: appPackage.version, icon: '⚙', page: 'app-version' },
  { title: 'System Information', subtitle: 'iOS / Android', icon: 'device', page: 'system-information' },
  { title: 'Privacy Policy', icon: 'security', page: 'privacy-policy' },
  { title: 'Terms of Service', icon: 'document', page: 'terms-of-service' },
];

export function SettingsAboutPage() {
  const s = useResponsiveStyles(baseStyles);
  const { isPreview } = useSettingsCamera();
  const { from } = useLocalSearchParams<{ from?: string }>();
  return <SettingsPage white>
    <View style={s.hero}><Text accessibilityRole="header" style={s.logo}>Little<Text style={s.eye}>Eye</Text></Text>
      <Text style={s.tagline}>Smarter eyes. Safer moments.</Text></View>
    <View style={s.links}>{links.map(link => <GlowButton key={link.page} accessibilityRole="button"
      onPress={() => router.push({ pathname: '/settings-pages/[section]', params: {
        section: link.page, ...(isPreview && { preview: 'connected' }), ...(from === 'profile' && { from: 'profile' }),
      } })}
      style={s.row}>
      <View accessible={false} style={s.icon}>
        {link.icon === 'device' ? <View style={s.phone}><View style={s.phoneDot} /></View> :
          link.icon === 'security' ? <View style={s.shield}><Text style={s.shieldKey}>•</Text></View> :
            link.icon === 'document' ? <View style={s.document}><View style={s.line} /><View style={s.line} /><View style={s.line} /></View> :
              <Text style={s.iconText}>{link.icon}</Text>}
      </View>
      <View style={s.rowText}><Text style={s.rowTitle}>{link.title}</Text>{link.subtitle && <Text style={s.subtitle}>{link.subtitle}</Text>}</View><View style={s.chevron} />
    </GlowButton>)}</View>
  </SettingsPage>;
}

const baseStyles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 40 }, logo: { fontFamily: F.extraBold, fontSize: 32, color: C.blue, textShadowColor: 'rgba(50,80,123,.2)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 4 }, eye: { color: C.lightBlue },
  tagline: { fontFamily: F.semiBold, fontSize: T.body, lineHeight: 22, color: C.blue, textAlign: 'center', marginTop: 10 },
  links: { gap: 16 }, row: { minHeight: 62, borderRadius: 30, borderWidth: 1, borderColor: '#BED1EF', backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 10, boxShadow: '0 12px 24px rgba(83,116,183,.2)' },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F3F7FB', alignItems: 'center', justifyContent: 'center' }, iconText: { fontSize: 25, color: C.blue },
  phone: { width: 12, height: 21, borderWidth: 2, borderColor: C.blue, borderRadius: 2 }, phoneDot: { position: 'absolute', width: 2, height: 2, bottom: 1, left: 3, backgroundColor: C.blue },
  shield: { width: 18, height: 21, borderRadius: 5, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: C.blue, alignItems: 'center' }, shieldKey: { color: C.white, fontSize: 16 },
  document: { width: 15, height: 20, borderWidth: 1.5, borderColor: C.blue, borderRadius: 2, padding: 3, gap: 3 }, line: { height: 1.5, backgroundColor: C.blue },
  rowText: { flex: 1 }, rowTitle: { fontFamily: F.bold, color: C.blue, fontSize: T.label, lineHeight: 22 }, subtitle: { fontFamily: F.regular, color: C.blue, fontSize: T.caption, lineHeight: 18 },
  chevron: { width: 7, height: 7, borderRightWidth: 1.5, borderTopWidth: 1.5, borderColor: C.blue, transform: [{ rotate: '45deg' }], marginRight: 10 },
});
