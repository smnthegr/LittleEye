import { BackButton } from '@/components/back-button';
import { EdgeScrollView } from '@/components/edge-scroll-view';
import { AuthBottomWave } from '@/components/auth-bottom-wave';
import { GlowButton } from '@/components/glow-button';
import { useAppSession } from '@/components/app-session';
import { useMascotImages } from '@/components/mascot-images';
import { BrandColors, BrandFonts } from '@/constants/brand';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, BackHandler, Easing, Keyboard, KeyboardAvoidingView, Platform,
  Pressable, type ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Contact = { fullName: string; phone: string; email: string; address: string };
const emptyContact = (): Contact => ({ fullName: '', phone: '', email: '', address: '' });
const MAX_CONTACTS = 3;
const sections = ['Guardian’s Information', 'Child’s Information', 'Emergency Contact'];
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const validPhone = (value: string) => /^\+?\d{10,15}$/.test(value.replace(/[\s()-]/g, ''));

function contactError(contact: Contact, emailOptional = false) {
  if (!contact.fullName.trim()) return 'Enter a full name.';
  if (!validPhone(contact.phone)) return 'Enter a valid contact number.';
  if ((!emailOptional || contact.email.trim()) && !validEmail(contact.email)) return 'Enter a valid email address.';
  if (!contact.address.trim()) return 'Enter an address.';
  return '';
}

function validBirthdate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [, month, day, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return year >= 1900 && date.getFullYear() === year && date.getMonth() === month - 1
    && date.getDate() === day && date.getTime() <= Date.now();
}

function childAge(value: string, today = new Date()) {
  if (!validBirthdate(value)) return -1;
  const [month, day, year] = value.split('/').map(Number);
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
  return age;
}

function validChildHeight(value: string) {
  // Broad input sanity limits, not a clinical growth assessment.
  return /^\d{2,3}(\.\d{1,2})?$/.test(value.trim()) && Number(value) >= 40 && Number(value) <= 140;
}

function Field({ placeholder, value, style, ...props }: TextInputProps) {
  return <TextInput accessibilityLabel={placeholder} placeholder={placeholder}
    placeholderTextColor={BrandColors.white} {...props} value={value}
    style={[styles.input, style, !!value && styles.filledInput]} />;
}

export default function SetUpScreen() {
  const { enterPreview } = useAppSession();
  const mascots = useMascotImages();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { identifier } = useLocalSearchParams<{ identifier?: string }>();
  const initialIdentifier = typeof identifier === 'string' ? identifier : '';
  const [step, setStep] = useState(0);
  const [guardian, setGuardian] = useState<Contact>(() => ({ ...emptyContact(),
    email: validEmail(initialIdentifier) ? initialIdentifier : '',
    phone: validPhone(initialIdentifier) ? initialIdentifier : '',
  }));
  const [child, setChild] = useState({ fullName: '', birthdate: '', height: '', sex: '' });
  const [contacts, setContacts] = useState<Contact[]>([emptyContact()]);
  const [sexOpen, setSexOpen] = useState(false);
  const [error, setError] = useState('');
  const [fade] = useState(() => new Animated.Value(1));
  const scroll = useRef<ScrollView>(null);
  const pendingContactScroll = useRef<number | null>(null);
  const pageWidth = Math.min(width - insets.left - insets.right, 480);
  const mascotScale = (pageWidth * 0.82) / 533;
  useEffect(() => () => fade.stopAnimation(), [fade]);

  const changeStep = useCallback((value: number) => {
    Keyboard.dismiss();
    setError('');
    setSexOpen(false);
    setStep(value);
    scroll.current?.scrollTo({ y: 0, animated: false });
    fade.setValue(0.85);
    Animated.timing(fade, { toValue: 1, duration: 280,
      easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start();
  }, [fade]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sexOpen) { setSexOpen(false); return true; }
      if (step === 0) return false;
      changeStep(step - 1);
      return true;
    });
    return () => subscription.remove();
  }, [step, changeStep, sexOpen]));

  function next() {
    let message = '';
    if (step === 0) message = contactError(guardian);
    if (step === 1) {
      if (!child.fullName.trim()) message = 'Enter your child’s full name.';
      else if (!validBirthdate(child.birthdate)) message = 'Enter a valid birthdate in MM/DD/YYYY format.';
      else if (childAge(child.birthdate) < 1 || childAge(child.birthdate) > 4) message = 'Profile setup is for children ages 1–4.';
      else if (!validChildHeight(child.height)) message = 'Please double-check your child’s height.';
      else if (!child.sex) message = 'Select your child’s sex.';
    }
    if (step === 2) {
      for (let index = 0; index < contacts.length; index++) {
        const problem = contactError(contacts[index], true);
        if (problem) { message = `Contact ${index + 1}: ${problem}`; break; }
      }
    }
    if (message) { setError(message); return; }
    if (step < 2) changeStep(step + 1);
    else { Keyboard.dismiss(); enterPreview({ guardian, child, contacts }); }
  }

  function updateContact(index: number, key: keyof Contact, value: string) {
    setContacts((current) => current.map((contact, item) => item === index ? { ...contact, [key]: value } : contact));
    setError('');
  }

  function contactFields(contact: Contact, update: (key: keyof Contact, value: string) => void, emailOptional = false) {
    return <>
      <Field placeholder="Full Name" value={contact.fullName} autoCapitalize="words"
        autoComplete="name" onChangeText={(value) => update('fullName', value)} />
      <Field placeholder="Contact Number" value={contact.phone} keyboardType="phone-pad"
        autoComplete="tel" onChangeText={(value) => update('phone', value)} />
      <Field placeholder={emailOptional ? 'Email (optional)' : 'Email'} value={contact.email} keyboardType="email-address"
        autoCapitalize="none" autoCorrect={false} autoComplete="email"
        onChangeText={(value) => update('email', value)} />
      <Field placeholder="Address" value={contact.address} autoCapitalize="words"
        autoComplete="street-address" onChangeText={(value) => update('address', value)} />
    </>;
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <EdgeScrollView topColor={BrandColors.blue} bottomColor={BrandColors.white} ref={scroll} keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.page, { minHeight: Math.max(height, insets.top + 680 + insets.bottom), paddingBottom: insets.bottom + 40 }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image source={mascots.signUp} accessible={false} contentFit="contain" transition={0}
            style={{ position: 'absolute', opacity: 0.475, width: 1920 * mascotScale, height: 1080 * mascotScale,
              left: pageWidth - 1190 * mascotScale, top: insets.top + pageWidth * 0.6 - 109 * mascotScale }} />
          <AuthBottomWave width={pageWidth} height={pageWidth * 0.62 + insets.bottom} />
        </View>
        <BackButton accessibilityRole="button" accessibilityLabel={step === 0 ? 'Back to Sign Up' : 'Back to previous setup step'}
          hitSlop={12} onPress={() => step === 0 ? router.back() : changeStep(step - 1)}
          style={[styles.back, { top: insets.top + 12 }]} />
        <Animated.View style={[styles.form, { paddingTop: insets.top + 76, opacity: fade }]}>
          {sexOpen && <Pressable accessibilityRole="button" accessibilityLabel="Close sex menu"
            onPress={() => setSexOpen(false)} style={styles.menuDismiss} />}
          <Text accessibilityRole="header" style={styles.heading}>Set Up</Text>
          <Text style={styles.subtitle}>your profile with <Text style={styles.brand}>LittleEye</Text></Text>
          <View style={styles.section}><Text style={styles.sectionText}>{sections[step]}</Text></View>
          <Text style={styles.progress}>Step {step + 1} of 3</Text>
          {step === 0 && contactFields(guardian, (key, value) => {
            setGuardian((current) => ({ ...current, [key]: value })); setError('');
          })}
          {step === 1 && <>
            <Field placeholder="Full Name" value={child.fullName} autoCapitalize="words"
              onChangeText={(value) => { setChild((current) => ({ ...current, fullName: value })); setError(''); }} />
            <Field placeholder="Birthdate (MM/DD/YYYY)" value={child.birthdate} keyboardType="number-pad" maxLength={10}
              onChangeText={(value) => {
                const digits = value.replace(/\D/g, '').slice(0, 8);
                const formatted = digits.length <= 2 ? digits : digits.length <= 4
                  ? `${digits.slice(0, 2)}/${digits.slice(2)}` : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                setChild((current) => ({ ...current, birthdate: formatted })); setError('');
              }} />
            <Field placeholder="Height (cm)" value={child.height} keyboardType="decimal-pad"
              onChangeText={(value) => { setChild((current) => ({ ...current, height: value })); setError(''); }} />
            <View style={[styles.selectAnchor, sexOpen && styles.selectAbove]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Select sex" accessibilityState={{ expanded: sexOpen }}
              onPress={() => { Keyboard.dismiss(); setSexOpen(!sexOpen); }}
              style={({ pressed }) => [styles.input, styles.select, sexOpen && styles.selectOpen, pressed && styles.textPressed]}>
              <Text style={[styles.inputText, !!child.sex && styles.filledInput]}>{child.sex || 'Sex'}</Text>
              <View style={[styles.chevron, sexOpen && styles.chevronOpen]} />
            </Pressable>
            {sexOpen && <View style={styles.options}>
              <Text style={styles.menuLabel}>SELECT SEX</Text>
              {['Female', 'Male'].map((sex) => (
              <Pressable key={sex} accessibilityRole="radio" accessibilityState={{ checked: child.sex === sex }}
                onPress={() => { setChild((current) => ({ ...current, sex })); setSexOpen(false); setError(''); }}
                style={({ pressed }) => [styles.option, child.sex === sex && styles.optionSelected, pressed && styles.optionPressed]}>
                <Text style={styles.optionText}>{sex}</Text>
                <View style={[styles.selectionCircle, child.sex === sex && styles.selectionActive]}>
                  {child.sex === sex && <View style={styles.check} />}
                </View>
              </Pressable>
            ))}</View>}
            </View>
          </>}
          {step === 2 && <>
            <Text style={styles.contactHint}>The first contact is your primary emergency contact. You can add up to three contacts.</Text>
            {contacts.map((contact, index) => <View key={index}
              onLayout={(event) => {
                if (pendingContactScroll.current !== index) return;
                pendingContactScroll.current = null;
                const y = Math.max(0, event.nativeEvent.layout.y - 16);
                requestAnimationFrame(() => scroll.current?.scrollTo({ y, animated: true }));
              }}>
              <View style={styles.contactHeader}>
                <Text style={styles.contactTitle}>Contact {index + 1}</Text>
                {index === 0 && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Primary</Text></View>}
                {index > 0 && <Pressable accessibilityRole="button" accessibilityLabel={`Remove contact ${index + 1}`} hitSlop={8}
                  onPress={() => { setContacts((current) => current.filter((_, item) => item !== index)); setError(''); }}
                  style={({ pressed }) => [styles.removeContact, pressed && styles.textPressed]}>
                  <View accessible={false} style={styles.trashIcon}>
                    <View style={styles.trashHandle} /><View style={styles.trashLid} /><View style={styles.trashBody} />
                  </View>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>}
              </View>
              {contactFields(contact, (key, value) => updateContact(index, key, value), true)}
            </View>)}
            {contacts.length < MAX_CONTACTS ? <Pressable accessibilityRole="button" onPress={() => {
              Keyboard.dismiss();
              pendingContactScroll.current = contacts.length;
              setContacts((current) => current.length < MAX_CONTACTS ? [...current, emptyContact()] : current);
              setError('');
            }}
              style={({ pressed }) => [styles.addContact, pressed && styles.textPressed]}>
              <View accessible={false} style={styles.addIcon}>
                <View style={styles.plusHorizontal} /><View style={styles.plusVertical} />
              </View>
              <Text style={styles.addText}>Add Contact</Text>
            </Pressable> : <Text style={styles.limitNote}>3 of 3 contacts added</Text>}
          </>}
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <GlowButton accessibilityRole="button" hitSlop={6} onPress={next} style={[styles.next, step === 2 && styles.finish]}>
            <Text style={[styles.nextText, step === 2 && styles.finishText]}>{step === 2 ? 'Connect a Camera' : 'Next'}</Text>
          </GlowButton>
        </Animated.View>
      </EdgeScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  filledInput: { fontFamily: BrandFonts.semiBold },
  screen: { flex: 1, backgroundColor: BrandColors.blue },
  page: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: BrandColors.blue, overflow: 'hidden' },
  back: { position: 'absolute', left: 16, zIndex: 1 },
  backArrow: { width: 12, height: 12, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: BrandColors.white, transform: [{ rotate: '45deg' }], marginLeft: 6 },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center', paddingHorizontal: 36 },
  heading: { fontFamily: BrandFonts.extraBold, fontSize: 36, color: BrandColors.white, textAlign: 'center' },
  subtitle: { fontFamily: BrandFonts.regular, fontSize: 15, lineHeight: 22, color: BrandColors.white, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  brand: { fontFamily: BrandFonts.bold, color: BrandColors.lightBlue },
  section: { borderRadius: 24, backgroundColor: BrandColors.white, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 12, boxShadow: '0 6px 16px rgba(50,80,123,0.2)' },
  sectionText: { fontFamily: BrandFonts.extraBold, fontSize: 15, color: BrandColors.blue, textAlign: 'center' },
  progress: { fontFamily: BrandFonts.regular, fontSize: 11, color: BrandColors.white, textAlign: 'center', marginTop: 10, marginBottom: 20 },
  input: { minHeight: 56, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(148,176,213,0.8)', backgroundColor: 'rgba(148,176,213,0.4)', paddingHorizontal: 22, paddingVertical: 14, color: BrandColors.white, fontFamily: BrandFonts.regular, fontSize: 14, marginBottom: 16 },
  inputText: { fontFamily: BrandFonts.regular, fontSize: 14, color: BrandColors.white },
  menuDismiss: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 10 },
  selectAnchor: { position: 'relative', marginBottom: 16 },
  selectAbove: { zIndex: 30 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 },
  selectOpen: { borderColor: BrandColors.white },
  chevron: { width: 8, height: 8, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: BrandColors.white, transform: [{ rotate: '45deg' }] },
  chevronOpen: { transform: [{ rotate: '225deg' }] },
  options: { position: 'absolute', top: 64, left: 0, right: 0, zIndex: 40, borderRadius: 20, backgroundColor: BrandColors.white, padding: 8, borderColor: 'rgba(148,176,213,0.35)', borderWidth: 1, boxShadow: '0 10px 28px rgba(50,80,123,0.3)' },
  menuLabel: { fontFamily: BrandFonts.semiBold, fontSize: 9, letterSpacing: 1.2, color: BrandColors.blue, opacity: 0.65, marginHorizontal: 12, marginTop: 6, marginBottom: 8 },
  option: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderRadius: 12, marginBottom: 2 },
  optionText: { fontFamily: BrandFonts.semiBold, fontSize: 14, color: BrandColors.blue },
  optionSelected: { backgroundColor: 'rgba(148,176,213,0.2)' },
  optionPressed: { backgroundColor: 'rgba(148,176,213,0.3)' },
  selectionCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: BrandColors.lightBlue, alignItems: 'center', justifyContent: 'center' },
  selectionActive: { backgroundColor: BrandColors.blue, borderColor: BrandColors.blue },
  check: { width: 8, height: 5, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: BrandColors.white, transform: [{ rotate: '-45deg' }], marginTop: -2 },
  textPressed: { opacity: 0.55 },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  contactTitle: { fontFamily: BrandFonts.semiBold, fontSize: 13, color: BrandColors.white },
  contactHint: { fontFamily: BrandFonts.regular, fontSize: 12, lineHeight: 18, color: BrandColors.white, marginBottom: 18 },
  primaryBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: BrandColors.lightBlue },
  primaryText: { fontFamily: BrandFonts.semiBold, fontSize: 10, color: BrandColors.blue },
  limitNote: { fontFamily: BrandFonts.semiBold, fontSize: 12, color: BrandColors.white, textAlign: 'center', marginBottom: 16 },
  addContact: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', minHeight: 48, borderRadius: 24, backgroundColor: 'rgba(148,176,213,0.18)', borderWidth: 1, borderColor: 'rgba(148,176,213,0.5)', marginBottom: 16 },
  addText: { fontFamily: BrandFonts.semiBold, fontSize: 14, color: BrandColors.white },
  addIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: BrandColors.white, alignItems: 'center', justifyContent: 'center' },
  plusHorizontal: { position: 'absolute', width: 10, height: 2, borderRadius: 1, backgroundColor: BrandColors.blue },
  plusVertical: { position: 'absolute', width: 2, height: 10, borderRadius: 1, backgroundColor: BrandColors.blue },
  removeContact: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: 'rgba(148,176,213,0.2)' },
  removeText: { fontFamily: BrandFonts.semiBold, fontSize: 11, color: BrandColors.white },
  trashIcon: { width: 14, height: 16 },
  trashHandle: { position: 'absolute', top: 0, left: 4, width: 6, height: 3, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: BrandColors.white, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  trashLid: { position: 'absolute', top: 3, width: 14, height: 1.5, borderRadius: 1, backgroundColor: BrandColors.white },
  trashBody: { position: 'absolute', top: 5, left: 2, width: 10, height: 10, borderWidth: 1.5, borderTopWidth: 0, borderColor: BrandColors.white, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  error: { fontFamily: BrandFonts.semiBold, fontSize: 12, lineHeight: 18, color: '#FF5C5C', marginBottom: 12 },
  next: { width: '60%', alignSelf: 'center', minHeight: 44, borderRadius: 24, backgroundColor: BrandColors.white, alignItems: 'center', justifyContent: 'center', marginTop: 6, boxShadow: '0 8px 20px rgba(50,80,123,0.3), 0 2px 6px rgba(50,80,123,0.15)' },
  nextText: { fontFamily: BrandFonts.extraBold, fontSize: 18, color: BrandColors.blue },
  finish: { width: '100%', paddingHorizontal: 16 },
  finishText: { fontSize: 15, textAlign: 'center' },
});
