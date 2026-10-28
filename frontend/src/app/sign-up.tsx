import { FixedPageHeader } from '@/components/fixed-page-header';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { EdgeScrollView } from '@/components/edge-scroll-view';
import { AuthBottomWave } from '@/components/auth-bottom-wave';
import { useMascotImages } from '@/components/mascot-images';
import { GlowButton } from '@/components/glow-button';
import { FormError } from '@/components/form-error';
import { PasswordInput } from '@/components/password-input';
import { BrandColors, BrandFonts } from '@/constants/brand';
import { isValidEmail, isValidPhoneNumber } from '@/utils/contact-validation';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, View,
} from 'react-native';

export default function SignUpScreen() {
  const mascots = useMascotImages();
  const { pageWidth, height, insets } = useResponsiveLayout();
  const mascotScale = (pageWidth * 0.82) / 533;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const submitting = useRef(false);
  useFocusEffect(useCallback(() => {
    submitting.current = false;
  }, []));

  function next() {
    if (submitting.current) return;
    const value = identifier.trim();
    const emailValid = isValidEmail(value);
    const phoneValid = isValidPhoneNumber(value);
    if (!emailValid && !phoneValid) {
      setError(value.includes('@') ? 'Enter a valid email address.' : 'Enter a valid email or phone number.');
    } else if (password.length < 8 || !password.trim()) {
      setError('Use at least 8 characters for your password.');
    } else if (password !== confirmPassword) {
      setError('Your passwords do not match.');
    } else {
      setError('');
      submitting.current = true;
      try {
        router.push({ pathname: '/set-up', params: { identifier: value } });
      } catch {
        submitting.current = false;
        setError('Could not open setup. Please try again.');
      }
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <EdgeScrollView topColor={BrandColors.blue} bottomColor={BrandColors.white} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.page, { minHeight: Math.max(height, insets.top + 680 + insets.bottom), paddingBottom: insets.bottom + 20 }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image source={mascots.signUp} accessible={false} contentFit="contain" transition={0}
            style={{ position: 'absolute', opacity: 0.475, width: 1920 * mascotScale, height: 1080 * mascotScale,
              left: pageWidth - 1190 * mascotScale, top: insets.top + pageWidth * 0.6 - 109 * mascotScale }} />
          <AuthBottomWave width={pageWidth} height={pageWidth * 0.62 + insets.bottom} />
        </View>
        <View style={[styles.form, { paddingTop: insets.top + 76 }]}>
          <Text accessibilityRole="header" style={styles.heading}>Sign Up</Text>
          <Text style={styles.subtitle}>Get Started with <Text style={styles.brand}>LittleEye</Text></Text>
          <TextInput accessibilityLabel="Email or Phone Number" placeholder="Email or Phone Number"
            placeholderTextColor={BrandColors.white} value={identifier}
            onChangeText={(value) => { setIdentifier(value); setError(''); }}
            autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username"
            style={[styles.input, !!identifier && styles.filledInput]} />
          <PasswordInput accessibilityLabel="Create a Password" placeholder="Create a Password" iconColor={BrandColors.white}
            placeholderTextColor={BrandColors.white} value={password}
            onChangeText={(value) => { setPassword(value); setError(''); }}
            cursorColor={BrandColors.white} selectionColor={BrandColors.white}
            autoCapitalize="none" autoCorrect={false} autoComplete="new-password"
            textContentType="newPassword" style={[styles.input, !!password && styles.filledInput, styles.passwordInput]} />
          <PasswordInput accessibilityLabel="Confirm Password" placeholder="Confirm Password" iconColor={BrandColors.white}
            placeholderTextColor={BrandColors.white} value={confirmPassword}
            onChangeText={(value) => { setConfirmPassword(value); setError(''); }}
            cursorColor={BrandColors.white} selectionColor={BrandColors.white}
            autoCapitalize="none" autoCorrect={false} textContentType="newPassword"
            returnKeyType="go" onSubmitEditing={next} style={[styles.input, !!confirmPassword && styles.filledInput, styles.passwordInput]} />
          <FormError>{error}</FormError>
          <GlowButton accessibilityRole="button" hitSlop={6} onPress={next} style={styles.next}>
            <Text style={styles.nextText}>Next</Text>
          </GlowButton>
        </View>
        <View style={styles.divider}>
          <View style={styles.line} /><Text style={styles.dividerText}>Or sign up with</Text><View style={styles.line} />
        </View>
        <GlowButton accessibilityRole="button" accessibilityLabel="Sign up with Google"
          onPress={() => Alert.alert('Google Sign Up', 'Google authentication will be connected to the backend later.')}
          style={[styles.google]}>
          <Image source={require('../../assets/images/google-g.png')} accessible={false} contentFit="contain" transition={0} style={styles.googleIcon} />
        </GlowButton>
      </EdgeScrollView>
      <FixedPageHeader onBack={() => router.back()} profile={false} backLabel="Back to Sign In" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  filledInput: { fontFamily: BrandFonts.semiBold },
  passwordInput: { color: BrandColors.white, ...Platform.select({ web: { WebkitTextFillColor: BrandColors.white }, default: {} }) },
  screen: { flex: 1, backgroundColor: BrandColors.blue },
  page: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: BrandColors.blue, overflow: 'hidden' },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center', paddingHorizontal: 36 },
  heading: { fontFamily: BrandFonts.extraBold, fontSize: 36, color: BrandColors.white, textAlign: 'center' },
  subtitle: { fontFamily: BrandFonts.regular, fontSize: 15, lineHeight: 22, color: BrandColors.white, textAlign: 'center', marginTop: 8, marginBottom: 28 },
  brand: { fontFamily: BrandFonts.bold, color: BrandColors.lightBlue },
  input: { minHeight: 56, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(148,176,213,0.8)', backgroundColor: 'rgba(148,176,213,0.4)', paddingHorizontal: 22, paddingVertical: 14, color: BrandColors.white, fontFamily: BrandFonts.regular, fontSize: 14, marginBottom: 16 },
  next: { width: '60%', alignSelf: 'center', minHeight: 44, borderRadius: 24, backgroundColor: BrandColors.white, alignItems: 'center', justifyContent: 'center', marginTop: 6, boxShadow: '0 8px 20px rgba(50,80,123,0.3), 0 2px 6px rgba(50,80,123,0.15)' },
  nextText: { fontFamily: BrandFonts.extraBold, fontSize: 18, color: BrandColors.blue },
  pressed: { opacity: 0.8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 30 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.7)' },
  dividerText: { fontFamily: BrandFonts.regular, fontSize: 15, color: BrandColors.white },
  google: { width: 72, height: 50, borderRadius: 18, alignSelf: 'center', backgroundColor: BrandColors.white, alignItems: 'center', justifyContent: 'center', marginTop: 20, boxShadow: '0 8px 20px rgba(50,80,123,0.3)' },
  googleIcon: { width: 26, height: 26 },
});

