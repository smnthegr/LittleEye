import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const utilityUrl = new URL('../src/utils/emergency-directory.ts', import.meta.url).href;
const sourceUrl = new URL('../src/', import.meta.url).href;
const resolution = registerHooks({ resolve(specifier, context, next) {
  return next(context.parentURL?.startsWith(sourceUrl) && specifier.startsWith('.') && !specifier.endsWith('.ts') ? `${specifier}.ts` : specifier, context);
} });
const { EMERGENCY_LOCALITIES, NATIONAL_EMERGENCY_HOTLINES } = await import('../src/constants/emergency-hotlines.ts');
const { PHILIPPINE_CITIES } = await import('../src/constants/philippine-cities.ts');
const { LOCAL_CONTACT_SOURCE_GROUPS, isFallRelevantService } = await import('../src/constants/local-emergency-contacts.ts');
const { createEmergencyAreaChoice, detectEmergencyLocality, getEmergencyDirectory, getEmergencyDialUrl } = await import(utilityUrl);
resolution.deregister();

test('selected PSGC codes control hotline matching instead of city names in street or barangay text', () => {
  for (const area of EMERGENCY_LOCALITIES) {
    assert.equal(getEmergencyDirectory('Quezon City Road, Pasig City', undefined, area.psgcCode).locality?.id, area.id);
  }
  const text = '12 Quezon City Road, Baguio, Adams, Ilocos Norte, Philippines';
  const municipality = getEmergencyDirectory(text, undefined, '0102801000');
  assert.equal(municipality.locality, null);
  assert.deepEqual(municipality.hotlines.map(item => item.dialNumber), ['911', '143']);
  assert.equal(getEmergencyDirectory(text, createEmergencyAreaChoice(text, 'makati-city'), '0102801000').locality.id, 'makati-city');
});

test('national numbers are always available without assuming Quezon City', () => {
  for (const address of ['', 'Quezon Province, Philippines', 'A Philippine municipality']) {
    const result = getEmergencyDirectory(address);
    assert.equal(result.locality, null);
    assert.deepEqual(result.hotlines.map(item => item.dialNumber), ['911', '143']);
  }
});

test('Philippine address matching handles full city names, aliases and postal codes', () => {
  for (const [address, expected] of [
    ['Unit 2, Commonwealth, QUEZON CITY, Metro Manila, Philippines', 'quezon-city'],
    ['Unit 2 Commonwealth Quezon City Metro Manila', 'quezon-city'],
    ['QC, Metro Manila', 'quezon-city'], ['Makati 1200, Philippines', 'makati-city'],
    ['123 Street, Marikina, Metro Manila', 'marikina-city'],
    ['Barangay San Miguel, Pasig City, Philippines', 'pasig-city'],
    ['Gen. Trias, Cavite', 'general-trias'], ['Baguio City, Philippines', 'baguio-city'],
    ['Matina, Davao City, Philippines', 'davao-city'],
  ]) assert.equal(detectEmergencyLocality(address).locality?.id, expected, address);
});

test('street names, ambiguous cities and explicit foreign addresses do not select a wrong local service', () => {
  assert.equal(detectEmergencyLocality('10 Quezon City Street, Pasig City, Philippines').locality?.id, 'pasig-city');
  assert.equal(detectEmergencyLocality('Makati Avenue, Mandaluyong City').locality?.name, 'Mandaluyong City');
  for (const address of ['Quezon Province', 'Quezon City, Pasig City', 'Quezon City, USA']) {
    assert.equal(detectEmergencyLocality(address).locality, null, address);
    assert.equal(getEmergencyDirectory(address).hotlines.some(item => item.id === 'qc-122'), false);
  }
  assert.equal(getEmergencyDirectory('Quezon City, Pasig City').status, 'ambiguous');
});

test('all 149 PSA cities have unique codes, can be selected, and always offer national emergency calling', () => {
  assert.equal(PHILIPPINE_CITIES.length, 149);
  assert.equal(EMERGENCY_LOCALITIES.length, 149);
  assert.equal(new Set(PHILIPPINE_CITIES.map(city => city.psgcCode)).size, 149);
  assert.equal(new Set(EMERGENCY_LOCALITIES.map(city => city.id)).size, 149);
  assert.equal(new Set(PHILIPPINE_CITIES.map(city => city.region)).size, 18);
  for (const city of PHILIPPINE_CITIES) {
    assert.match(city.psgcCode, /^\d{10}$/);
    const address = `${city.officialName}, ${city.province || city.region}, Philippines`;
    assert.equal(getEmergencyDirectory(address).locality?.id, city.id, address);
    const directory = getEmergencyDirectory('Sample address', createEmergencyAreaChoice('Sample address', city.id));
    assert.equal(directory.locality.id, city.id);
    assert.ok(directory.hotlines.some(hotline => hotline.dialNumber === '911'));
    assert.ok(directory.hotlines.some(hotline => hotline.dialNumber === '143'));
  }
});

test('duplicate city names require a province and never silently choose the first city', () => {
  for (const name of ['Naga City', 'San Fernando City', 'San Carlos City', 'Talisay City']) {
    assert.equal(getEmergencyDirectory(name).status, 'ambiguous', name);
  }
  for (const [address, province] of [
    ['Naga City, Cebu', 'Cebu'], ['Naga City Cebu Philippines', 'Cebu'], ['Naga City, Camarines Sur', 'Camarines Sur'],
    ['San Fernando, Pampanga', 'Pampanga'], ['San Fernando, La Union', 'La Union'],
    ['Talisay City, Negros Occidental', 'Negros Occidental'], ['San Carlos City, Pangasinan', 'Pangasinan'],
  ]) assert.equal(getEmergencyDirectory(address).locality?.province, province, address);
  assert.equal(getEmergencyDirectory('Cebu Province').locality, null);
  assert.equal(getEmergencyDirectory('Alaminos, Laguna').locality, null, 'Alaminos municipality is not Alaminos City, Pangasinan');
  assert.equal(getEmergencyDirectory('Sta. Rosa City, Laguna').locality?.name, 'Santa Rosa City');
  assert.equal(getEmergencyDirectory('Santo Tomas City, Batangas').locality?.name, 'Sto. Tomas City');
});

test('local hotlines are limited to the matched or explicitly selected city', () => {
  const qc = getEmergencyDirectory('Quezon City, Philippines');
  assert.ok(qc.hotlines.some(item => item.dialNumber === '122'));
  const pasig = getEmergencyDirectory('Pasig City, Philippines');
  assert.ok(pasig.hotlines.some(item => item.dialNumber === '0286430000'));
  assert.equal(pasig.hotlines.some(item => item.dialNumber === '122'), false);
  const address = 'Quezon City, Philippines';
  const choice = createEmergencyAreaChoice(address, 'marikina-city');
  assert.equal(getEmergencyDirectory(address, choice).locality.id, 'marikina-city');
  assert.equal(getEmergencyDirectory(address, choice).status, 'selected');
});

test('published local contacts appear before national fallback and never leak into another city', () => {
  for (const group of LOCAL_CONTACT_SOURCE_GROUPS) {
    for (const [name, service, number, province, , extension] of group.rows) {
      if (!isFallRelevantService(service)) continue;
      const cities = PHILIPPINE_CITIES.filter(city => city.name === name && (!province || province === city.province));
      assert.equal(cities.length, 1, `${name}, ${province ?? ''}: every source row must identify exactly one city`);
      const city = cities[0];
      const address = `${city.officialName}, ${city.province || city.region}, Philippines`;
      const result = getEmergencyDirectory(address);
      assert.equal(result.locality.id, city.id);
      assert.ok(result.hotlines.some(hotline => hotline.dialNumber === number.replace(/\D/g, '') && hotline.extension === extension), name);
      if (!/Hospital — |Medical Assistance — /.test(service)) assert.notEqual(result.hotlines[0].area, 'Philippines', `${name}: show local dispatch before national cards`);
      assert.ok(result.hotlines.every(hotline => hotline.area === 'Philippines' || result.locality.hotlines.some(local => local.id === hotline.id)));
    }
  }
  const nagaCebu = getEmergencyDirectory('Naga City, Cebu').hotlines.map(hotline => hotline.dialNumber);
  const nagaBicol = getEmergencyDirectory('Naga City, Camarines Sur').hotlines.map(hotline => hotline.dialNumber);
  assert.ok(nagaCebu.includes('09163614638'));
  assert.equal(nagaCebu.includes('09085253000'), false);
  assert.ok(nagaBicol.includes('09085253000'));
  assert.equal(nagaBicol.includes('09163614638'), false);
});

test('changing a saved address invalidates the previous manual override', () => {
  const choice = createEmergencyAreaChoice('Quezon City, Philippines', 'makati-city');
  const next = getEmergencyDirectory('Pasig City, Philippines', choice);
  assert.equal(next.locality.id, 'pasig-city');
  assert.equal(next.status, 'matched');
  assert.equal(getEmergencyDirectory('quezon city, PHILIPPINES', choice).locality.id, 'makati-city');
});

test('national-only selection, corrupt IDs and non-PH overrides are handled safely', () => {
  const address = 'Quezon City, Philippines';
  const choice = createEmergencyAreaChoice(address, null);
  assert.equal(getEmergencyDirectory(address, choice).status, 'national-only');
  assert.equal(getEmergencyDirectory(address, choice).hotlines.length, 2);
  assert.throws(() => createEmergencyAreaChoice(address, 'invented-city'));
  assert.equal(getEmergencyDirectory(address, { ...choice, country: 'US' }).locality.id, 'quezon-city');
  assert.equal(getEmergencyDirectory(address, { ...choice, localityId: 'invented-city' }).locality.id, 'quezon-city');
});

test('cities that officially use 911 do not get duplicate or administrative numbers', () => {
  for (const address of ['Davao City, Philippines', 'Baguio City, Philippines', 'Alaminos City, Pangasinan', 'Legazpi City, Albay', 'Cagayan de Oro City, Misamis Oriental']) {
    const result = getEmergencyDirectory(address);
    assert.equal(result.locality.via911, true);
    assert.deepEqual(result.hotlines.map(item => item.dialNumber), ['911', '143']);
  }
});

test('every directory number has a source, review date and safe dial URI', () => {
  const all = [...NATIONAL_EMERGENCY_HOTLINES, ...EMERGENCY_LOCALITIES.flatMap(area => area.hotlines)];
  assert.equal(new Set(all.map(item => item.id)).size, all.length);
  for (const entry of all) {
    const url = new URL(entry.source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(url.hostname.endsWith('.gov.ph') || url.hostname === 'redcross.org.ph');
    assert.match(entry.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(entry.number.replace(/\D/g, ''), entry.dialNumber);
    assert.match(entry.dialNumber, /^(?:09\d{9}|0[2-8]\d{8}|911|143|122|161|137175|137135)$/);
    if (entry.extension) assert.match(entry.extension, /^\d{1,5}$/);
    assert.notEqual(entry.dialNumber, '09123456789', 'Do not import placeholder phone numbers from unfinished official pages');
    assert.equal(getEmergencyDialUrl(entry), `tel:${entry.dialNumber}`);
  }
  assert.throws(() => getEmergencyDialUrl({ id: 'ph-911', dialNumber: '911;1234' }));
  assert.throws(() => getEmergencyDialUrl({ id: 'unknown', dialNumber: '911' }));
});

function loadModule(relative, dependencies) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected module: ${name}`);
    return dependencies[name];
  } });
  return module.exports;
}

test('dialer handoff requires a user action, uses reviewed tel URLs and reports failures honestly', async () => {
  const opened = [];
  const alerts = [];
  let fail = false;
  const { openEmergencyDialer } = loadModule('../src/services/emergency-dialer.ts', {
    'react-native': { Linking: { async openURL(url) { if (fail) throw new Error('No phone app'); opened.push(url); } }, Alert: { alert: (...args) => alerts.push(args) } },
    '@/utils/emergency-directory': { getEmergencyDialUrl },
  });
  assert.equal(opened.length, 0, 'Importing the module must never place/open a call');
  await openEmergencyDialer(NATIONAL_EMERGENCY_HOTLINES[0]);
  assert.deepEqual(opened, ['tel:911']);
  fail = true;
  await openEmergencyDialer(NATIONAL_EMERGENCY_HOTLINES[1]);
  assert.equal(alerts.at(-1)[0], 'Open your phone app');
  assert.ok(alerts.at(-1)[1].includes('143'));
  await openEmergencyDialer({ ...NATIONAL_EMERGENCY_HOTLINES[0], dialNumber: '999999' });
  assert.equal(alerts.at(-1)[0], 'Hotline unavailable');
  assert.equal(opened.length, 1);
});

test('saved area changes are shared by screens and profile address edits refresh the match', () => {
  let profile = { guardian: { address: 'Quezon City, Philippines' }, contacts: [], child: {} };
  const { useEmergencyHotlines } = loadModule('../src/hooks/use-emergency-hotlines.ts', {
    '@/components/app-session': { useAppSession: () => ({ profile, updateProfile: next => { profile = next; } }) },
    '@/utils/emergency-directory': { getEmergencyDirectory },
  });
  assert.equal(useEmergencyHotlines().directory.locality.id, 'quezon-city');
  useEmergencyHotlines().changeArea(createEmergencyAreaChoice(profile.guardian.address, 'makati-city'));
  assert.equal(useEmergencyHotlines().directory.locality.id, 'makati-city');
  profile = { ...profile, guardian: { address: 'Pasig City, Philippines' } };
  assert.equal(useEmergencyHotlines().directory.locality.id, 'pasig-city');
  useEmergencyHotlines().changeArea(undefined);
  assert.equal(profile.emergencyArea, undefined);
  profile = { ...profile, guardian: { address: 'Quezon City Road, Pasig City', addressDetails: { localityCode: '1381300000' } } };
  assert.equal(useEmergencyHotlines().directory.locality.id, 'quezon-city');
  assert.equal(useEmergencyHotlines().localityCode, '1381300000');
  const point = { latitude: 14.7, longitude: 121.08, accuracyMeters: 12, capturedAt: new Date().toISOString() };
  profile.guardian.addressDetails.deviceLocation = point;
  assert.equal(useEmergencyHotlines().addressLocation, point);
  profile.guardian.addressDetails.confirmed = false;
  assert.equal(useEmergencyHotlines().addressLocation, point, 'Saved location does not depend on the removed checkbox');
});

test('all source-published carrier alternatives survive directory assembly and have separate dial actions', () => {
  const expected = [
    ['Quezon City', [['09478859929', 'Smart'], ['09770312892', 'Globe'], ['09478847498', 'Smart']]],
    ['Marikina City', [['09175842168', 'Globe'], ['09285593341', 'Smart'], ['09989970115', 'Smart'], ['09985796435', 'Smart']]],
    ['Cauayan City, Isabela', [['09171278785', 'Globe / TM'], ['09997275090', 'Smart'], ['09236765094', 'Sun']]],
    ['Muntinlupa City', [['09215427123', 'Smart'], ['09272579322', 'Globe'], ['0283735165', 'Landline']]],
    ['Naga City, Camarines Sur', [['09085253000', 'Smart'], ['09632209700', 'TNT']]],
    ['Ilagan City, Isabela', [['09152341124', 'Globe'], ['0786240203', 'PLDT']]],
    ['Digos City', [['09466957777', 'Smart / TNT']]],
    ['Bayugan City', [['09317218885', 'Smart'], ['09552148567', 'Globe']]],
  ];
  for (const [address, numbers] of expected) {
    const directory = getEmergencyDirectory(address);
    for (const [number, network] of numbers) {
      const entry = directory.hotlines.find(item => item.dialNumber === number);
      assert.ok(entry, `${address}: missing ${number}`);
      assert.equal(entry.network, network);
      assert.equal(getEmergencyDialUrl(entry), `tel:${number}`);
    }
    assert.equal(new Set(directory.hotlines.map(item => item.dialNumber)).size, directory.hotlines.length);
  }
});

test('fall directory excludes unrelated police and fire-only rows but retains documented rescue teams', () => {
  for (const group of LOCAL_CONTACT_SOURCE_GROUPS) {
    assert.ok(group.rows.length, `${group.source.name}: do not silently omit an entire provincial group`);
    for (const [name, service, number, province] of group.rows) {
      if (isFallRelevantService(service)) continue;
      const city = PHILIPPINE_CITIES.find(item => item.name === name && (!province || province === item.province));
      const digits = number.replace(/\D/g, '');
      // A historic fire row may also have a reviewed rescue role from a different source.
      const matching = city && getEmergencyDirectory('', createEmergencyAreaChoice('', city.id)).hotlines.filter(item => item.dialNumber === digits);
      assert.ok(matching && matching.every(item => !/Fire Station| Police$/.test(item.name)), `${name}: ${digits}`);
    }
  }
  for (const [city, number] of [['Bayugan City', '09317218885'], ['Iloilo City', '09660520061'], ['Olongapo City', '0472231415']]) {
    assert.ok(getEmergencyDirectory(city).hotlines.some(item => item.dialNumber === number), city);
  }
  assert.ok(getEmergencyDirectory('Bacolod City').hotlines.some(item => item.dialNumber === '09561976151'), 'Image-only Annex E emergency mobile must survive even though PDF text search misses it');
});

test('medical alternatives from full directories survive assembly with department extensions intact', () => {
  for (const [city, numbers] of [
    ['Cavite City', ['0464849600', '0468522967', '09269707556', '09178588263', '09190616584']],
    ['Mandaue City', ['0323831658', '09384765461', '0322339300', '0322539793']],
    ['Roxas City, Capiz', ['0365227878', '0365201086']],
    ['Ligao City', ['09297759604', '09356992804']],
    ['Panabo City', ['09302385937']],
    ['Bacolod City', ['09302434706', '09369401591', '0344323871', '0344323872', '0344323873']],
    ['Iloilo City', ['0333372741', '0333372749', '0333200315', '0333200319']],
  ]) {
    const directory = getEmergencyDirectory(city);
    for (const number of numbers) assert.ok(directory.hotlines.some(item => item.dialNumber === number), `${city}: ${number}`);
  }
  const sanJuan = getEmergencyDirectory('San Juan City').hotlines.filter(item => item.dialNumber === '137135');
  assert.deepEqual(sanJuan.map(item => item.extension), ['532', '160']);
  assert.equal(new Set(sanJuan.map(item => item.id)).size, 2);
  for (const entry of sanJuan) assert.equal(getEmergencyDialUrl(entry), 'tel:137135', 'Never append extension digits to the phone number');
  assert.equal(getEmergencyDirectory('Quezon City').hotlines.find(item => item.dialNumber === '0289884242').extension, '7245');
  assert.equal(getEmergencyDirectory('Mandaue City').hotlines.find(item => item.dialNumber === '0322533906').extension, '1051');
  assert.equal(getEmergencyDirectory('Makati City').hotlines.some(item => item.dialNumber === '09178588263'), false, 'Provincial rescue contacts must not leak outside their service area');
  for (const city of ['Iloilo City', 'Calamba City', 'Tabuk City']) {
    const hotlines = getEmergencyDirectory(city).hotlines;
    assert.ok(hotlines.findIndex(item => item.dialNumber === '911') < hotlines.findIndex(item => item.name.includes('Hospital — ')), city);
  }
});
