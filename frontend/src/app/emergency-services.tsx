import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { GlowButton } from '@/components/glow-button';
import { SettingsProfileButton } from '@/components/settings-profile-button';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';

const serviceNumbers = [
  { name: 'National Emergency Hotline', number: '911' },
  { name: 'Quezon City Helpline', number: '122' },
  { name: 'Red Cross', number: '(02) 8527-0000' },
];

export default function EmergencyServicesScreen() {
  const insets = useSafeAreaInsets();

  function callService(number: string) {
    router.push({ pathname: '/call', params: { recipient: number, phone: number, kind: 'hotline' } });
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/emergency-hotline');
  }

  return <View style={s.screen}>
    <StatusBar style="light" />
    <Image pointerEvents="none" source={require('../../assets/images/emergency-services-background.svg')} contentFit="fill" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
    <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) + 18 }]} showsVerticalScrollIndicator={false}>
      <View style={s.headerRow}>
        <BackButton accessibilityLabel="Back" onPress={goBack} />
        <SettingsProfileButton />
      </View>

      <View style={s.heading}>
        <Text accessibilityRole="header" style={s.title}>Emergency Services</Text>
        <Text style={s.subtitle}>If there is an emergency, long press the SOS button</Text>
        <Text style={s.subtitle}>for 3 seconds to confirm alert.</Text>
      </View>

      <View style={s.servicesList}>
        {serviceNumbers.map(service => <GlowButton
          key={service.number}
          accessibilityRole="button"
          accessibilityLabel={`Call ${service.name}, ${service.number}`}
          onPress={() => callService(service.number)}
          style={s.serviceCard}
        >
          <Image source={require('../../assets/images/emergency-hotline-shield.svg')} contentFit="contain" transition={0} accessible={false} style={s.serviceBadge} />
          <View style={s.serviceCopy}>
            <Text style={s.serviceName}>{service.name}</Text>
            <Text style={s.serviceNumber}>{service.number}</Text>
          </View>
        </GlowButton>)}
      </View>

      <View style={s.infoCard}>
        <View style={s.infoIcon}>
          <Image source={require('../../assets/images/info-mark.svg')} contentFit="contain" transition={0} accessible={false} style={s.infoIconImage} />
        </View>
        <Text style={s.infoText}>If there is immediate danger, call the appropriate emergency service.</Text>
      </View>
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFBFC' },
  content: { flexGrow: 1, paddingHorizontal: 34 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: -12, transform: [{ translateY: 1 }] },
  heading: { alignItems: 'center', marginTop: 38 },
  title: { color: C.white, fontFamily: F.extraBold, fontSize: 20, lineHeight: 26, marginBottom: 9 },
  subtitle: { color: C.white, fontFamily: F.regular, fontSize: 10, lineHeight: 14, textAlign: 'center' },
  servicesList: { gap: 16, marginTop: 118 },
  serviceCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 30, backgroundColor: C.white, borderWidth: 1, borderColor: '#C7D8EB', boxShadow: '0 5px 11px rgba(0,0,0,.28)' },
  serviceBadge: { width: 36, height: 40 },
  serviceCopy: { flex: 1, gap: 2 },
  serviceName: { color: C.blue, fontFamily: F.bold, fontSize: 13, lineHeight: 16 },
  serviceNumber: { color: '#526D8E', fontFamily: F.regular, fontSize: 14, lineHeight: 18 },
  infoCard: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 30, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, backgroundColor: '#D0DFEF', borderWidth: 1, borderColor: '#AFC7E2' },
  infoIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: C.blue },
  infoIconImage: { width: 26, height: 26 },
  infoText: { flex: 1, color: '#58759A', fontSize: 14, fontStyle: 'italic', lineHeight: 18 },
});
