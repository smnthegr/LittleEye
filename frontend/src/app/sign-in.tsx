import { useMascotImages } from '@/components/mascot-images';
import { GlowButton } from '@/components/glow-button';
import { useAppSession } from '@/components/app-session';
import { Image } from 'expo-image';
import { BrandColors, BrandFonts } from '@/constants/brand';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const { enterPreview } = useAppSession();
  const mascotImages = useMascotImages();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pageWidth = Math.min(width - insets.left - insets.right, 480);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function signIn() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && !/^\+?\d{10,15}$/.test(email.replace(/[\s()-]/g, ''))) {
      setError('Please enter a valid email or phone number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    enterPreview();
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.page, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={[styles.hero, { height: pageWidth * 0.78 + insets.top }]}>
          <Image
            source={require('../../assets/images/sign-in-white-edge.svg')}
            accessible={false}
            contentFit="fill"
            transition={0}
            style={{ position: 'absolute', bottom: 0, width: pageWidth, height: pageWidth * 0.78 }}
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
          <GlowButton
            accessibilityRole="button"
            accessibilityLabel="Back to welcome"
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.back, { top: insets.top + 12 }]}>
            <View style={styles.backArrow} />
          </GlowButton>
        </View>

        <View style={styles.form}>
          <Text accessibilityRole="header" style={styles.heading} adjustsFontSizeToFit numberOfLines={1}>Hello! I’m Peeka</Text>
          <Text style={styles.subtitle}>Good to see you again—let’s get you in.</Text>

          <View style={styles.inputShadow}>
            <TextInput
              accessibilityLabel="Email"
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
            <TextInput
              accessibilityLabel="Password"
              placeholder="Password"
              placeholderTextColor={BrandColors.blue}
              value={password}
              onChangeText={(value) => { setPassword(value); setError(''); }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={signIn}
              style={[styles.input, !!password && styles.filledInput]}
            />
          </View>
          <Pressable accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.forgot, pressed && styles.textPressed]} onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
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
          <Pressable accessibilityRole="button" hitSlop={8} style={({ pressed }) => pressed && styles.textPressed} onPress={() => router.push('/sign-up')}>
            <Text style={styles.signUp}>Sign Up!</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  filledInput: { fontFamily: BrandFonts.semiBold },
  screen: { flex: 1, backgroundColor: BrandColors.white },
  page: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: BrandColors.white },
  hero: { backgroundColor: BrandColors.blue, overflow: 'hidden' },

  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { width: 12, height: 12, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: BrandColors.white, transform: [{ rotate: '45deg' }], marginLeft: 6 },
  form: { paddingHorizontal: 32, paddingTop: 12 },
  heading: { fontSize: 32, fontFamily: BrandFonts.extraBold, color: '#000000', textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 13, lineHeight: 20, fontFamily: BrandFonts.regular, color: '#222222', textAlign: 'center', marginTop: 4, marginBottom: 22 },
  inputShadow: { marginBottom: 20, borderRadius: 36, backgroundColor: '#FFFAFC', shadowColor: '#8298FF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.24, shadowRadius: 18, elevation: 3 },
  input: { minHeight: 58, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 36, borderWidth: 1, borderColor: '#CEDAE9', fontFamily: BrandFonts.regular, fontSize: 15, color: BrandColors.blue },
  forgot: { alignSelf: 'flex-end', marginTop: -10, minHeight: 30, justifyContent: 'center' },
  forgotText: { fontSize: 10, fontFamily: BrandFonts.regular, color: BrandColors.blue },
  textPressed: { opacity: 0.55 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 18, fontFamily: BrandFonts.regular, marginBottom: 8 },
  signIn: { alignSelf: 'center', width: '68%', minHeight: 48, borderRadius: 30, backgroundColor: BrandColors.lightBlue, alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4, marginTop: 4 },
  signInText: { fontSize: 19, fontFamily: BrandFonts.extraBold, color: BrandColors.white },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 34 },
  line: { flex: 1, height: 1, backgroundColor: '#555555' },
  dividerText: { fontFamily: BrandFonts.regular, fontSize: 14, color: '#111111' },
  google: { width: 68, height: 48, borderRadius: 18, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.white, marginTop: 16, shadowColor: BrandColors.blue, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4 },
  googleIcon: { width: 24, height: 24 },
  footer: { marginTop: 14, paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' },
  footerText: { fontFamily: BrandFonts.semiBold, fontSize: 14, color: '#111111' },
  signUp: { fontFamily: BrandFonts.extraBold, fontSize: 14, color: BrandColors.lightBlue },
});




