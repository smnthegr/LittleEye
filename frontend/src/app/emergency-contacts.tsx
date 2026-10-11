import { useMemo, useState } from 'react';
import { Alert, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { GlowButton } from '@/components/glow-button';
import { useAppSession } from '@/components/app-session';
import { SettingsProfileButton } from '@/components/settings-profile-button';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';

const contactIcon = {
  ios: 'person.crop.circle.badge.plus',
  android: 'person_add_alt_1',
  web: 'person_add_alt_1',
} satisfies SymbolViewProps['name'];

export default function EmergencyContactsScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { profile, profilePhoto, updateProfile } = useAppSession();
  const [localContacts, setLocalContacts] = useState(profile?.contacts ?? []);
  const contacts = useMemo(() => (profile?.contacts ?? localContacts).filter(contact => contact.fullName.trim() || contact.phone.trim()), [profile?.contacts, localContacts]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [newContact, setNewContact] = useState({ fullName: '', phone: '', email: '', address: '' });
  const displayedContacts = contacts.map((contact, index) => ({
    fullName: contact.fullName || 'Emergency Contact',
    phone: contact.phone,
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
    if (contacts.length >= 3) {
      Alert.alert('Contact limit reached', 'You can add up to three emergency contacts.');
      return;
    }
    setEditingContactIndex(null);
    setNewContact({ fullName: '', phone: '', email: '', address: '' });
    setShowAddContact(true);
  }

  function openEditContact(index: number) {
    const contact = contacts[index];
    if (!contact) return;
    setEditingContactIndex(index);
    setNewContact({ fullName: contact.fullName, phone: contact.phone, email: contact.email ?? '', address: contact.address ?? '' });
    setShowAddContact(true);
  }

  function removeContact(index: number) {
    const contact = contacts[index];
    if (!contact) return;
    Alert.alert('Remove contact?', `Remove ${contact.fullName} from emergency contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        const updatedContacts = contacts.filter((_, contactIndex) => contactIndex !== index);
        setLocalContacts(updatedContacts);
        if (profile) updateProfile({ ...profile, contacts: updatedContacts });
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
    const contact = {
      fullName: newContact.fullName.trim(),
      phone: newContact.phone.trim(),
      email: newContact.email.trim(),
      address: newContact.address.trim(),
    };
    if (!contact.fullName || !contact.phone || !contact.email || !contact.address) {
      Alert.alert('Complete all fields', 'Enter the contact name, number, email, and address.');
      return;
    }
    const normalizedPhone = contact.phone.replace(/[\s()-]/g, '');
    if (!/^(?:09\d{9}|\+63\d{10})$/.test(normalizedPhone)) {
      Alert.alert('Invalid contact number', 'Use an 11-digit number starting with 09, or a number starting with +63 followed by 10 digits.');
      return;
    }
    const comparablePhone = (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      return digits.startsWith('63') ? `0${digits.slice(2)}` : digits;
    };
    const duplicatePhone = contacts.some((existing, index) =>
      index !== editingContactIndex && comparablePhone(existing.phone) === comparablePhone(normalizedPhone),
    );
    if (duplicatePhone) {
      Alert.alert('Number already added', 'Each emergency contact must have a different phone number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      Alert.alert('Check the email', 'Enter a valid email address.');
      return;
    }
    if (!/^[^\s@]+@gmail\.com$/i.test(contact.email)) {
      Alert.alert('Gmail address required', 'The email address must end with gmail.com.');
      return;
    }
    const updatedContacts = editingContactIndex === null
      ? [...contacts, contact]
      : contacts.map((existing, index) => index === editingContactIndex ? contact : existing);
    setLocalContacts(updatedContacts);
    if (profile) updateProfile({ ...profile, contacts: updatedContacts });
    Keyboard.dismiss();
    setShowAddContact(false);
  }

  return <View style={s.screen}>
    <StatusBar style="light" />
    <Image pointerEvents="none" source={require('../../assets/images/emergency-contacts-background.svg')} contentFit="fill" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
    <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 10, paddingBottom: Math.max(insets.bottom, 16) + 14 }]} showsVerticalScrollIndicator={false}>
      <View style={s.headerRow}>
        <BackButton accessibilityLabel="Back" onPress={goBack} />
        <SettingsProfileButton />
      </View>

      <Text accessibilityRole="header" style={s.title}>Emergency Contacts</Text>

      <View style={s.contactList}>
        {displayedContacts.map((contact, index) => <View key={`${contact.phone}-${index}`} style={s.contactCard}>
          <View style={s.contactMainRow}>
            <View style={s.avatar}>
              {profilePhoto ? <Image source={{ uri: profilePhoto }} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} /> :
                <Text style={s.avatarInitials}>{contact.fullName.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</Text>}
            </View>
            <View style={s.contactCopy}>
              <View style={s.contactNameRow}>
                <Text numberOfLines={1} style={s.contactName}>{contact.fullName}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${contact.fullName}`} onPress={() => openEditContact(index)} hitSlop={8} style={s.editIconButton}>
                  <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={14} tintColor={C.white} />
                </Pressable>
              </View>
              {!!contact.phone && <Text numberOfLines={1} style={s.contactPhone}>{contact.phone}</Text>}
              {!!contacts[index]?.email && <Text numberOfLines={1} style={s.contactMeta}>{contacts[index].email}</Text>}
              {!!contacts[index]?.address && <Text numberOfLines={2} style={s.contactMeta}>{contacts[index].address}</Text>}
              <Text style={s.contactRole}>{contact.label}</Text>
            </View>
            <GlowButton accessibilityRole="button" accessibilityLabel={`Call ${contact.fullName}`} onPress={() => callContact(contact.fullName, contact.phone)} style={s.callButton} pressRippleSize={40}>
              <SymbolView name={{ ios: 'phone', android: 'call', web: 'call' }} size={22} tintColor={C.white} />
            </GlowButton>
          </View>
        </View>)}
        {!displayedContacts.length && <Text style={s.emptyMessage}>No emergency contacts added yet.</Text>}
      </View>

      <GlowButton accessibilityRole="button" accessibilityLabel="Add Contact. Maximum of 3 contacts only" onPress={openAddContact} style={s.addContact}>
        <View style={s.addIconBox}><SymbolView name={contactIcon} size={34} tintColor={C.white} /></View>
        <View style={s.addCopy}>
          <Text style={s.addTitle}>Add Contact</Text>
          <Text style={s.addSubtitle}>Maximum of 3 contacts only</Text>
        </View>
        <View style={s.chevron} />
      </GlowButton>
    </ScrollView>
    <Modal visible={showAddContact} transparent animationType="fade" onRequestClose={() => setShowAddContact(false)}>
      <View style={s.addModalOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close add contact form" onPress={() => setShowAddContact(false)} style={StyleSheet.absoluteFill} />
        <ScrollView style={[s.addModalCard, { maxHeight: height * .84 }]} contentContainerStyle={s.addModalContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Image pointerEvents="none" source={require('../../assets/images/emergency-contacts-mascot.png')} contentFit="contain" transition={0} accessible={false} style={s.addModalMascot} />
          <View style={s.addModalHeading}>
            <Text accessibilityRole="header" style={s.addModalTitle}>{editingContactIndex === null ? 'Add Contact' : 'Edit Contact'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setShowAddContact(false)} style={s.modalClose}>
              <View style={s.closeLineOne} /><View style={s.closeLineTwo} />
            </Pressable>
          </View>
          <Text style={s.addModalSubtitle}>Emergency contact details</Text>
          <View style={s.formFields}>
            <TextInput accessibilityLabel="Emergency contact name" placeholder="Full Name" placeholderTextColor="#8190A3" value={newContact.fullName} onChangeText={value => setNewContact(current => ({ ...current, fullName: value }))} autoCapitalize="words" returnKeyType="next" style={s.formInput} />
            <TextInput accessibilityLabel="Emergency contact number" placeholder="Contact Number" placeholderTextColor="#8190A3" value={newContact.phone} onChangeText={value => setNewContact(current => ({ ...current, phone: value }))} keyboardType="phone-pad" returnKeyType="next" style={s.formInput} />
            <TextInput accessibilityLabel="Emergency contact email" placeholder="Email Address" placeholderTextColor="#8190A3" value={newContact.email} onChangeText={value => setNewContact(current => ({ ...current, email: value }))} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" style={s.formInput} />
            <TextInput accessibilityLabel="Emergency contact address" placeholder="Address" placeholderTextColor="#8190A3" value={newContact.address} onChangeText={value => setNewContact(current => ({ ...current, address: value }))} autoCapitalize="words" returnKeyType="done" style={s.formInput} />
          </View>
          <GlowButton accessibilityRole="button" accessibilityLabel={editingContactIndex === null ? 'Save emergency contact' : 'Save contact changes'} onPress={saveContact} style={s.saveContactButton}>
            <Text style={s.saveContactText}>{editingContactIndex === null ? 'Save Contact' : 'Save Changes'}</Text>
          </GlowButton>
          {editingContactIndex !== null && <Pressable accessibilityRole="button" accessibilityLabel="Delete contact" onPress={removeEditingContact} style={s.deleteContactButton}>
            <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={16} tintColor="#B13E4B" />
            <Text style={s.deleteContactText}>Delete Contact</Text>
          </Pressable>}
        </ScrollView>
      </View>
    </Modal>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.blue },
  content: { flexGrow: 1, paddingHorizontal: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: C.white, fontFamily: F.extraBold, fontSize: 19, lineHeight: 25, textAlign: 'center', marginTop: 17 },
  contactList: { gap: 20, marginTop: 28 },
  contactCard: { gap: 9, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,.5)' },
  contactMainRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#B9CEE3' },
  avatarInitials: { color: C.blue, fontFamily: F.bold, fontSize: 14 },
  contactCopy: { flex: 1, justifyContent: 'center', gap: 5 },
  contactNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactName: { color: C.white, fontFamily: F.bold, fontSize: 13, lineHeight: 16 },
  editIconButton: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: 'rgba(255,255,255,.2)' },
  contactPhone: { color: C.white, fontFamily: F.regular, fontSize: 11, lineHeight: 13 },
  contactRole: { alignSelf: 'flex-start', overflow: 'hidden', color: C.blue, fontFamily: F.bold, fontSize: 10, lineHeight: 15, paddingHorizontal: 7, borderRadius: 7, backgroundColor: '#D9E9F8' },
  contactMeta: { color: 'rgba(255,255,255,.86)', fontFamily: F.regular, fontSize: 10, lineHeight: 13 },
  callButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#DCEAF7', backgroundColor: 'rgba(50,80,123,.18)' },
  emptyMessage: { color: 'rgba(255,255,255,.8)', fontFamily: F.regular, fontSize: 12, textAlign: 'center', paddingVertical: 18 },
  addContact: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, paddingHorizontal: 14, borderRadius: 22, backgroundColor: C.white, boxShadow: '0 6px 12px rgba(0,0,0,.3)' },
  addIconBox: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: C.blue },
  addCopy: { flex: 1, gap: 2 },
  addTitle: { color: C.blue, fontFamily: F.bold, fontSize: 12 },
  addSubtitle: { color: '#6F829B', fontFamily: F.regular, fontSize: 9 },
  chevron: { width: 8, height: 8, borderTopWidth: 1.7, borderRightWidth: 1.7, borderColor: C.blue, transform: [{ rotate: '45deg' }], marginRight: 3 },
  addModalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,.48)' },
  addModalCard: { width: '100%', maxWidth: 360, flexGrow: 0, flexShrink: 1, borderRadius: 28, backgroundColor: C.white, overflow: 'hidden' },
  addModalContent: { flexGrow: 0, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 },
  addModalHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addModalTitle: { color: C.blue, fontFamily: F.bold, fontSize: 18 },
  addModalSubtitle: { marginTop: 4, color: '#71839B', fontFamily: F.regular, fontSize: 11 },
  modalClose: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#91A5BE', alignItems: 'center', justifyContent: 'center' },
  closeLineOne: { position: 'absolute', width: 12, height: 1.5, borderRadius: 1, backgroundColor: '#526F92', transform: [{ rotate: '45deg' }] },
  closeLineTwo: { position: 'absolute', width: 12, height: 1.5, borderRadius: 1, backgroundColor: '#526F92', transform: [{ rotate: '-45deg' }] },
  formFields: { gap: 16, marginTop: 26 },
  formInput: { minHeight: 48, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(126,164,209,.57)', backgroundColor: 'rgba(255,255,255,.57)', color: C.blue, fontFamily: F.regular, fontSize: 13, boxShadow: '0 0 12px rgba(81,112,255,.24)' },
  saveContactButton: { width: '78%', minHeight: 44, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 26, borderRadius: 999, backgroundColor: '#7EA4D1', boxShadow: '0 2px 5px rgba(0,0,0,.25)' },
  deleteContactButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(177,62,75,.35)', backgroundColor: 'rgba(255,255,255,.86)' },
  deleteContactText: { color: '#B13E4B', fontFamily: F.bold, fontSize: 13 },
  saveContactText: { color: C.white, fontFamily: F.bold, fontSize: 14, textShadowColor: 'rgba(0,0,0,.65)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  addModalMascot: { position: 'absolute', zIndex: 0, width: 520, height: 293, right: -160, bottom: -35, opacity: .92 },
});
