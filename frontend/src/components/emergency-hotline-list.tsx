import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlowButton } from './glow-button';
import { useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import type { EmergencyHotline } from '@/constants/emergency-hotlines';
import { openEmergencyDialer, openHotlineSource } from '@/services/emergency-dialer';
import { getHotlineNetworkLabel } from '@/utils/hotline-network';
import { getHotlinePresentation, type HotlineServiceGroup } from '@/utils/hotline-presentation';

function CallRow({ hotline, selected }: { hotline: EmergencyHotline; selected: boolean }) {
  const s = useResponsiveStyles(styles);
  const networkLabel = getHotlineNetworkLabel(hotline);
  const [opening, setOpening] = useState(false);
  const busy = useRef(false);
  async function dial() {
    if (busy.current) return;
    busy.current = true;
    setOpening(true);
    try { await openEmergencyDialer(hotline); }
    finally { busy.current = false; setOpening(false); }
  }
  return <View style={[s.numberRow, selected && s.selected]}>
    <View style={s.numberDetails}>
      {!!networkLabel && <Text style={s.network}>{networkLabel}</Text>}
      <Text selectable style={s.number}>{hotline.number}</Text>
      {!!hotline.extension && <Text selectable style={s.description}>Ask for extension {hotline.extension}</Text>}
    </View>
    <GlowButton pressGlow="soft" accessibilityRole="button" accessibilityLabel={`Call ${hotline.name}, ${networkLabel ? `${networkLabel}, ` : ''}${hotline.number}${hotline.extension ? `, ask for extension ${hotline.extension}` : ''}`}
      accessibilityState={{ disabled: opening }} disabled={opening} onPress={() => { void dial(); }} style={s.call}>
      <Text style={s.callText}>{opening ? 'Opening…' : 'Call'}</Text>
    </GlowButton>
  </View>;
}

function ServiceCard({ group, selectedNumber }: { group: HotlineServiceGroup; selectedNumber?: string }) {
  const s = useResponsiveStyles(styles);
  const sources = [...new Map(group.hotlines.map(hotline => [hotline.source.url, hotline.source])).values()];
  return <View style={s.card}>
    <View style={s.top}><Text style={s.area}>{group.hotlines[0].area}</Text></View>
    <Text style={s.name}>{group.name}</Text>
    {group.hotlines.map(hotline => <CallRow key={hotline.id} hotline={hotline} selected={hotline.number === selectedNumber || hotline.dialNumber === selectedNumber} />)}
    {sources.map(source => <Pressable key={source.url} accessibilityRole="link" accessibilityLabel={`Official source: ${source.name}`}
      onPress={() => { void openHotlineSource(source.url); }} style={({ pressed }) => [s.source, pressed && s.sourcePressed]}>
      <Text style={s.sourceText}>{source.name} ↗</Text>
    </Pressable>)}
  </View>;
}

type ListProps = { hotlines: readonly EmergencyHotline[]; selectedNumber?: string };

export function EmergencyHotlineList(props: ListProps) {
  // A changed city or deep-linked number starts with a fresh disclosure state.
  return <HotlineChoices key={`${props.hotlines.map(hotline => hotline.id).join('|')}:${props.selectedNumber ?? ''}`} {...props} />;
}

function HotlineChoices({ hotlines, selectedNumber }: ListProps) {
  const s = useResponsiveStyles(styles);
  const presentation = getHotlinePresentation(hotlines);
  const [expanded, setExpanded] = useState(() => presentation.additional.some(group => group.hotlines.some(hotline => hotline.number === selectedNumber || hotline.dialNumber === selectedNumber)));
  return <View style={s.list}>
    {presentation.visible.map(group => <ServiceCard key={group.name} group={group} selectedNumber={selectedNumber} />)}
    {!!presentation.additional.length && <>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={({ pressed }) => [s.more, pressed && s.morePressed]}>
        <Text style={s.moreText}>{expanded ? 'Show fewer contacts' : 'More emergency contacts'}</Text><Text accessible={false} style={s.moreText}>{expanded ? '−' : '+'}</Text>
      </Pressable>
      {expanded && presentation.additional.map(group => <ServiceCard key={group.name} group={group} selectedNumber={selectedNumber} />)}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: 14 },
  card: { padding: 18, gap: 6, borderRadius: 24, backgroundColor: C.white, borderWidth: 1, borderColor: '#C6D8ED', boxShadow: '0 5px 14px rgba(42,81,127,.13)' },
  selected: { backgroundColor: '#EFF5FD', borderColor: C.blue },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  area: { flexShrink: 1, color: '#64809F', fontFamily: F.semiBold, fontSize: 11, lineHeight: 17 },
  name: { color: C.blue, fontFamily: F.bold, fontSize: 15, lineHeight: 22 },
  numberRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderRadius: 12 },
  numberDetails: { flex: 1, gap: 3 },
  number: { color: '#294F7C', fontFamily: F.bold, fontSize: 18, lineHeight: 27 },
  network: { color: '#567291', fontFamily: F.semiBold, fontSize: 11, lineHeight: 17 },
  description: { color: '#5E7695', fontFamily: F.regular, fontSize: 12, lineHeight: 19 },
  call: { minHeight: 48, minWidth: 64, borderRadius: 14, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  callText: { fontFamily: F.bold, fontSize: 13, lineHeight: 20, color: C.white, textAlign: 'center' },
  source: { minHeight: 44, justifyContent: 'center', marginTop: 2, gap: 3, borderRadius: 8 },
  sourcePressed: { opacity: 0.6 },
  sourceText: { fontFamily: F.semiBold, fontSize: 10, lineHeight: 16, color: '#50739D' },
  more: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#9CB6D5', backgroundColor: '#E5EEF9' },
  morePressed: { backgroundColor: '#D3E2F3' },
  moreText: { flexShrink: 1, color: C.blue, fontFamily: F.semiBold, fontSize: 13, lineHeight: 20 },
});
