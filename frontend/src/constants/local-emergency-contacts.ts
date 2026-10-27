import { PHILIPPINE_CITIES, type PhilippineCity } from './philippine-cities';
import type { EmergencyHotline } from './emergency-hotlines';

type LocalService = 'Rescue / Disaster Response' | 'Fire Station' | 'Police' | 'Emergency Medical Assistance' | 'Emergency Hotline'
  | 'Emergency Doctor' | 'Red Cross' | `Hospital — ${string}` | `Medical Assistance — ${string}` | `Rescue — ${string}`;
type ContactRow = readonly [city: string, service: LocalService, number: string, province?: string, network?: string, extension?: string, serviceArea?: string];
type SourceGroup = { source: EmergencyHotline['source']; rows: readonly ContactRow[]; checkedAt?: string };

// Keep excluded historical police/fire rows for traceability; only fall-relevant
// services are assembled below. Source review is not a test call.
// Trunks are included only when explicitly published for emergency services,
// with department extensions preserved separately from dialable numbers.
export const isFallRelevantService = (service: LocalService) => service !== 'Police' && service !== 'Fire Station';
const provincialRows = (province: string, service: LocalService, numbers: readonly string[]): ContactRow[] => PHILIPPINE_CITIES
  .filter(city => city.province === province)
  .flatMap(city => numbers.map(number => [city.name, service, number, province, undefined, undefined, `${province} province`] as const));
export const LOCAL_CONTACT_SOURCE_GROUPS: readonly SourceGroup[] = [
  {
    source: { name: 'Malaybalay City Government — CDRRMO contact directory', url: 'https://sakata.malaybalaycity.gov.ph/contact-us/' },
    rows: [['Malaybalay City', 'Rescue / Disaster Response', '0917 827 6117']],
  },
  {
    source: { name: 'Panabo City Government — police station hotlines', url: 'https://panabocity.gov.ph/panabo-city-police-station-hotline-numbers/' },
    rows: [
      ['Panabo City', 'Police', '0907 312 2991'],
      ['Panabo City', 'Police', '0998 598 7104'],
    ],
  },
  {
    source: { name: 'City of Ilagan — CDRRMO / Rescue 1124', url: 'https://cityofilagan.gov.ph/index.php/city-drrm/' },
    checkedAt: '2026-10-23',
    rows: [['Ilagan City', 'Rescue / Disaster Response', '0915 234 1124', undefined, 'Globe'],
      ['Ilagan City', 'Rescue / Disaster Response', '(078) 624 0203', undefined, 'PLDT']],
  },
  {
    source: { name: 'Isabela Provincial Government — emergency directory (July 2026)', url: 'https://provinceofisabela.gov.ph/emergency-hotlines/' },
    rows: [
      ['Santiago City', 'Rescue / Disaster Response', '0905 558 6669'],
      ['Santiago City', 'Fire Station', '0917 500 8535'],
    ],
  },
  {
    source: { name: 'Tabuk City Government — emergency hotlines', url: 'https://tabukcity.gov.ph/contact-us/' },
    rows: [
      ['Tabuk City', 'Rescue / Disaster Response', '0917 164 3658'],
      ['Tabuk City', 'Fire Station', '0977 360 7633'],
      ['Tabuk City', 'Police', '0998 598 7824'],
    ],
  },
  {
    source: { name: 'Philippine Information Agency — Dagupan emergency advisory', url: 'https://pia.gov.ph/news/typhoon-uwan-prompts-forced-evacuations-liquor-ban-in-dagupan-city/' },
    rows: [
      ['Dagupan City', 'Rescue / Disaster Response', '0968 444 9598'],
      ['Dagupan City', 'Fire Station', '0917 184 2611'],
      ['Dagupan City', 'Police', '0998 598 5121'],
    ],
  },
  {
    source: { name: 'Roxas City Government — emergency advisory', url: 'https://roxascity.gov.ph/public-advisory-low-pressure-area/' },
    rows: [['Roxas City', 'Emergency Hotline', '0912 472 2669']],
  },
  {
    source: { name: 'Sipalay City Government — disaster and emergency response', url: 'https://sipalaycity.gov.ph/wp-content/uploads/2023/10/Citizens-Charter-2022.pdf' },
    rows: [
      ['Sipalay City', 'Rescue / Disaster Response', '0949 687 7325'],
      ['Sipalay City', 'Rescue / Disaster Response', '0917 504 3266'],
    ],
  },
  {
    source: { name: 'Olongapo City Government — emergency hotlines', url: 'https://olongapocity.gov.ph/emergency-hotlines/' },
    rows: [['Olongapo City', 'Rescue / Disaster Response', '0998 593 7446']],
  },
  {
    source: { name: 'Provincial Government of Cavite — city hotline directory', url: 'https://cavite.gov.ph/directory/' },
    rows: [
      ['Trece Martires City', 'Emergency Hotline', '0949 629 8026'],
      ['Tagaytay City', 'Emergency Hotline', '0956 003 4681'],
      ['Carmona City', 'Emergency Hotline', '0917 112 0291'],
    ],
  },
  {
    source: { name: 'Cavite City Government — CDRRMO hotlines', url: 'https://www.cavitecity.gov.ph/index.php/about-lgu/directory/lgu-offices' },
    rows: [
      ['Cavite City', 'Rescue / Disaster Response', '0948 515 0632'],
      ['Cavite City', 'Fire Station', '0908 950 8557'],
    ],
  },
  {
    source: { name: 'Dasmariñas City Government — emergency assistance', url: 'https://cityofdasmarinas.gov.ph/cdrrmo-emergency-assistance-services/' },
    checkedAt: '2026-10-23',
    rows: [
      ['Dasmariñas City', 'Rescue / Disaster Response', '0917 721 8825'],
      ['Dasmariñas City', 'Rescue / Disaster Response', '0998 843 5477'],
      ['Dasmariñas City', 'Rescue / Disaster Response', '(046) 435 0183', undefined, 'Landline'],
      ['Dasmariñas City', 'Rescue / Disaster Response', '(046) 481 0555', undefined, 'Landline'],
      ['Dasmariñas City', 'Rescue / Disaster Response', '(046) 686 6608', undefined, 'Landline'],
      ['Dasmariñas City', 'Rescue / Disaster Response', '(046) 513 1766', undefined, 'Landline'],
    ],
  },
  {
    source: { name: 'Imus City Government — emergency hotlines', url: 'https://cityofimus.gov.ph/' },
    rows: [
      ['Imus City', 'Emergency Hotline', '(046) 888 9911'],
      ['Imus City', 'Rescue / Disaster Response', '0919 069 1703'],
      ['Imus City', 'Fire Station', '0915 528 3256'],
    ],
  },
  {
    source: { name: 'General Trias City Government — emergency directory', url: 'https://web.generaltrias.gov.ph/about/directory-of-offices' },
    rows: [
      ['General Trias City', 'Emergency Medical Assistance', '0962 538 5617'],
      ['General Trias City', 'Fire Station', '0967 429 0363'],
    ],
  },
  {
    source: { name: 'Calamba City Government — emergency hotlines', url: 'https://gad.calambacity.gov.ph/hotlines/' },
    rows: [['Calamba City', 'Police', '(049) 545 1694']],
  },
  {
    source: { name: 'San Pablo City Government — emergency hotlines', url: 'https://www.sanpablocity.gov.ph/services' },
    rows: [['San Pablo City', 'Rescue / Disaster Response', '0998 540 7171']],
  },
  {
    source: { name: 'Quezon Provincial Government — city DRRMO hotlines', url: 'https://quezon.gov.ph/quezon-province-emergency-hotlines/' },
    rows: [
      ['Lucena City', 'Rescue / Disaster Response', '0970 128 5078'],
      ['Tayabas City', 'Rescue / Disaster Response', '0917 839 8434'],
    ],
  },
  {
    source: { name: 'Cauayan City Government — Rescue 922', url: 'https://www.cityofcauayan.gov.ph/contact' },
    checkedAt: '2026-10-23',
    rows: [
      ['Cauayan City', 'Rescue / Disaster Response', '0917 127 8785', undefined, 'Globe / TM'],
      ['Cauayan City', 'Rescue / Disaster Response', '0999 727 5090', undefined, 'Smart'],
      ['Cauayan City', 'Rescue / Disaster Response', '0923 676 5094', undefined, 'Sun'],
      ['Cauayan City', 'Police', '(078) 652 2224', undefined, 'Landline'],
      ['Cauayan City', 'Police', '0905 558 8333'],
      ['Cauayan City', 'Fire Station', '0926 490 5075'],
    ],
  },
  {
    source: { name: 'Batac City Government — emergency hotlines', url: 'https://batac.gov.ph/?query-101-page=2' },
    rows: [
      ['Batac City', 'Rescue / Disaster Response', '0922 892 7971'],
      ['Batac City', 'Fire Station', '0906 583 6071'],
    ],
  },
  {
    source: { name: 'Candon City Government — emergency hotline', url: 'https://candoncity.gov.ph/page/18/' },
    checkedAt: '2026-10-23',
    rows: [
      ['Candon City', 'Emergency Hotline', '0917 868 3742', undefined, 'Globe'],
      ['Candon City', 'Emergency Hotline', '0968 862 3742', undefined, 'Smart'],
    ],
  },
  {
    source: { name: 'Philippine Information Agency — San Fernando city emergency advisory', url: 'https://pia.gov.ph/disaster-information-service/san-fernando-city-ramps-up-preparedness-as-typhoon-uwan-enters-par/' },
    rows: [['San Fernando City', 'Rescue / Disaster Response', '0928 522 0622', 'La Union']],
  },
  {
    source: { name: 'Naga City Government — COMCEN emergency numbers', url: 'https://www2.naga.gov.ph/' },
    checkedAt: '2026-10-23',
    rows: [
      ['Naga City', 'Emergency Hotline', '0908 525 3000', 'Camarines Sur', 'Smart'],
      ['Naga City', 'Emergency Hotline', '0963 220 9700', 'Camarines Sur', 'TNT'],
    ],
  },
  {
    source: { name: 'Bureau of Fire Protection — Naga City Central Fire Station', url: 'https://region5.bfp.gov.ph/wp-content/uploads/2025/01/6th-Edition-PBDs_DOG-FOOD-2025.pdf' },
    rows: [['Naga City', 'Fire Station', '0923 083 9429', 'Camarines Sur']],
  },
  {
    source: { name: 'City of Naga, Cebu — CDRRMO ambulance services', url: 'https://cityofnagacebu.gov.ph/office-of-the-city-disaster-risk-reduction-management/' },
    checkedAt: '2026-10-23',
    rows: [
      ['Naga City', 'Emergency Medical Assistance', '0916 361 4638', 'Cebu'],
      ['Naga City', 'Emergency Medical Assistance', '0908 413 7220', 'Cebu'],
      ['Naga City', 'Emergency Medical Assistance', '(032) 489 4155', 'Cebu', 'Landline'],
    ],
  },
  {
    source: { name: 'Ligao City Government — emergency hotlines', url: 'https://ligaocity.albay.gov.ph/contact-us-2/' },
    rows: [
      ['Ligao City', 'Rescue / Disaster Response', '0919 078 0730'],
      ['Ligao City', 'Rescue / Disaster Response', '0995 400 4711'],
      ['Ligao City', 'Fire Station', '0936 547 4962'],
    ],
  },
  {
    source: { name: 'Mandaue City Government — emergency hotlines', url: 'https://www.mandauecity.gov.ph/emergency-hotlines' },
    rows: [
      ['Mandaue City', 'Rescue / Disaster Response', '0917 111 6633'],
      ['Mandaue City', 'Police', '0928 890 7047'],
      ['Mandaue City', 'Fire Station', '(032) 344 4747'],
    ],
  },
  {
    source: { name: 'Iloilo City CDRRMO — emergency hotlines', url: 'https://cdrrmo.iloilocity.gov.ph/' },
    rows: [
      ['Iloilo City', 'Rescue / Disaster Response', '0919 066 2333'],
      ['Iloilo City', 'Rescue / Disaster Response', '0919 066 1554'],
      ['Iloilo City', 'Fire Station', '(033) 337 3011'],
    ],
  },
  {
    source: { name: 'Digos City Government — CDRRMO emergency hotlines', url: 'https://digoscity.gov.ph/?page_id=1634' },
    checkedAt: '2026-10-23',
    rows: [
      ['Digos City', 'Rescue / Disaster Response', '0946 695 7777', undefined, 'Smart / TNT'],
      ['Digos City', 'Fire Station', '0919 858 8656'],
      ['Digos City', 'Police', '0939 924 0779'],
    ],
  },
  {
    source: { name: 'Agusan del Sur Provincial Government — Bayugan emergency hotlines', url: 'https://agusandelsur.gov.ph/emergency-hotline/' },
    checkedAt: '2026-10-23',
    rows: [
      ['Bayugan City', 'Rescue / Disaster Response', '0931 721 8885', undefined, 'Smart'],
      // Same BFP team appears in the page's Search and Rescue table; preserve
      // its separately published Globe alternative as well as its Smart line.
      ['Bayugan City', 'Rescue / Disaster Response', '0955 214 8567', undefined, 'Globe'],
      ['Bayugan City', 'Police', '0998 598 7308'],
    ],
  },
  {
    source: { name: 'Bureau of Fire Protection — Central Luzon', url: 'https://region3.bfp.gov.ph/contact-us/' },
    rows: [
      ['Balanga City', 'Fire Station', '0961 694 5781'],
      ['Baliwag City', 'Fire Station', '0942 352 7440'],
      ['Malolos City', 'Fire Station', '0995 186 0370'],
      ['Meycauayan City', 'Fire Station', '0943 134 7740'],
      ['San Jose Del Monte City', 'Fire Station', '0932 373 2444'],
      ['Cabanatuan City', 'Fire Station', '0943 303 4279'],
      ['Gapan City', 'Fire Station', '0933 111 3640'],
      ['Palayan City', 'Fire Station', '0943 066 9962'],
      ['San Jose City', 'Fire Station', '(044) 940 5258'],
      ['Science City of Muñoz', 'Fire Station', '(044) 456 5893'],
      ['Angeles City', 'Fire Station', '(045) 322 2333'],
      ['Mabalacat City', 'Fire Station', '0933 990 9960'],
      ['San Fernando City', 'Fire Station', '(045) 961 2331', 'Pampanga'],
      ['Tarlac City', 'Fire Station', '0968 214 9184'],
      ['Olongapo City', 'Fire Station', '0951 277 9025'],
    ],
  },
  {
    source: { name: 'Taguig City Government', url: 'https://taguig.gov.ph/awards/' },
    rows: [
      ['Taguig City', 'Rescue / Disaster Response', '0919 070 3112'],
      ['Taguig City', 'Fire Station', '(02) 8837 0740'],
      ['Taguig City', 'Police', '0998 598 7932'],
    ],
  },
  {
    source: { name: 'Muntinlupa City Government — emergency hotline advisory', url: 'https://muntinlupacity.gov.ph/iwasan-ang-heat-stroke/' },
    checkedAt: '2026-10-23',
    rows: [
      ['Muntinlupa City', 'Rescue / Disaster Response', '137-175'],
      ['Muntinlupa City', 'Rescue / Disaster Response', '(02) 8373 5165', undefined, 'Landline'],
      ['Muntinlupa City', 'Rescue / Disaster Response', '0921 542 7123', undefined, 'Smart'],
      ['Muntinlupa City', 'Rescue / Disaster Response', '0927 257 9322', undefined, 'Globe'],
    ],
  },
  {
    source: { name: 'Mandaluyong City Government', url: 'https://mandaluyong.gov.ph/government/' },
    rows: [
      ['Mandaluyong City', 'Rescue / Disaster Response', '(02) 8533 2225'],
      ['Mandaluyong City', 'Police', '(02) 8532 2145'],
      ['Mandaluyong City', 'Fire Station', '(02) 8532 2189'],
    ],
  },
  {
    source: { name: 'Philippine Information Agency — Malabon emergency advisory', url: 'https://pia.gov.ph/news/malabon-mayor-steps-up-flood-monitoring-response-as-habagat-brings-heavy-rains/' },
    rows: [
      ['Malabon City', 'Rescue / Disaster Response', '0942 372 9891'],
      ['Malabon City', 'Rescue / Disaster Response', '0919 062 5588'],
    ],
  },
  {
    source: { name: 'Caloocan City Government — emergency advisory', url: 'https://caloocancity.gov.ph/15732-2/' },
    rows: [
      ['Caloocan City', 'Rescue / Disaster Response', '(02) 8882 5664'],
      ['Caloocan City', 'Rescue / Disaster Response', '0908 812 5664'],
      ['Caloocan City', 'Rescue / Disaster Response', '0998 512 5664'],
    ],
  },
  {
    source: { name: 'San Juan City Government — CDRRMO directory', url: 'https://www.sanjuancity.gov.ph/Makabagong_SJ_Directory' },
    checkedAt: '2026-10-23',
    rows: [['San Juan City', 'Rescue / Disaster Response', '137-135', undefined, undefined, '532'],
      ['San Juan City', 'Rescue — Central Emergency and Disaster Operations Center', '137-135', undefined, undefined, '160']],
  },
  {
    source: { name: 'Valenzuela City Government — Bureau of Fire Protection', url: 'https://valenzuela.gov.ph/bureau-of-fire-protection-bfp-valenzuela/' },
    rows: [['Valenzuela City', 'Fire Station', '(02) 8292 3519']],
  },
  {
    source: { name: 'Bacoor City Government — emergency hotlines', url: 'https://bacoor.gov.ph/latest-news/in-case-of-emergency-please-contact-the-following-numbers/' },
    rows: [
      ['Bacoor City', 'Rescue / Disaster Response', '(046) 417 0727'],
      ['Bacoor City', 'Police', '(046) 417 6366'],
      ['Bacoor City', 'Fire Station', '(046) 417 6060'],
    ],
  },
  {
    source: { name: 'Batangas City Government — emergency numbers', url: 'https://www.batangascity.gov.ph/web/piocitizen-scharter/66-leipo' },
    rows: [
      ['Batangas City', 'Emergency Medical Assistance', '0999 222 6626'],
      ['Batangas City', 'Fire Station', '(043) 425 7163'],
    ],
  },
  {
    source: { name: 'Bacolod City Government — DRRM Plan directory', url: 'https://bacolodcity.gov.ph/wp-content/uploads/2024/04/E.-Bacolod-City-DRRM-Plan-2023-2025-Annexes-References.pdf' },
    checkedAt: '2026-10-23',
    rows: [
      // Annex E's emergency poster is an image (physical page 140), so these
      // digits are absent from PDF text extraction. Visually reviewed Oct 23.
      ['Bacolod City', 'Rescue / Disaster Response', '0956 197 6151'],
      ['Bacolod City', 'Rescue / Disaster Response', '(034) 432 3879'],
      ['Bacolod City', 'Red Cross', '(034) 435 0324'],
      ['Bacolod City', 'Hospital — Corazon Locsin Montelibano Memorial Regional Hospital', '(034) 433 2697'],
      ['Bacolod City', 'Hospital — Corazon Locsin Montelibano Memorial Regional Hospital', '(034) 435 1591'],
      // The city charter separately documents BFP participation in its emergency
      // medical/rescue response. These are the poster's BFP contacts.
      ['Bacolod City', 'Rescue — BFP Emergency Response', '0921 341 7002'],
      ['Bacolod City', 'Rescue — BFP Emergency Response', '(034) 434 5022'],
      ['Bacolod City', 'Rescue — BFP Emergency Response', '(034) 434 5023'],
      ['Bacolod City', 'Fire Station', '0921 341 7002'],
    ],
  },
  // Additional alternatives found in the complete source-page review on Oct 23.
  {
    source: { name: 'Malaybalay City Government — CDRRMO contact directory', url: 'https://sakata.malaybalaycity.gov.ph/contact-us/' }, checkedAt: '2026-10-23',
    rows: [['Malaybalay City', 'Rescue / Disaster Response', '(088) 813 3611']],
  },
  {
    source: { name: 'Panabo City Government — emergency response directory', url: 'https://panabocity.gov.ph/emergency-hotlines/' }, checkedAt: '2026-10-23',
    rows: [['Panabo City', 'Rescue / Disaster Response', '0930 238 5937']],
  },
  {
    source: { name: 'Isabela Provincial Government — emergency directory (July 2026)', url: 'https://provinceofisabela.gov.ph/emergency-hotlines/' }, checkedAt: '2026-10-23',
    rows: [['Ilagan City', 'Rescue / Disaster Response', '0916 217 5857'], ['Cauayan City', 'Rescue / Disaster Response', '0927 716 9220']],
  },
  {
    source: { name: 'Tabuk City Government — emergency hotlines', url: 'https://tabukcity.gov.ph/contact-us/' }, checkedAt: '2026-10-23',
    rows: [
      ['Tabuk City', 'Red Cross', '0909 766 4311'],
      ['Tabuk City', 'Hospital — Kalinga Provincial Hospital ER', '0906 306 2457'],
      ['Tabuk City', 'Hospital — Kalinga Provincial Hospital ER', '0915 779 6556'],
      ['Tabuk City', 'Hospital — Holy Trinity Medical Clinic', '0948 847 9137'],
      ['Tabuk City', 'Hospital — Mija Kim Medical Center', '0960 897 1124'],
      ['Tabuk City', 'Hospital — San Juan General Hospital', '0921 756 9504'],
      ['Tabuk City', 'Hospital — St. Jude Hospital', '0928 860 8452'],
      ['Tabuk City', 'Hospital — St. Peter Claver Hospital', '0966 710 6785'],
    ],
  },
  {
    source: { name: 'Philippine Information Agency — Dagupan emergency advisory', url: 'https://pia.gov.ph/news/typhoon-uwan-prompts-forced-evacuations-liquor-ban-in-dagupan-city/' }, checkedAt: '2026-10-23',
    rows: [['Dagupan City', 'Rescue / Disaster Response', '(075) 540 0363'],
      ['Dagupan City', 'Rescue — PARMC Emergency Operations Center', '0985 187 3333']],
  },
  {
    source: { name: 'Roxas City Government — RCERT rescue advisory', url: 'https://roxascity.gov.ph/public-advisory-low-pressure-area/' }, checkedAt: '2026-10-23',
    rows: [['Roxas City', 'Rescue — RCERT', '(036) 522 7878'], ['Roxas City', 'Rescue — RCERT Emergency Operations Center', '(036) 520 1086']],
  },
  {
    source: { name: 'Olongapo City Government — emergency hotlines', url: 'https://olongapocity.gov.ph/emergency-hotlines/' }, checkedAt: '2026-10-23',
    rows: [
      ['Olongapo City', 'Rescue / Disaster Response', '0998 536 7121'],
      ['Olongapo City', 'Rescue — Fire and Rescue', '(047) 223 1415'],
      ['Olongapo City', 'Rescue — Sta. Rita', '0939 956 0009'], ['Olongapo City', 'Rescue — Sta. Rita', '(047) 222 9225'],
      ['Olongapo City', 'Red Cross', '0917 889 2783'], ['Olongapo City', 'Red Cross', '(047) 222 2181'],
      ['Olongapo City', 'Rescue — New Cabalan Fire and Rescue', '(047) 224 5414'],
      ['Olongapo City', 'Rescue — Old Cabalan Quick Emergency Response', '(047) 603 1700'],
      ['Olongapo City', 'Rescue — Gordon Heights Fire and Rescue', '(047) 223 5497'],
      ['Olongapo City', 'Rescue — Barretto Fire and Rescue', '(047) 222 4295'],
      ['Olongapo City', 'Rescue — East Bajac Bajac Fire and Rescue', '0917 436 5998'],
      ['Olongapo City', 'Rescue — East Bajac Bajac Fire and Rescue', '(047) 222 5035'],
      ['Olongapo City', 'Rescue — West Bajac Bajac Fire and Rescue', '(047) 222 5173'],
    ],
  },
  {
    source: { name: 'Provincial Government of Cavite — city hotline directory', url: 'https://cavite.gov.ph/directory/' }, checkedAt: '2026-10-23',
    rows: [
      ['Trece Martires City', 'Emergency Hotline', '(046) 419 3500'], ['Trece Martires City', 'Emergency Hotline', '0977 676 3491'],
      ['Tagaytay City', 'Emergency Hotline', '(046) 483 0446'], ['Tagaytay City', 'Emergency Hotline', '(046) 404 5638'],
      ['Tagaytay City', 'Emergency Hotline', '0961 828 5952'], ['Carmona City', 'Emergency Hotline', '(046) 430 0911'],
      ['General Trias City', 'Rescue / Disaster Response', '(046) 513 6986'],
      ['General Trias City', 'Rescue / Disaster Response', '0917 077 1760'],
      ['Cavite City', 'Rescue / Disaster Response', '(046) 484 9600'], ['Cavite City', 'Rescue / Disaster Response', '(046) 852 2967'],
      ['Cavite City', 'Rescue / Disaster Response', '0926 970 7556'],
    ],
  },
  {
    source: { name: 'Dasmariñas City Government — emergency assistance', url: 'https://cityofdasmarinas.gov.ph/cdrrmo-emergency-assistance-services/' }, checkedAt: '2026-10-23',
    rows: [['Dasmariñas City', 'Rescue / Disaster Response', '0908 818 5555']],
  },
  {
    source: { name: 'General Trias City Government — emergency directory', url: 'https://web.generaltrias.gov.ph/about/directory-of-offices' }, checkedAt: '2026-10-23',
    rows: [['General Trias City', 'Rescue / Disaster Response', '(046) 409 7303']],
  },
  {
    source: { name: 'Calamba City Government — emergency hotlines', url: 'https://gad.calambacity.gov.ph/hotlines/' }, checkedAt: '2026-10-23',
    rows: [
      ['Calamba City', 'Hospital — Dr. Jose P. Rizal Memorial Provincial District Hospital', '(049) 545 0082'],
      ['Calamba City', 'Hospital — Dr. Jose P. Rizal Memorial Provincial District Hospital', '(049) 545 1885'],
      ...['7371', '7372', '0194', '0195', '2529'].map(last => ['Calamba City', 'Hospital — Calamba Doctors’ Hospital', `(049) 545 ${last}`] as const),
      ['Calamba City', 'Hospital — Calamba Doctors’ Hospital', '0917 545 7371'],
      ['Calamba City', 'Hospital — Calamba Medical Center', '(049) 545 1740'],
      ...['9690', '9691', '9692', '9693', '9694'].map(last => ['Calamba City', 'Hospital — Pamana Medical Center', `(049) 554 ${last}`] as const),
      ['Calamba City', 'Hospital — Pamana Medical Center', '0945 778 5469'],
    ],
  },
  {
    source: { name: 'San Pablo City Government — emergency hotlines', url: 'https://www.sanpablocity.gov.ph/services' }, checkedAt: '2026-10-23',
    rows: [['San Pablo City', 'Rescue / Disaster Response', '(049) 800 0405']],
  },
  {
    source: { name: 'Naga City Government — COMCEN emergency numbers', url: 'https://www2.naga.gov.ph/' }, checkedAt: '2026-10-23',
    rows: [['Naga City', 'Emergency Hotline', '(054) 472 3000', 'Camarines Sur']],
  },
  {
    source: { name: 'Ligao City Government — emergency hotlines', url: 'https://ligaocity.albay.gov.ph/contact-us-2/' }, checkedAt: '2026-10-23',
    rows: [['Ligao City', 'Rescue — Special Rescue Unit', '0929 775 9604'], ['Ligao City', 'Rescue — Special Rescue Unit', '0935 699 2804']],
  },
  {
    source: { name: 'Mandaue City Government — emergency hotlines', url: 'https://www.mandauecity.gov.ph/emergency-hotlines' }, checkedAt: '2026-10-23',
    rows: [
      ['Mandaue City', 'Rescue / Disaster Response', '(032) 383 1658'], ['Mandaue City', 'Rescue / Disaster Response', '0938 476 5461'],
      ['Mandaue City', 'Emergency Hotline', '(032) 230 4500'],
      ['Mandaue City', 'Rescue — Emergency Rescue Unit Foundation', '(032) 233 9300'],
      ['Mandaue City', 'Hospital — Vicente Sotto Memorial Medical Center', '(032) 253 9891'],
      ['Mandaue City', 'Hospital — Eversley Childs Sanitarium', '(032) 346 2468'],
      ['Mandaue City', 'Hospital — Mandaue City Hospital ER', '(032) 253 3906', undefined, undefined, '1051'],
      ['Mandaue City', 'Red Cross', '(032) 253 9793'],
    ],
  },
  {
    source: { name: 'Iloilo CDRRMO — complete emergency hotlines directory', url: 'https://cdrrmo.iloilocity.gov.ph/about-us/emergency-hotlines-directory/' }, checkedAt: '2026-10-23',
    rows: [
      ...['(033) 333 2333', '(033) 335 1554', '(033) 339 7171'].map(number => ['Iloilo City', 'Rescue / Disaster Response', number] as const),
      ['Iloilo City', 'Rescue — BFP Search and Rescue', '(033) 337 3011'], ['Iloilo City', 'Rescue — BFP Search and Rescue', '0966 052 0061'],
      ['Iloilo City', 'Red Cross', '0917 117 0066'], ['Iloilo City', 'Red Cross', '(033) 337 5950'],
      ['Iloilo City', 'Hospital — Western Visayas Medical Center', '(033) 339 7070'],
      ['Iloilo City', 'Hospital — West Visayas State University Medical Center', '(033) 320 2431'],
      ...Array.from({ length: 9 }, (_, i) => ['Iloilo City', 'Hospital — St. Paul’s Hospital', `(033) 337 ${2741 + i}`] as const),
      ['Iloilo City', 'Hospital — Iloilo Doctors’ Hospital', '(033) 337 7702'],
      ['Iloilo City', 'Hospital — Metro Iloilo Hospital and Medical Center', '(033) 327 1527'],
      ['Iloilo City', 'Hospital — Healthway QualiMed Hospital', '(033) 500 4000'],
      ['Iloilo City', 'Hospital — The Medical City', '(033) 339 7340'], ['Iloilo City', 'Hospital — The Medical City', '(033) 500 1000'],
      ...Array.from({ length: 5 }, (_, i) => ['Iloilo City', 'Hospital — Iloilo Mission Hospital', `(033) 320 ${String(315 + i).padStart(4, '0')}`] as const),
      ['Iloilo City', 'Hospital — Asia Pacific Medical Center', '(033) 339 9991'],
      ['Iloilo City', 'Hospital — Medicus Medical Center', '(033) 328 7777'],
    ],
  },
  {
    source: { name: 'Taguig City Government — emergency directory', url: 'https://taguig.gov.ph/awards/' }, checkedAt: '2026-10-23',
    rows: [['Taguig City', 'Emergency Hotline', '(02) 8789 3200'], ['Taguig City', 'Emergency Doctor', '0919 079 9112']],
  },
  {
    source: { name: 'Mandaluyong City Government — emergency directory', url: 'https://mandaluyong.gov.ph/government/' }, checkedAt: '2026-10-23',
    rows: [['Mandaluyong City', 'Hospital — City Hospital', '(02) 8539 5500']],
  },
  {
    source: { name: 'Philippine Information Agency — Malabon emergency advisory', url: 'https://pia.gov.ph/news/malabon-mayor-steps-up-flood-monitoring-response-as-habagat-brings-heavy-rains/' }, checkedAt: '2026-10-23',
    rows: [['Malabon City', 'Rescue / Disaster Response', '(02) 8921 6009'], ['Malabon City', 'Rescue / Disaster Response', '(02) 8921 6029']],
  },
  {
    source: { name: 'Quezon City Government — emergency hotline directory', url: 'https://quezoncity.gov.ph/emergency-hotline-numbers/' }, checkedAt: '2026-10-23',
    rows: [['Quezon City', 'Rescue — Emergency Operations Center', '(02) 8988 4242', undefined, undefined, '7245']],
  },
  {
    source: { name: 'Makati City Government — rescue directory', url: 'https://www.makati.gov.ph/city' }, checkedAt: '2026-10-23',
    rows: [['Makati City', 'Rescue / Disaster Response', '(02) 8899 8928'], ['Makati City', 'Rescue / Disaster Response', '(02) 8896 2828']],
  },
  {
    source: { name: 'Pasig City Government — emergency contacts', url: 'https://pasigcity.gov.ph/news-and-releases/emergency-contact-numbers-ng-lungsod-ng-pasig-393' }, checkedAt: '2026-10-23',
    rows: [
      ['Pasig City', 'Hospital — Pasig City Children’s Hospital', '(02) 8643 2222'],
      ['Pasig City', 'Hospital — Pasig City General Hospital', '(02) 8642 7379'], ['Pasig City', 'Hospital — Pasig City General Hospital', '(02) 8642 7381'],
      ['Pasig City', 'Rescue — Santolan Fire and Rescue Brigade', '(02) 8682 1019'],
      ['Pasig City', 'Rescue — Santolan Fire and Rescue Brigade', '0919 450 0133'],
      ['Pasig City', 'Rescue — Santolan Fire and Rescue Brigade', '0910 450 0133'],
      ['Pasig City', 'Rescue — Santolan Ambulance', '0951 335 7000'],
      ['Pasig City', 'Rescue — Santolan Patient Transport', '0912 794 1722'],
    ],
  },
  {
    source: { name: 'Batangas City Government — emergency numbers', url: 'https://www.batangascity.gov.ph/web/piocitizen-scharter/66-leipo' }, checkedAt: '2026-10-23',
    rows: [
      ['Batangas City', 'Rescue / Disaster Response', '(043) 702 3902'], ['Batangas City', 'Red Cross', '0951 282 0000'],
      ['Batangas City', 'Hospital — Batangas Medical Center', '(043) 723 0911'],
      ['Batangas City', 'Hospital — St. Patrick’s Hospital', '(043) 723 1605'],
      ['Batangas City', 'Hospital — Jesus of Nazareth Hospital', '(043) 723 4144'],
      ['Batangas City', 'Hospital — Golden Gate General Hospital', '(043) 723 2508'],
      ['Batangas City', 'Hospital — Batangas Healthcare Specialists', '(043) 403 8642'],
      ['Batangas City', 'Hospital — United Doctors of St. Camillus', '0918 994 2074'],
    ],
  },
  {
    source: { name: 'Batac City Government — emergency hotline advisory', url: 'https://batac.gov.ph/wp-content/uploads/2024/05/Emergency-Hotline-Numbers.jpg' }, checkedAt: '2026-10-23',
    rows: [['Batac City', 'Hospital — Mariano Marcos Memorial Hospital and Medical Center', '0995 192 9313'],
      ['Batac City', 'Hospital — Mariano Marcos Memorial Hospital and Medical Center', '(077) 600 8000']],
  },
  {
    source: { name: 'Bacolod City Government — emergency response citizen’s charter', url: 'https://servicesdirectory.bacolodcity.gov.ph/?page_id=204' }, checkedAt: '2026-10-23',
    rows: [['Bacolod City', 'Rescue / Disaster Response', '0930 243 4706'], ['Bacolod City', 'Rescue / Disaster Response', '0936 940 1591'],
      ['Bacolod City', 'Rescue — Disaster Operations Center', '(034) 445 7826'],
      ...['3871', '3872', '3873'].map(last => ['Bacolod City', 'Rescue / Disaster Response', `(034) 432 ${last}`] as const)],
  },
  {
    source: { name: 'Bacolod City Government Tourism Office — emergency directory', url: 'https://tourism.bacolodcity.gov.ph/contact.php' }, checkedAt: '2026-10-23',
    rows: [['Bacolod City', 'Red Cross', '0920 216 3069'], ['Bacolod City', 'Red Cross', '0995 128 1588'],
      ['Bacolod City', 'Rescue — Amity', '161'], ['Bacolod City', 'Rescue — Amity', '(034) 433 3244'], ['Bacolod City', 'Rescue — Amity', '(034) 433 3626'],
      ['Bacolod City', 'Rescue — Chamber Volunteer Emergency Response', '(034) 432 0111'],
      ['Bacolod City', 'Rescue — Chamber Volunteer Emergency Response', '(034) 433 1777'],
      ['Bacolod City', 'Rescue — Chamber Volunteer Emergency Response', '(034) 435 5555']],
  },
  {
    source: { name: 'Olongapo City Government — DRRMO directory', url: 'https://olongapocity.gov.ph/government-directory/' }, checkedAt: '2026-10-23',
    rows: [['Olongapo City', 'Rescue / Disaster Response', '(047) 232 7530'],
      ['Olongapo City', 'Rescue / Disaster Response', '(047) 611 1911']],
  },
  {
    source: { name: 'Bacolod City Government Tourism Office — emergency directory', url: 'https://tourism.bacolodcity.gov.ph/contact.php' }, checkedAt: '2026-10-23',
    rows: [['Bacolod City', 'Medical Assistance — One Hospital Command Center', '0949 484 1971']],
  },
  {
    source: { name: 'Cavite Provincial Government — OPDRRMO emergency hotlines', url: 'https://cavite.gov.ph/directory/' }, checkedAt: '2026-10-23',
    rows: provincialRows('Cavite', 'Rescue — Cavite Provincial DRRMO', ['0917 858 8263', '0919 061 6584', '(046) 840 0774']),
  },
  {
    source: { name: 'Quezon Provincial Government — PDRRMO emergency hotlines', url: 'https://quezon.gov.ph/quezon-province-emergency-hotlines/' }, checkedAt: '2026-10-23',
    rows: provincialRows('Quezon', 'Rescue — Quezon Provincial DRRMO', ['0946 274 8706', '(042) 710 3933']),
  },
  {
    source: { name: 'Philippine Information Agency — La Union emergency advisory', url: 'https://pia.gov.ph/disaster-information-service/san-fernando-city-ramps-up-preparedness-as-typhoon-uwan-enters-par/' }, checkedAt: '2026-10-23',
    rows: provincialRows('La Union', 'Rescue — La Union Provincial DRRMO', ['0998 561 1519']),
  },
  {
    source: { name: 'Isabela Provincial Government — DART 831', url: 'https://provinceofisabela.gov.ph/emergency-hotlines/' }, checkedAt: '2026-10-23',
    rows: provincialRows('Isabela', 'Rescue — Isabela DART 831', ['0915 819 3187']),
  },
  {
    source: { name: 'Agusan del Sur Provincial Government — Search and Rescue', url: 'https://agusandelsur.gov.ph/emergency-hotline/' }, checkedAt: '2026-10-23',
    rows: provincialRows('Agusan del Sur', 'Rescue — Agusan del Sur Provincial Search and Rescue', ['0948 679 8454']),
  },
  {
    source: { name: 'Philippine Information Agency — Dagupan emergency advisory', url: 'https://pia.gov.ph/news/typhoon-uwan-prompts-forced-evacuations-liquor-ban-in-dagupan-city/' }, checkedAt: '2026-10-23',
    // Explicitly offered for emergency assistance. The landline in the same
    // article is attributed to two agencies; retain only the unambiguous mobile.
    rows: [['Dagupan City', 'Medical Assistance — City Health Office', '0997 840 1377']],
  },
  {
    source: { name: 'Batac City Government — emergency hotline advisory', url: 'https://batac.gov.ph/wp-content/uploads/2024/05/Emergency-Hotline-Numbers.jpg' }, checkedAt: '2026-10-23',
    rows: [['Batac City', 'Medical Assistance — City Health Office', '0917 185 9584'],
      ['Batac City', 'Medical Assistance — City Health Office', '0977 690 8158']],
  },
  {
    source: { name: 'Tabuk City Government — emergency hotlines', url: 'https://tabukcity.gov.ph/contact-us/' }, checkedAt: '2026-10-23',
    rows: [['Tabuk City', 'Medical Assistance — City Health Services Office', '0907 122 0684']],
  },
];

export function getAdditionalLocalHotlines(city: PhilippineCity): EmergencyHotline[] {
  return LOCAL_CONTACT_SOURCE_GROUPS.flatMap(({ source, rows, checkedAt }) => rows
    .filter(([name, service, , province]) => isFallRelevantService(service) && name === city.name && (!province || province === city.province))
    .map(([, service, number, , network, extension, serviceArea]) => ({
      id: `local-${city.psgcCode}-${number.replace(/\D/g, '')}${extension ? `-ext-${extension}` : ''}`,
      name: `${city.name} ${service}`,
      number,
      dialNumber: number.replace(/\D/g, ''),
      network,
      extension,
      area: serviceArea ?? `${city.name}${city.province ? `, ${city.province}` : ''}`,
      description: service.startsWith('Hospital — ') ? 'Hospital contact; ask for emergency care.'
        : service.startsWith('Medical Assistance — ') ? 'Health office listed for emergency assistance.'
        : service === 'Emergency Doctor' ? 'Emergency medical assistance.'
          : extension ? `Call and ask for extension ${extension}.` : 'Published emergency assistance contact.',
      source,
      checkedAt: checkedAt ?? '2026-10-22',
    })));
}
