import type { LocationGeocodedAddress } from 'expo-location';
import { resolvePlaceLocality, type PhilippineAddress } from './philippine-address';

/** Use postal fields, never a nearby business/placemark name as a home address. */
export function phoneAddress(result: Partial<LocationGeocodedAddress>): PhilippineAddress | undefined {
  const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
  const country = text(result.isoCountryCode).toUpperCase();
  if (country !== 'PH' && !(country === '' && /^(philippines|pilipinas)$/i.test(text(result.country)))) return;
  const streetName = text(result.street);
  const city = text(result.city);
  const region = text(result.region);
  const street = [text(result.streetNumber), streetName].filter(Boolean).join(' ');
  const seen = new Set<string>();
  const parts = [street, text(result.district), city, text(result.subregion), region, text(result.postalCode), 'Philippines']
    .filter(part => {
      const key = part.toLowerCase();
      if (!part || seen.has(key)) return false;
      seen.add(key); return true;
    });
  if (!streetName && !city && !region && !text(result.district) && !text(result.subregion)) return;
  return { source: 'phone', street: parts.join(', '), countryCode: 'PH', confirmed: false,
    addressLevel: streetName && (city || region || text(result.subregion)) ? 'street' : 'area',
    localityCode: resolvePlaceLocality([
      { longText: city, types: ['locality'] }, { longText: text(result.subregion), types: ['administrative_area_level_2'] },
      { longText: region, types: ['administrative_area_level_1'] },
    ]), barangayCode: '',
  } satisfies PhilippineAddress;
}
