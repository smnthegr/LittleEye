import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FixedPageHeader } from '@/components/fixed-page-header';
import { ResponsiveBackground } from '@/components/responsive-background';
import { GlowButton } from '@/components/glow-button';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { getPageHeaderLayout } from '@/utils/responsive';

const serviceNumbers = [
  { name: 'National Emergency Hotline', number: '911' },
  { name: 'Quezon City Helpline', number: '122' },
  { name: 'Red Cross', number: '(02) 8527-0000' },
];

export default function EmergencyServicesScreen() {
  const { pageWidth, scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();

  function openSos(number: string) {
    router.dismissTo({ pathname: '/emergency-hotline', params: { service: number } });
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/emergency-hotline');
  }

  return <View style={s.screen}>
    <StatusBar style="light" />
    <ResponsiveBackground source={require('../../assets/images/emergency-services-background.svg')} />
    <FixedPageHeader onBack={goBack} />
    <ScrollView contentContainerStyle={[s.content, { width: pageWidth, paddingTop: getPageHeaderLayout(pageWidth, insets.top).contentTop, paddingBottom: insets.bottom + scaleSize(24) }]} showsVerticalScrollIndicator={false}>
      <View style={s.heading}>
        <Text accessibilityRole="header" style={s.title}>Emergency Services</Text>
        <Text style={s.subtitle}>Choose a service, then press and hold SOS for 2 seconds to open calling options.</Text>
      </View>

      <View style={s.servicesList}>
        {serviceNumbers.map(service => <GlowButton
          key={service.number}
          accessibilityRole="button"
          accessibilityLabel={`${service.name}, ${service.number}. Go to SOS`}
          accessibilityHint="Press and hold SOS on the next screen to choose a hotline."
          onPress={() => openSos(service.number)}
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
        <Text style={s.infoText}>Calling options open after you press and hold SOS.</Text>
      </View>
    </ScrollView>
  </View>;
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFBFC' },
  content: { flexGrow: 1, alignSelf: 'center', paddingHorizontal: 24 },
  heading: { alignItems: 'center' },
  title: { color: C.white, fontFamily: F.extraBold, fontSize: T.title, lineHeight: 32, marginBottom: 8, textAlign: 'center' },
  subtitle: { color: C.white, fontFamily: F.regular, fontSize: T.body, lineHeight: 20, textAlign: 'center' },
  servicesList: { gap: 16, marginTop: 24 },
  serviceCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 30, backgroundColor: C.white, borderWidth: 1, borderColor: '#C7D8EB', boxShadow: '0 5px 11px rgba(0,0,0,.28)' },
  serviceBadge: { width: 36, height: 40 },
  serviceCopy: { flex: 1, gap: 2 },
  serviceName: { color: C.blue, fontFamily: F.bold, fontSize: T.label, lineHeight: 20 },
  serviceNumber: { color: '#526D8E', fontFamily: F.regular, fontSize: T.body, lineHeight: 20 },
  infoCard: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 30, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, backgroundColor: '#D0DFEF', borderWidth: 1, borderColor: '#AFC7E2' },
  infoIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: C.blue },
  infoIconImage: { width: 26, height: 26 },
  infoText: { flex: 1, color: '#58759A', fontFamily: F.regular, fontSize: T.body, fontStyle: 'italic', lineHeight: 20 },
});
