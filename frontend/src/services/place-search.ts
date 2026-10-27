import { resolvePlaceLocality, type PhilippineAddress } from '../utils/philippine-address';

export type PlaceSuggestion = { id: string; title: string; address: string; selection: PhilippineAddress };
type TomTomResult = { id?: string; type?: string; poi?: { name?: string }; position?: { lat?: number; lon?: number };
  address?: { countryCode?: string; countryCodeISO3?: string; freeformAddress?: string; streetNumber?: string; streetName?: string;
    municipality?: string; municipalitySubdivision?: string; countrySubdivision?: string; countrySecondarySubdivision?: string; postalCode?: string } };
type Feature = { geometry?: { type?: string; coordinates?: unknown[] }; properties?: Record<string, unknown> };
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const broadPlaces = new Set(['country', 'state', 'region', 'province', 'county', 'city', 'town', 'village', 'municipality', 'suburb', 'district', 'borough', 'neighbourhood', 'quarter', 'island']);

export function parseTomTomSuggestions(data: { results?: TomTomResult[] }): PlaceSuggestion[] {
  const unique = new Map<string, PlaceSuggestion>();
  for (const result of data.results ?? []) {
    const a = result.address;
    if (!a || !(text(a.countryCode).toUpperCase() === 'PH' || text(a.countryCodeISO3).toUpperCase() === 'PHL') || result.type === 'Geography') continue;
    const latitude = result.position?.lat;
    const longitude = result.position?.lon;
    if (typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude) > 90
      || typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude) > 180) continue;
    const id = text(result.id);
    const street = [text(a.streetNumber), text(a.streetName)].filter(Boolean).join(' ');
    const formattedAddress = text(a.freeformAddress) || [...new Set([street, text(a.municipalitySubdivision), text(a.municipality), text(a.countrySubdivision), text(a.postalCode), 'Philippines'].filter(Boolean))].join(', ');
    const name = text(result.poi?.name);
    if (!id || (!street && !name && !text(a.freeformAddress))) continue;
    const selection: PhilippineAddress = { source: 'tomtom', street: '', formattedAddress, placeName: name || undefined,
      placeId: id, countryCode: 'PH', latitude, longitude, confirmed: false, barangayCode: '',
      localityCode: resolvePlaceLocality([
        { longText: text(a.municipality), types: ['locality'] },
        { longText: text(a.countrySecondarySubdivision), types: ['administrative_area_level_2'] },
        { longText: text(a.countrySubdivision), types: ['administrative_area_level_1'] },
      ]),
    };
    unique.set(id, { id: `tomtom:${id}`, title: name || street || formattedAddress, address: formattedAddress, selection });
  }
  return [...unique.values()].slice(0, 5);
}

/** Decode actual OSM results; never manufacture a business from the user's query. */
export function parsePlaceSuggestions(data: { features?: Feature[] }): PlaceSuggestion[] {
  const unique = new Map<string, PlaceSuggestion>();
  for (const feature of data.features ?? []) {
    const p = feature.properties ?? {};
    if (text(p.countrycode).toUpperCase() !== 'PH' || feature.geometry?.type !== 'Point') continue;
    if (text(p.osm_key) === 'boundary' || (text(p.osm_key) === 'place' && broadPlaces.has(text(p.osm_value)))) continue;
    const [longitude, latitude] = feature.geometry.coordinates ?? [];
    if (typeof longitude !== 'number' || typeof latitude !== 'number' || !Number.isFinite(longitude) || !Number.isFinite(latitude)
      || Math.abs(longitude) > 180 || Math.abs(latitude) > 90) continue;
    const osmType = text(p.osm_type).toUpperCase();
    const osmId = typeof p.osm_id === 'number' && Number.isSafeInteger(p.osm_id) && p.osm_id > 0 ? String(p.osm_id)
      : /^\d+$/.test(text(p.osm_id)) ? text(p.osm_id) : '';
    if (!/^[NWR]$/.test(osmType) || !osmId) continue;
    const street = [text(p.housenumber), text(p.street)].filter(Boolean).join(' ');
    const title = text(p.name) || street;
    if (!title) continue;
    const parts = [street, text(p.district), text(p.city), text(p.county), text(p.state), text(p.postcode), 'Philippines'];
    const address = [...new Set(parts.filter(part => part && part.toLowerCase() !== title.toLowerCase()))].join(', ');
    if (!text(p.city) && !text(p.county) && !text(p.state)) continue;
    const id = `${osmType}/${osmId}`;
    unique.set(id, { id, title, address, selection: {
      source: 'osm', street: '', localityCode: resolvePlaceLocality([
        { longText: text(p.city), types: ['locality'] },
        { longText: text(p.county), types: ['administrative_area_level_2'] },
        { longText: text(p.state), types: ['administrative_area_level_1'] },
      ]), barangayCode: '', placeId: id, placeName: title, formattedAddress: address, countryCode: 'PH', latitude, longitude, confirmed: false,
    } });
  }
  return [...unique.values()].slice(0, 5);
}

// Shared modest request pacing across all address fields; memory-only short cache.
const cache = new Map<string, { expires: number; results: PlaceSuggestion[] }>();
let queue = Promise.resolve();
let nextRequestAt = 0;
export async function searchPlaces(input: string, signal: AbortSignal): Promise<PlaceSuggestion[]> {
  const query = input.trim();
  if (query.length < 3 || query.length > 250) return [];
  const tomtomKey = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;
  const endpoint = tomtomKey ? `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json`
    : process.env.EXPO_PUBLIC_PHOTON_URL || 'https://photon.komoot.io/api/';
  const cacheKey = `${endpoint}|${query.toLowerCase()}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.results;
  const run = async () => {
    if (signal.aborted) throw new Error('Search cancelled');
    const delay = Math.max(0, nextRequestAt - Date.now());
    if (delay) await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new Error('Search cancelled')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, delay);
      signal.addEventListener('abort', abort, { once: true });
    });
    if (signal.aborted) throw new Error('Search cancelled');
    nextRequestAt = Date.now() + 1100;
    const url = new URL(endpoint);
    if (tomtomKey) {
      url.searchParams.set('key', tomtomKey); url.searchParams.set('typeahead', 'true'); url.searchParams.set('countrySet', 'PH');
      url.searchParams.set('idxSet', 'POI,PAD,Addr,Str'); url.searchParams.set('limit', '5'); url.searchParams.set('language', 'en-US');
    } else {
      url.searchParams.set('q', query); url.searchParams.set('countrycode', 'PH');
      url.searchParams.set('limit', '10'); url.searchParams.set('lang', 'en');
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 8000);
    try {
      const response = await fetch(url.toString(), { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Location search is unavailable.');
      const results = tomtomKey ? parseTomTomSuggestions(await response.json()) : parsePlaceSuggestions(await response.json());
      if (!tomtomKey) {
        cache.set(cacheKey, { expires: Date.now() + 120_000, results });
        if (cache.size > 30) cache.delete(cache.keys().next().value!);
      }
      return results;
    } finally { clearTimeout(timeout); signal.removeEventListener('abort', abort); }
  };
  const task = queue.then(run);
  queue = task.then(() => undefined, () => undefined);
  return task;
}
