import localityData from '../constants/addresses/localities.json';

export type AddressDeviceLocation = {
  latitude: number; longitude: number; accuracyMeters: number; capturedAt: string;
};
export type PhilippineAddress = {
  street: string; localityCode: string; barangayCode: string;
  source?: 'manual' | 'osm' | 'phone' | 'tomtom'; placeId?: string; countryCode?: string;
  addressLevel?: 'street' | 'area';
  formattedAddress?: string; placeName?: string;
  latitude?: number; longitude?: number;
  /** Legacy checkbox value; no longer used for validation or location access. */
  confirmed?: boolean;
  /** Device estimate is separate from a landmark's map coordinates. */
  deviceLocation?: AddressDeviceLocation;
};
export type AddressLocality = { code: string; name: string; province: string; region: string };
export type AddressBarangay = { code: string; name: string; district: string };
export const EMPTY_ADDRESS: PhilippineAddress = { street: '', localityCode: '', barangayCode: '' };
const localities: AddressLocality[] = Object.entries(localityData).map(([code, [name, province, region]]) => ({ code, name, province, region }))
  .sort((a, b) => a.name.localeCompare(b.name));
const localityByCode = new Map(localities.map(item => [item.code, item]));
let barangayData: Record<string, string[][]> | undefined;
const barangayCache = new Map<string, AddressBarangay[]>();

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\bcity of\b|\bcity\b|\bmunicipality of\b|\bbarangay\b|\bbrgy\b/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
export function getAddressLocality(code: string) { return localityByCode.get(code); }
export function getAddressBarangays(localityCode: string): AddressBarangay[] {
  if (!localityByCode.has(localityCode)) return [];
  if (!barangayCache.has(localityCode)) {
    // Load the larger directory only when an address is used; no network or location permission.
    barangayData ??= require('../constants/addresses/barangays.json') as Record<string, string[][]>;
    barangayCache.set(localityCode, (barangayData[localityCode] ?? []).map(([code, name, district = '']) => ({ code, name, district }))
      .sort((a, b) => a.name.localeCompare(b.name)));
  }
  return barangayCache.get(localityCode)!;
}
export function searchAddressLocalities(query: string) {
  const normalized = normalize(query);
  const words = normalized.split(' ').filter(Boolean);
  const rank = (item: AddressLocality) => item.name.toLowerCase() === query.trim().toLowerCase() ? 0
    : normalize(item.name) === normalized ? 1 : normalize(item.name).startsWith(normalized) ? 2 : 3;
  return localities.filter(item => words.every(word => normalize(`${item.name} ${item.province} ${item.region}`).includes(word)))
    .sort((a, b) => rank(a) - rank(b));
}
export function searchAddressBarangays(localityCode: string, query: string) {
  const words = normalize(query).split(' ').filter(Boolean);
  return getAddressBarangays(localityCode).filter(item => words.every(word => normalize(`${item.name} ${item.district}`).includes(word)));
}
/** Changing the city must clear its old barangay, even if both have the same name. */
export function changeAddressLocality(address: PhilippineAddress, localityCode: string): PhilippineAddress {
  return { ...address, localityCode, barangayCode: address.localityCode === localityCode ? address.barangayCode : '' };
}
export function formatPhilippineAddress(address?: PhilippineAddress) {
  if (!address) return '';
  if (address.source === 'manual' || address.source === 'phone') return address.street;
  if (address.source === 'osm' || address.source === 'tomtom') return [address.placeName, address.formattedAddress].filter(Boolean).join(', ');
  const locality = getAddressLocality(address.localityCode);
  const barangay = getAddressBarangays(address.localityCode).find(item => item.code === address.barangayCode);
  return [address.street.trim(), barangay?.name, barangay?.district, locality?.name,
    locality?.province || locality?.region, 'Philippines'].filter(Boolean).join(', ');
}
/** Checks address parts, not residence, a doorway, or a dispatch destination. */
function hasAddressParts(address?: PhilippineAddress): boolean {
  if (address?.source === 'phone') return address.countryCode === 'PH' && address.addressLevel === 'street'
    && address.street.trim().length >= 5 && address.street.length <= 500;
  if (address?.source === 'osm' || address?.source === 'tomtom') return address.countryCode === 'PH'
    && (address.source === 'osm' ? /^[NWR]\/\d+$/.test(address.placeId ?? '') && !!address.placeName?.trim() : !!address.placeId && address.placeId.length <= 512)
    && !!address.formattedAddress?.trim()
    && typeof address.latitude === 'number' && Number.isFinite(address.latitude) && Math.abs(address.latitude) <= 90
    && typeof address.longitude === 'number' && Number.isFinite(address.longitude) && Math.abs(address.longitude) <= 180;
  if (address?.source === 'manual') {
    const input = address.street.trim();
    if (input.length > 500) return false;
    const parts = input.split(/[,;\n]/).map(part => part.trim()).filter(Boolean);
    // Manual input is a completeness check, never a claim that a map verified it.
    return parts.length >= 3 && parts.filter(part => /\p{L}/u.test(part) &&
      !/^(?:philippines|pilipinas|n\/?a|none|test|testing|sample|address|asdf|qwerty)$/i.test(part)).length >= 3;
  }
  if (!address || !localityByCode.has(address.localityCode)) return false;
  const street = address.street.trim();
  if (street.length < 3 || street.length > 180 || !/\p{L}/u.test(street)) return false;
  const words = normalize(street).split(' ');
  if (!words.some(word => !['n', 'a', 'na', 'none', 'test', 'testing', 'sample', 'address', 'asdf', 'qwerty', 'null', 'undefined'].includes(word) && /\p{L}/u.test(word))) return false;
  return getAddressBarangays(address.localityCode).some(item => item.code === address.barangayCode);
}

export function manualPhilippineAddress(street: string): PhilippineAddress {
  return { street, localityCode: '', barangayCode: '', source: 'manual', confirmed: false };
}

export function isValidAddressDeviceLocation(location: AddressDeviceLocation) {
  return Number.isFinite(location.latitude) && Math.abs(location.latitude) <= 90
    && Number.isFinite(location.longitude) && Math.abs(location.longitude) <= 180
    && Number.isFinite(location.accuracyMeters) && location.accuracyMeters >= 0 && location.accuracyMeters <= 100
    && Number.isFinite(Date.parse(location.capturedAt));
}

export function getPhilippineAddressError(address?: PhilippineAddress) {
  if (!hasAddressParts(address)) return 'Enter a complete address.';
  if (address?.deviceLocation && !isValidAddressDeviceLocation(address.deviceLocation)) return 'Refresh your current location.';
  return '';
}

export function isCompletePhilippineAddress(address?: PhilippineAddress): boolean {
  return !getPhilippineAddressError(address);
}

/** Keep a device estimate while adding house/unit text; clear provider identity. */
export function editPhilippineAddress(street: string, previous?: PhilippineAddress): PhilippineAddress {
  return { ...manualPhilippineAddress(street), ...(previous?.deviceLocation && { deviceLocation: previous.deviceLocation }) };
}

/** Resolve provider locality components only when the directory match is unique. */
export function resolvePlaceLocality(components: { longText: string; types: string[] }[]) {
  const cityComponents = components.filter(c => c.types.includes('locality') || c.types.includes('administrative_area_level_2'));
  const cityNames = cityComponents.map(c => normalize(c.longText)).filter(Boolean);
  // Preserve "City" in administrative fields: "Quezon City" is not Quezon province.
  const normalizeArea = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\bprovince of\b|\bprovince\b/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const areaNames = components.filter(c => c.types.some(t => t.startsWith('administrative_area_level_'))).map(c => normalizeArea(c.longText));
  const matches = localities.filter(item => cityNames.includes(normalize(item.name)));
  const explicitCities = matches.filter(item => /\bcity\b/i.test(item.name) && cityComponents.some(c =>
    /\bcity\b/i.test(c.longText) && normalize(c.longText) === normalize(item.name)));
  const candidates = explicitCities.length ? explicitCities : matches;
  const withProvince = candidates.filter(item => item.province && areaNames.includes(normalizeArea(item.province)));
  return (withProvince.length === 1 ? withProvince[0] : candidates.length === 1 ? candidates[0] : undefined)?.code ?? '';
}
