import { BackButton } from '@/components/back-button';
import { EdgeScrollView } from '@/components/edge-scroll-view';
import { useCallback, useState } from 'react';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { validCameraAddress } from '@/constants/camera';
import { useAppSession } from '@/components/app-session';
import { CameraIcon } from '@/components/camera-icon';
import { GlowButton } from '@/components/glow-button';
import { PageTransition } from '@/components/page-transition';
import { SettingsIcon } from '@/components/settings-icon';

export default function ConnectCameraScreen() {
  const insets = useSafeAreaInsets();
  const session = useAppSession();
  const [step, setStep] = useState<'start' | 'search' | 'manual'>('start');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [continueHome, setContinueHome] = useState(false);
  useFocusEffect(useCallback(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'start') return false;
      Keyboard.dismiss(); setError(''); setStep('start'); return true;
    });
    return () => back.remove();
  }, [step]));
  function changeStep(value: typeof step) { Keyboard.dismiss(); setError(''); setStep(value); }
  function saveDetails() {
    if (!name.trim()) { setError('Give your camera a name.'); return; }
    if (!validCameraAddress(address)) { setError('Enter an HTTP, HTTPS or RTSP address without a username or password.'); return; }
    Keyboard.dismiss();
    // Frontend handoff only. The connection service must confirm success before
    // saving status: 'connected' and continuing here in the production app.
    session.saveCamera({ name: name.trim(), address: address.trim(), status: 'pending' });
    setContinueHome(true);
  }
  if (continueHome && session.camera) return <Redirect href="/home" />;
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar style="light" />
    <EdgeScrollView topColor={C.blue} bottomColor={C.white} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.page, { paddingBottom: insets.bottom + 32 }]}>
      <View style={[s.hero, { paddingTop: insets.top + 24 }]}>
        <View pointerEvents="none" style={s.wave}>
          <Image source={require('../../assets/images/camera-setup-blob.svg')} contentFit="fill" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
        </View>
        <View style={s.header}>
          <View style={s.headerText}><Text style={s.logo}>Little<Text style={{ color: C.lightBlue }}>Eye</Text></Text><Text style={s.headerLabel}>Camera setup</Text></View>
          <GlowButton accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => { Keyboard.dismiss(); router.push('/settings'); }} style={s.settingsButton}>
            <SettingsIcon />
          </GlowButton>
        </View>
        <Text accessibilityRole="header" style={s.heroTitle}>Let’s bring your{'\n'}camera home.</Text>
      </View>
      <View style={s.content}>
        <PageTransition key={step} backgroundColor="transparent">
          <View style={s.card}>
            {step !== 'start' && <BackButton light accessibilityRole="button" accessibilityLabel="Back to camera setup" onPress={() => changeStep('start')} style={s.back} />}
            <View style={s.orbit}><View style={s.orbitInner}><CameraIcon size={52} /></View><View style={s.orbitDot} /></View>
            <Text accessibilityRole="header" style={s.cardTitle}>{step === 'start' ? 'A new view starts here' : step === 'search' ? 'Find your camera' : 'Connect your camera'}</Text>
            <Text style={s.cardBody}>{step === 'start' ? 'Find a camera on your Wi-Fi network, or add it using its stream address.' : step === 'search' ? 'Keep your phone and CCTV camera on the same Wi-Fi network.' : 'Give your camera a name and enter its stream address.'}</Text>
            {step === 'start' && <>
              <GlowButton accessibilityRole="button" style={s.primary} onPress={() => changeStep('search')}><Text style={s.primaryText}>Find my camera</Text></GlowButton>
              <GlowButton accessibilityRole="button" style={s.secondary} onPress={() => changeStep('manual')}><Text style={s.secondaryText}>Add camera manually  +</Text></GlowButton>
            </>}
            {step === 'search' && <>
              <View style={s.searchNotice}><Text style={s.noticeTitle}>Camera search isn’t available yet</Text><Text style={s.small}>This build can’t search your network. You can enter your camera’s address to prepare its setup.</Text></View>
              <GlowButton accessibilityRole="button" style={s.primary} onPress={() => changeStep('manual')}><Text style={s.primaryText}>Add camera manually</Text></GlowButton>
            </>}
            {step === 'manual' && <>
              <TextInput accessibilityLabel="Camera name" placeholder="Camera name" placeholderTextColor={C.blue} value={name} onChangeText={(value) => { setName(value); setError(''); }} maxLength={48} style={[s.input, !!name && s.filled]} />
              <TextInput accessibilityLabel="Camera stream address" placeholder="rtsp://192.168.1.10:554/stream" placeholderTextColor={C.blue} value={address} onChangeText={(value) => { setAddress(value); setError(''); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" onSubmitEditing={saveDetails} style={[s.input, !!address && s.filled]} />
              <Text style={s.small}>HTTP, HTTPS or RTSP. Camera passwords aren’t needed for this setup preview.</Text>
              {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
              <GlowButton accessibilityRole="button" style={s.primary} onPress={saveDetails}><Text style={s.primaryText}>Save & continue</Text></GlowButton>
              <Text style={s.preview}>This saves setup details and opens Home. A live connection isn’t made in this build.</Text>
            </>}
          </View>
        </PageTransition>
        <View style={s.tip}><View style={s.tipDot} /><View style={{ flex: 1 }}><Text style={s.tipTitle}>A few things before you connect</Text><Text style={s.small}>Power on your camera, connect it to Wi-Fi, and make sure you have permission to use it.</Text></View></View>
      </View>
    </EdgeScrollView>
  </KeyboardAvoidingView>;
}

const s = StyleSheet.create({
  headerText: { transform: [{ translateY: 10 }] },
  screen: { flex: 1, backgroundColor: C.white }, page: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  hero: { backgroundColor: C.blue, paddingHorizontal: 28, paddingBottom: 64, borderBottomLeftRadius: 72, overflow: 'hidden' },
  wave: { position: 'absolute', width: 440, height: 275, opacity: .14, right: -130, top: 76, transform: [{ rotate: '-12deg' }] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }, logo: { fontFamily: F.extraBold, fontSize: 36, color: C.white }, headerLabel: { fontFamily: F.regular, fontSize: 12, color: C.white, marginTop: 10 },
  settingsButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(148,176,213,.22)', borderWidth: 1, borderColor: 'rgba(148,176,213,.45)', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px 5px rgba(148,176,213,.32), 0 5px 14px rgba(24,42,67,.16)' },
  heroTitle: { fontFamily: F.bold, fontSize: 26, lineHeight: 34, color: C.white },
  content: { paddingHorizontal: 24, marginTop: -28 }, card: { backgroundColor: C.white, borderRadius: 30, padding: 22, alignItems: 'center', boxShadow: '0 12px 30px rgba(50,80,123,.24), 0 0 24px 4px rgba(148,176,213,.22)' },
  orbit: { width: 116, height: 116, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(148,176,213,.35)', justifyContent: 'center', alignItems: 'center', marginVertical: 14 }, orbitInner: { width: 84, height: 84, borderRadius: 50, backgroundColor: 'rgba(148,176,213,.22)', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 24px rgba(148,176,213,.3)' }, orbitDot: { position: 'absolute', width: 12, height: 12, borderRadius: 8, backgroundColor: C.lightBlue, right: 4, top: 17, borderWidth: 3, borderColor: C.white },
  cardTitle: { fontFamily: F.bold, fontSize: 20, lineHeight: 28, color: C.blue, textAlign: 'center', marginBottom: 8 }, cardBody: { fontFamily: F.regular, color: C.blue, fontSize: 12, lineHeight: 21, textAlign: 'center', marginBottom: 16 },
  primary: { alignSelf: 'stretch', minHeight: 48, paddingHorizontal: 14, backgroundColor: C.blue, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginTop: 16, boxShadow: '0 8px 20px rgba(50,80,123,.24)' }, primaryText: { fontFamily: F.bold, fontSize: 14, color: C.white }, secondary: { alignSelf: 'stretch', minHeight: 48, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, borderColor: C.lightBlue, borderWidth: 1, marginTop: 14, marginBottom: 8, boxShadow: '0 6px 18px rgba(50,80,123,.12)' }, secondaryText: { fontFamily: F.semiBold, fontSize: 12, color: C.blue },
  input: { alignSelf: 'stretch', minHeight: 54, backgroundColor: 'rgba(148,176,213,.22)', borderRadius: 28, paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(148,176,213,.5)', fontFamily: F.regular, color: C.blue, fontSize: 12, marginBottom: 16 }, filled: { fontFamily: F.semiBold }, small: { fontFamily: F.regular, fontSize: 11, lineHeight: 18, color: C.blue, opacity: .75 }, error: { alignSelf: 'stretch', color: C.blue, fontFamily: F.semiBold, fontSize: 12, lineHeight: 19, marginTop: 12 },
  searchNotice: { alignSelf: 'stretch', padding: 16, borderRadius: 20, backgroundColor: 'rgba(148,176,213,.14)' }, noticeTitle: { color: C.blue, fontFamily: F.semiBold, fontSize: 12, marginBottom: 8 }, preview: { fontFamily: F.regular, fontSize: 10, lineHeight: 17, color: C.blue, opacity: .7, textAlign: 'center', marginTop: 14 },
  tip: { flexDirection: 'row', gap: 12, padding: 18, borderRadius: 22, marginTop: 24, backgroundColor: 'rgba(148,176,213,.14)' }, tipDot: { width: 8, height: 8, backgroundColor: C.lightBlue, borderRadius: 5, marginTop: 5 }, tipTitle: { fontFamily: F.semiBold, fontSize: 12, color: C.blue, marginBottom: 5 },
  back: { alignSelf: 'flex-start' },
});
