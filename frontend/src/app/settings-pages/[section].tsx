import { useLocalSearchParams } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SettingsPage } from '@/components/settings-page';
import { SettingsDetails } from '@/components/settings-details';
import { SettingsDevicePage } from '@/components/settings-device-page';
import { SettingsAboutPage } from '@/components/settings-about-page';
import { SettingsSections, type SettingsSection } from '@/constants/settings';
import { Policies, PolicyDetails } from '@/constants/policies';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import appPackage from '../../../package.json';

export function generateStaticParams() {
  return Object.keys(SettingsSections).map(section => ({ section }));
}

export default function SettingsDetailScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  if (!section || !Object.prototype.hasOwnProperty.call(SettingsSections, section)) {
    return <SettingsPage title="Settings"><Text style={s.body}>This settings page is unavailable. Use the back button to return to Settings.</Text></SettingsPage>;
  }
  const title = SettingsSections[section as SettingsSection];
  if (section === 'device-information') return <SettingsDevicePage />;
  if (section === 'about') return <SettingsAboutPage />;
  if (section === 'privacy-policy' || section === 'terms-of-service') {
    const paragraphs = section === 'privacy-policy' ? Policies.privacy : Policies.terms;
    return <SettingsPage white title={title} fallback="about">
      <Text style={s.meta}>{PolicyDetails.version} · {PolicyDetails.operator}</Text>
      {paragraphs.map(([heading, body]) => <View key={heading} style={s.paragraph}><Text accessibilityRole="header" style={s.heading}>{heading}</Text><Text style={s.body}>{body}</Text></View>)}
    </SettingsPage>;
  }
  if (section === 'app-version' || section === 'system-information') return <SettingsPage white title={title} fallback="about">
    <View style={s.paper}>
      {section === 'app-version' ? <><Text style={s.heading}>LittleEye</Text><Text style={s.version}>v{appPackage.version}</Text><Text style={s.body}>Child Safety AI Monitoring System</Text></> :
        <><Text style={s.heading}>LittleEye</Text><Text style={s.body}>Child Safety AI Monitoring System</Text><Text style={s.heading}>Current platform</Text><Text style={s.body}>{Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}</Text>
          <Text style={s.heading}>Monitoring</Text><Text style={s.body}>LittleEye is designed to use CCTV footage for AI fall detection. Camera monitoring, detection and notification services are not connected in this preview.</Text></>}
    </View>
  </SettingsPage>;
  return <SettingsPage title={title}><View style={s.paper}><SettingsDetails key={section} section={title} /></View></SettingsPage>;
}

const s = StyleSheet.create({
  paper: { backgroundColor: C.white, borderRadius: 28, padding: 22, boxShadow: '0 8px 22px rgba(111,160,235,.2)' },
  heading: { fontFamily: F.bold, fontSize: 15, lineHeight: 23, color: C.blue, marginTop: 18, marginBottom: 8 },
  body: { fontFamily: F.regular, fontSize: 12, lineHeight: 22, color: C.blue }, version: { fontFamily: F.extraBold, fontSize: 32, color: C.blue, marginVertical: 16 },
  meta: { fontFamily: F.semiBold, fontSize: 10, lineHeight: 18, color: C.blue, marginBottom: 10 }, paragraph: { marginBottom: 14 },
});
