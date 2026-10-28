import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { FixedPageHeader } from '@/components/fixed-page-header';
import { EdgeScrollView } from '@/components/edge-scroll-view';
import { useMascotImages } from '@/components/mascot-images';
import { GlowButton } from '@/components/glow-button';
import { FormError } from '@/components/form-error';
import { PasswordInput } from '@/components/password-input';
import { TextButton } from '@/components/text-button';
import { useAppSession } from '@/components/app-session';
import { getMockSignInProfile } from '@/utils/preview-profile';
import { isValidEmail, isValidPhoneNumber } from '@/utils/contact-validation';
import { Image } from 'expo-image';
import { BrandColors, BrandFonts, PageTypography } from '@/constants/brand';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const styles = useResponsiveStyles(baseStyles);
  const { enterPreview } = useAppSession();
  const mascotImages = useMascotImages();
  const { pageWidth, scaleSize } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function signIn() {
    if (!isValidEmail(email) && !isValidPhoneNumber(email)) {
      setError(email.includes('@') ? 'Enter a valid email address.' : 'Enter a valid email or phone number.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    // Frontend-only sign-in. Backend integration replaces this with authentication
    // and the actual account profile; missing server data must never use samples.
    enterPreview(getMockSignInProfile(__DEV__));
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <EdgeScrollView topColor={BrandColors.blue} bottomColor={BrandColors.white}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.page, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={[styles.hero, { height: pageWidth * 0.78 + insets.top }]}>
          <Image
            source={require('../../assets/images/sign-in-white-edge.svg')}
            accessible={false}
            contentFit="fill"
            transition={0}
            style={{ position: 'absolute', bottom: scaleSize(0), width: pageWidth, height: pageWidth * 0.78 }}
          />
          <Image
            source={mascotImages.signIn}
            accessible={false}
            contentFit="contain" transition={0} cachePolicy="memory"
            style={{
              position: 'absolute',
              width: pageWidth * (1920 / 1091),
              height: pageWidth * (1080 / 1091),
              left: -pageWidth * (303 / 1091),
              top: insets.top - pageWidth * (125 / 1091),
            }}
          />
        </View>

        <View style={styles.form}>
          <Text accessibilityRole="header" style={styles.heading}>Hello! I’m Peeka</Text>
          <Text style={styles.subtitle}>Good to see you again—let’s get you in.</Text>

          <View style={styles.inputShadow}>
            <TextInput
              accessibilityLabel="Email or phone number"
              placeholder="Email or Phone Number"
              placeholderTextColor={BrandColors.blue}
              value={email}
              onChangeText={(value) => { setEmail(value); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              style={[styles.input, !!email && styles.filledInput]}
            />
          </View>
          <View style={styles.inputShadow}>
            <PasswordInput
              accessibilityLabel="Password"
              placeholder="Password"
              placeholderTextColor={BrandColors.blue}
              value={password}
              onChangeText={(value) => { setPassword(value); setError(''); }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={signIn}
              style={[styles.input, !!password && styles.filledInput]}
            />
          </View>
          <TextButton hitSlop={8} style={styles.forgot} textStyle={styles.forgotText} onPress={() => router.push('/forgot-password')}>
            Forgot password?
          </TextButton>
          <FormError>{error}</FormError>
          <GlowButton accessibilityRole="button" onPress={signIn} style={styles.signIn}>
            <Text style={styles.signInText}>Sign In</Text>
          </GlowButton>
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>Or sign in with</Text>
          <View style={styles.line} />
        </View>
        <GlowButton accessibilityRole="button" accessibilityLabel="Sign in with Google" onPress={() => Alert.alert('Google Sign In', 'Google authentication will be connected later.')} style={styles.google}>
          <Image
            source={require('../../assets/images/google-g.png')}
            accessible={false}
            contentFit="contain"
            transition={0}
            cachePolicy="memory"
            style={styles.googleIcon}
          />
        </GlowButton>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an account yet? </Text>
          <TextButton hitSlop={8} textStyle={styles.signUp} onPress={() => router.push('/sign-up')}>
            Sign Up!
          </TextButton>
        </View>
      </EdgeScrollView>
      <FixedPageHeader onBack={() => router.back()} profile={false} />
    </KeyboardAvoidingView>
  );
}

const baseStyles = StyleSheet.create({
  filledInput: { fontFamily: BrandFonts.semiBold },
  screen: { flex: 1, backgroundColor: BrandColors.white },
  page: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: BrandColors.white },
  hero: { backgroundColor: BrandColors.blue, overflow: 'hidden' },

  form: { paddingHorizontal: 24, paddingTop: 16 },
  heading: { fontSize: PageTypography.title, lineHeight: 32, fontFamily: BrandFonts.extraBold, color: '#000000', textAlign: 'center' },
  subtitle: { fontSize: PageTypography.body, lineHeight: 22, fontFamily: BrandFonts.regular, color: '#222222', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  inputShadow: { marginBottom: 20, borderRadius: 36, backgroundColor: '#FFFAFC', shadowColor: '#8298FF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.24, shadowRadius: 18, elevation: 3 },
  input: { minHeight: 56, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 30, borderWidth: 1, borderColor: '#CEDAE9', fontFamily: BrandFonts.regular, fontSize: PageTypography.body, color: BrandColors.blue },
  forgot: { alignSelf: 'flex-end', marginTop: -8, minHeight: 44, justifyContent: 'center' },
  forgotText: { fontSize: PageTypography.caption, fontFamily: BrandFonts.regular, color: BrandColors.blue },
  signIn: { alignSelf: 'center', width: '68%', minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30, backgroundColor: BrandColors.lightBlue, alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4, marginTop: 4 },
  signInText: { fontSize: PageTypography.label, fontFamily: BrandFonts.extraBold, color: BrandColors.white },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 34 },
  line: { flex: 1, height: 1, backgroundColor: '#555555' },
  dividerText: { fontFamily: BrandFonts.regular, fontSize: 14, color: '#111111' },
  google: { width: 68, minHeight: 48, borderRadius: 18, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.white, marginTop: 16, shadowColor: BrandColors.blue, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4 },
  googleIcon: { width: 24, height: 24 },
  // Balance the link's 44-point hit area so its letters keep their original gap.
  footer: { marginTop: 1, marginBottom: -13, paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' },
  footerText: { fontFamily: BrandFonts.semiBold, fontSize: 14, color: '#111111' },
  signUp: { fontFamily: BrandFonts.extraBold, fontSize: 14, color: BrandColors.lightBlue },
});




