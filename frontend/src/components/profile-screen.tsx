import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useState } from 'react';
import { PhilippineAddressField } from './philippine-address-field';
import { EmergencyAreaCard } from './emergency-area-card';
import { formatPhilippineAddress, getPhilippineAddressError, manualPhilippineAddress, type PhilippineAddress } from '@/utils/philippine-address';
import { Redirect, router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FixedPageHeader } from './fixed-page-header';
import { EdgeScrollView } from './edge-scroll-view';
import { GlowButton } from './glow-button';
import { FormError } from './form-error';
import { PasswordInput } from './password-input';
import { SettingsSignOut } from './settings-sign-out';
import { SettingsIcon } from './settings-icon';
import { ProfileIcon, type ProfileIconName } from './profile-icon';
import { useAppSession, type Profile } from './app-session';
import { useSettingsCamera } from '@/hooks/use-settings-camera';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';
import { getPageHeaderLayout } from '@/utils/responsive';
import { isValidBirthdate, isValidChildHeight, isValidEmail, isValidPhoneNumber, PHONE_NUMBER_HINT } from '@/utils/contact-validation';

type Mode = 'guardian' | 'child' | 'account';
type Field = 'guardian-name' | 'child-name' | 'phone' | 'email' | 'address' | 'birthdate' | 'height' | 'sex' | 'password';
const emptyProfile: Profile = { guardian: { fullName: '', phone: '', email: '', address: '' }, child: { fullName: '', birthdate: '', height: '', sex: '' }, contacts: [] };
const fieldLabels: Record<Field, string> = { 'guardian-name': 'Guardian name', 'child-name': 'Child name', phone: 'Contact number', email: 'Email address', address: 'Address', birthdate: 'Birthdate', height: 'Height', sex: 'Sex', password: 'Change Password' };

function InfoRow({ title, value, icon, onPress, chevron = false }: { title: string; value?: string; icon: ProfileIconName; onPress?: () => void; chevron?: boolean }) {
  const s = useResponsiveStyles(baseStyles);
  const contents = <>{chevron && <ProfileIcon name={icon} size={22} />}<View style={s.rowText}><Text style={s.rowTitle}>{title}</Text>{value !== undefined && <Text style={s.rowValue}>{value || 'Not provided'}</Text>}</View>
    {chevron ? <View style={s.chevron} /> : <View style={s.iconCircle}><ProfileIcon name={icon} size={21} /></View>}</>;
  return onPress ? <GlowButton accessibilityRole="button" accessibilityLabel={`${title}${value ? `: ${value}` : ''}`} onPress={onPress} style={s.row}>{contents}</GlowButton> : <View style={s.row}>{contents}</View>;
}

export function ProfileScreen({ mode = 'guardian' }: { mode?: Mode }) {
  const { pageWidth, scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const session = useAppSession();
  const { camera, isPreview } = useSettingsCamera();
  const insets = useSafeAreaInsets();
  const profile = session.profile ?? emptyProfile;
  const primaryContact = profile.contacts.find(contact => contact.fullName.trim() || contact.phone.trim());
  const child = mode === 'child';
  const account = mode === 'account';
  const photo = child ? session.childPhoto : session.profilePhoto;
  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [edit, setEdit] = useState<Field | null>(null);
  const [draft, setDraft] = useState('');
  const [addressDraft, setAddressDraft] = useState<PhilippineAddress>();
  const [error, setError] = useState('');
  const [photoFailed, setPhotoFailed] = useState(false);
  const params = isPreview ? { preview: 'connected' } : {};
  const settingsParams = { ...params, from: 'profile' };
  const headerLayout = getPageHeaderLayout(pageWidth, insets.top);
  function navigate(pathname: '/profile' | '/profile-child' | '/profile-account' | '/settings') {
    router.push({ pathname, params: pathname === '/settings' ? settingsParams : params });
  }
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: mode === 'guardian' ? '/settings' : '/profile', params: mode === 'guardian' ? settingsParams : params });
  }
  function openEdit(field: Field) {
    setError('');
    if (field === 'address') setAddressDraft(profile.guardian.addressDetails ?? manualPhilippineAddress(profile.guardian.address));
    setDraft(field === 'guardian-name' ? profile.guardian.fullName : field === 'child-name' ? profile.child.fullName :
      field === 'birthdate' || field === 'height' || field === 'sex' ? profile.child[field] : field === 'password' ? '' : profile.guardian[field]);
    setEdit(field);
  }
  function save() {
    if (!edit || edit === 'password') return;
    if (edit === 'address') {
      const problem = getPhilippineAddressError(addressDraft);
      if (problem) { setError(problem); return; }
    }
    const value = edit === 'address' ? formatPhilippineAddress(addressDraft) : draft.trim();
    if (!value) { setError('Please fill in this field.'); return; }
    if (edit === 'email' && !isValidEmail(value)) { setError('Enter a valid email address.'); return; }
    if (edit === 'phone' && !isValidPhoneNumber(value)) { setError(PHONE_NUMBER_HINT); return; }
    if (edit === 'height' && !isValidChildHeight(value)) { setError('Please check your child’s height.'); return; }
    if (edit === 'birthdate' && !isValidBirthdate(value)) { setError('Enter a valid birthdate (MM/DD/YYYY).'); return; }
    if (edit === 'sex' && !['Female', 'Male'].includes(value)) { setError('Select your child’s sex.'); return; }
    const next = { ...profile, guardian: { ...profile.guardian }, child: { ...profile.child } };
    if (edit === 'guardian-name') next.guardian.fullName = value;
    else if (edit === 'child-name') next.child.fullName = value;
    else if (edit === 'birthdate' || edit === 'height' || edit === 'sex') next.child[edit] = value;
    else next.guardian[edit] = value;
    if (edit === 'address') next.guardian.addressDetails = addressDraft;
    session.updateProfile(next);
    setEdit(null);
  }
  async function choosePhoto() {
    if (picking) return;
    setPicking(true); setPhotoError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .9 });
      if (!result.canceled && result.assets[0]?.uri) {
        (child ? session.setChildPhoto : session.setProfilePhoto)(result.assets[0].uri);
        setPhotoFailed(false);
      }
    } catch { setPhotoError('Could not open your photos; try again.'); }
    finally { setPicking(false); }
  }
  // A cleared session also clears its camera. Do not let that trigger the
  // no-camera Settings redirect while sign-out is removing account screens.
  if (!session.signedIn || !session.accepted) return <Redirect href="/" />;
  if (!camera) return <Redirect href={{ pathname: '/settings', params: settingsParams }} />;
  return <View style={s.screen}>
    <StatusBar style="dark" />
    <FixedPageHeader light profile={false} onBack={back}>
      <GlowButton accessibilityRole="button" accessibilityLabel="Open Settings" onPress={() => navigate('/settings')}
        style={[s.settingsButton, { width: headerLayout.buttonSize, height: headerLayout.buttonSize, borderRadius: headerLayout.buttonSize / 2 }]}>
        <SettingsIcon color={C.blue} />
      </GlowButton>
    </FixedPageHeader>
    <EdgeScrollView topColor={C.white} bottomColor={C.blue} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} showsVerticalScrollIndicator={false} contentContainerStyle={[s.page, { width: pageWidth, minHeight: '100%', paddingBottom: insets.bottom + scaleSize(mode === 'guardian' ? 92 : 28) }]}>
      <View pointerEvents="none" style={[s.safeAreaFill, { height: insets.top }]} />
      <View pointerEvents="none" style={[s.headerArt, { top: insets.top, height: pageWidth * 350 / 440 }]}>
        <Image source={require('../../assets/images/profile-header-wave.svg')} contentFit="fill" style={StyleSheet.absoluteFill} />
      </View>
      <View pointerEvents="none" style={s.bottomBlob} />
      <View style={[s.top, { paddingTop: headerLayout.contentTop }]}>
        <Text accessibilityRole="header" style={s.heading}>{account ? 'Account & Privacy' : child ? 'Child’s Profile' : 'Guardian’s Profile'}</Text>
      </View>
      {account ? <View style={s.laptopFrame}><View pointerEvents="none" style={s.laptopGlow} /><Image accessible={false} source={require('../../assets/images/profile-laptop-mascot-4k.png')} contentFit="contain" style={s.laptop} /></View> : <View style={s.avatarSection}>
        <GlowButton accessibilityRole="button" accessibilityLabel={`Change ${child ? 'child' : 'guardian'} photo`} disabled={picking} onPress={choosePhoto} style={s.avatarRing}>
          <View pointerEvents="none" style={s.avatarClip}>
            {photo && !photoFailed ? <Image source={{ uri: photo }} contentFit="cover" style={StyleSheet.absoluteFill} onError={() => setPhotoFailed(true)} /> :
              <Image accessible={false} source={require('../../assets/images/profile-guardian-child-mascots-4k.png')} contentFit="contain" style={[s.mascotPair, { left: child ? scaleSize(-221) : scaleSize(-14) }]} />}
          </View>
          <View pointerEvents="none" style={s.cameraBadge}><ProfileIcon name="camera" size={24} /></View>
        </GlowButton>
        {picking && <Text style={s.photoNote}>Opening photos…</Text>}
        <FormError>{photoError}</FormError>
        <GlowButton accessibilityRole="button" accessibilityLabel={`Edit ${child ? 'child' : 'guardian'} name`} onPress={() => openEdit(child ? 'child-name' : 'guardian-name')} style={s.nameButton}>
          <Text style={s.name}>{(child ? profile.child.fullName : profile.guardian.fullName) || (child ? 'Child name' : 'Your name')}</Text><ProfileIcon name="edit" size={17} color={C.lightBlue} />
        </GlowButton>
        {!child && <Text style={s.email}>{profile.guardian.email || 'Email not provided'}</Text>}
        {!!photo && <Pressable accessibilityRole="button" onPress={() => { (child ? session.setChildPhoto : session.setProfilePhoto)(null); setPhotoFailed(false); }} style={s.removePhoto}><Text style={s.removeText}>Remove photo</Text></Pressable>}
      </View>}
      <View style={s.details}>
        {account ? <>
          <InfoRow title="Change Password" icon="lock" chevron onPress={() => openEdit('password')} />
          <InfoRow title="Change Email" icon="mail" chevron onPress={() => openEdit('email')} />
          <InfoRow title="Change Contact Number" icon="phone" chevron onPress={() => openEdit('phone')} />
          <InfoRow title="Change Address" icon="home" chevron onPress={() => openEdit('address')} />
        </> : child ? <>
          <InfoRow title="Birthdate" value={profile.child.birthdate} icon="calendar" onPress={() => openEdit('birthdate')} />
          <InfoRow title="Address" value={profile.guardian.address} icon="home" onPress={() => openEdit('address')} />
          <InfoRow title="Height" value={profile.child.height ? `${profile.child.height} cm` : ''} icon="height" onPress={() => openEdit('height')} />
          <InfoRow title="Sex" value={profile.child.sex} icon="sex" onPress={() => openEdit('sex')} />
        </> : <>
          <InfoRow title="Contact Number" value={profile.guardian.phone} icon="phone" onPress={() => openEdit('phone')} />
          <InfoRow title="Address" value={profile.guardian.address} icon="home" onPress={() => openEdit('address')} />
          <InfoRow title="Account & Privacy" icon="lock" onPress={() => navigate('/profile-account')} />
          <Text accessibilityRole="header" style={s.sectionTitle}>Primary Emergency Contact</Text>
          {primaryContact ? <InfoRow title={primaryContact.fullName || 'Emergency Contact'} value={primaryContact.phone} icon="phone" />
            : <Text style={s.empty}>No emergency contacts added yet.</Text>}
        </>}
        {mode === 'guardian' && <SettingsSignOut light />}
      </View>
    </EdgeScrollView>
    {mode === 'guardian' && <GlowButton accessibilityRole="button" onPress={() => navigate('/profile-child')}
      style={[s.childButton, { bottom: insets.bottom + scaleSize(16), maxWidth: pageWidth - scaleSize(48) }]}><Text style={s.childButtonText}>Child’s Profile</Text></GlowButton>}
    <Modal visible={!!edit} supportedOrientations={['portrait', 'landscape']} transparent animationType="fade" onRequestClose={() => setEdit(null)}>
      <KeyboardAvoidingView style={s.keyboardOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[s.overlay, {
        paddingTop: insets.top + scaleSize(16), paddingBottom: insets.bottom + scaleSize(16),
        paddingLeft: insets.left + scaleSize(24), paddingRight: insets.right + scaleSize(24),
      }]}>
        <View accessibilityViewIsModal style={s.modal}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text accessibilityRole="header" style={s.modalTitle}>{edit ? fieldLabels[edit] : ''}</Text>
            {edit === 'password' ? <>
              <Text style={s.modalNote}>Password updates will be available when account authentication is connected.</Text>
              {['Current Password', 'New Password', 'Confirm New Password'].map(label => <PasswordInput key={label} accessibilityLabel={label} placeholder={label} editable={false} placeholderTextColor="#7588A3" style={s.input} />)}
            </> : edit === 'address' ? <>
              <PhilippineAddressField allowCurrentLocation value={addressDraft} legacyAddress={profile.guardian.address}
                onChange={value => { setAddressDraft(value); setError(''); }} />
              {!!addressDraft && !!formatPhilippineAddress(addressDraft).trim() && <EmergencyAreaCard compact
                address={formatPhilippineAddress(addressDraft)} localityCode={addressDraft.localityCode} choice={profile.emergencyArea} />}
            </> : edit === 'sex' ? <View style={s.options}>{['Female', 'Male'].map(value => <GlowButton key={value} accessibilityRole="radio" accessibilityState={{ checked: draft === value }} onPress={() => setDraft(value)} style={[s.option, draft === value && s.selected]}><Text style={s.optionText}>{value}</Text></GlowButton>)}</View> : <TextInput
              accessibilityLabel={edit ? fieldLabels[edit] : 'Profile value'} value={draft} onChangeText={value => { setDraft(value); setError(''); }}
              placeholder={edit === 'birthdate' ? 'MM/DD/YYYY' : edit === 'height' ? 'Height in cm' : edit ? fieldLabels[edit] : ''}
              placeholderTextColor="#7588A3" keyboardType={edit === 'phone' ? 'phone-pad' : edit === 'height' ? 'decimal-pad' : edit === 'email' ? 'email-address' : 'default'}
              autoCapitalize={edit === 'email' ? 'none' : 'sentences'} maxLength={100} style={s.input} />}
            <FormError>{error}</FormError>
          </ScrollView>
          <View style={s.modalActions}><GlowButton accessibilityRole="button" onPress={() => setEdit(null)} style={s.cancel}><Text style={s.cancelText}>{edit === 'password' ? 'Close' : 'Cancel'}</Text></GlowButton>
            {edit !== 'password' && <GlowButton accessibilityRole="button" onPress={save} style={s.save}><Text style={s.saveText}>Save Changes</Text></GlowButton>}</View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.blue }, page: { alignSelf: 'center', backgroundColor: C.blue, overflow: 'hidden' },
  settingsButton: { alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(148,176,213,.22)', borderWidth: 1, borderColor: 'rgba(148,176,213,.45)', boxShadow: '0 0 20px 5px rgba(148,176,213,.32), 0 5px 14px rgba(24,42,67,.16)' },
  headerArt: { position: 'absolute', left: 0, right: 0 },
  safeAreaFill: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: C.white },
  bottomBlob: { position: 'absolute', width: 490, height: 490, left: -140, top: 430, borderRadius: 150, backgroundColor: 'rgba(148,176,213,.16)', transform: [{ rotate: '-26deg' }] },
  top: { paddingHorizontal: 24 }, heading: { fontFamily: F.extraBold, color: C.blue, textAlign: 'center', fontSize: T.title, lineHeight: 32, marginBottom: 20 },
  avatarSection: { alignItems: 'center', paddingTop: 8, paddingHorizontal: 24 },
  avatarRing: { width: 204, height: 204, borderRadius: 102, borderWidth: 6, borderColor: C.lightBlue, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px 6px rgba(148,176,213,.65), 0 8px 20px rgba(25,46,86,.25)' },
  avatarClip: { width: 180, height: 180, borderRadius: 90, overflow: 'hidden', backgroundColor: '#E8EFF8' },
  mascotPair: { position: 'absolute', width: 420, height: 236.25, top: -15 },
  cameraBadge: { position: 'absolute', right: 0, bottom: 2, width: 42, height: 42, borderRadius: 21, backgroundColor: C.blue, borderWidth: 4, borderColor: C.white, justifyContent: 'center', alignItems: 'center' },
  nameButton: { minHeight: 44, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 22, marginTop: 14, paddingHorizontal: 8 },
  name: { fontFamily: F.bold, color: C.white, fontSize: T.section, lineHeight: 26, flexShrink: 1, textAlign: 'center' }, email: { fontFamily: F.regular, color: C.lightBlue, fontSize: T.body, textAlign: 'center', lineHeight: 20 },
  photoNote: { color: C.white, fontFamily: F.regular, fontSize: T.caption, lineHeight: 18, marginTop: 8, textAlign: 'center' }, removePhoto: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }, removeText: { color: '#D7E4F5', fontFamily: F.regular, fontSize: T.caption, lineHeight: 18 },
  details: { paddingHorizontal: 24, paddingTop: 24, gap: 12 },
  row: { minHeight: 58, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(148,176,213,.8)', backgroundColor: 'rgba(148,176,213,.32)', paddingVertical: 12, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, minWidth: 0 }, rowTitle: { fontFamily: F.bold, fontSize: T.label, lineHeight: 20, color: C.white }, rowValue: { fontFamily: F.regular, fontSize: T.body, lineHeight: 20, marginTop: 3, color: C.white },
  iconCircle: { width: 31, height: 31, borderRadius: 16, borderWidth: 2, borderColor: '#D8E7F8', alignItems: 'center', justifyContent: 'center' },
  chevron: { width: 9, height: 9, borderRightWidth: 2, borderTopWidth: 2, borderColor: C.white, transform: [{ rotate: '45deg' }] },
  sectionTitle: { fontFamily: F.bold, fontSize: T.section, lineHeight: 26, color: C.white, marginTop: 12 }, empty: { fontFamily: F.regular, fontSize: T.body, color: '#D8E7F8', lineHeight: 20 },
  childButton: { position: 'absolute', zIndex: 10, minHeight: 48, alignSelf: 'center', paddingHorizontal: 28, justifyContent: 'center', borderRadius: 24, backgroundColor: C.white, boxShadow: '0 0 24px 5px rgba(148,176,213,.35)' }, childButtonText: { fontFamily: F.bold, color: C.blue, fontSize: T.label, lineHeight: 20 },
  laptopFrame: { height: 260, alignItems: 'center', justifyContent: 'center' }, laptop: { width: '145%', height: 290 },
  laptopGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(148,176,213,.18)', boxShadow: '0 0 28px 12px rgba(148,176,213,.4)' },
  keyboardOverlay: { flex: 1, backgroundColor: 'rgba(15,30,51,.55)' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' }, modal: { backgroundColor: C.white, width: '100%', maxWidth: 400, maxHeight: '100%', flexShrink: 1, borderRadius: 28, padding: 24 },
  modalTitle: { fontFamily: F.bold, color: C.blue, fontSize: T.section, lineHeight: 26, marginBottom: 18 }, modalNote: { fontFamily: F.regular, color: C.blue, fontSize: T.body, lineHeight: 20, marginBottom: 12 },
  input: { minHeight: 52, backgroundColor: '#F2F6FC', borderWidth: 1, borderColor: C.lightBlue, borderRadius: 16, padding: 14, fontFamily: F.regular, color: C.blue, fontSize: 14, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancel: { flex: 1, minHeight: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8EFF8' }, cancelText: { color: C.blue, fontFamily: F.semiBold, fontSize: T.label, lineHeight: 20 },
  save: { flex: 1, minHeight: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', backgroundColor: C.blue }, saveText: { color: C.white, fontFamily: F.semiBold, fontSize: T.label, lineHeight: 20, textAlign: 'center' },
  options: { flexDirection: 'row', gap: 12 }, option: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: C.lightBlue, justifyContent: 'center', alignItems: 'center' }, selected: { backgroundColor: '#DBE8FA', borderColor: C.blue }, optionText: { fontFamily: F.semiBold, color: C.blue, fontSize: 14 },
});
