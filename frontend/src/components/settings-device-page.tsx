import { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppSession } from './app-session';
import { CameraIcon } from './camera-icon';
import { SettingsPage } from './settings-page';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { useSettingsCamera } from '@/hooks/use-settings-camera';

export function SettingsDevicePage() {
  const { saveCamera } = useAppSession();
  const { camera, isPreview } = useSettingsCamera();
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const name = draft ?? camera?.name ?? 'LittleEye Camera 01';
  const connected = camera?.status === 'connected';
  const status = isPreview ? 'Online (preview)' : camera ? connected ? 'Online (session status)' : 'Pending connection' : 'Preview device';
  const specs = [
    ['Device ID', 'Not available'], ['Camera Type', 'Not available'],
    ['Resolution', 'Not available'], ['Frame Rate', 'Not available'],
    ['Field of View', 'Not available'], ['Last Connected', 'Not recorded'],
  ];
  return <SettingsPage title="Device Information">
    <View style={s.cameraCard}>
      <View style={s.cameraRow}>
        <View pointerEvents="none" style={s.cameraFrame}><View style={s.glow} /><View style={s.art}>
          <Image accessible={false} source={require('../../assets/images/littleeye-camera-4k.png')} contentFit="contain" transition={0} style={s.image} />
        </View></View>
        <View style={s.cameraText}><Text style={s.name}>{camera?.name ?? 'LittleEye Camera 01'}</Text>
          <View style={s.statusRow}><View style={[s.dot, { backgroundColor: connected ? '#42D52B' : C.lightBlue }]} /><Text style={s.status}>{status}</Text></View>
        </View>
      </View>
      <View style={s.feed}>
        <CameraIcon size={42} color={C.lightBlue} /><Text style={s.feedTitle}>Camera preview</Text>
        <Text style={s.feedNote}>Live feed is not connected yet.</Text>
      </View>
    </View>
    <View style={s.specs}>{specs.map(([label, value], index) => <View key={label} style={[s.specRow, index === specs.length - 1 && { borderBottomWidth: 0 }]}>
      <Text style={s.specLabel}>{label}</Text><Text style={s.specValue}>{value}</Text>
    </View>)}</View>
    <Text style={s.note}>Device specifications will appear when supplied by the camera.</Text>
    <View style={s.renameCard}><Text style={s.renameTitle}>Camera name</Text>
      <TextInput accessibilityLabel="Camera name" value={name} maxLength={60} onChangeText={value => { setDraft(value); setSaved(false); }} style={s.input} />
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: isPreview || !camera || !name.trim() }} disabled={isPreview || !camera || !name.trim()}
        onPress={() => { if (!camera) return; const trimmed = name.trim(); saveCamera({ ...camera, name: trimmed }); setDraft(trimmed); setSaved(true); }}
        style={({ pressed }) => [s.save, (isPreview || !camera || !name.trim()) && { opacity: .45 }, pressed && { opacity: .6 }]}><Text style={s.saveText}>Save camera name</Text></Pressable>
      <Text accessibilityLiveRegion="polite" style={s.note}>{isPreview ? 'Sample camera for layout preview only.' : saved ? 'Name saved for this preview session.' : camera ? 'Name changes apply to this preview session.' : 'Connect a camera to rename it.'}</Text>
      {camera && <><Text style={s.renameTitle}>Stream address</Text><Text selectable style={s.note}>{camera.address}</Text></>}
    </View>
  </SettingsPage>;
}

const s = StyleSheet.create({
  cameraCard: { borderRadius: 32, padding: 16, backgroundColor: C.white, boxShadow: '0 10px 24px rgba(111,160,235,.42)' },
  cameraRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }, cameraText: { flex: 1 },
  cameraFrame: { width: 88, height: 92 }, glow: { position: 'absolute', width: 66, height: 66, left: 11, top: 13, borderRadius: 33, backgroundColor: 'rgba(111,160,235,.22)', boxShadow: '0 0 20px 8px rgba(111,160,235,.58)' },
  art: { width: 88, height: 92, overflow: 'hidden' }, image: { position: 'absolute', width: 208, height: 117, left: -72, top: -16 },
  name: { fontFamily: F.bold, color: C.blue, fontSize: 13, lineHeight: 20 }, statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }, dot: { width: 10, height: 10, borderRadius: 5 }, status: { fontFamily: F.regular, fontSize: 11, lineHeight: 18, color: C.blue },
  feed: { minHeight: 132, marginTop: 12, borderRadius: 20, backgroundColor: '#EDF3FA', borderWidth: 2, borderColor: C.white, alignItems: 'center', justifyContent: 'center', padding: 16 },
  feedTitle: { fontFamily: F.semiBold, fontSize: 12, color: C.blue, marginTop: 8 }, feedNote: { fontFamily: F.regular, fontSize: 10, color: C.blue, marginTop: 5 },
  specs: { marginTop: 24, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#F1F7FF', borderRadius: 26, boxShadow: '0 9px 20px rgba(111,160,235,.3)' },
  specRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#DDE9FA' },
  specLabel: { fontFamily: F.semiBold, fontSize: 11, color: C.blue }, specValue: { flexShrink: 1, fontFamily: F.semiBold, fontSize: 11, color: C.blue, textAlign: 'right' },
  note: { fontFamily: F.regular, fontSize: 11, lineHeight: 19, color: C.blue, marginTop: 12 },
  renameCard: { marginTop: 24, padding: 20, borderRadius: 24, backgroundColor: '#F5F8FD' }, renameTitle: { fontFamily: F.bold, fontSize: 12, color: C.blue, marginBottom: 10 },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: C.lightBlue, backgroundColor: C.white, padding: 12, fontFamily: F.regular, color: C.blue, fontSize: 13 },
  save: { minHeight: 46, marginTop: 14, borderRadius: 23, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', padding: 12 }, saveText: { fontFamily: F.semiBold, fontSize: 12, color: C.white },
});
