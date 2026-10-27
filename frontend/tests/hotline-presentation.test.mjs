import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const sourceRoot = new URL('../src/', import.meta.url).href;
const hook = registerHooks({ resolve(specifier, context, next) {
  return next(context.parentURL?.startsWith(sourceRoot) && specifier.startsWith('.') && !specifier.endsWith('.ts') ? `${specifier}.ts` : specifier, context);
} });
const constants = await import('../src/constants/emergency-hotlines.ts');
const directory = await import('../src/utils/emergency-directory.ts');
const presentation = await import('../src/utils/hotline-presentation.ts');
const networks = await import('../src/utils/hotline-network.ts');
hook.deregister();

test('Bacolod keeps dispatch, Red Cross and the rescue shortcode visible while repeated numbers and hospital contacts remain available', () => {
  const hotlines = directory.getEmergencyDirectory('Bacolod City').hotlines;
  const result = presentation.getHotlinePresentation(hotlines);
  const dispatch = result.visible.find(group => group.name === 'Bacolod City Rescue / Disaster Response');
  assert.deepEqual(dispatch.hotlines.map(item => item.dialNumber), ['09302434706', '09369401591', '0344323871']);
  assert.ok(dispatch.hotlines.every(item => item.source.url === 'https://servicesdirectory.bacolodcity.gov.ph/?page_id=204'));
  assert.ok(result.additional.some(group => group.hotlines.some(item => item.dialNumber === '09561976151')));
  for (const number of ['911', '143', '161', '0344457826', '09202163069', '09951281588']) {
    assert.ok(result.visible.some(group => group.hotlines.some(item => item.dialNumber === number)), number);
  }
  assert.ok(result.additional.some(group => /Hospital/.test(group.name)));
  assert.equal(result.additional.some(group => group.hotlines.some(item => item.dialNumber === '143')), false);
});

test('every city retains national contacts, essential service groups and a lossless backup directory without a primary service', () => {
  for (const area of constants.EMERGENCY_LOCALITIES) {
    const input = [...area.hotlines, ...constants.NATIONAL_EMERGENCY_HOTLINES];
    const before = JSON.stringify(input);
    const result = presentation.getHotlinePresentation(input);
    const visible = result.visible.flatMap(group => group.hotlines);
    assert.ok(visible.some(item => item.dialNumber === '911'));
    assert.ok(visible.some(item => item.dialNumber === '143'));
    assert.ok(visible.every(item => !constants.isGeneralMedicalContact(item)));
    assert.equal(result.primary, undefined);
    const all = [...visible, ...result.additional.flatMap(group => group.hotlines)];
    assert.deepEqual(all.map(item => item.id).sort(), input.map(item => item.id).sort(), area.name);
    assert.equal(new Set(all.map(item => item.id)).size, all.length);
    assert.equal(JSON.stringify(input), before, 'Presentation must not mutate the reviewed directory');
  }
  for (const city of ['Davao City', 'Calamba City', 'Valenzuela City']) {
    const visible = presentation.getHotlinePresentation(directory.getEmergencyDirectory(city).hotlines).visible;
    assert.ok(visible.every(group => group.hotlines.every(item => item.area === 'Philippines')), city);
  }
});

test('each visible service preserves source-published brand alternatives and puts repeated same-network numbers in backups', () => {
  for (const [city, expected] of [
    ['Naga City, Camarines Sur', ['Smart', 'TNT', 'Landline']],
    ['Cauayan City, Isabela', ['Globe / TM', 'Smart', 'Sun']],
    ['Bayugan City', ['Smart', 'Globe']],
    ['Marikina City', ['Globe', 'Smart', 'Landline']],
  ]) {
    const result = presentation.getHotlinePresentation(directory.getEmergencyDirectory(city).hotlines);
    const service = result.visible.find(group => group.hotlines[0].area !== 'Philippines');
    assert.deepEqual(service.hotlines.map(networks.getHotlineNetworkLabel), expected, city);
  }
  const marikina = presentation.getHotlinePresentation(directory.getEmergencyDirectory('Marikina City').hotlines);
  assert.ok(marikina.additional.some(group => group.hotlines.some(item => item.dialNumber === '09989970115')));
});

test('QC 122, EOC network alternatives and direct EMS remain visible, along with other cities’ citywide emergency services', () => {
  const visibleFor = city => presentation.getHotlinePresentation(directory.getEmergencyDirectory(city).hotlines).visible.flatMap(group => group.hotlines);
  const qc = visibleFor('Quezon City');
  for (const number of ['122', '09478859929', '09770312892', '09478847498', '0289284396', '911', '143']) {
    assert.ok(qc.some(item => item.dialNumber === number), number);
  }
  for (const [city, number] of [['Muntinlupa City', '137175'], ['Imus City', '0468889911'], ['Taguig City', '0287893200'], ['San Juan City', '137135'], ['Pasig City', '09513357000']]) {
    assert.ok(visibleFor(city).some(item => item.dialNumber === number), `${city}: ${number}`);
  }
  assert.deepEqual(visibleFor('San Juan City').filter(item => item.dialNumber === '137135').map(item => item.extension).sort(), ['160', '532']);
  const olongapo = presentation.getHotlinePresentation(directory.getEmergencyDirectory('Olongapo City').hotlines);
  assert.ok(olongapo.additional.some(group => /New Cabalan/.test(group.name)), 'Neighbourhood alternatives do not flood the citywide list');
});

// Small renderer for the production components; keep hook slots per keyed
// component so disclosure resets and actual button handoffs can be exercised.
function harness() {
  const slots = new Map();
  let active, cursor;
  const calls = [];
  const react = {
    useState(initial) {
      const values = slots.get(active);
      const index = cursor++;
      if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial;
      return [values[index], value => { values[index] = typeof value === 'function' ? value(values[index]) : value; }];
    },
    useRef(initial) {
      const values = slots.get(active);
      const index = cursor++;
      return values[index] ??= { current: initial };
    },
  };
  const native = Object.fromEntries(['View', 'Text', 'Pressable', 'TextInput', 'FlatList', 'Modal', 'KeyboardAvoidingView'].map(name => [name, name]));
  native.StyleSheet = { create: value => value, absoluteFill: {} };
  native.Platform = { OS: 'ios' };
  native.Keyboard = { dismiss() {} };
  function load(relative) {
    const module = { exports: {} };
    const code = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'react-native') return native;
      if (name === './glow-button') return { GlowButton: 'GlowButton' };
      if (name === '@/constants/emergency-hotlines') return constants;
      if (name === '@/utils/emergency-directory') return directory;
      if (name === '@/utils/hotline-presentation') return presentation;
      if (name === '@/utils/hotline-network') return networks;
      if (name === '@/constants/brand') return { BrandColors: {}, BrandFonts: {} };
      if (name === '@/hooks/use-responsive-layout') return { useResponsiveStyles: value => value, useResponsiveLayout: () => ({ scaleSize: value => value }) };
      if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
      if (name === '@/services/emergency-dialer') return { openHotlineSource() {}, openEmergencyDialer: async hotline => calls.push(directory.getEmergencyDialUrl(hotline)) };
      throw new Error(`Unexpected module: ${name}`);
    } });
    return module.exports;
  }
  const List = load('../src/components/emergency-hotline-list.tsx').EmergencyHotlineList;
  const Area = load('../src/components/emergency-area-card.tsx').EmergencyAreaCard;
  function renderNode(element, path = 'root') {
    if (Array.isArray(element)) return element.flatMap((item, index) => renderNode(item, `${path}/${item?.key ?? index}`));
    if (!element?.props) return element;
    const key = `${path}:${element.key ?? ''}`;
    if (typeof element.type === 'function') {
      active = key;
      cursor = 0;
      if (!slots.has(key)) slots.set(key, []);
      return renderNode(element.type(element.props), `${key}/${element.type.name}`);
    }
    return { ...element, props: { ...element.props, children: renderNode(element.props.children, key) } };
  }
  return { calls, list: props => renderNode({ type: List, props }), area: props => renderNode({ type: Area, props }) };
}
function nodes(tree) {
  return Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children)] : [];
}
function text(tree) {
  return Array.isArray(tree) ? tree.map(text).join(' ') : tree?.props ? text(tree.props.children) : tree == null || typeof tree === 'boolean' ? '' : String(tree);
}
function disclosure(tree) { return nodes(tree).find(item => item.type === 'Pressable' && item.props.accessibilityState?.expanded !== undefined); }

test('actual grouped call cards start compact, expand/collapse without calling, preserve backups and reset on city change', async () => {
  const h = harness();
  let props = { hotlines: directory.getEmergencyDirectory('Bacolod City').hotlines };
  let tree = h.list(props);
  assert.equal(disclosure(tree).props.accessibilityState.expanded, false);
  const visibleNumbers = presentation.getHotlinePresentation(props.hotlines).visible.flatMap(group => group.hotlines.map(item => item.number));
  const actions = nodes(tree).filter(item => item.type === 'GlowButton');
  assert.equal(actions.length, visibleNumbers.length);
  for (const number of visibleNumbers) assert.ok(actions.some(item => item.props.accessibilityLabel.includes(number)), number);
  assert.doesNotMatch(text(tree), /Corazon Locsin/);
  disclosure(tree).props.onPress();
  tree = h.list(props);
  assert.match(text(tree), /Corazon Locsin/);
  assert.equal(h.calls.length, 0);
  const backupCall = nodes(tree).find(item => item.type === 'GlowButton' && item.props.accessibilityLabel.includes('0956 197 6151'));
  await backupCall.props.onPress();
  assert.deepEqual(h.calls, ['tel:09561976151']);
  disclosure(tree).props.onPress();
  assert.equal(disclosure(h.list(props)).props.accessibilityState.expanded, false);
  disclosure(h.list(props)).props.onPress();
  props = { hotlines: directory.getEmergencyDirectory('Quezon City').hotlines };
  assert.equal(disclosure(h.list(props)).props.accessibilityState.expanded, false);
});

test('Setup/Profile/SOS previews use the same shortlist and disclosure, while Services can show only the area picker', () => {
  const h = harness();
  const props = { address: 'Bacolod City', compact: true };
  let tree = h.area(props);
  assert.match(text(tree), /0930 243 4706/);
  assert.match(text(tree), /Red Cross/);
  assert.match(text(tree), /143/);
  assert.doesNotMatch(text(tree), /Corazon Locsin/);
  disclosure(tree).props.onPress();
  assert.match(text(h.area(props)), /Corazon Locsin/);
  assert.equal(h.calls.length, 0);
  tree = h.area({ ...props, address: 'Quezon City' });
  assert.equal(disclosure(tree).props.accessibilityState.expanded, false);
  const areaOnly = h.area({ ...props, showHotlines: false });
  assert.equal(disclosure(areaOnly), undefined);
  assert.doesNotMatch(text(areaOnly), /0930 243 4706/);
});

test('legacy deep links reveal a selected backup instead of hiding the requested number', () => {
  const h = harness();
  const tree = h.list({ hotlines: directory.getEmergencyDirectory('Bacolod City').hotlines, selectedNumber: '09561976151' });
  assert.equal(disclosure(tree).props.accessibilityState.expanded, true);
  assert.ok(nodes(tree).some(item => item.type === 'GlowButton' && item.props.accessibilityLabel.includes('0956 197 6151')));
  assert.equal(h.calls.length, 0);
});

test('national services use the same number styling as local services and remain callable without a primary badge', async () => {
  const h = harness();
  const tree = h.list({ hotlines: directory.getEmergencyDirectory('Davao City').hotlines });
  const actions = nodes(tree).filter(item => item.type === 'GlowButton');
  assert.equal(actions.length, 2);
  assert.equal(disclosure(tree), undefined);
  assert.match(text(tree), /Philippine Red Cross/);
  assert.doesNotMatch(text(tree), /EMERGENCY|PRIMARY/);
  const qcTree = h.list({ hotlines: directory.getEmergencyDirectory('Quezon City').hotlines });
  const numberStyle = number => nodes(qcTree).find(item => item.type === 'Text' && item.props.selectable && text(item) === number).props.style;
  assert.deepEqual(numberStyle('911'), numberStyle('122'));
  assert.deepEqual(numberStyle('143'), numberStyle('0947 885 9929'));
  const preview = h.area({ address: 'Quezon City', compact: true });
  const previewStyle = number => nodes(preview).find(item => item.type === 'Text' && item.props.selectable && text(item).trim() === number).props.style;
  assert.deepEqual(previewStyle('911'), previewStyle('122'));
  assert.deepEqual(previewStyle('143'), previewStyle('0977 031 2892'));
  for (const action of actions) await action.props.onPress();
  assert.deepEqual(h.calls, ['tel:911', 'tel:143']);
});
