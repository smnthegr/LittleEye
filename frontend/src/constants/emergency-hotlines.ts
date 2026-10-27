import { PHILIPPINE_CITIES, PHILIPPINE_CITY_SOURCE } from './philippine-cities';
import { getAdditionalLocalHotlines } from './local-emergency-contacts';

export type EmergencyHotline = {
  id: string;
  name: string;
  number: string;
  dialNumber: string;
  /** Carrier as published by the source, never guessed from a mobile prefix. */
  network?: string;
  /** Ask the operator for this department; never append it to the phone number. */
  extension?: string;
  area: string;
  description: string;
  source: { name: string; url: string };
  checkedAt: string;
};

export type EmergencyLocality = {
  id: string;
  name: string;
  region: string;
  province?: string;
  psgcCode?: string;
  aliases: readonly string[];
  source: { name: string; url: string };
  via911?: boolean;
  hotlines: readonly EmergencyHotline[];
};

/** General care contacts follow urgent dispatch options in the directory. */
export const isGeneralMedicalContact = (hotline: Pick<EmergencyHotline, 'name'>) => /Hospital — |Medical Assistance — /.test(hotline.name);

// Source-page review date, not a test call or a guarantee of live availability.
export const HOTLINE_SOURCES_CHECKED = '2026-10-21';
const qc = { name: 'Quezon City Government', url: 'https://quezoncity.gov.ph/emergency-hotline-numbers/' };
const marikina = { name: 'Marikina City Government', url: 'https://www.marikina.gov.ph/contact-us' };
const pasig = { name: 'Pasig City Government', url: 'https://pasigcity.gov.ph/news-and-releases/emergency-contact-numbers-ng-lungsod-ng-pasig-393' };
const makati = { name: 'Makati City Government', url: 'https://www.makati.gov.ph/city' };
const generalTrias = { name: 'General Trias City Government', url: 'https://web.generaltrias.gov.ph/about/directory-of-offices' };
const davao = { name: 'Davao City Government', url: 'https://davaocity.gov.ph/departments/social-services/central-911/' };
const baguio = { name: 'Baguio CDRRMO', url: 'https://www.cdrrmo.baguio.gov.ph/contact-us' };

export const NATIONAL_EMERGENCY_HOTLINES: readonly EmergencyHotline[] = [
  {
    id: 'ph-911', name: 'National Emergency Hotline', number: '911', dialNumber: '911', area: 'Philippines',
    description: 'For emergencies requiring urgent assistance.',
    source: { name: 'Department of the Interior and Local Government', url: 'https://ncr.dilg.gov.ph/dilg-leads-nationwide-campaign-for-unified-911-emergency-hotline/' },
    checkedAt: HOTLINE_SOURCES_CHECKED,
  },
  {
    id: 'ph-red-cross', name: 'Philippine Red Cross', number: '143', dialNumber: '143', area: 'Philippines',
    description: 'Red Cross emergency hotline.',
    source: { name: 'Philippine Red Cross', url: 'https://redcross.org.ph/contact-us/' },
    checkedAt: HOTLINE_SOURCES_CHECKED,
  },
];

/** Reviewed local listings only. Missing cities fall back to national hotlines. */
const REVIEWED_LOCAL_SERVICES: readonly EmergencyLocality[] = [
  {
    id: 'quezon-city', name: 'Quezon City', region: 'Metro Manila', aliases: ['quezon city', 'city of quezon', 'qc'], source: qc,
    hotlines: [
      { id: 'qc-122', name: 'Quezon City Helpline', number: '122', dialNumber: '122', area: 'Quezon City', description: 'City emergency and public assistance.', source: qc, checkedAt: '2026-10-22' },
      { id: 'qc-eoc', name: 'QC Emergency Operations Center', number: '0947 885 9929', dialNumber: '09478859929', network: 'Smart', area: 'Quezon City', description: 'Local emergency operations contact.', source: qc, checkedAt: '2026-10-23' },
      { id: 'qc-eoc-globe', name: 'QC Emergency Operations Center', number: '0977 031 2892', dialNumber: '09770312892', network: 'Globe', area: 'Quezon City', description: 'Local emergency operations contact.', source: qc, checkedAt: '2026-10-23' },
      { id: 'qc-ems-smart', name: 'QC Emergency Medical Services / Search and Rescue', number: '0947 884 7498', dialNumber: '09478847498', network: 'Smart', area: 'Quezon City', description: 'Emergency medical services and search and rescue.', source: qc, checkedAt: '2026-10-23' },
      { id: 'qc-ems-landline', name: 'QC Emergency Medical Services / Search and Rescue', number: '(02) 8928 4396', dialNumber: '0289284396', network: 'Landline', area: 'Quezon City', description: 'Emergency medical services and search and rescue.', source: qc, checkedAt: '2026-10-23' },
    ],
  },
  {
    id: 'marikina-city', name: 'Marikina City', region: 'Metro Manila', aliases: ['marikina city', 'city of marikina', 'marikina'], source: marikina,
    hotlines: [
      { id: 'marikina-rescue', name: 'Marikina Rescue', number: '0917 584 2168', dialNumber: '09175842168', network: 'Globe', area: 'Marikina City', description: 'City-listed rescue contact.', source: marikina, checkedAt: '2026-10-23' },
      ...['0928 559 3341', '0998 997 0115', '0998 579 6435'].map(number => ({ id: `marikina-rescue-${number.replace(/\D/g, '')}`, name: 'Marikina Rescue', number, dialNumber: number.replace(/\D/g, ''), network: 'Smart', area: 'Marikina City', description: 'City-listed rescue contact.', source: marikina, checkedAt: '2026-10-23' })),
      { id: 'marikina-rescue-landline', name: 'Marikina Rescue', number: '(02) 8646 0427', dialNumber: '0286460427', network: 'Landline', area: 'Marikina City', description: 'City-listed rescue contact.', source: marikina, checkedAt: '2026-10-23' },
      ...['0286462436', '0286462437', '0286462438'].map(dialNumber => ({ id: `marikina-rescue-${dialNumber}`, name: 'Marikina Rescue', number: `(02) ${dialNumber.slice(2, 6)} ${dialNumber.slice(6)}`, dialNumber, network: 'Landline', area: 'Marikina City', description: 'City-listed rescue contact.', source: marikina, checkedAt: '2026-10-23' })),
      { id: 'marikina-rescue-landline-2', name: 'Marikina Rescue', number: '(02) 7116 5532', dialNumber: '0271165532', network: 'Landline', area: 'Marikina City', description: 'City-listed rescue contact.', source: marikina, checkedAt: '2026-10-23' },
    ],
  },
  {
    id: 'pasig-city', name: 'Pasig City', region: 'Metro Manila', aliases: ['pasig city', 'city of pasig', 'pasig'], source: pasig,
    hotlines: [{ id: 'pasig-emergency', name: 'Pasig Emergency Hotline', number: '(02) 8643 0000', dialNumber: '0286430000', area: 'Pasig City', description: 'City emergency services. If unavailable, use 911.', source: pasig, checkedAt: '2026-10-22' }],
  },
  {
    id: 'makati-city', name: 'Makati City', region: 'Metro Manila', aliases: ['makati city', 'city of makati', 'makati'], source: makati,
    hotlines: [{ id: 'makati-rescue', name: 'Makati Rescue', number: '(02) 8895 8243', dialNumber: '0288958243', area: 'Makati City', description: 'City-listed rescue contact.', source: makati, checkedAt: HOTLINE_SOURCES_CHECKED }],
  },
  {
    id: 'general-trias', name: 'General Trias', region: 'Cavite', aliases: ['general trias city', 'city of general trias', 'general trias', 'gen trias', 'gentri'], source: generalTrias,
    hotlines: [{ id: 'gentri-rescue', name: 'General Trias CDRRMO / Rescue', number: '0919 077 1760', dialNumber: '09190771760', area: 'General Trias, Cavite', description: 'City-listed rescue hotline.', source: generalTrias, checkedAt: HOTLINE_SOURCES_CHECKED }],
  },
  { id: 'davao-city', name: 'Davao City', region: 'Davao Region', aliases: ['davao city', 'city of davao'], source: davao, via911: true, hotlines: [] },
  { id: 'baguio-city', name: 'Baguio City', region: 'Cordillera Administrative Region', aliases: ['baguio city', 'city of baguio', 'baguio'], source: baguio, via911: true, hotlines: [] },
  {
    id: 'ph-0105503000', name: 'Alaminos City', region: 'Ilocos Region', aliases: [], via911: true, hotlines: [],
    source: { name: 'Philippine Information Agency — Alaminos local 911 activation', url: 'https://pia.gov.ph/regions/alaminos-city-activates-state-of-the-art-911-emergency-hotline/' },
  },
  {
    id: 'ph-0500506000', name: 'Legazpi City', region: 'Bicol Region', aliases: [], via911: true, hotlines: [],
    source: { name: 'Legazpi City Government — 911 Emergency Action Center', url: 'https://legazpi.gov.ph/wp-content/uploads/2023/09/CDRRMO-PAGE-189-224.pdf' },
  },
  {
    id: 'ph-1030500000', name: 'Cagayan De Oro City', region: 'Northern Mindanao', aliases: [], via911: true, hotlines: [],
    source: { name: 'Cagayan de Oro City Government — Oro Rescue 911 advisory', url: 'https://www.cagayandeoro.gov.ph/index.php/news-and-article/item/2301-cdrrmd-gihangyo-ang-publiko-pagtawag-gilayon-sa-911-hotline-kung-adunay-emergency-cases.html' },
  },
];

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** All PSA-listed cities have national options; local listings require a separate official source. */
export const EMERGENCY_LOCALITIES: readonly EmergencyLocality[] = PHILIPPINE_CITIES.map(city => {
  const reviewed = REVIEWED_LOCAL_SERVICES.find(area => area.id === city.id);
  const hotlines = [...(reviewed?.hotlines ?? []), ...getAdditionalLocalHotlines(city)]
    .filter((hotline, index, all) => all.findIndex(entry => entry.dialNumber === hotline.dialNumber && entry.extension === hotline.extension) === index)
    .sort((a, b) => Number(isGeneralMedicalContact(a)) - Number(isGeneralMedicalContact(b)));
  const base = city.name.replace(/ City$/, '').replace(/^(?:Science City of|Island Garden City of) /, '');
  const aliases = [city.name, city.officialName, `${base} City`, `City of ${base}`, base, ...(reviewed?.aliases ?? [])].map(normalize);
  if (base === 'Sto. Tomas') aliases.push('santo tomas city', 'city of santo tomas', 'santo tomas');
  if (base === 'Baliwag') aliases.push('baliuag', 'baliuag city');
  if (base === 'Cagayan De Oro') aliases.push('cdo');
  if (base === 'General Santos') aliases.push('gensan');
  return { ...city, aliases: [...new Set(aliases)], source: reviewed?.source ?? hotlines[0]?.source ?? PHILIPPINE_CITY_SOURCE,
    hotlines, via911: reviewed?.via911 };
}).sort((a, b) => a.name.localeCompare(b.name) || (a.province ?? '').localeCompare(b.province ?? ''));

export const SOS_HOTLINE = NATIONAL_EMERGENCY_HOTLINES[0];
