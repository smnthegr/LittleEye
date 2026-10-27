import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FixedPageHeader } from '@/components/fixed-page-header';
import { ResponsiveBackground } from '@/components/responsive-background';
import { GlowButton } from '@/components/glow-button';
import { EmergencyAreaCard } from '@/components/emergency-area-card';
import { EmergencyHotlineList } from '@/components/emergency-hotline-list';
import { useEmergencyHotlines } from '@/hooks/use-emergency-hotlines';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { getPageHeaderLayout } from '@/utils/responsive';

export default function EmergencyServicesScreen() {
  const { pageWidth, scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const { address, localityCode, choice, directory, canEdit, changeArea } = useEmergencyHotlines();

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
      </View>
      <View style={s.servicesList}>
        <EmergencyAreaCard showHotlines={false} address={address} localityCode={localityCode} choice={choice} onChange={canEdit ? changeArea : undefined} />
        {!canEdit && <GlowButton accessibilityRole="button" onPress={() => router.push('/profile')} style={s.profileLink}><Text style={s.profileLinkText}>Add your address in Profile</Text></GlowButton>}
        <EmergencyHotlineList hotlines={directory.hotlines} />
      </View>

      <View style={s.infoCard}>
        <View style={s.infoIcon}>
          <Image source={require('../../assets/images/info-mark.svg')} contentFit="contain" transition={0} accessible={false} style={s.infoIconImage} />
        </View>
        <Text style={s.infoText}>Give the operator the incident address and landmark.</Text>
      </View>
    </ScrollView>
  </View>;
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFBFC' },
  content: { flexGrow: 1, alignSelf: 'center', paddingHorizontal: 24 },
  heading: { alignItems: 'center' },
  title: { color: C.white, fontFamily: F.extraBold, fontSize: T.title, lineHeight: 32, marginBottom: 8, textAlign: 'center' },
  servicesList: { gap: 16, marginTop: 24 },
  profileLink: { minHeight: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6EFFA' },
  profileLinkText: { color: C.blue, fontFamily: F.semiBold, fontSize: 13 },
  infoCard: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 30, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, backgroundColor: '#D0DFEF', borderWidth: 1, borderColor: '#AFC7E2' },
  infoIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: C.blue },
  infoIconImage: { width: 26, height: 26 },
  infoText: { flex: 1, color: '#58759A', fontFamily: F.regular, fontSize: T.body, fontStyle: 'italic', lineHeight: 20 },
});
