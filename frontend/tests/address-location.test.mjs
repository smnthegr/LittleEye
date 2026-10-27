import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { addresses, phoneAddresses } from './helpers/address-fixtures.mjs';

const transpile = file => ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const position = (changes = {}) => ({ coords: { latitude: 14.7, longitude: 121.08, accuracy: 12, ...changes }, timestamp: Date.now() });
function service(overrides = {}, platform = 'android') {
  const calls = [];
  const timers = new Map();
  let timerId = 0;
  const location = {
    Accuracy: { High: 'high' },
    hasServicesEnabledAsync: async () => { calls.push('services'); return true; },
    requestForegroundPermissionsAsync: async () => { calls.push('permission'); return { granted: true }; },
    getCurrentPositionAsync: async options => { calls.push(options); return position(); },
    reverseGeocodeAsync: async coordinates => { calls.push({ reverse: coordinates }); return [{ isoCountryCode: 'PH', country: 'Philippines',
      streetNumber: '42', street: 'Rivera Street', district: 'Commonwealth', city: 'Quezon City', region: 'Metro Manila' }]; },
    ...overrides,
  };
  const module = { exports: {} };
  vm.runInNewContext(transpile('../src/services/address-location.ts'), { module, exports: module.exports, Error,
    setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id),
    require(name) {
      if (name === 'expo-location') return location;
      if (name === 'react-native') return { Platform: { OS: platform } };
      if (name === '@/utils/phone-address') return phoneAddresses;
      throw new Error(name);
    },
  });
  return { request: module.exports.requestAddressLocation, calls, timers };
}
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

test('GPS requests permission only on explicit use, asks for fresh high accuracy and preserves measured uncertainty', async () => {
  const h = service();
  assert.equal(h.calls.length, 0);
  const found = await h.request(new AbortController().signal);
  const fix = found.deviceLocation;
  assert.equal(h.calls[0], 'services'); assert.equal(h.calls[1], 'permission');
  assert.equal(h.calls[2].accuracy, 'high');
  assert.equal(fix.accuracyMeters, 12); assert.equal(fix.latitude, 14.7); assert.equal(fix.longitude, 121.08);
  assert.ok(Number.isFinite(Date.parse(fix.capturedAt)));
  assert.equal(h.timers.size, 0);
  assert.equal(h.calls[3].reverse.latitude, fix.latitude);
  assert.equal(found.address.source, 'phone');
  assert.match(found.address.street, /^42 Rivera Street, Commonwealth, Quezon City/);
  assert.equal(addresses.isCompletePhilippineAddress(found.address), true);
  assert.equal(found.address.confirmed, false, 'Autofill does not fabricate explicit confirmation');
});

test('native address autofill never invents a street from a nearby placemark and retains GPS when lookup is unavailable', async () => {
  const partial = service({ reverseGeocodeAsync: async () => [{ isoCountryCode: 'PH', name: 'Nearby mall', city: 'Quezon City', region: 'Metro Manila' }] });
  const found = await partial.request(new AbortController().signal);
  assert.equal(found.address.street, 'Quezon City, Metro Manila, Philippines');
  assert.equal(found.address.addressLevel, 'area');
  assert.equal(addresses.isCompletePhilippineAddress({ ...found.address, confirmed: true }), false);
  assert.match(found.notice, /Street unavailable/);
  const unavailable = service({ reverseGeocodeAsync: async () => { throw new Error('Offline'); } });
  const result = await unavailable.request(new AbortController().signal);
  assert.equal(result.address, undefined); assert.equal(result.deviceLocation.latitude, 14.7);
  assert.match(result.notice, /Address unavailable/);
  const foreign = service({ reverseGeocodeAsync: async () => [{ isoCountryCode: 'SG', city: 'Singapore' }] });
  await assert.rejects(foreign.request(new AbortController().signal), /outside the Philippines/);
  const web = service({}, 'web');
  const browser = await web.request(new AbortController().signal);
  assert.equal(web.calls.length, 3); assert.equal(browser.address, undefined);
});

test('cancelling address resolution cannot apply a late autofill result', async () => {
  let finish;
  const h = service({ reverseGeocodeAsync: () => new Promise(resolve => { finish = resolve; }) });
  const controller = new AbortController();
  const request = h.request(controller.signal);
  for (let i = 0; i < 25; i++) await Promise.resolve();
  assert.equal(typeof finish, 'function'); controller.abort();
  await assert.rejects(request, /cancelled/);
  finish([{ isoCountryCode: 'PH', street: 'Late Street', city: 'Manila' }]);
  await settle(); assert.equal(h.timers.size, 0);
});

test('denied permission, disabled services, coarse or stale fixes never produce a saved location', async () => {
  const disabled = service({ hasServicesEnabledAsync: async () => false });
  await assert.rejects(disabled.request(new AbortController().signal), /Turn on location/);
  assert.equal(disabled.calls.length, 0, 'Must not ask permission or request coordinates when services are off');
  for (const canAskAgain of [true, false]) {
    const h = service({ requestForegroundPermissionsAsync: async () => ({ granted: false, canAskAgain }) });
    await assert.rejects(h.request(new AbortController().signal), canAskAgain ? /Allow location/ : /Settings/);
    assert.equal(h.calls.length, 1, 'GPS cannot run after permission is refused');
  }
  for (const details of [{ android: { accuracy: 'coarse' } }, { ios: { accuracy: 'reduced' } }]) {
    const h = service({ requestForegroundPermissionsAsync: async () => ({ granted: true, ...details }) });
    await assert.rejects(h.request(new AbortController().signal), /Enable precise location/);
    assert.equal(h.calls.length, 1);
  }
  for (const data of [position({ accuracy: null }), position({ accuracy: 800 }), position({ latitude: NaN }),
    { ...position(), timestamp: Date.now() - 180_000 }, { ...position(), timestamp: Date.now() + 60_000 }]) {
    const h = service({ getCurrentPositionAsync: async () => data });
    await assert.rejects(h.request(new AbortController().signal));
    assert.equal(h.timers.size, 0);
  }
});

test('cancel during permission and GPS timeout discard late native responses', async () => {
  let grant;
  const permission = new Promise(resolve => { grant = resolve; });
  const h = service({ requestForegroundPermissionsAsync: () => permission });
  const controller = new AbortController();
  const cancelled = h.request(controller.signal);
  await settle(); controller.abort(); grant({ granted: true });
  await assert.rejects(cancelled, /cancelled/); assert.equal(h.calls.length, 1);
  let finish;
  const timeout = service({ getCurrentPositionAsync: () => new Promise(resolve => { finish = resolve; }) });
  const pending = timeout.request(new AbortController().signal);
  await settle(); for (const fn of [...timeout.timers.values()]) fn();
  await assert.rejects(pending, /timed out/);
  finish(position()); await settle(); assert.equal(timeout.timers.size, 0);
});

test('location hook blocks duplicate requests, survives close/reopen and ignores late results after cancel or unmount', async () => {
  let cursor = 0;
  let mounted = true;
  let lateWrites = 0;
  const slots = [];
  const requests = [];
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { if (!mounted) lateWrites++; slots[i] = value; }]; },
    useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i]; },
    useCallback(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((v, j) => v !== slots[i].deps[j])) slots[i] = { deps, fn }; return slots[i].fn; },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((v, j) => v !== slots[i].deps[j])) { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; } },
  };
  const module = { exports: {} };
  vm.runInNewContext(transpile('../src/hooks/use-address-location.ts'), { module, exports: module.exports, AbortController,
    require(name) {
      if (name === 'react') return react;
      if (name === '@/services/address-location') return { requestAddressLocation: signal => new Promise((resolve, reject) => { requests.push({ signal, resolve, reject }); }) };
      throw new Error(name);
    },
  });
  const render = (enabled = true) => { cursor = 0; return module.exports.useAddressLocation(enabled); };
  const first = render().locate();
  assert.equal(await render().locate(), null); assert.equal(requests.length, 1);
  render().cancel(); requests[0].resolve(position()); assert.equal(await first, null);
  const second = render().locate(); render(false); render(true);
  assert.equal(render().locating, false, 'Closing and reopening cannot leave the button stuck');
  requests[1].resolve(position()); assert.equal(await second, null);
  const third = render().locate();
  for (const slot of slots) slot?.cleanup?.(); mounted = false;
  requests[2].resolve(position()); assert.equal(await third, null); assert.equal(lateWrites, 0);
});
