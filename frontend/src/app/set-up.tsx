import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { FixedPageHeader } from '@/components/fixed-page-header';
import { EdgeScrollView } from '@/components/edge-scroll-view';
import { AuthBottomWave } from '@/components/auth-bottom-wave';
import { GlowButton } from '@/components/glow-button';
import { FormError } from '@/components/form-error';
import { useAppSession, type Contact } from '@/components/app-session';
import { PhilippineAddressField } from '@/components/philippine-address-field';
import { formatPhilippineAddress, getPhilippineAddressError } from '@/utils/philippine-address';
import { EmergencyAreaCard } from '@/components/emergency-area-card';
import type { EmergencyAreaChoice } from '@/utils/emergency-directory';
import { getChildAge, isValidBirthdate, isValidChildHeight, isValidEmail, isValidOptionalEmail, isValidPhoneNumber, normalizePhoneNumber, PHONE_NUMBER_HINT } from '@/utils/contact-validation';
import { useMascotImages } from '@/components/mascot-images';
import { BrandColors, BrandFonts, PageTypography } from '@/constants/brand';
import { getPageHeaderLayout } from '@/utils/responsive';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, BackHandler, Easing, Keyboard, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type ScrollViewInstance, type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const emptyContact = (): Contact => ({ fullName: '', phone: '', email: '', address: '' });
const MAX_CONTACTS = 3;
const sections = ['Guardian’s Information', 'Child’s Information', 'Emergency Contact'];

function contactError(contact: Contact, emailOptional = false) {
  if (!contact.fullName.trim()) return 'Enter a full name.';
  if (!isValidPhoneNumber(contact.phone)) return PHONE_NUMBER_HINT;
  if (!(emailOptional ? isValidOptionalEmail(contact.email) : isValidEmail(contact.email))) return 'Enter a valid email address.';
  const addressError = getPhilippineAddressError(contact.addressDetails);
  if (addressError) return addressError;
  return '';
}

function Field({ placeholder, value, style, ...props }: TextInputProps) {
  const styles = useResponsiveStyles(baseStyles);
  return <TextInput accessibilityLabel={placeholder} placeholder={placeholder}
    placeholderTextColor={BrandColors.white} {...props} value={value}
    style={[styles.input, style, !!value && styles.filledInput]} />;
}

export default function SetUpScreen() {
  const styles = useResponsiveStyles(baseStyles);
  const { enterPreview } = useAppSession();
  const mascots = useMascotImages();
  const insets = useSafeAreaInsets();
  const { pageWidth, height, scaleSize } = useResponsiveLayout();
  const header = getPageHeaderLayout(pageWidth, insets.top);
  const { identifier } = useLocalSearchParams<{ identifier?: string }>();
  const initialIdentifier = typeof identifier === 'string' ? identifier : '';
  const [step, setStep] = useState(0);
  const [guardian, setGuardian] = useState<Contact>(() => ({ ...emptyContact(),
    email: isValidEmail(initialIdentifier) ? initialIdentifier : '',
    phone: isValidPhoneNumber(initialIdentifier) ? initialIdentifier : '',
  }));
  const [child, setChild] = useState({ fullName: '', birthdate: '', height: '', sex: '' });
  const [contacts, setContacts] = useState<Contact[]>([emptyContact()]);
  const [emergencyArea, setEmergencyArea] = useState<EmergencyAreaChoice>();
  const [sexOpen, setSexOpen] = useState(false);
  const [sexTriggerHeight, setSexTriggerHeight] = useState(0);
  const [sexMenuHeight, setSexMenuHeight] = useState(0);
  const sexAnchorY = useRef(0);
  const scrollOffset = useRef(0);
  const [error, setError] = useState('');
  const [fade] = useState(() => new Animated.Value(1));
  const scroll = useRef<ScrollViewInstance>(null);
  const pendingContactScroll = useRef<number | null>(null);
  const mascotScale = (pageWidth * 0.82) / 533;
  useEffect(() => () => fade.stopAnimation(), [fade]);
  useEffect(() => {
    if (!sexOpen || !sexMenuHeight || !sexTriggerHeight) return;
    const menuBottom = sexAnchorY.current + sexTriggerHeight + scaleSize(8) + sexMenuHeight;
    const visibleBottom = height - insets.bottom - scaleSize(16);
    if (menuBottom - scrollOffset.current <= visibleBottom) return;
    // Keep the overlay reachable on short screens without reserving layout space.
    const frame = requestAnimationFrame(() => scroll.current?.scrollTo({
      y: Math.max(0, menuBottom - visibleBottom), animated: true,
    }));
    return () => cancelAnimationFrame(frame);
  }, [height, insets.bottom, scaleSize, sexMenuHeight, sexOpen, sexTriggerHeight]);

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
      else if (!isValidBirthdate(child.birthdate)) message = 'Enter a valid birthdate (MM/DD/YYYY).';
      else if (getChildAge(child.birthdate) < 1 || getChildAge(child.birthdate) > 4) message = 'Profile setup is for children ages 1–4.';
      else if (!isValidChildHeight(child.height)) message = 'Please check your child’s height.';
      else if (!child.sex) message = 'Select your child’s sex.';
    }
    if (step === 2) {
      const phoneNumbers = new Set<string>();
      for (let index = 0; index < contacts.length; index++) {
        const problem = contactError(contacts[index], true);
        if (problem) { message = `Contact ${index + 1}: ${problem}`; break; }
        const phone = normalizePhoneNumber(contacts[index].phone)!;
        if (phoneNumbers.has(phone)) { message = `Contact ${index + 1}: This phone number is already added.`; break; }
        phoneNumbers.add(phone);
      }
    }
    if (message) { setError(message); return; }
    if (step < 2) changeStep(step + 1);
    else { Keyboard.dismiss(); enterPreview({ guardian, child, contacts, emergencyArea }); }
  }

  function updateContact(index: number, changes: Partial<Contact>) {
    setContacts((current) => current.map((contact, item) => item === index ? { ...contact, ...changes } : contact));
    setError('');
  }

  function contactFields(contact: Contact, update: (changes: Partial<Contact>) => void, emailOptional = false) {
    return <>
      <Field placeholder="Full Name" value={contact.fullName} autoCapitalize="words"
        autoComplete="name" onChangeText={(value) => update({ fullName: value })} />
      <Field placeholder="Contact Number" value={contact.phone} keyboardType="phone-pad"
        autoComplete="tel" onChangeText={(value) => update({ phone: value })} />
      <Field placeholder={emailOptional ? 'Email (optional)' : 'Email'} value={contact.email} keyboardType="email-address"
        autoCapitalize="none" autoCorrect={false} autoComplete="email"
        onChangeText={(value) => update({ email: value })} />
      <PhilippineAddressField light allowCurrentLocation={!emailOptional} value={contact.addressDetails} onChange={addressDetails => update({ addressDetails, address: formatPhilippineAddress(addressDetails) })} />
    </>;
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <EdgeScrollView topColor={BrandColors.blue} bottomColor={BrandColors.white} ref={scroll} keyboardShouldPersistTaps="handled"
        onScroll={event => { scrollOffset.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.page, { minHeight: height, paddingBottom: insets.bottom + scaleSize(40) }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image source={mascots.signUp} accessible={false} contentFit="contain" transition={0}
            style={{ position: 'absolute', opacity: 0.475, width: 1920 * mascotScale, height: 1080 * mascotScale,
              left: pageWidth - 1190 * mascotScale, top: insets.top + pageWidth * 0.6 - 109 * mascotScale }} />
          <AuthBottomWave width={pageWidth} height={pageWidth * 0.62 + insets.bottom} />
        </View>
        <Animated.View style={[styles.form, { paddingTop: header.contentTop, opacity: fade }]}>
          {sexOpen && <Pressable accessibilityRole="button" accessibilityLabel="Close sex menu"
            onPress={() => setSexOpen(false)} style={styles.menuDismiss} />}
          <Text accessibilityRole="header" style={styles.heading}>Set Up</Text>
          <View style={styles.section}><Text style={styles.sectionText}>{sections[step]}</Text></View>
          <View style={styles.formSurface}>
          <Text style={styles.progress}>Step {step + 1} of 3</Text>
          {step === 0 && <>{contactFields(guardian, changes => {
            setGuardian((current) => ({ ...current, ...changes })); setError('');
          })}{!!guardian.address.trim() && <EmergencyAreaCard compact address={guardian.address} localityCode={guardian.addressDetails?.localityCode} choice={emergencyArea} onChange={setEmergencyArea} />}</>}
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
            <View onLayout={event => { sexAnchorY.current = event.nativeEvent.layout.y; }}
              style={[styles.selectAnchor, sexOpen && styles.selectAbove]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Select sex" accessibilityState={{ expanded: sexOpen }}
              onLayout={event => setSexTriggerHeight(event.nativeEvent.layout.height)}
              onPress={() => { Keyboard.dismiss(); setSexOpen(!sexOpen); }}
              style={({ pressed }) => [styles.input, styles.select, sexOpen && styles.selectOpen, pressed && styles.textPressed]}>
              <Text style={[styles.inputText, !!child.sex && styles.filledInput]}>{child.sex || 'Sex'}</Text>
              <View style={[styles.chevron, sexOpen && styles.chevronOpen]} />
            </Pressable>
            {sexOpen && <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled"
              onLayout={event => setSexMenuHeight(event.nativeEvent.layout.height)}
              style={[styles.options, { top: sexTriggerHeight + scaleSize(8),
                maxHeight: Math.max(44, height - header.contentTop - insets.bottom - sexTriggerHeight - scaleSize(32)) }]}
              contentContainerStyle={styles.optionsContent}>
              {['Female', 'Male'].map((sex) => (
              <GlowButton key={sex} accessibilityRole="radio" accessibilityState={{ checked: child.sex === sex }}
                onPress={() => { setChild((current) => ({ ...current, sex })); setSexOpen(false); setError(''); }}
                style={({ pressed }) => [styles.option, child.sex === sex && styles.optionSelected, pressed && styles.optionPressed]}>
                <Text style={styles.optionText}>{sex}</Text>
                <View style={[styles.selectionCircle, child.sex === sex && styles.selectionActive]}>
                  {child.sex === sex && <View style={styles.check} />}
                </View>
              </GlowButton>
            ))}</ScrollView>}
            </View>
          </>}
          {step === 2 && <>
            <Text style={styles.contactHint}>Up to 3 contacts.</Text>
            {contacts.map((contact, index) => <View key={index} style={index > 0 && styles.followingContact}
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
              {contactFields(contact, changes => updateContact(index, changes), true)}
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
          <FormError>{error}</FormError>
          <GlowButton accessibilityRole="button" hitSlop={6} onPress={next} style={[styles.next, step === 2 && styles.finish]}>
            <Text style={[styles.nextText, step === 2 && styles.finishText]}>{step === 2 ? 'Connect a Camera' : 'Next'}</Text>
          </GlowButton>
          </View>
        </Animated.View>
      </EdgeScrollView>
      <FixedPageHeader onBack={() => step === 0 ? router.back() : changeStep(step - 1)} profile={false} />
    </KeyboardAvoidingView>
  );
}

const baseStyles = StyleSheet.create({
  filledInput: { fontFamily: BrandFonts.semiBold },
  screen: { flex: 1, backgroundColor: BrandColors.blue },
  page: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: BrandColors.blue, overflow: 'hidden' },
  form: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24 },
  formSurface: { marginTop: 16 },
  heading: { fontFamily: BrandFonts.extraBold, fontSize: PageTypography.title, lineHeight: 32, color: BrandColors.white, textAlign: 'center', marginBottom: 20 },
  section: { borderRadius: 24, backgroundColor: BrandColors.white, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 12, boxShadow: '0 6px 16px rgba(50,80,123,0.2)' },
  sectionText: { fontFamily: BrandFonts.extraBold, fontSize: PageTypography.label, color: BrandColors.blue, textAlign: 'center' },
  progress: { fontFamily: BrandFonts.regular, fontSize: PageTypography.caption, color: BrandColors.white, textAlign: 'center', alignSelf: 'center', marginTop: 10, marginBottom: 20 },
  input: { minHeight: 56, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(148,176,213,0.8)', backgroundColor: 'rgba(42,81,127,0.86)', paddingHorizontal: 22, paddingVertical: 14, color: BrandColors.white, fontFamily: BrandFonts.regular, fontSize: 14, marginBottom: 16 },
  inputText: { fontFamily: BrandFonts.regular, fontSize: 14, color: BrandColors.white },
  menuDismiss: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 10 },
  selectAnchor: { position: 'relative', marginBottom: 16 },
  selectAbove: { zIndex: 30 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 },
  selectOpen: { borderColor: BrandColors.white },
  chevron: { width: 8, height: 8, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: BrandColors.white, transform: [{ rotate: '45deg' }] },
  chevronOpen: { transform: [{ rotate: '225deg' }] },
  options: { position: 'absolute', left: 0, right: 0, zIndex: 40, borderRadius: 20, backgroundColor: BrandColors.white, borderColor: 'rgba(148,176,213,0.35)', borderWidth: 1, boxShadow: '0 10px 28px rgba(50,80,123,0.3)' },
  optionsContent: { padding: 8 },
  option: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderRadius: 12, marginBottom: 2 },
  optionText: { fontFamily: BrandFonts.semiBold, fontSize: 14, color: BrandColors.blue },
  optionSelected: { backgroundColor: 'rgba(148,176,213,0.2)' },
  optionPressed: { backgroundColor: 'rgba(148,176,213,0.3)' },
  selectionCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: BrandColors.lightBlue, alignItems: 'center', justifyContent: 'center' },
  selectionActive: { backgroundColor: BrandColors.blue, borderColor: BrandColors.blue },
  check: { width: 8, height: 5, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: BrandColors.white, transform: [{ rotate: '-45deg' }], marginTop: -2 },
  textPressed: { opacity: 0.55 },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, marginBottom: 12 },
  contactTitle: { flexShrink: 1, fontFamily: BrandFonts.semiBold, fontSize: PageTypography.label, color: BrandColors.white },
  contactHint: { fontFamily: BrandFonts.regular, fontSize: 12, lineHeight: 18, color: BrandColors.white, marginBottom: 18, alignSelf: 'flex-start' },
  primaryBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: BrandColors.lightBlue },
  primaryText: { fontFamily: BrandFonts.semiBold, fontSize: PageTypography.caption, color: BrandColors.blue },
  limitNote: { fontFamily: BrandFonts.semiBold, fontSize: 12, color: BrandColors.white, textAlign: 'center', marginTop: 24, marginBottom: 16, alignSelf: 'center', backgroundColor: 'rgba(42,81,127,0.86)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addContact: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', minHeight: 48, borderRadius: 24, backgroundColor: 'rgba(42,81,127,0.86)', borderWidth: 1, borderColor: 'rgba(148,176,213,0.5)', marginTop: 24, marginBottom: 16 },
  addText: { fontFamily: BrandFonts.semiBold, fontSize: 14, color: BrandColors.white },
  addIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: BrandColors.white, alignItems: 'center', justifyContent: 'center' },
  plusHorizontal: { position: 'absolute', width: 10, height: 2, borderRadius: 1, backgroundColor: BrandColors.blue },
  plusVertical: { position: 'absolute', width: 2, height: 10, borderRadius: 1, backgroundColor: BrandColors.blue },
  removeContact: { minHeight: 44, paddingHorizontal: 12, borderRadius: 18, flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: 'rgba(148,176,213,0.2)' },
  removeText: { fontFamily: BrandFonts.semiBold, fontSize: PageTypography.caption, color: BrandColors.white },
  trashIcon: { width: 14, height: 16 },
  trashHandle: { position: 'absolute', top: 0, left: 4, width: 6, height: 3, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: BrandColors.white, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  trashLid: { position: 'absolute', top: 3, width: 14, height: 1.5, borderRadius: 1, backgroundColor: BrandColors.white },
  trashBody: { position: 'absolute', top: 5, left: 2, width: 10, height: 10, borderWidth: 1.5, borderTopWidth: 0, borderColor: BrandColors.white, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  followingContact: { marginTop: 24 },
  next: { width: '100%', alignSelf: 'center', minHeight: 50, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: '#EAF2FC', borderWidth: 1, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  nextText: { fontFamily: BrandFonts.extraBold, fontSize: PageTypography.label, color: BrandColors.blue },
  finish: { width: '100%', paddingHorizontal: 16 },
  finishText: { fontSize: PageTypography.label, textAlign: 'center' },
});
