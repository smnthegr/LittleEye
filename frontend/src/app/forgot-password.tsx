import { GlowButton } from '@/components/glow-button';
import { FormError } from '@/components/form-error';
import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { FixedPageHeader } from '@/components/fixed-page-header';
import { EdgeScrollView } from '@/components/edge-scroll-view';
import { BrandColors, BrandFonts, PageTypography } from '@/constants/brand';
import { getPageHeaderLayout } from '@/utils/responsive';
import { isValidEmail } from '@/utils/contact-validation';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const styles = useResponsiveStyles(baseStyles);
  const { pageWidth, insets, height, scaleSize } = useResponsiveLayout();
  const header = getPageHeaderLayout(pageWidth, insets.top);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function requestReset() {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <EdgeScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="never"
          contentContainerStyle={[styles.page, { minHeight: height, paddingTop: header.contentTop, paddingBottom: insets.bottom + scaleSize(24) }]}>
          <View style={styles.content}>
            <View accessible={false} style={styles.iconCircle}>
              <View style={styles.lockLoop} /><View style={styles.lockBody}><View style={styles.keyhole} /></View>
            </View>
            <Text accessibilityRole="header" style={styles.heading}>{submitted ? 'Reset request preview' : 'Forgot Password?'}</Text>
            <Text style={styles.description}>
              {submitted
                ? 'Your email is ready for password recovery. Email delivery will be available when the backend is connected.'
                : 'Enter the email address linked to your LittleEye account to request a password reset.'}
            </Text>
            {submitted ? (
              <>
                <View style={styles.notice}>
                  <Text style={styles.noticeTitle}>Frontend preview — no email sent</Text>
                  <Text style={styles.email}>{email.trim()}</Text>
                </View>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setSubmitted(false)} style={({ pressed }) => [styles.secondary, pressed && styles.textPressed]}>
                  <Text style={styles.secondaryText}>Use a different email</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.label}>Email address</Text>
                <View style={styles.inputShadow}>
                  <TextInput accessibilityLabel="Email address" placeholder="Enter your email" placeholderTextColor={BrandColors.blue}
                    value={email} onChangeText={(value) => { setEmail(value); setError(''); }} keyboardType="email-address"
                    autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress"
                    returnKeyType="go" onSubmitEditing={requestReset} style={[styles.input, !!email && styles.filledInput]} />
                </View>
                <FormError>{error}</FormError>
                <GlowButton accessibilityRole="button" onPress={requestReset} style={[styles.button]}>
                  <Text style={styles.buttonText}>Request Password Reset</Text>
                </GlowButton>
                <Text style={styles.preview}>Email delivery will be connected to the backend.</Text>
              </>
            )}
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={({ pressed }) => [styles.returnButton, pressed && styles.textPressed]}>
              <Text style={styles.returnText}>Back to Sign In</Text>
            </Pressable>
          </View>
        </EdgeScrollView>
      </KeyboardAvoidingView>
      <FixedPageHeader light onBack={() => router.back()} profile={false} />
    </View>
  );
}

const baseStyles = StyleSheet.create({
  filledInput: { fontFamily: BrandFonts.semiBold },
  textPressed: { opacity: 0.55 },
  screen: { flex: 1, backgroundColor: BrandColors.white },
  flex: { flex: 1 },
  page: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center', paddingTop: 16, paddingBottom: 24 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EAF0F8', alignSelf: 'center', marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  lockLoop: { position: 'absolute', top: 23, width: 30, height: 30, borderWidth: 4, borderColor: BrandColors.blue, borderRadius: 15 },
  lockBody: { marginTop: 18, width: 44, height: 32, borderRadius: 8, backgroundColor: BrandColors.blue, alignItems: 'center', justifyContent: 'center' },
  keyhole: { width: 6, height: 12, borderRadius: 3, backgroundColor: BrandColors.white },
  heading: { fontFamily: BrandFonts.extraBold, fontSize: PageTypography.title, lineHeight: 32, color: BrandColors.blue, textAlign: 'center' },
  description: { fontFamily: BrandFonts.regular, fontSize: 14, lineHeight: 22, color: BrandColors.blue, textAlign: 'center', marginTop: 12, marginBottom: 28 },
  label: { fontFamily: BrandFonts.semiBold, fontSize: PageTypography.label, color: BrandColors.blue, marginBottom: 10, marginLeft: 8 },
  inputShadow: { borderRadius: 32, backgroundColor: '#FFFAFC', shadowColor: '#8298FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 2 },
  input: { minHeight: 56, borderRadius: 30, borderWidth: 1, borderColor: '#CEDAE9', paddingHorizontal: 22, paddingVertical: 14, fontFamily: BrandFonts.regular, fontSize: PageTypography.body, color: BrandColors.blue },
  button: { minHeight: 52, borderRadius: 30, backgroundColor: BrandColors.blue, marginTop: 24, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: BrandFonts.bold, fontSize: PageTypography.label, color: BrandColors.white, textAlign: 'center' },
  pressed: { opacity: 0.8 },
  preview: { fontFamily: BrandFonts.regular, fontSize: PageTypography.caption, lineHeight: 18, color: BrandColors.blue, textAlign: 'center', marginTop: 12 },
  returnButton: { minHeight: 48, marginTop: 20, alignItems: 'center', justifyContent: 'center' },
  returnText: { fontFamily: BrandFonts.bold, fontSize: 14, color: BrandColors.blue },
  notice: { backgroundColor: '#EAF0F8', borderRadius: 20, padding: 20 },
  noticeTitle: { fontFamily: BrandFonts.semiBold, fontSize: PageTypography.label, lineHeight: 22, color: BrandColors.blue, textAlign: 'center' },
  email: { fontFamily: BrandFonts.regular, fontSize: 14, color: BrandColors.blue, textAlign: 'center', marginTop: 10 },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  secondaryText: { fontFamily: BrandFonts.semiBold, fontSize: 14, color: BrandColors.blue },
});
