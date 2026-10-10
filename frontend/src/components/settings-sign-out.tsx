import { useState } from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSession } from './app-session';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';

export function SettingsSignOut() {
  const session = useAppSession();
  const insets = useSafeAreaInsets();
  const [confirm, setConfirm] = useState(false);
  function signOut() { setConfirm(false); session.signOut(); router.replace('/'); }
  return <View style={s.footer}>
    <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
      <View style={[s.backdrop, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View accessibilityViewIsModal style={s.confirm}>
      <Text accessibilityRole="header" style={s.title}>Sign out?</Text>
      <Text style={s.note}>Are you sure you want to sign out of LittleEye?</Text>
      <View style={s.actions}>
        <Pressable accessibilityRole="button" onPress={() => setConfirm(false)} style={({ pressed }) => [s.cancel, pressed && s.pressed]}><Text style={s.cancelText}>Cancel</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={signOut} style={({ pressed }) => [s.button, s.confirmButton, pressed && s.pressed]}><Text style={s.buttonText}>Sign out</Text></Pressable>
      </View>
      </View>
      </View>
    </Modal>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !session.signedIn }} disabled={!session.signedIn}
      onPress={() => setConfirm(true)} style={({ pressed }) => [s.button, !session.signedIn && { opacity: .5 }, pressed && s.pressed]}>
      <Text style={s.buttonText}>Sign out</Text>
    </Pressable>
    {!session.signedIn && <Text style={s.note}>No account is signed in for this preview.</Text>}
  </View>;
}

const s = StyleSheet.create({
  footer: { paddingHorizontal: 8, marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E4EBF5' },
  button: { minHeight: 50, borderRadius: 25, padding: 14, backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 20px rgba(50,80,123,.2)' }, buttonText: { fontFamily: F.bold, fontSize: 13, color: C.white },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,37,60,.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  confirm: { width: '100%', maxWidth: 380, padding: 26, borderRadius: 28, backgroundColor: C.white, boxShadow: '0 10px 28px rgba(50,80,123,.2)' }, title: { fontFamily: F.bold, color: C.blue, fontSize: 20 }, note: { fontFamily: F.regular, fontSize: 12, color: C.blue, lineHeight: 20, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 18 }, confirmButton: { flex: 1 }, cancel: { flex: 1, minHeight: 50, borderRadius: 25, borderWidth: 1, borderColor: C.lightBlue, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, cancelText: { fontFamily: F.semiBold, color: C.blue, fontSize: 13 }, pressed: { opacity: .6 },
});
