import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useMemo, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FixedPageHeader } from '@/components/fixed-page-header';
import { ResponsiveBackground } from '@/components/responsive-background';
import { GlowButton } from '@/components/glow-button';
import { FormError } from '@/components/form-error';
import { useAppSession, type Contact } from '@/components/app-session';
import { PhilippineAddressField } from '@/components/philippine-address-field';
import { formatPhilippineAddress, getPhilippineAddressError, manualPhilippineAddress } from '@/utils/philippine-address';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { getPageHeaderLayout } from '@/utils/responsive';
import { isValidOptionalEmail, normalizePhoneNumber, PHONE_NUMBER_HINT } from '@/utils/contact-validation';

const contactIcon = {
  ios: 'person.crop.circle.badge.plus',
  android: 'person_add_alt_1',
  web: 'person_add_alt_1',
} satisfies SymbolViewProps['name'];

const MAX_EMERGENCY_CONTACTS = 3;

export default function EmergencyContactsScreen() {
  const { pageWidth, scaleSize, fontScale } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const { profile, profilePhoto, updateContacts } = useAppSession();
  const contacts = useMemo(() => (profile?.contacts ?? []).filter(contact => contact.fullName.trim() || contact.phone.trim()), [profile?.contacts]);
  const contactLimitReached = contacts.length >= MAX_EMERGENCY_CONTACTS;
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [newContact, setNewContact] = useState<Contact>({ fullName: '', phone: '', email: '', address: '' });
  const [contactError, setContactError] = useState('');
  const displayedContacts = contacts.map((contact, index) => ({
    fullName: contact.fullName || 'Emergency Contact',
    phone: contact.phone,
    email: contact.email,
    address: contact.address,
    label: index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Contact',
  }));

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/emergency-hotline');
  }

  function callContact(fullName: string, phone: string) {
    router.push({ pathname: '/call', params: { recipient: fullName, phone, kind: 'contact' } });
  }

  function openAddContact() {
    if (contactLimitReached) {
      Alert.alert('Contact limit reached', 'You can add up to three emergency contacts.');
      return;
    }
    setEditingContactIndex(null);
    setContactError('');
    setNewContact({ fullName: '', phone: '', email: '', address: '' });
    setShowAddContact(true);
  }

  function openEditContact(index: number) {
    const contact = contacts[index];
    if (!contact) return;
    setEditingContactIndex(index);
    setContactError('');
    setNewContact({ fullName: contact.fullName, phone: contact.phone, email: contact.email ?? '', address: contact.address ?? '', addressDetails: contact.addressDetails });
    setShowAddContact(true);
  }

  function removeContact(index: number) {
    const contact = contacts[index];
    if (!contact) return;
    Alert.alert('Remove contact?', `Remove ${contact.fullName} from emergency contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        const updatedContacts = contacts.filter((_, contactIndex) => contactIndex !== index);
        updateContacts(updatedContacts);
        setShowAddContact(false);
        setEditingContactIndex(null);
      } },
    ]);
  }

  function removeEditingContact() {
    if (editingContactIndex === null) return;
    removeContact(editingContactIndex);
  }

  function saveContact() {
    if (editingContactIndex === null && contactLimitReached) {
      Alert.alert('Contact limit reached', 'You can add up to three emergency contacts.');
      return;
    }
    const contact = {
      fullName: newContact.fullName.trim(),
      phone: newContact.phone.trim(),
      email: newContact.email.trim(),
      address: newContact.address.trim(),
      addressDetails: newContact.addressDetails ?? manualPhilippineAddress(newContact.address),
    };
    if (!contact.fullName || !contact.phone || !contact.address) {
      setContactError('Enter a name, phone number, and address.');
      return;
    }
    const addressError = getPhilippineAddressError(contact.addressDetails);
    if (addressError) {
      setContactError(addressError);
      return;
    }
    const normalizedPhone = normalizePhoneNumber(contact.phone);
    if (!normalizedPhone) {
      setContactError(PHONE_NUMBER_HINT);
      return;
    }
    const duplicatePhone = contacts.some((existing, index) =>
      index !== editingContactIndex && normalizePhoneNumber(existing.phone) === normalizedPhone,
    );
    if (duplicatePhone) {
      setContactError('This phone number is already added.');
      return;
    }
    if (!isValidOptionalEmail(contact.email)) {
      setContactError('Enter a valid email address.');
      return;
    }
    const updatedContacts = editingContactIndex === null
      ? [...contacts, contact]
      : contacts.map((existing, index) => index === editingContactIndex ? contact : existing);
    updateContacts(updatedContacts);
    Keyboard.dismiss();
    setShowAddContact(false);
  }

  function updateContactField(field: keyof typeof newContact, value: string) {
    setNewContact(current => ({ ...current, [field]: value }));
    setContactError('');
  }

  return <View style={s.screen}>
    <StatusBar style="light" />
    <ResponsiveBackground source={require('../../assets/images/emergency-contacts-background.svg')} />
    <FixedPageHeader onBack={goBack} />
    <ScrollView contentContainerStyle={[s.content, { width: pageWidth, paddingTop: getPageHeaderLayout(pageWidth, insets.top).contentTop, paddingBottom: insets.bottom + scaleSize(24) }]} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" style={s.title}>Emergency Contacts</Text>

      <View style={s.contactList}>
        {displayedContacts.map((contact, index) => <View key={`${contact.phone}-${index}`} style={s.contactCard}>
          {/* Sibling call/edit targets keep editing from triggering the card's call action. */}
          <GlowButton accessibilityRole="button" accessibilityLabel={`Call ${contact.fullName}, ${contact.phone}`}
            accessibilityHint="Opens calling for this emergency contact."
            accessibilityState={{ disabled: !contact.phone.trim() }} disabled={!contact.phone.trim()}
            onPress={() => callContact(contact.fullName, contact.phone)} style={[StyleSheet.absoluteFill, s.cardCallTarget]} />
          <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.contactMainRow}>
            <View style={s.avatar}>
              {profilePhoto ? <Image source={{ uri: profilePhoto }} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} /> :
                <Text style={s.avatarInitials}>{contact.fullName.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</Text>}
            </View>
            <View style={s.contactCopy}>
              <Text style={s.contactName}>{contact.fullName}</Text>
              <Text style={s.contactRole}>{contact.label}</Text>
            </View>
            <View style={[s.callIconBadge, { width: Math.max(44, scaleSize(44)), height: Math.max(44, scaleSize(44)) }]}>
              <SymbolView name={{ ios: 'phone.fill', android: 'call', web: 'call' }} size={scaleSize(21)} tintColor={C.blue} />
            </View>
          </View>
          <View pointerEvents="box-none" style={s.contactDetails}>
            <View pointerEvents="box-none" style={[s.contactPhoneRow, fontScale > 1.3 && s.contactPhoneRowStacked]}>
              <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.phoneCopy}>
                <Text style={s.contactPhone}>{contact.phone || 'No phone number'}</Text>
              </View>
              <GlowButton accessibilityRole="button" accessibilityLabel={`Edit ${contact.fullName}`} onPress={() => openEditContact(index)}
                style={s.editContactButton} pressRippleSize={40}>
                <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={scaleSize(15)} tintColor="#E6F1FC" />
                <Text style={s.editContactText}>Edit</Text>
              </GlowButton>
            </View>
            {!!contact.email && <View pointerEvents="none" style={s.contactDetailRow}>
              <View pointerEvents="none" style={s.detailIcon}><SymbolView name={{ ios: 'envelope', android: 'mail_outline', web: 'mail_outline' }} size={scaleSize(16)} tintColor="#D9E9F8" /></View>
              <Text style={s.contactMeta}>{contact.email}</Text>
            </View>}
            {!!contact.address && <View pointerEvents="none" style={s.contactDetailRow}>
              <View pointerEvents="none" style={s.detailIcon}><SymbolView name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }} size={scaleSize(16)} tintColor="#D9E9F8" /></View>
              <Text style={s.contactMeta}>{contact.address}</Text>
            </View>}
          </View>
        </View>)}
        {!displayedContacts.length && <Text style={s.emptyMessage}>No emergency contacts added yet.</Text>}
      </View>

      <GlowButton accessibilityRole="button" accessibilityLabel="Add Contact. Maximum of 3 contacts only"
        accessibilityState={{ disabled: contactLimitReached }}
        accessibilityHint={contactLimitReached ? 'Remove a contact to add another.' : undefined}
        disabled={contactLimitReached} onPress={openAddContact} style={[s.addContact, contactLimitReached && s.addContactDisabled]}>
        <View style={[s.addIconBox, contactLimitReached && s.addIconBoxDisabled]}><SymbolView name={contactIcon} size={scaleSize(34)} tintColor={C.white} /></View>
        <View style={s.addCopy}>
          <Text style={[s.addTitle, contactLimitReached && s.addTextDisabled]}>Add Contact</Text>
          <Text style={s.addSubtitle}>{contactLimitReached ? '3 of 3 contacts added' : 'Maximum of 3 contacts only'}</Text>
        </View>
        <View style={[s.chevron, contactLimitReached && s.chevronDisabled]} />
      </GlowButton>
    </ScrollView>
    <Modal visible={showAddContact} supportedOrientations={['portrait', 'landscape']} transparent animationType="fade" onRequestClose={() => setShowAddContact(false)}>
      <KeyboardAvoidingView style={s.keyboardOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[s.addModalOverlay, {
        paddingTop: insets.top + scaleSize(16), paddingBottom: insets.bottom + scaleSize(16),
        paddingLeft: insets.left + scaleSize(20), paddingRight: insets.right + scaleSize(20),
      }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close add contact form" onPress={() => setShowAddContact(false)} style={StyleSheet.absoluteFill} />
        <ScrollView accessibilityViewIsModal style={s.addModalCard} contentContainerStyle={s.addModalContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Image pointerEvents="none" source={require('../../assets/images/emergency-contacts-mascot.png')} contentFit="contain" transition={0} accessible={false} style={s.addModalMascot} />
          <View style={s.addModalHeading}>
            <Text accessibilityRole="header" style={s.addModalTitle}>{editingContactIndex === null ? 'Add Contact' : 'Edit Contact'}</Text>
            <GlowButton accessibilityRole="button" accessibilityLabel="Close" onPress={() => setShowAddContact(false)} style={s.modalClose}>
              <View style={s.closeLineOne} /><View style={s.closeLineTwo} />
            </GlowButton>
          </View>
          <Text style={s.addModalSubtitle}>Emergency contact details</Text>
          <View style={s.formFields}>
            <TextInput accessibilityLabel="Emergency contact name" placeholder="Full Name" placeholderTextColor="#8190A3" value={newContact.fullName} onChangeText={value => updateContactField('fullName', value)} autoCapitalize="words" returnKeyType="next" style={s.formInput} />
            <TextInput accessibilityLabel="Emergency contact number" placeholder="Contact Number" placeholderTextColor="#8190A3" value={newContact.phone} onChangeText={value => updateContactField('phone', value)} keyboardType="phone-pad" returnKeyType="next" style={s.formInput} />
            <TextInput accessibilityLabel="Emergency contact email (optional)" placeholder="Email Address (optional)" placeholderTextColor="#8190A3" value={newContact.email} onChangeText={value => updateContactField('email', value)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" style={s.formInput} />
            <PhilippineAddressField enabled={showAddContact} value={newContact.addressDetails} legacyAddress={newContact.address} onChange={addressDetails => {
              setNewContact(current => ({ ...current, addressDetails, address: formatPhilippineAddress(addressDetails) })); setContactError('');
            }} />
          </View>
          <FormError>{contactError}</FormError>
          <GlowButton accessibilityRole="button" accessibilityLabel={editingContactIndex === null ? 'Save emergency contact' : 'Save contact changes'} onPress={saveContact} style={[s.contactFormButton, s.saveContactButton]}>
            <Text style={s.contactFormButtonText}>{editingContactIndex === null ? 'Save Contact' : 'Save Changes'}</Text>
          </GlowButton>
          {editingContactIndex !== null && <GlowButton accessibilityRole="button" accessibilityLabel="Delete contact" onPress={removeEditingContact} style={[s.contactFormButton, s.deleteContactButton]}>
            <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={scaleSize(16)} tintColor={C.white} />
            <Text style={s.contactFormButtonText}>Delete Contact</Text>
          </GlowButton>}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.blue },
  content: { flexGrow: 1, alignSelf: 'center', paddingHorizontal: 24 },
  title: { color: C.white, fontFamily: F.extraBold, fontSize: T.title, lineHeight: 32, textAlign: 'center' },
  contactList: { gap: 18, marginTop: 24 },
  contactCard: { position: 'relative', overflow: 'hidden', gap: 12, paddingHorizontal: 18, paddingVertical: 16, borderRadius: 24, backgroundColor: '#365C86', borderWidth: 1, borderColor: '#8FAED0', boxShadow: '0 5px 14px rgba(22,43,69,.18)' },
  cardCallTarget: { borderRadius: 24 },
  contactMainRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 64, height: 64, flexShrink: 0, borderRadius: 32, borderWidth: 2, borderColor: '#D9E9F8', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#C8DCEF' },
  avatarInitials: { color: C.blue, fontFamily: F.bold, fontSize: 22 },
  contactCopy: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 8 },
  contactName: { color: C.white, fontFamily: F.bold, fontSize: 16, lineHeight: 23 },
  callIconBadge: { flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#E2EFFB' },
  contactDetails: { gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.18)', paddingTop: 10 },
  contactPhoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  contactPhoneRowStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  phoneCopy: { flexShrink: 1 },
  contactPhone: { flexShrink: 1, color: C.white, fontFamily: F.semiBold, fontSize: 16, lineHeight: 24, fontVariant: ['tabular-nums'] },
  contactRole: { alignSelf: 'flex-start', overflow: 'hidden', color: '#E6F1FC', fontFamily: F.semiBold, fontSize: T.caption, lineHeight: 18, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9, backgroundColor: 'rgba(255,255,255,.13)' },
  contactDetailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailIcon: { width: 18, height: 20, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  contactMeta: { flex: 1, minWidth: 0, color: '#D9E9F8', fontFamily: F.regular, fontSize: 13, lineHeight: 20 },
  editContactButton: { flexShrink: 0, minHeight: 44, flexDirection: 'row', gap: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.1)' },
  editContactText: { color: '#E6F1FC', fontFamily: F.semiBold, fontSize: T.caption, lineHeight: 18 },
  emptyMessage: { color: 'rgba(255,255,255,.8)', fontFamily: F.regular, fontSize: T.body, lineHeight: 20, textAlign: 'center', paddingVertical: 18 },
  addContact: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, paddingHorizontal: 18, paddingVertical: 16, borderRadius: 24, borderWidth: 1, borderColor: '#D4E1EF', backgroundColor: C.white, boxShadow: '0 4px 12px rgba(0,0,0,.18)' },
  addContactDisabled: { backgroundColor: '#E6ECF3', borderColor: '#C4CEDC', boxShadow: 'none' },
  addIconBoxDisabled: { backgroundColor: '#91A2B7' },
  addTextDisabled: { color: '#6F829B' },
  chevronDisabled: { borderColor: '#91A2B7' },
  addIconBox: { width: 52, height: 52, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: C.blue },
  addCopy: { flex: 1, minWidth: 0, gap: 4 },
  addTitle: { color: C.blue, fontFamily: F.bold, fontSize: T.label, lineHeight: 20 },
  addSubtitle: { color: '#6F829B', fontFamily: F.regular, fontSize: T.caption, lineHeight: 18 },
  chevron: { width: 8, height: 8, borderTopWidth: 1.7, borderRightWidth: 1.7, borderColor: C.blue, transform: [{ rotate: '45deg' }], marginRight: 3 },
  keyboardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.48)' },
  addModalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addModalCard: { width: '100%', maxWidth: 360, maxHeight: '100%', flexGrow: 0, flexShrink: 1, borderRadius: 28, backgroundColor: C.white, overflow: 'hidden' },
  addModalContent: { flexGrow: 0, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 },
  addModalHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addModalTitle: { color: C.blue, fontFamily: F.bold, fontSize: T.section, lineHeight: 26 },
  addModalSubtitle: { marginTop: 4, color: '#71839B', fontFamily: F.regular, fontSize: T.caption, lineHeight: 18 },
  modalClose: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#91A5BE', alignItems: 'center', justifyContent: 'center' },
  closeLineOne: { position: 'absolute', width: 12, height: 1.5, borderRadius: 1, backgroundColor: '#526F92', transform: [{ rotate: '45deg' }] },
  closeLineTwo: { position: 'absolute', width: 12, height: 1.5, borderRadius: 1, backgroundColor: '#526F92', transform: [{ rotate: '-45deg' }] },
  formFields: { gap: 16, marginTop: 26 },
  formInput: { minHeight: 48, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(126,164,209,.57)', backgroundColor: 'rgba(255,255,255,.57)', color: C.blue, fontFamily: F.regular, fontSize: T.body, boxShadow: '0 0 12px rgba(81,112,255,.24)' },
  contactFormButton: { width: '78%', minHeight: 48, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, boxShadow: '0 2px 5px rgba(0,0,0,.2)' },
  saveContactButton: { marginTop: 26, backgroundColor: '#7EA4D1' },
  deleteContactButton: { marginTop: 12, backgroundColor: '#D92D3A' },
  contactFormButtonText: { color: C.white, fontFamily: F.bold, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  addModalMascot: { position: 'absolute', zIndex: 0, width: 520, height: 293, right: -160, bottom: -35, opacity: .92 },
});
