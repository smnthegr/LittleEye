import { EMERGENCY_LOCALITIES, NATIONAL_EMERGENCY_HOTLINES, isGeneralMedicalContact } from '../constants/emergency-hotlines';
import type { EmergencyHotline } from '../constants/emergency-hotlines';

export type EmergencyAreaChoice = { country: 'PH'; localityId: string | null; addressKey: string };

export function normalizeEmergencyAddress(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\bsta\b/g, 'santa').replace(/\bsto\b/g, 'santo');
}

const provinceNames = new Set(EMERGENCY_LOCALITIES.map(area => normalizeEmergencyAddress(area.province ?? '')).filter(Boolean));
const cityMatchers = EMERGENCY_LOCALITIES.map(locality => ({
  locality,
  province: normalizeEmergencyAddress(locality.province ?? ''),
  region: normalizeEmergencyAddress(locality.region),
  aliases: locality.aliases.map(alias => ({
    text: normalizeEmergencyAddress(alias),
    explicit: alias.includes('city'),
    pattern: new RegExp(`\\b${normalizeEmergencyAddress(alias)}\\b(?!\\s+(?:street|st|road|rd|avenue|ave|building|village|subdivision)\\b)`),
  })),
}));

function isExplicitForeignAddress(address: string) {
  return /(?:^|[,;\n])\s*(?:singapore|united states(?: of america)?|usa|us|canada|australia|united kingdom|uk|japan|china|malaysia|thailand|vietnam|indonesia|south korea|united arab emirates|uae)\s*\d*\s*$/i.test(address);
}

/** Conservative text match, not GPS/geocoding. Never infer QC from "Quezon Province". */
export function detectEmergencyLocality(address: string) {
  if (isExplicitForeignAddress(address)) return { locality: null, ambiguous: false };
  const normalized = normalizeEmergencyAddress(address);
  const segments = address.split(/[,;\n]/).map(part => normalizeEmergencyAddress(part).replace(/\b\d{4}\b/g, '').trim());
  const mentionedProvinces = [...provinceNames].filter(province => segments.some(segment =>
    new RegExp(`(?:^| )${province}(?: province)?(?: (?:philippines|pilipinas))?$`).test(segment)));
  const candidates = cityMatchers.filter(({ aliases, province, region }) => aliases.some(alias => {
    if (alias.explicit) return alias.pattern.test(normalized);
    // A province name alone (e.g. Cebu or Quezon) must not become a city match.
    if (provinceNames.has(alias.text)) return false;
    const tails = ['', province, region, 'philippines', 'pilipinas', ...(region === 'metro manila' ? ['ncr'] : [])];
    return segments.some(segment => tails.some(tail => segment === `${alias.text}${tail ? ` ${tail}` : ''}`));
  }));
  // Resolve duplicate names using an explicit province, never array ordering.
  const matches = candidates.filter(candidate => !mentionedProvinces.length || !candidate.province
    || mentionedProvinces.includes(candidate.province)).map(candidate => candidate.locality);
  return { locality: matches.length === 1 ? matches[0] : null, ambiguous: matches.length > 1 };
}

export function createEmergencyAreaChoice(address: string, localityId: string | null): EmergencyAreaChoice {
  if (localityId !== null && !EMERGENCY_LOCALITIES.some(area => area.id === localityId)) throw new Error('Unknown Philippine hotline area.');
  return { country: 'PH', localityId, addressKey: normalizeEmergencyAddress(address) };
}

export function getEmergencyDirectory(address: string, choice?: EmergencyAreaChoice, localityCode?: string) {
  // A selected PSGC municipality is authoritative: a city name in its street or
  // barangay must not accidentally select that other city's emergency numbers.
  const detected = localityCode
    ? { locality: EMERGENCY_LOCALITIES.find(area => area.psgcCode === localityCode) ?? null, ambiguous: false }
    : detectEmergencyLocality(address);
  const validChoice = choice?.country === 'PH' && choice.addressKey === normalizeEmergencyAddress(address)
    && (choice.localityId === null || EMERGENCY_LOCALITIES.some(area => area.id === choice.localityId));
  const locality = validChoice
    ? EMERGENCY_LOCALITIES.find(area => area.id === choice.localityId) ?? null
    : detected.locality;
  // Keep dispatch/rescue first and national emergency options above hospital
  // switchboards, so long hospital directories never bury 911.
  const local = locality?.hotlines ?? [];
  const hotlines = [...local.filter(entry => !isGeneralMedicalContact(entry)), ...NATIONAL_EMERGENCY_HOTLINES,
    ...local.filter(isGeneralMedicalContact)]
    .filter((hotline, index, all) => all.findIndex(entry => entry.dialNumber === hotline.dialNumber && entry.extension === hotline.extension) === index);
  const status = validChoice ? locality ? 'selected' : 'national-only'
    : locality ? 'matched' : detected.ambiguous ? 'ambiguous' : address.trim() ? 'unlisted' : 'missing-address';
  const duplicateName = locality && EMERGENCY_LOCALITIES.some(area => area.id !== locality.id && area.name === locality.name);
  const areaName = locality ? `${locality.name}${duplicateName && locality.province ? `, ${locality.province}` : ''}` : 'Philippines';
  return { locality, hotlines, status, areaName };
}

/** Only reviewed numbers may be handed to the phone app; no arbitrary tel URLs. */
export function getEmergencyDialUrl(hotline: Pick<EmergencyHotline, 'id' | 'dialNumber'>) {
  const entry = [...NATIONAL_EMERGENCY_HOTLINES, ...EMERGENCY_LOCALITIES.flatMap(area => area.hotlines)]
    .find(item => item.id === hotline.id && item.dialNumber === hotline.dialNumber);
  if (!entry || !/^\d{3,11}$/.test(entry.dialNumber)) throw new Error('This hotline is not in the reviewed directory.');
  return `tel:${entry.dialNumber}`;
}
