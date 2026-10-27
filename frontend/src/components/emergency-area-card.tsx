import { useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlowButton } from './glow-button';
import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { EMERGENCY_LOCALITIES, type EmergencyHotline } from '@/constants/emergency-hotlines';
import { createEmergencyAreaChoice, getEmergencyDirectory, normalizeEmergencyAddress, type EmergencyAreaChoice } from '@/utils/emergency-directory';
import { openHotlineSource } from '@/services/emergency-dialer';
import { getHotlineNetworkLabel } from '@/utils/hotline-network';
import { getHotlinePresentation, type HotlineServiceGroup } from '@/utils/hotline-presentation';

function HotlinePreview({ hotlines }: { hotlines: readonly EmergencyHotline[] }) {
  const s = useResponsiveStyles(styles);
  const [expanded, setExpanded] = useState(false);
  const presentation = getHotlinePresentation(hotlines);
  const renderService = (group: HotlineServiceGroup) => <View key={group.name} style={s.serviceGroup}>
    <Text style={s.serviceTitle}>{group.name}</Text>
    {group.hotlines.map(hotline => <View key={hotline.id} style={s.hotlineRow}>
      <Text style={s.carrier}>{getHotlineNetworkLabel(hotline) ?? 'Hotline'}</Text>
      <Text selectable style={s.hotlineNumber}>{hotline.number}{hotline.extension ? ` · ext. ${hotline.extension}` : ''}</Text>
    </View>)}
  </View>;
  return <View style={s.hotlines}>
    {presentation.visible.map(renderService)}
    {!!presentation.additional.length && <>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={({ pressed }) => [s.moreButton, pressed && s.morePressed]}>
        <Text style={s.moreText}>{expanded ? 'Show fewer contacts' : 'More emergency contacts'}</Text><Text accessible={false} style={s.moreText}>{expanded ? '−' : '+'}</Text>
      </Pressable>
      {expanded && presentation.additional.map(renderService)}
    </>}
  </View>;
}

export function EmergencyAreaCard({ address, choice, onChange, localityCode, compact = false, showHotlines = true }: {
  address: string;
  choice?: EmergencyAreaChoice;
  localityCode?: string;
  compact?: boolean;
  /** The Services screen already has call cards; avoid repeating the numbers. */
  showHotlines?: boolean;
  onChange?: (choice: EmergencyAreaChoice | undefined) => void;
}) {
  const s = useResponsiveStyles(styles);
  const { scaleSize } = useResponsiveLayout();
  // Box-shadow blur stays in pixels; retain enough gutter even on narrow phones.
  const shadowGutter = Math.max(14, scaleSize(14));
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const directory = getEmergencyDirectory(address, choice, localityCode);
  const automatic = getEmergencyDirectory(address, undefined, localityCode);
  const query = normalizeEmergencyAddress(search);
  const areas = EMERGENCY_LOCALITIES.filter(area => query.split(' ').every(part =>
    normalizeEmergencyAddress(`${area.name} ${area.province ?? ''} ${area.region} ${area.aliases.join(' ')}`).includes(part)));
  const statusText = directory.status === 'ambiguous' ? 'Choose your city.'
    : directory.status === 'missing-address' ? 'Add your address for local hotlines.'
    : directory.status === 'unlisted' ? 'Choose a city for local hotlines.' : '';

  function select(localityId: string | null | undefined) {
    onChange?.(localityId === undefined ? undefined : createEmergencyAreaChoice(address, localityId));
    setOpen(false);
    setSearch('');
    Keyboard.dismiss();
  }

  return <>
    <View style={[s.card, compact && s.compactCard]}>
      <View style={s.topRow}><Text style={s.eyebrow}>{!showHotlines ? 'HOTLINE AREA' : compact ? 'SUGGESTED HOTLINES' : 'EMERGENCY HOTLINES'}</Text><View style={s.country}><Text style={s.countryText}>PH</Text></View></View>
      <Text accessibilityRole="header" style={s.title}>{directory.areaName}</Text>
      {!!statusText && <Text accessibilityLiveRegion="polite" style={s.body}>{statusText}</Text>}
      {showHotlines && <HotlinePreview key={directory.hotlines.map(hotline => hotline.id).join('|')} hotlines={directory.hotlines} />}
      {directory.locality?.via911 && <Text style={s.body}>911 serves this city.</Text>}
      {directory.locality && !directory.locality.via911 && !directory.locality.hotlines.length && <Text style={s.body}>No verified local number yet.</Text>}
      {!compact && showHotlines && directory.status !== 'selected' && <Text style={s.note}>Using your saved address.</Text>}
      {onChange && <GlowButton pressGlow="soft" accessibilityRole="button" accessibilityLabel="Change Philippine hotline area" onPress={() => { Keyboard.dismiss(); setOpen(true); }} style={s.changeButton}>
        <Text style={s.changeText}>Change area</Text><Text accessible={false} style={s.arrow}>›</Text>
      </GlowButton>}
      {showHotlines && !!directory.locality && <Pressable accessibilityRole="link" onPress={() => { void openHotlineSource(directory.locality!.source.url); }} style={({ pressed }) => [s.sourceButton, pressed && s.sourcePressed]}>
        <Text style={s.sourceText}>{directory.locality.source.name} ↗</Text>
      </Pressable>}
    </View>
    <Modal visible={open} transparent animationType="slide" supportedOrientations={['portrait', 'landscape']} onRequestClose={() => setOpen(false)}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close hotline area picker" onPress={() => setOpen(false)} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={[s.sheet, { marginTop: insets.top + scaleSize(12), marginBottom: insets.bottom + scaleSize(12) }]}>
          <View style={s.sheetHeading}><Text accessibilityRole="header" style={s.sheetTitle}>Choose hotline area</Text>
            <GlowButton pressGlow="soft" accessibilityRole="button" accessibilityLabel="Close hotline area picker" onPress={() => setOpen(false)} style={s.close}><Text style={s.closeText}>×</Text></GlowButton>
          </View>
          <TextInput accessibilityLabel="Search Philippine hotline areas" placeholder="Search city or province" placeholderTextColor="#70849F"
            value={search} onChangeText={setSearch} maxLength={80} autoCorrect={false} style={s.search} />
          <FlatList key={query} data={areas} keyExtractor={area => area.id} extraData={directory.locality?.id}
            initialNumToRender={8} windowSize={5} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator
            removeClippedSubviews={false} style={{ marginHorizontal: -shadowGutter }}
            contentContainerStyle={[s.areaList, { paddingHorizontal: shadowGutter, paddingVertical: shadowGutter }]} ListHeaderComponent={<View style={s.areaOptions}>
            <GlowButton pressGlow="soft" accessibilityRole="button" onPress={() => select(undefined)} style={s.areaRow}>
              <Text style={s.areaName}>Use my address</Text><Text style={s.body}>{automatic.locality?.name ?? 'National hotlines'}</Text>
            </GlowButton>
            <GlowButton pressGlow="soft" accessibilityRole="button" onPress={() => select(null)} style={s.areaRow}>
              <Text style={s.areaName}>National hotlines</Text><Text style={s.body}>911 · Red Cross 143</Text>
            </GlowButton>
            </View>}
            renderItem={({ item: area }) => <GlowButton pressGlow="soft" accessibilityRole="radio" accessibilityState={{ checked: directory.locality?.id === area.id }}
              onPress={() => select(area.id)} style={[s.areaRow, directory.locality?.id === area.id && s.selected]}>
              <View style={s.areaTitle}><Text style={s.areaName}>{area.name}</Text>{directory.locality?.id === area.id && <Text style={s.check}>✓</Text>}</View>
              <Text style={s.body}>{[area.province, area.region].filter(Boolean).join(' · ')}</Text>
            </GlowButton>}
            ListEmptyComponent={<Text style={s.empty}>No matching city.</Text>}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#F4F8FD', borderRadius: 24, borderWidth: 1, borderColor: '#C7D8EC', padding: 18, gap: 8, marginBottom: 18 },
  compactCard: { padding: 14, borderRadius: 18, marginTop: 14, marginBottom: 8 },
  topRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  eyebrow: { flex: 1, color: '#5B7494', fontFamily: F.bold, fontSize: 10, lineHeight: 16, letterSpacing: 0.6 },
  country: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, backgroundColor: '#DCE8F5' },
  countryText: { color: C.blue, fontFamily: F.bold, fontSize: 11 },
  title: { color: C.blue, fontFamily: F.bold, fontSize: 20, lineHeight: 27 },
  body: { color: '#5C7290', fontFamily: F.regular, fontSize: 12, lineHeight: 19 },
  note: { color: '#637A98', fontFamily: F.regular, fontSize: 11, lineHeight: 17 },
  hotlines: { marginTop: 4, gap: 12 },
  serviceGroup: { gap: 2 },
  serviceTitle: { color: C.blue, fontFamily: F.semiBold, fontSize: 12, lineHeight: 18, marginBottom: 3 },
  hotlineRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  carrier: { flex: 1, color: '#567291', fontFamily: F.regular, fontSize: 12, lineHeight: 18 },
  hotlineNumber: { flexShrink: 1, color: C.blue, fontFamily: F.semiBold, fontSize: 13, lineHeight: 20, textAlign: 'right', fontVariant: ['tabular-nums'] },
  moreButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderWidth: 1, borderColor: '#9CB6D5', backgroundColor: '#E5EEF9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  morePressed: { backgroundColor: '#D3E2F3' },
  moreText: { flexShrink: 1, color: '#476B99', fontFamily: F.semiBold, fontSize: 12, lineHeight: 18 },
  changeButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 14, backgroundColor: C.blue, marginTop: 2 },
  changeText: { color: C.white, fontFamily: F.semiBold, fontSize: 13 },
  arrow: { color: C.white, fontSize: 26 },
  sourceButton: { minHeight: 44, justifyContent: 'center', borderRadius: 10 },
  sourcePressed: { opacity: 0.6 },
  sourceText: { color: '#476B99', fontFamily: F.semiBold, fontSize: 11, lineHeight: 18 },
  overlay: { flex: 1, backgroundColor: 'rgba(18,36,59,.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  sheet: { width: '100%', maxWidth: 440, maxHeight: '100%', flexShrink: 1, borderRadius: 28, backgroundColor: C.white, padding: 18 },
  sheetHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sheetTitle: { flex: 1, fontFamily: F.bold, fontSize: 20, lineHeight: 27, color: C.blue },
  close: { width: 44, height: 44, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#EDF3FA' },
  closeText: { color: C.blue, fontSize: 27 },
  search: { minHeight: 48, color: C.blue, backgroundColor: '#F2F6FC', borderRadius: 16, borderWidth: 1, borderColor: '#CCDCEF', marginTop: 14, marginBottom: 10, paddingHorizontal: 14, fontFamily: F.regular, fontSize: 13 },
  areaList: { gap: 8 },
  areaOptions: { gap: 8 },
  areaRow: { minHeight: 62, borderRadius: 16, borderWidth: 1, borderColor: '#D4E0EF', backgroundColor: C.white, padding: 13, justifyContent: 'center', gap: 3 },
  areaTitle: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  areaName: { flexShrink: 1, fontFamily: F.semiBold, fontSize: 13, color: C.blue, lineHeight: 20 },
  check: { color: C.blue, fontSize: 15 },
  selected: { backgroundColor: '#E8F1FC', borderColor: '#80A3D1' },
  empty: { fontFamily: F.regular, fontSize: 13, lineHeight: 20, color: '#637A98', paddingVertical: 16 },
});
