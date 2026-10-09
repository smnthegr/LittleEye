import { useMascotImages } from '@/components/mascot-images';
import { GlowButton } from '@/components/glow-button';
import { BrandColors, BrandFonts } from '@/constants/brand';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, useWindowDimensions, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const mascots = useMascotImages();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pageWidth = Math.min(width - insets.left - insets.right, 480);
  const mascotScale = (pageWidth * 0.82) / 533;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  function next() {
    const value = identifier.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const phoneValid = /^\+?\d{10,15}$/.test(value.replace(/[\s()-]/g, ''));
    if (!emailValid && !phoneValid) {
      setError('Enter a valid email or phone number.');
    } else if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
    } else if (password !== confirmPassword) {
      setError('Your passwords do not match.');
    } else {
      setError('');
      router.push({ pathname: '/set-up', params: { identifier: value } });
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="never" bounces={false}
        contentContainerStyle={[styles.page, { minHeight: Math.max(height, insets.top + 680 + insets.bottom) }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image source={mascots.signUp} accessible={false} contentFit="contain" transition={0}
            style={{ position: 'absolute', opacity: 0.475, width: 1920 * mascotScale, height: 1080 * mascotScale,
              left: pageWidth - 1190 * mascotScale, top: insets.top + pageWidth * 0.6 - 109 * mascotScale }} />
          <Image source={require('../../assets/images/sign-up-wave.svg')} accessible={false}
            contentFit="fill" transition={0}
            style={{ position: 'absolute', bottom: 0, width: pageWidth, height: pageWidth * 0.62 + insets.bottom }} />
        </View>
        <GlowButton accessibilityRole="button" accessibilityLabel="Back to Sign In" hitSlop={12}
          onPress={() => router.back()} style={[styles.back, { top: insets.top + 12 }]}>
          <View style={styles.backArrow} />
        </GlowButton>
        <View style={[styles.form, { paddingTop: insets.top + 76 }]}>
          <Text accessibilityRole="header" style={styles.heading}>Sign Up</Text>
          <Text style={styles.subtitle}>Get Started with <Text style={styles.brand}>LittleEye</Text></Text>
          <TextInput accessibilityLabel="Email or Phone Number" placeholder="Email or Phone Number"
            placeholderTextColor={BrandColors.white} value={identifier}
            onChangeText={(value) => { setIdentifier(value); setError(''); }}
            autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username"
            style={[styles.input, !!identifier && styles.filledInput]} />
          <TextInput accessibilityLabel="Create a Password" placeholder="Create a Password"
            placeholderTextColor={BrandColors.white} value={password}
            onChangeText={(value) => { setPassword(value); setError(''); }}
            secureTextEntry cursorColor={BrandColors.white} selectionColor={BrandColors.white}
            autoCapitalize="none" autoCorrect={false} autoComplete="new-password"
            textContentType="newPassword" style={[styles.input, !!password && styles.filledInput, styles.passwordInput]} />
          <TextInput accessibilityLabel="Confirm Password" placeholder="Confirm Password"
            placeholderTextColor={BrandColors.white} value={confirmPassword}
            onChangeText={(value) => { setConfirmPassword(value); setError(''); }}
            secureTextEntry cursorColor={BrandColors.white} selectionColor={BrandColors.white}
            autoCapitalize="none" autoCorrect={false} textContentType="newPassword"
            returnKeyType="go" onSubmitEditing={next} style={[styles.input, !!confirmPassword && styles.filledInput, styles.passwordInput]} />
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <GlowButton accessibilityRole="button" hitSlop={6} onPress={next} style={styles.next}>
            <Text style={styles.nextText}>Next</Text>
          </GlowButton>
        </View>
        <View style={styles.divider}>
          <View style={styles.line} /><Text style={styles.dividerText}>Or sign up with</Text><View style={styles.line} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Sign up with Google"
          onPress={() => Alert.alert('Google Sign Up', 'Google authentication will be connected to the backend later.')}
          style={({ pressed }) => [styles.google, pressed && styles.pressed]}>
          <Image source={require('../../assets/images/google-g.png')} accessible={false} contentFit="contain" transition={0} style={styles.googleIcon} />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  filledInput: { fontFamily: BrandFonts.semiBold },
  passwordInput: { color: BrandColors.white, ...Platform.select({ web: { WebkitTextFillColor: BrandColors.white }, default: {} }) },
  screen: { flex: 1, backgroundColor: BrandColors.blue },
  page: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: BrandColors.blue, overflow: 'hidden' },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  backArrow: { width: 12, height: 12, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: BrandColors.white, transform: [{ rotate: '45deg' }], marginLeft: 6 },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center', paddingHorizontal: 36 },
  heading: { fontFamily: BrandFonts.extraBold, fontSize: 36, color: BrandColors.white, textAlign: 'center' },
  subtitle: { fontFamily: BrandFonts.regular, fontSize: 15, lineHeight: 22, color: BrandColors.white, textAlign: 'center', marginTop: 8, marginBottom: 28 },
  brand: { fontFamily: BrandFonts.bold, color: BrandColors.lightBlue },
  input: { minHeight: 56, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(148,176,213,0.8)', backgroundColor: 'rgba(148,176,213,0.4)', paddingHorizontal: 22, paddingVertical: 14, color: BrandColors.white, fontFamily: BrandFonts.regular, fontSize: 14, marginBottom: 16 },
  error: { fontFamily: BrandFonts.semiBold, fontSize: 12, lineHeight: 18, color: '#FF5C5C', marginBottom: 12 },
  next: { width: '60%', alignSelf: 'center', minHeight: 44, borderRadius: 24, backgroundColor: BrandColors.white, alignItems: 'center', justifyContent: 'center', marginTop: 6, boxShadow: '0 8px 20px rgba(50,80,123,0.3), 0 2px 6px rgba(50,80,123,0.15)' },
  nextText: { fontFamily: BrandFonts.extraBold, fontSize: 18, color: BrandColors.blue },
  pressed: { opacity: 0.8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 30 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.7)' },
  dividerText: { fontFamily: BrandFonts.regular, fontSize: 15, color: BrandColors.white },
  google: { width: 72, height: 50, borderRadius: 18, alignSelf: 'center', backgroundColor: BrandColors.white, alignItems: 'center', justifyContent: 'center', marginTop: 20, boxShadow: '0 8px 20px rgba(50,80,123,0.3)' },
  googleIcon: { width: 26, height: 26 },
});

