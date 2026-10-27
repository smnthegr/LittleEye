import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';
import { useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { useAddressLocation } from '@/hooks/use-address-location';
import { editPhilippineAddress, formatPhilippineAddress, manualPhilippineAddress, type PhilippineAddress } from '@/utils/philippine-address';
import { ExternalLink } from './external-link';
import { FormError } from './form-error';

type Props = {
  value?: PhilippineAddress;
  onChange: (value: PhilippineAddress) => void;
  legacyAddress?: string;
  light?: boolean;
  enabled?: boolean;
  allowCurrentLocation?: boolean;
};
const pin = { ios: 'mappin.circle', android: 'location_on', web: 'location_on' } as const;

/** One address field with provider suggestions and explicit location autofill. */
export function PhilippineAddressField({ value, onChange, legacyAddress, light = false, enabled = true, allowCurrentLocation = false }: Props) {
  const s = useResponsiveStyles(styles);
  const [open, setOpen] = useState(false);
  const query = value ? formatPhilippineAddress(value) : legacyAddress ?? '';
  const location = useAddressLocation(enabled && allowCurrentLocation);
  const editable = enabled && !location.locating;
  const searchable = !value?.source || value.source === 'manual';
  const { suggestions, status, cancel } = usePlaceSearch(query, editable && open && searchable);
  const showResults = editable && open && searchable && query.trim().length >= 3 && query.trim().length <= 250;
  return <View style={[s.container, light && s.lightSurface]}>
    <Text style={[s.label, light && s.lightText]}>Address</Text>
    <View style={[s.inputRow, light && s.lightControl]}>
      <View pointerEvents="none"><SymbolView name={pin} size={21} tintColor={light ? '#FFFFFF' : C.blue} /></View>
      <View style={s.inputBody}>
      {/* The in-flow copy sizes the field independently of TextInput's sticky
          native content size. It wraps the full value and shrinks on deletion. */}
      <Text testID="address-size-text" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none"
        textBreakStrategy="simple" style={[s.inputTypography, s.inputMeasurement]}>{query || ' '}</Text>
      <TextInput accessibilityLabel="Address" accessibilityHint="Enter your full house or unit address; suggestions are optional."
        placeholder="House / unit, street, barangay, city" placeholderTextColor={light ? '#E0EAF6' : '#71839B'}
        value={query} onChangeText={text => { cancel(); location.cancel(); onChange(editPhilippineAddress(text, value)); setOpen(true); }}
        onFocus={() => setOpen(true)} editable={editable} autoCapitalize="words" autoCorrect={false} autoComplete="street-address"
        multiline maxLength={500} scrollEnabled={false} textBreakStrategy="simple" underlineColorAndroid="transparent"
        style={[s.inputTypography, s.input, light && s.lightText]} />
      </View>
      {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear address" disabled={!editable} onPress={() => {
        cancel(); location.cancel(); onChange(manualPhilippineAddress('')); setOpen(false);
      }} style={s.clear}><Text style={[s.clearText, light && s.lightText]}>×</Text></Pressable>}
    </View>
    {showResults && <View style={s.suggestions}>
      {status === 'loading' && <Text accessibilityLiveRegion="polite" style={s.hint}>Searching…</Text>}
      {status === 'error' && <FormError>Search unavailable; enter your full address.</FormError>}
      {status === 'ready' && !suggestions.length && <Text accessibilityLiveRegion="polite" style={s.hint}>No matches; enter your address.</Text>}
      {suggestions.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.title}, ${item.address}`}
        onPress={() => { cancel(); onChange({ ...item.selection, confirmed: false }); setOpen(false); Keyboard.dismiss(); }}
        style={({ pressed }) => [s.result, pressed && s.pressed]}>
        <View pointerEvents="none"><SymbolView name={pin} size={23} tintColor={C.blue} /></View>
        <View style={s.resultCopy}><Text style={s.resultTitle}>{item.title}</Text><Text style={s.resultSubtitle}>{item.address}</Text></View>
      </Pressable>)}
      <View style={s.footer}>
        {!!suggestions.length && <ExternalLink suppressHighlighting href={suggestions[0].selection.source === 'tomtom' ? 'https://www.tomtom.com/legal/' : 'https://www.openstreetmap.org/copyright'} style={s.credit}>{suggestions[0].selection.source === 'tomtom' ? '© TomTom' : '© OpenStreetMap contributors'}</ExternalLink>}
        <Pressable accessibilityRole="button" accessibilityLabel="Close location suggestions" onPress={() => { cancel(); setOpen(false); }} style={s.close}><Text style={s.closeText}>Close</Text></Pressable>
      </View>
    </View>}
    {value?.source === 'osm' && <ExternalLink suppressHighlighting href="https://www.openstreetmap.org/copyright" style={[s.credit, light && s.lightText]}>© OpenStreetMap contributors</ExternalLink>}
    {value?.source === 'tomtom' && <ExternalLink suppressHighlighting href="https://www.tomtom.com/legal/" style={[s.credit, light && s.lightText]}>© TomTom</ExternalLink>}
    {allowCurrentLocation && <>
      <Pressable accessibilityRole="button" accessibilityLabel={location.locating ? 'Getting current location' : 'Use my current location'}
        accessibilityState={{ disabled: !editable, busy: location.locating }} disabled={!editable}
        onPress={async () => {
          cancel(); setOpen(false); Keyboard.dismiss();
          const address = { ...(value ?? manualPhilippineAddress(query)), deviceLocation: undefined, confirmed: false };
          onChange(address);
          const found = await location.locate();
          if (found) onChange({ ...(found.address ?? address), deviceLocation: found.deviceLocation, confirmed: false });
        }} style={({ pressed }) => [s.locationButton, !editable && s.locationDisabled, pressed && s.locationPressed]}>
        <View pointerEvents="none" style={s.locationIcon}><SymbolView name={{ ios: 'location', android: 'my_location', web: 'my_location' }} size={19} tintColor="#FFFFFF" /></View>
        <Text style={s.locationButtonText}>{location.locating ? 'Getting address…' : 'Use my current location'}</Text>
        <Text accessible={false} style={s.locationArrow}>›</Text>
      </Pressable>
      {location.locating && <Pressable accessibilityRole="button" accessibilityLabel="Cancel location request" onPress={location.cancel} style={s.smallAction}><Text style={[s.locationText, light && s.lightText]}>Cancel</Text></Pressable>}
      <FormError>{location.error}</FormError>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 8 }, label: { color: C.blue, fontFamily: F.semiBold, fontSize: 13 },
  lightSurface: { backgroundColor: 'rgba(42,81,127,0.86)', borderRadius: 22, padding: 12 },
  inputRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 22, paddingLeft: 16, paddingRight: 5, borderWidth: 1, borderColor: '#C4D6E9', backgroundColor: '#F3F7FC' },
  lightControl: { backgroundColor: 'rgba(22,48,80,0.35)', borderColor: 'rgba(148,176,213,0.8)' },
  lightText: { color: '#FFFFFF' },
  inputBody: { flex: 1, minWidth: 0, minHeight: 54 },
  inputTypography: { paddingVertical: 15, paddingHorizontal: 0, fontFamily: F.regular, fontSize: 14, lineHeight: 20, includeFontPadding: false },
  inputMeasurement: { minHeight: 54, opacity: 0 },
  input: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, color: C.blue, textAlignVertical: 'top' },
  clear: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, clearText: { fontSize: 25, color: C.blue },
  suggestions: { padding: 6, gap: 3, borderRadius: 18, borderWidth: 1, borderColor: '#C4D6E9', backgroundColor: '#FFFFFF' },
  result: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 12, gap: 10, borderRadius: 12 },
  resultCopy: { flex: 1, minWidth: 0, gap: 4 }, pressed: { backgroundColor: '#DFEBF8' },
  resultTitle: { color: C.blue, fontFamily: F.semiBold, fontSize: 14 }, resultSubtitle: { color: '#657D98', fontFamily: F.regular, fontSize: 12, lineHeight: 18 },
  hint: { padding: 12, color: '#657D98', fontFamily: F.regular, fontSize: 12, lineHeight: 19 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 10 },
  credit: { color: '#657D98', fontFamily: F.regular, fontSize: 10, paddingVertical: 8 },
  close: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }, closeText: { color: C.blue, fontFamily: F.semiBold, fontSize: 12 },
  locationButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#345D8D', borderWidth: 1, borderColor: '#7699C1', marginTop: 4 },
  locationIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#486F9E', alignItems: 'center', justifyContent: 'center' },
  locationButtonText: { flex: 1, fontFamily: F.semiBold, fontSize: 13, lineHeight: 20, color: '#FFFFFF' },
  locationArrow: { color: '#E3EEFB', fontSize: 24 }, locationPressed: { backgroundColor: '#284D7A', opacity: 0.9 }, locationDisabled: { opacity: 0.6 },
  locationText: { fontFamily: F.semiBold, fontSize: 12, color: C.blue },
  smallAction: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 6 },
});
