import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { addresses } from './helpers/address-fixtures.mjs';
import { createPlaceSearchCache } from '../src/utils/place-search-cache.ts';

// Synthetic response fixtures exercise parsing; the app never ships sample suggestions.
const feature = (properties = {}, coordinates = [121.08, 14.7]) => ({
  geometry: { type: 'Point', coordinates }, properties: {
    countrycode: 'PH', osm_type: 'N', osm_id: 1234, osm_key: 'amenity', osm_value: 'cafe',
    name: 'Sample cafe', street: 'Main Street', district: 'Commonwealth', city: 'Quezon City', state: 'Metro Manila', ...properties,
  },
});
function loadService(fetch, env = {}) {
  const placeSearchCache = createPlaceSearchCache();
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/services/place-search.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { module, exports: module.exports, fetch, URL, AbortController, setTimeout, clearTimeout, process: { env },
    require(name) {
      if (name === '../utils/philippine-address') return addresses;
      if (name === '../utils/place-search-cache') return { placeSearchCache, clearPlaceSearchCache: () => placeSearchCache.clear() };
      throw new Error(name);
    },
  });
  return module.exports;
}

test('OSM parsing keeps Philippine landmarks, removes duplicates, foreign results, broad cities and bad coordinates', () => {
  const { parsePlaceSuggestions } = loadService(() => { throw new Error('No live calls in tests'); });
  const results = parsePlaceSuggestions({ features: [feature(), feature(), feature({ countrycode: 'US', osm_id: 5 }),
    feature({ osm_key: 'place', osm_value: 'city', osm_id: 6 }), feature({}, [121, NaN]), feature({ osm_id: 'not-an-id' }),
    feature({ city: '', county: '', state: '', osm_id: 7 }), feature({ osm_type: 'R', osm_id: 8, name: 'Second landmark' })] });
  assert.equal(results.length, 2);
  assert.equal(results[0].selection.countryCode, 'PH'); assert.equal(results[0].selection.localityCode, '1381300000');
  assert.equal(results[0].selection.latitude, 14.7); assert.equal(results[0].selection.longitude, 121.08);
  assert.equal(addresses.isCompletePhilippineAddress(results[0].selection), true, 'A valid selection can be saved without a checkbox');
  assert.equal(results[0].selection.confirmed, false, 'Validation does not invent explicit confirmation');
  assert.equal(results[1].id, 'R/8');
});

test('TomTom parses Philippine street results and replaces Photon when its preview key is configured', async () => {
  const calls = [];
  const result = { type: 'Street', id: 'synthetic-street-id', position: { lat: 14.7, lon: 121.08 }, address: {
    countryCode: 'PH', streetName: 'Rivera Street', municipality: 'Quezon City', countrySubdivision: 'Metro Manila',
    freeformAddress: 'Rivera Street, Quezon City, Metro Manila',
  } };
  const service = loadService(async url => { calls.push(new URL(url)); return { ok: true, json: async () => ({ results: [result] }) }; }, { EXPO_PUBLIC_TOMTOM_API_KEY: 'synthetic-test-key' });
  const parsed = service.parseTomTomSuggestions({ results: [result, result, { ...result, type: 'Geography' },
    { ...result, id: 'foreign', address: { countryCode: 'US' } }, { ...result, id: 'invalid-point', position: { lat: NaN, lon: 121 } }] });
  assert.equal(parsed.length, 1); assert.equal(parsed[0].selection.source, 'tomtom');
  assert.equal(parsed[0].selection.localityCode, '1381300000');
  assert.equal(addresses.isCompletePhilippineAddress({ ...parsed[0].selection, confirmed: true }), true);
  await service.searchPlaces('Rivera Street / Quezon City', new AbortController().signal);
  assert.equal(calls[0].hostname, 'api.tomtom.com');
  assert.equal(calls[0].searchParams.get('countrySet'), 'PH');
  assert.equal(calls[0].searchParams.get('typeahead'), 'true');
  assert.ok(calls[0].pathname.includes('%2F'));
  assert.equal(calls[0].searchParams.get('key'), 'synthetic-test-key');
});

test('provider city names require province disambiguation rather than preferring a same-name municipality', () => {
  const resolve = (city, province) => addresses.resolvePlaceLocality([
    { longText: city, types: ['locality'] }, { longText: province, types: ['administrative_area_level_1'] },
  ]);
  assert.equal(resolve('Naga', ''), '');
  assert.equal(addresses.getAddressLocality(resolve('Naga', 'Cebu')).province, 'Cebu');
  assert.equal(addresses.getAddressLocality(resolve('Naga', 'Camarines Sur')).province, 'Camarines Sur');
  assert.equal(resolve('Quezon City', 'Metro Manila'), '1381300000');
});

test('Photon requests filter to PH, encode the query, cache repeats, and recover from a failed request', async () => {
  const calls = [];
  let fail = true;
  const service = loadService(async (url, options) => {
    calls.push({ url: new URL(url), options });
    if (fail) { fail = false; return { ok: false }; }
    return { ok: true, json: async () => ({ features: [feature()] }) };
  });
  const signal = new AbortController().signal;
  await assert.rejects(service.searchPlaces('Cafe & Main, Quezon City', signal));
  const results = await service.searchPlaces('Cafe & Main, Quezon City', signal);
  assert.equal(results.length, 1);
  assert.equal(calls[0].url.searchParams.get('countrycode'), 'PH');
  assert.equal(calls[0].url.searchParams.get('q'), 'Cafe & Main, Quezon City');
  assert.equal(calls[0].url.origin, 'https://photon.komoot.io');
  await service.searchPlaces('Cafe & Main, Quezon City', signal); assert.equal(calls.length, 2);
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(service.searchPlaces('Another cafe', cancelled.signal));
  await service.searchPlaces('Ca', signal); assert.equal(calls.length, 2);
});

function hookHarness() {
  let cursor = 0;
  let mounted = true;
  let lateWrites = 0;
  let nextTimer = 0;
  const timers = new Map();
  const slots = [];
  const requests = [];
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { if (!mounted) lateWrites++; slots[i] = value; }]; },
    useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i]; },
    useCallback(fn) { const i = cursor++; slots[i] ??= fn; return slots[i]; },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || deps.some((value, index) => value !== slots[i].deps[index])) {
        slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() };
      }
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/hooks/use-place-search.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { module, exports: module.exports, AbortController,
    setTimeout: fn => { const id = ++nextTimer; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id),
    require(name) {
      if (name === 'react') return react;
      if (name === '@/services/place-search') return { searchPlaces: (query, signal) => new Promise((resolve, reject) => { requests.push({ query, signal, resolve, reject }); }) };
      throw new Error(name);
    },
  });
  const render = (query, active = true) => { cursor = 0; return module.exports.usePlaceSearch(query, active); };
  return { render, requests, timers, get lateWrites() { return lateWrites; },
    fire() { for (const [id, fn] of [...timers]) { timers.delete(id); fn(); } },
    unmount() { for (const slot of slots) slot?.cleanup?.(); mounted = false; },
  };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

test('clearing address searches drops cached entries and prevents old requests from repopulating them', async () => {
  let finish, entered;
  const started = new Promise(resolve => { entered = resolve; });
  const response = new Promise(resolve => { finish = resolve; });
  let calls = 0;
  const service = loadService(async () => {
    calls++;
    if (calls === 1) { entered(); return response; }
    return { ok: true, json: async () => ({ features: [feature()] }) };
  });
  const signal = new AbortController().signal;
  const oldRequest = service.searchPlaces('QA cafe, Quezon City', signal);
  await started;
  service.clearPlaceSearchCache();
  finish({ ok: true, json: async () => ({ features: [feature()] }) });
  await oldRequest;
  await service.searchPlaces('QA cafe, Quezon City', signal);
  assert.equal(calls, 2, 'late results from the old session cannot refill the cache');
  await service.searchPlaces('QA cafe, Quezon City', signal);
  assert.equal(calls, 2, 'current-session repeats still use the cache');
  service.clearPlaceSearchCache();
  await service.searchPlaces('QA cafe, Quezon City', signal);
  assert.equal(calls, 3, 'logout also removes completed searches');
});

test('rapid typing cancels queued searches and late responses cannot replace newer suggestions', async () => {
  const h = hookHarness();
  h.render('Riz'); h.render('Rizal'); h.render('Rizal Park');
  assert.equal(h.timers.size, 1); h.fire(); assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].query, 'Rizal Park');
  h.render('Intramuros'); h.fire(); assert.equal(h.requests[0].signal.aborted, true);
  h.requests[0].resolve([{ id: 'old' }]); await settle();
  assert.equal(h.render('Intramuros').suggestions.length, 0);
  h.requests[1].resolve([{ id: 'new' }]); await settle();
  assert.equal(h.render('Intramuros').suggestions[0].id, 'new');
  h.unmount();
});

test('selection, hiding a form and unmounting invalidate pending requests; network errors leave manual input usable', async () => {
  const h = hookHarness();
  h.render('Sample cafe'); h.fire();
  h.render('Sample cafe').cancel();
  h.requests[0].resolve([{ id: 'cancelled' }]); await settle();
  assert.equal(h.render('Sample cafe').suggestions.length, 0);
  h.render('Another place'); h.fire(); h.requests[1].reject(new Error('Offline')); await settle();
  assert.equal(h.render('Another place').status, 'error');
  h.render('Another place', false); assert.equal(h.requests[1].signal.aborted, true);
  h.render('Latest place'); h.fire(); h.unmount();
  h.requests[2].resolve([{ id: 'after-unmount' }]); await settle();
  assert.equal(h.lateWrites, 0);
});
