import { GlowButton } from '@/components/glow-button';
import { useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useState } from 'react';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { useAppSession } from './app-session';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { useSettingsCamera } from '@/hooks/use-settings-camera';

export function SettingsNetworkPanel() {
  const s = useResponsiveStyles(baseStyles);
  const session = useAppSession();
  const { camera, isPreview } = useSettingsCamera();
  const [showReconnectNotice, setShowReconnectNotice] = useState(false);
  const connected = camera?.status === 'connected';
  const status = isPreview ? 'Connected (preview)' : connected ? 'Connected' : camera ? 'Pending connection' : 'No camera connected';

  function reconnect() {
    if (session.signedIn && session.accepted) router.push('/connect-camera');
    else setShowReconnectNotice(true);
  }

  return <View>
    <View style={s.summary}>
      <View accessible={false} style={[s.wifiFrame, connected && s.connectedIcon]}>
        <Image source={require('../../assets/images/settings-wifi.svg')} accessible={false}
          contentFit="contain" transition={0} style={s.wifi} />
      </View>
      <View style={s.summaryText}>
        <Text style={s.title}>Camera Connection</Text>
        <Text style={[s.status, connected && s.green]}>{status}</Text>
        <Text style={s.caption}>Last checked: Not yet</Text>
      </View>
    </View>
    <View style={s.divider} />
    <View style={s.row}>
      <View style={s.rowText}><Text style={s.title}>Connection Status</Text>
        <Text style={s.description}>Check whether the camera feed is available.</Text></View>
      <View style={s.badge}><Text style={s.badgeText}>Not checked</Text></View>
    </View>
    <View style={s.row}>
      <View style={s.rowText}><Text style={s.title}>Reconnect Camera</Text>
        <Text style={s.description}>Review setup to restore a lost connection.</Text></View>
      <GlowButton accessibilityRole="button" accessibilityLabel="Reconnect camera"
        accessibilityHint="Opens camera setup when signed in. Live reconnection is not available in this preview."
        onPress={reconnect} style={s.reconnect}>
        <Text style={s.reconnectText}>Reconnect</Text>
      </GlowButton>
    </View>
    {showReconnectNotice && <View style={s.notice}>
      <Text accessibilityLiveRegion="polite" style={s.description}>Sign in and add your camera to review its setup. Live reconnection is not available in this preview.</Text>
    </View>}
    <View style={s.troubleshooting}>
      <View style={s.helpHeading}><View accessible={false} style={s.infoIcon}><Text style={s.infoLetter}>i</Text></View>
        <Text accessibilityRole="header" style={s.title}>Connection Troubleshooting</Text></View>
      <Text style={s.description}>Check the camera’s power supply, network connection and device availability if the live feed is interrupted.</Text>
    </View>
    <Text style={s.footnote}>Live connection checks and reconnect are not connected yet. Monitoring may be interrupted when the camera disconnects.</Text>
  </View>;
}

const baseStyles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  wifiFrame: { width: 50, height: 50, borderRadius: 15, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' }, connectedIcon: { backgroundColor: '#208653' }, wifi: { width: 28, height: 28 },
  summaryText: { flex: 1 }, title: { flexShrink: 1, fontFamily: F.bold, color: C.blue, fontSize: T.label, lineHeight: 22 },
  status: { fontFamily: F.semiBold, color: C.blue, fontSize: T.caption, lineHeight: 18, marginTop: 4 }, green: { color: '#208653' },
  caption: { fontFamily: F.regular, color: C.blue, fontSize: T.caption, lineHeight: 18, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#E4EBF5', marginTop: 10, marginBottom: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, paddingVertical: 12 }, rowText: { flex: 1, minWidth: 124 },
  description: { fontFamily: F.regular, color: C.blue, fontSize: T.body, lineHeight: 22, marginTop: 4 },
  badge: { backgroundColor: '#EDF3FB', borderRadius: 15, paddingVertical: 6, paddingHorizontal: 10 }, badgeText: { fontFamily: F.semiBold, color: C.blue, fontSize: T.caption, lineHeight: 18 },
  reconnect: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 24, backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(50,80,123,.18)' }, reconnectText: { fontFamily: F.semiBold, color: C.white, fontSize: T.label, lineHeight: 22 },
  notice: { padding: 14, backgroundColor: '#EDF3FB', borderRadius: 15, marginVertical: 6 },
  troubleshooting: { marginTop: 18, padding: 15, backgroundColor: '#F4F8FE', borderRadius: 18 },
  helpHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, infoIcon: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: C.blue, alignItems: 'center', justifyContent: 'center' }, infoLetter: { fontFamily: F.bold, color: C.blue, fontSize: 12, lineHeight: 16 },
  footnote: { fontFamily: F.regular, color: C.blue, fontSize: T.caption, lineHeight: 18, marginTop: 18 },
});
