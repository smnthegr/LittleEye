import { useState } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { useAppSession } from '@/components/app-session';
import { GlowButton } from '@/components/glow-button';
import { PolicyReader } from '@/components/consent-gate';
import { ProfileAvatar } from '@/components/profile-avatar';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const session = useAppSession();
  const [showPolicies, setShowPolicies] = useState(false);
  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const guardian = session.profile?.guardian;
  const canEditProfile = session.camera?.status === 'connected';
  const hasPhoto = typeof session.profilePhoto === 'string' && !!session.profilePhoto;
  async function choosePhoto() {
    if (!canEditProfile || picking) return;
    setPhotoError(''); setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .9,
      });
      if (!result.canceled && result.assets[0]?.uri) session.setProfilePhoto(result.assets[0].uri);
    } catch {
      setPhotoError('Couldn’t open your photos. Please try again.');
    } finally { setPicking(false); }
  }
  return <View style={[s.screen, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 20 }]}>
    <StatusBar style="dark" />
    <View style={s.page}>
      <View style={s.header}><GlowButton accessibilityRole="button" accessibilityLabel="Back to camera setup" style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/connect-camera')}><View style={s.arrow} /></GlowButton><Text style={s.heading}>Your profile</Text></View>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {canEditProfile && <View style={s.photoSection}>
          <GlowButton accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={picking}
            onPress={choosePhoto} style={s.photoFrame}><ProfileAvatar size={104} /></GlowButton>
          <Pressable accessibilityRole="button" disabled={picking} onPress={choosePhoto}
            style={({ pressed }) => [s.photoAction, (pressed || picking) && { opacity: .55 }]}>
            <Text style={s.photoActionText}>{picking ? 'Opening photos…' : hasPhoto ? 'Change photo' : 'Add photo'}</Text>
          </Pressable>
          {hasPhoto && <Pressable accessibilityRole="button" disabled={picking}
            onPress={() => { session.setProfilePhoto(null); setPhotoError(''); }}
            style={({ pressed }) => [s.removePhoto, pressed && { opacity: .55 }]}>
            <Text style={s.removePhotoText}>Remove photo</Text>
          </Pressable>}
          {!!photoError && <Text accessibilityRole="alert" style={s.photoError}>{photoError}</Text>}
        </View>}
        {canEditProfile && !!guardian?.fullName && <Text style={s.name}>{guardian.fullName}</Text>}
        {canEditProfile && !!guardian?.email && <Text style={s.note}>{guardian.email}</Text>}
        {canEditProfile && session.profile && <View style={s.card}>
          <Text style={s.label}>CHILD’S PROFILE</Text><Text style={s.value}>{session.profile.child.fullName}</Text>
          <Text style={s.label}>PRIMARY EMERGENCY CONTACT</Text><Text style={s.value}>{session.profile.contacts[0]?.fullName}</Text><Text style={s.note}>{session.profile.contacts[0]?.phone}</Text>
        </View>}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showPolicies }} onPress={() => setShowPolicies((value) => !value)} style={({ pressed }) => [s.policyButton, pressed && { opacity: .55 }]}><Text style={s.policyLabel}>Terms & Privacy</Text><View style={[s.policyChevron, { transform: [{ rotate: showPolicies ? '225deg' : '45deg' }] }]} /></Pressable>
        {showPolicies && <View style={s.reader}><PolicyReader /></View>}
        <GlowButton accessibilityRole="button" onPress={session.signOut} style={s.signOut}><Text style={s.signOutText}>Sign out</Text></GlowButton>
      </ScrollView>
    </View>
  </View>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.white, paddingHorizontal: 28 }, page: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }, back: { width: 38, height: 38, borderRadius: 20, backgroundColor: 'rgba(148,176,213,.2)', justifyContent: 'center', alignItems: 'center' }, arrow: { width: 12, height: 12, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: C.blue, transform: [{ rotate: '45deg' }], marginLeft: 4 },
  heading: { fontFamily: F.bold, color: C.blue, fontSize: 24 }, name: { fontFamily: F.bold, color: C.blue, fontSize: 22, marginBottom: 8 }, note: { fontFamily: F.regular, color: C.blue, fontSize: 12, lineHeight: 20, opacity: .75 },
  photoSection: { alignItems: 'center', marginBottom: 26 }, photoFrame: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(148,176,213,.18)', borderWidth: 1, borderColor: 'rgba(148,176,213,.4)', boxShadow: '0 0 32px 8px rgba(148,176,213,.3), 0 8px 24px rgba(50,80,123,.12)' },
  photoAction: { minHeight: 44, paddingHorizontal: 18, justifyContent: 'center', marginTop: 8 }, photoActionText: { fontFamily: F.semiBold, color: C.blue, fontSize: 13 }, removePhoto: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 }, removePhotoText: { fontFamily: F.regular, color: C.blue, opacity: .65, fontSize: 11 }, photoError: { fontFamily: F.semiBold, color: C.blue, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 8 },
  card: { padding: 22, borderRadius: 24, backgroundColor: 'rgba(148,176,213,.16)', marginTop: 24 }, label: { fontFamily: F.semiBold, color: C.blue, fontSize: 9, letterSpacing: 1, marginTop: 12, marginBottom: 8 }, value: { fontFamily: F.semiBold, color: C.blue, fontSize: 15, marginBottom: 8 },
  policyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24, marginTop: 0 }, policyChevron: { width: 9, height: 9, borderBottomWidth: 2, borderRightWidth: 2, borderColor: C.blue, marginRight: 4 }, policyLabel: { fontFamily: F.semiBold, color: C.blue, fontSize: 14 }, reader: { height: 360, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: C.lightBlue },
  signOut: { borderRadius: 27, backgroundColor: C.blue, alignItems: 'center', padding: 16, marginTop: 24, boxShadow: '0 8px 20px rgba(50,80,123,.2)' }, signOutText: { color: C.white, fontFamily: F.bold, fontSize: 14 },
});
