import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { addresses as a, phoneAddresses, qcAddress, completeAddress } from './helpers/address-fixtures.mjs';

test('the bundled directory includes nationwide municipalities, province-less cities and all barangays', () => {
  const locations = a.searchAddressLocalities('');
  assert.ok(locations.length > 1600);
  assert.equal(locations.reduce((total, item) => total + a.getAddressBarangays(item.code).length, 0), 42010);
  for (const place of ['Basco', 'Bongao', 'Daanbantayan', 'San Vicente Palawan', 'Naga Cebu', 'Naga Camarines Sur']) {
    assert.ok(a.searchAddressLocalities(place).length, place);
  }
  assert.ok(a.searchAddressLocalities('Paranaque').some(item => /Para[ñn]aque/i.test(item.name)));
  assert.ok(a.searchAddressLocalities('Quezon City').some(item => item.code === qcAddress.localityCode));
  assert.equal(a.getAddressLocality(qcAddress.localityCode).province, '');
  const manila = a.searchAddressLocalities('Manila').find(item => item.name === 'City of Manila');
  assert.ok(a.searchAddressBarangays(manila.code, 'Tondo').length > 100, 'Manila barangays remain selectable through their district');
  const barangayCodes = locations.flatMap(item => a.getAddressBarangays(item.code).map(b => b.code));
  assert.equal(new Set(barangayCodes).size, barangayCodes.length);
});

test('full-address validation requires street details and a barangay belonging to the selected city', () => {
  assert.equal(a.isCompletePhilippineAddress(qcAddress), true);
  for (const address of [undefined, a.EMPTY_ADDRESS, { ...qcAddress, street: '' }, { ...qcAddress, street: '12345' },
    { ...qcAddress, street: 'test address' }, { ...qcAddress, street: 'N/A' }, { ...qcAddress, street: 'x'.repeat(181) },
    { ...qcAddress, barangayCode: '' }, { ...qcAddress, localityCode: 'unknown' }, { ...qcAddress, localityCode: '1380600000' }]) {
    assert.equal(a.isCompletePhilippineAddress(address), false, JSON.stringify(address));
  }
  assert.equal(a.isCompletePhilippineAddress({ ...qcAddress, street: 'Purok Maligaya, Sitio Ilaya' }), true);
  assert.match(completeAddress, /12 Sampaguita Street, Commonwealth, Quezon City, National Capital Region \(NCR\), Philippines/);
  const changed = a.changeAddressLocality(qcAddress, '1380600000');
  assert.equal(changed.barangayCode, ''); assert.equal(changed.street, qcAddress.street);
  assert.equal(a.changeAddressLocality(qcAddress, qcAddress.localityCode).barangayCode, qcAddress.barangayCode);
});

test('one address field supports suggestions and GPS without a checkbox or extra location actions', async () => {
  let cursor = 0;
  const slots = [];
  let value;
  let status = 'ready';
  let enabled = true;
  let cancelled = 0;
  const fix = { latitude: 14.7, longitude: 121.08, accuracyMeters: 12, capturedAt: new Date().toISOString() };
  const selection = { source: 'osm', street: '', localityCode: '1380600000', barangayCode: '', placeId: 'W/314235479',
    placeName: 'Rizal Park Hotel', formattedAddress: 'South Road, Ermita, Manila, Philippines', countryCode: 'PH', latitude: 14.5787061, longitude: 120.9763067 };
  const require = createRequire(import.meta.url);
  const module = { exports: {} };
  const source = readFileSync(new URL('../src/components/philippine-address-field.tsx', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports,
    require(name) {
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'react') return { useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; } };
      if (name === 'react-native') return { View: 'View', Text: 'Text', TextInput: 'TextInput', Pressable: 'Pressable', StyleSheet: { create: s => s }, Keyboard: { dismiss() {} } };
      if (name === 'expo-symbols') return { SymbolView: 'SymbolView' };
      if (name === '@/hooks/use-place-search') return { usePlaceSearch: () => ({ status, cancel: () => { cancelled++; },
        suggestions: status === 'ready' ? [{ id: selection.placeId, title: selection.placeName, address: selection.formattedAddress, selection }] : [] }) };
      if (name === '@/hooks/use-address-location') return { useAddressLocation: () => ({ locating: false, locate: async () => ({ deviceLocation: fix,
        address: { source: 'phone', street: '42 Rivera Street, Commonwealth, Quezon City, Philippines', addressLevel: 'street', countryCode: 'PH', localityCode: '1381300000', barangayCode: '', confirmed: false } }), cancel() {} }) };
      if (name === '@/utils/philippine-address') return a;
      if (name === '@/constants/brand') return { BrandColors: {}, BrandFonts: {} };
      if (name === '@/hooks/use-responsive-layout') return { useResponsiveStyles: s => s };
      if (name === './external-link') return { ExternalLink: 'ExternalLink' };
      if (name === './form-error') return { FormError: 'FormError' };
      throw new Error(name);
    },
  });
  const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children)] : [];
  const render = () => { cursor = 0; return module.exports.PhilippineAddressField({ value, enabled, allowCurrentLocation: true, onChange: next => { value = next; } }); };
  const node = label => nodes(render()).find(n => n.props.accessibilityLabel === label);
  const sizeText = () => nodes(render()).find(n => n.props.testID === 'address-size-text');
  const flatten = style => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
  assert.equal(nodes(render()).filter(n => n.type === 'TextInput').length, 1);
  node('Address').props.onFocus(); node('Address').props.onChangeText('Rizal Park Hotel');
  assert.equal(a.isCompletePhilippineAddress(value), false, 'An unselected landmark name is not a full address');
  node(`${selection.placeName}, ${selection.formattedAddress}`).props.onPress();
  assert.equal(a.isCompletePhilippineAddress(value), true);
  assert.ok(!nodes(render()).some(n => n.props.accessibilityRole === 'checkbox'));
  assert.equal(value.placeId, selection.placeId);
  assert.equal(node('Address').props.value, `${selection.placeName}, ${selection.formattedAddress}`);
  assert.equal(sizeText().props.children, node('Address').props.value, 'The full selected address sizes the field, including wrapped lines');
  for (const link of nodes(render()).filter(n => n.type === 'ExternalLink')) assert.equal(link.props.suppressHighlighting, true);
  node('Address').props.onChangeText('12 Main Street, Commonwealth, Quezon City');
  assert.equal(value.source, 'manual'); assert.equal(value.placeId, undefined); assert.equal(value.latitude, undefined);
  assert.equal(a.isCompletePhilippineAddress(value), true);
  node('Address').props.onFocus(); status = 'error'; assert.ok(JSON.stringify(render()).includes('Search unavailable'));
  enabled = false; assert.equal(node('Address').props.editable, false);
  assert.ok(!JSON.stringify(render()).includes('Search unavailable'));
  enabled = true; node('Clear address').props.onPress(); assert.equal(node('Address').props.value, '');
  assert.equal(sizeText().props.children, ' ', 'Clearing with X restores the empty sizing content');
  const longAddress = 'Unit 12, A Long Residential Building Name, Sampaguita Street, Commonwealth, Quezon City, Metro Manila, Philippines';
  node('Address').props.onChangeText(longAddress);
  assert.equal(sizeText().props.children, longAddress);
  const inputStyle = flatten(node('Address').props.style);
  const measureStyle = flatten(sizeText().props.style);
  assert.equal(node('Address').props.multiline, true);
  assert.equal(node('Address').props.scrollEnabled, false, 'All address lines stay visible instead of scrolling inside a one-line field');
  assert.equal(inputStyle.height, undefined, 'Do not freeze a multiline input to a measured one-line height');
  assert.equal(inputStyle.maxHeight, undefined, 'Do not cap the visible address');
  assert.equal(measureStyle.position, undefined, 'Sizing text must participate in normal flow so it grows and shrinks');
  assert.equal(sizeText().props.numberOfLines, undefined);
  assert.equal(sizeText().props.accessibilityElementsHidden, true);
  for (const property of ['fontSize', 'fontFamily', 'lineHeight', 'paddingVertical', 'paddingHorizontal']) assert.equal(inputStyle[property], measureStyle[property], property);
  node('Address').props.onChangeText('');
  assert.equal(node('Address').props.value, '');
  assert.equal(sizeText().props.children, ' ', 'Deleting with the keyboard also restores default sizing');
  assert.equal(node('Clear address'), undefined);
  value = { ...selection, source: 'tomtom' };
  const tomtomLink = nodes(render()).find(n => n.type === 'ExternalLink');
  assert.equal(tomtomLink.props.href, 'https://www.tomtom.com/legal/');
  assert.equal(tomtomLink.props.suppressHighlighting, true, 'Keep TomTom attribution clickable without a native rectangular highlight');
  node('Clear address').props.onPress();
  node('Address').props.onChangeText('Unit 2, 12 Main Street, Commonwealth, Quezon City');
  await node('Use my current location').props.onPress();
  assert.equal(node('Address').props.value, '42 Rivera Street, Commonwealth, Quezon City, Philippines', 'Current location must autofill the real phone address');
  assert.equal(value.deviceLocation, fix); assert.equal(value.confirmed, false);
  assert.ok(!JSON.stringify(render()).includes('Location found'));
  assert.ok(!JSON.stringify(render()).includes('Include house/unit'));
  assert.ok(!JSON.stringify(render()).includes('GPS is approximate'));
  assert.equal(a.isCompletePhilippineAddress(value), true);
  node('Address').props.onChangeText('Unit 3, 12 Main Street, Commonwealth, Quezon City');
  assert.equal(value.deviceLocation, fix); assert.equal(value.confirmed, false);
  assert.equal(node('Remove saved GPS location'), undefined);
  assert.ok(!nodes(render()).some(n => n.props.accessibilityRole === 'checkbox'));
  assert.equal(a.isCompletePhilippineAddress(value), true);
  node('Clear address').props.onPress();
  assert.equal(value.deviceLocation, undefined);
  assert.equal(nodes(render()).filter(n => n.type === 'TextInput').length, 1);
  assert.ok(cancelled >= 3);
});

test('manual full addresses and OSM selections keep separate, honest validation rules', () => {
  for (const text of ['', 'Quezon City', 'Big Brew Riverside', 'test, address, Philippines', '123, 456, 789']) {
    assert.equal(a.isCompletePhilippineAddress(a.manualPhilippineAddress(text)), false, text);
  }
  const manual = a.manualPhilippineAddress('Purok Maligaya, Commonwealth, Quezon City');
  assert.equal(a.isCompletePhilippineAddress(manual), true);
  assert.equal(a.formatPhilippineAddress(manual), manual.street);
  const point = { ...manual, source: 'osm', placeId: 'N/1234', placeName: 'Sample landmark', formattedAddress: 'Commonwealth, Quezon City, Philippines', countryCode: 'PH', latitude: 14.7, longitude: 121.08 };
  assert.equal(a.isCompletePhilippineAddress(point), true);
  for (const change of [{ placeId: '' }, { countryCode: 'US' }, { latitude: NaN }, { longitude: 181 }, { formattedAddress: '' }]) {
    assert.equal(a.isCompletePhilippineAddress({ ...point, ...change }), false);
  }
});

test('manual house/unit edits preserve GPS and validation does not depend on a legacy checkbox', () => {
  const fix = { latitude: 14.7, longitude: 121.08, accuracyMeters: 12, capturedAt: '2026-10-22T02:00:00.000Z' };
  const home = { ...a.manualPhilippineAddress('12 Main Street, Commonwealth, Quezon City'), confirmed: true, deviceLocation: fix };
  assert.equal(a.isCompletePhilippineAddress(home), true);
  const edited = a.editPhilippineAddress('Unit 2, 12 Main Street, Commonwealth, Quezon City', home);
  assert.equal(edited.deviceLocation, fix); assert.equal(edited.confirmed, false);
  assert.equal(a.getPhilippineAddressError(edited), '');
  for (const change of [{ accuracyMeters: 800 }, { accuracyMeters: null }, { latitude: NaN }, { capturedAt: 'invalid' }]) {
    assert.equal(a.isCompletePhilippineAddress({ ...home, deviceLocation: { ...fix, ...change } }), false);
  }
  assert.equal(a.formatPhilippineAddress(home), home.street);
});

test('phone autofill uses only returned postal fields, deduplicates locality names and flags area-only results', () => {
  const address = phoneAddresses.phoneAddress({ isoCountryCode: 'PH', streetNumber: '42', street: 'Rivera Street',
    district: 'Commonwealth', city: 'Quezon City', subregion: 'Quezon City', region: 'Metro Manila', name: 'Unrelated nearby shop' });
  assert.equal(address.street, '42 Rivera Street, Commonwealth, Quezon City, Metro Manila, Philippines');
  assert.equal(address.localityCode, '1381300000');
  assert.equal(a.isCompletePhilippineAddress({ ...address, confirmed: true }), true);
  assert.equal(phoneAddresses.phoneAddress({ isoCountryCode: 'US', street: 'Main Street', city: 'Manila' }), undefined);
  const partial = phoneAddresses.phoneAddress({ isoCountryCode: 'PH', name: 'Nearby mall', city: 'Quezon City', region: 'Metro Manila' });
  assert.equal(partial.addressLevel, 'area'); assert.ok(!partial.street.includes('mall'));
  assert.equal(a.isCompletePhilippineAddress({ ...partial, confirmed: true }), false);
  assert.equal(phoneAddresses.phoneAddress({ isoCountryCode: 'PH', name: 'Only a placemark' }), undefined);
});
