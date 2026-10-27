import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlowButton } from './glow-button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSession } from './app-session';
import { BrandColors as C, BrandFonts as F, PageTypography as T } from '@/constants/brand';

export function SettingsSignOut({ action = 'sign-out', light = false }: {
  action?: 'sign-out' | 'delete-account'; light?: boolean;
}) {
  const { scaleSize } = useResponsiveLayout();
  const s = useResponsiveStyles(baseStyles);
  const session = useAppSession();
  const insets = useSafeAreaInsets();
  const [confirm, setConfirm] = useState(false);
  const deleting = action === 'delete-account';
  const label = deleting ? 'Delete Account' : 'Sign out';
  function complete() {
    setConfirm(false);
    if (deleting) session.deleteAccount();
    else session.signOut();
  }
  return <View style={[s.footer, deleting && s.deleteFooter]}>
    <Modal visible={confirm} supportedOrientations={['portrait', 'landscape']} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
      <View style={[s.backdrop, {
        paddingTop: insets.top + scaleSize(24), paddingBottom: insets.bottom + scaleSize(24),
        paddingLeft: insets.left + scaleSize(28), paddingRight: insets.right + scaleSize(28),
      }]}>
      <ScrollView accessibilityViewIsModal style={s.confirm} contentContainerStyle={s.confirmContent} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" style={s.title}>{deleting ? 'Delete account?' : 'Sign out?'}</Text>
      <Text style={s.note}>{deleting
        ? 'This preview has no server account. This will erase your profile, photos and camera setup from this session. This cannot be undone.'
        : 'Are you sure you want to sign out of LittleEye?'}</Text>
      <View style={s.actions}>
        <GlowButton accessibilityRole="button" onPress={() => setConfirm(false)} style={[s.cancel, deleting && s.compactConfirmButton]}><Text style={s.cancelText}>Cancel</Text></GlowButton>
        <GlowButton accessibilityRole="button" onPress={complete} style={[s.button, s.confirmButton, deleting && s.danger, deleting && s.compactConfirmButton]}><Text style={s.buttonText}>{deleting ? 'Delete' : label}</Text></GlowButton>
      </View>
      </ScrollView>
      </View>
    </Modal>
    <GlowButton accessibilityRole="button" accessibilityState={{ disabled: !session.signedIn }} disabled={!session.signedIn}
      onPress={() => setConfirm(true)} style={[s.button, deleting && s.danger, light && s.lightButton, !session.signedIn && { opacity: .5 }]}>
      <Text style={[s.buttonText, light && s.lightText]}>{label}</Text>
    </GlowButton>
    {!session.signedIn && <Text style={[s.note, light && { color: C.white }]}>No account is signed in for this preview.</Text>}
  </View>;
}

const baseStyles = StyleSheet.create({
  footer: { marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E4EBF5' },
  deleteFooter: { marginTop: 12, paddingTop: 0, borderTopWidth: 0 },
  button: { minHeight: 54, borderRadius: 27, padding: 14, backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 20px rgba(50,80,123,.2)' }, buttonText: { fontFamily: F.bold, fontSize: T.label, lineHeight: 22, color: C.white, textAlign: 'center' },
  danger: { backgroundColor: '#AD3E4A' },
  lightButton: { backgroundColor: '#A34F63', borderWidth: 1, borderColor: '#D492A4', boxShadow: '0 6px 16px rgba(35,26,46,.24)' },
  lightText: { color: C.white },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,37,60,.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  confirm: { width: '100%', maxWidth: 380, maxHeight: '100%', flexGrow: 0, flexShrink: 1, borderRadius: 28, backgroundColor: C.white, boxShadow: '0 10px 28px rgba(50,80,123,.2)' },
  confirmContent: { padding: 26 }, title: { fontFamily: F.bold, color: C.blue, fontSize: T.section, lineHeight: 26 }, note: { fontFamily: F.regular, fontSize: T.body, color: C.blue, lineHeight: 22, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 18 }, confirmButton: { flex: 1 }, cancel: { flex: 1, minHeight: 50, borderRadius: 25, borderWidth: 1, borderColor: C.lightBlue, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', padding: 12 }, cancelText: { fontFamily: F.semiBold, color: C.blue, fontSize: T.label, lineHeight: 22, textAlign: 'center' }, pressed: { opacity: .6 },
  compactConfirmButton: { minHeight: 44, padding: 0, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22 },
});
