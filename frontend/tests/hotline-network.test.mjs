import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

const sourceRoot = new URL('../src/', import.meta.url).href;
const resolution = registerHooks({ resolve(specifier, context, next) {
  return next(context.parentURL?.startsWith(sourceRoot) && specifier.startsWith('.') && !specifier.endsWith('.ts')
    ? `${specifier}.ts` : specifier, context);
} });
const { inferMobileCarrier, inferMobileBrand, getHotlineNetworkLabel } = await import('../src/utils/hotline-network.ts');
const { EMERGENCY_LOCALITIES, NATIONAL_EMERGENCY_HOTLINES } = await import('../src/constants/emergency-hotlines.ts');
resolution.deregister();

test('carrier inference supports domestic and international PH formats and uses the most specific prefix', () => {
  for (const [phone, expected] of [
    ['0917 123 4567', 'Globe'], ['+63 917 123 4567', 'Globe'], ['639171234567', 'Globe'],
    ['(0919) 123-4567', 'Smart'], ['0926 123 4567', 'Globe'], ['0930 123 4567', 'Smart'],
    ['0935 123 4567', 'Globe'], ['0945 123 4567', 'Globe'], ['0951 123 4567', 'Smart'],
    ['0962 123 4567', 'Smart'], ['0966 123 4567', 'Globe'], ['0991 123 4567', 'DITO'],
    ['0898 123 4567', 'DITO'], ['+63 817 123 4567', 'Globe'],
  ]) assert.equal(inferMobileCarrier(phone), expected, phone);
  for (const phone of ['911', '122', '143', '137175', '(02) 8643 0000', '+1 917 123 4567',
    '0917123456', '091712345678', '09901234567', 'call 09171234567', '09171234567;123']) {
    assert.equal(inferMobileCarrier(phone), undefined, phone);
  }
});

test('published carrier labels override prefix inference without rewriting directory data', () => {
  const published = Object.freeze({ network: 'Globe', dialNumber: '09191234567' });
  assert.equal(getHotlineNetworkLabel(published), 'Globe', 'A source may describe a ported number');
  assert.equal(getHotlineNetworkLabel({ network: 'Sun', dialNumber: '09231234567' }), 'Sun');
  assert.equal(getHotlineNetworkLabel({ dialNumber: '09191234567' }), 'TNT');
  assert.equal(getHotlineNetworkLabel({ dialNumber: '09171234567' }), 'Globe');
  assert.equal(getHotlineNetworkLabel({ dialNumber: '09911234567' }), 'DITO');
  assert.equal(getHotlineNetworkLabel({ dialNumber: '09901234567' }), 'Mobile');
  assert.equal(getHotlineNetworkLabel({ dialNumber: '0286430000' }), 'Landline');
  assert.equal(published.network, 'Globe');
  const naga = EMERGENCY_LOCALITIES.find(city => city.name === 'Naga City' && city.province === 'Camarines Sur');
  const comcen = naga.hotlines.find(hotline => hotline.dialNumber === '09632209700');
  assert.equal(comcen.network, 'TNT', 'Store the brand explicitly published by Naga COMCEN');
  assert.equal(comcen.source.url, 'https://www2.naga.gov.ph/');
  assert.equal(inferMobileBrand(comcen.dialNumber), 'Smart', 'This prefix fallback cannot identify the source-published brand');
  assert.equal(getHotlineNetworkLabel(comcen), 'TNT', 'Both directory cards and previews must use the source label over inference');
  for (const hotline of NATIONAL_EMERGENCY_HOTLINES) assert.equal(getHotlineNetworkLabel(hotline), undefined);
});

test('every bundled mobile hotline gains a label while published labels and dial numbers stay unchanged', () => {
  for (const hotline of EMERGENCY_LOCALITIES.flatMap(city => city.hotlines)) {
    const before = JSON.stringify(hotline);
    const label = getHotlineNetworkLabel(hotline);
    if (hotline.network) assert.equal(label, hotline.network);
    else if (/^09\d{9}$/.test(hotline.dialNumber)) {
      assert.ok(label);
      assert.ok(!label.includes('prefix'));
      assert.ok(label.split(' / ').every(brand => ['Smart', 'TNT', 'Globe', 'TM', 'GOMO', 'DITO', 'Sun'].includes(brand)), hotline.number);
    }
    else if (/^0[2-8]\d{8}$/.test(hotline.dialNumber)) assert.equal(label, 'Landline');
    assert.equal(JSON.stringify(hotline), before);
  }
});

test('brand labels distinguish supported brands, retain shared ranges, and respect newer carrier allocations', () => {
  for (const [phone, expected] of [
    ['09081234567', 'Smart'], ['09071234567', 'TNT'], ['+63 918 123 4567', 'Smart / TNT'],
    ['09171234567', 'Globe'], ['09531234567', 'TM'], ['09561234567', 'Globe / TM'],
    ['09761234567', 'GOMO'], ['09911234567', 'DITO'], ['09221234567', 'Smart / Sun'],
    ['09241234567', 'DITO'], ['09341234567', 'DITO'], ['09441234567', 'DITO'],
  ]) assert.equal(inferMobileBrand(phone), expected, phone);
  assert.equal(inferMobileBrand('911'), undefined);
});
