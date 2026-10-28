import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as validation from '../src/utils/contact-validation.ts';
import { addresses, qcAddress } from './helpers/address-fixtures.mjs';
import { validCameraAddress } from '../src/constants/camera.ts';
import { createEmptyProfile } from '../src/utils/profile.ts';

const require = createRequire(import.meta.url);
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children)] : [];
const text = tree => Array.isArray(tree) ? tree.map(text).join('') : typeof tree === 'string' ? tree : tree?.props ? text(tree.props.children) : '';

// Run real submit handlers with input changes and observable navigation/session writes.
function form(relative, props = {}, initialSession) {
  let cursor = 0;
  const slots = [];
  const writes = [];
  const routes = [];
  let onFocus;
  const session = initialSession ?? {
    signedIn: true, accepted: true, camera: { name: 'Camera' },
    profile: { guardian: { fullName: 'Guardian', phone: '09171234567', email: 'guardian@example.com', address: 'Quezon City' },
      child: { fullName: 'Child', birthdate: '01/01/2024', height: '90', sex: 'Female' }, contacts: [] },
    enterPreview(profile) { writes.push(profile); },
    updateProfile(profile) { writes.push(profile); session.profile = profile; },
    updateContacts(contacts) { session.updateProfile({ ...(session.profile ?? createEmptyProfile()), contacts }); },
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; slots[index] ??= { current: initial }; return slots[index]; },
    useMemo: fn => fn(), useCallback: fn => fn, useEffect() {},
  };
  const module = { exports: {} };
  const nativeComponents = new Proxy({}, { get: (_, name) => name });
  const code = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, __DEV__: false,
    requestAnimationFrame: callback => callback(), cancelAnimationFrame() {},
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === '@/utils/contact-validation') return validation;
      if (name === '@/utils/philippine-address') return addresses;
      if (name === '@/constants/camera') return { validCameraAddress };
      if (name === 'expo-router') return { Redirect: 'Redirect', useFocusEffect(callback) { onFocus = callback; }, useLocalSearchParams: () => ({}), router: {
        push: route => routes.push(route), replace: route => routes.push(route), canGoBack: () => false, back() {},
      } };
      if (name.endsWith('app-session')) return { useAppSession: () => session };
      if (name === '@/utils/preview-profile') return { getMockSignInProfile: () => null };
      if (name === '@/hooks/use-settings-camera') return { useSettingsCamera: () => ({ camera: session.camera, isPreview: false }) };
      if (name === '@/components/mascot-images') return { useMascotImages: () => ({}) };
      if (name === '@/hooks/use-responsive-layout') return {
        useResponsiveLayout: () => ({ pageWidth: 390, height: 844, fontScale: 1, scaleSize: x => x, insets: { top: 0, bottom: 0, left: 0, right: 0 } }),
        useResponsiveStyles: value => value,
      };
      if (name === '@/utils/responsive') return { getPageHeaderLayout: () => ({ top: 8, contentTop: 72, buttonSize: 44 }) };
      if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
      if (name === '@/constants/brand') return { BrandColors: {}, BrandFonts: {}, PageTypography: {} };
      if (name === 'react-native') return {
        ...Object.fromEntries(['View', 'Text', 'TextInput', 'Pressable', 'Modal', 'ScrollView', 'KeyboardAvoidingView'].map(name => [name, name])),
        StyleSheet: { create: value => value, absoluteFill: {} }, Platform: { OS: 'ios', select: options => options.ios ?? options.default },
        Keyboard: { dismiss() {} }, Alert: { alert() {} }, BackHandler: { addEventListener: () => ({ remove() {} }) },
        Animated: { Value: class { setValue() {} stopAnimation() {} }, View: 'AnimatedView', timing: () => ({ start() {} }) },
        Easing: { inOut: fn => fn, sin() {} },
      };
      if (name === 'expo-image') return { Image: 'Image' };
      if (name === 'expo-symbols') return { SymbolView: 'SymbolView' };
      if (name === 'expo-status-bar') return { StatusBar: 'StatusBar' };
      if (name === 'expo-image-picker') return {};
      if (name.startsWith('@/components/') || name.startsWith('./')) return nativeComponents;
      if (name.includes('/assets/')) return 'asset';
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const Component = module.exports.default ?? module.exports.ProfileScreen;
  const render = () => { cursor = 0; return Component(props); };
  return {
    session, writes, routes, render, focus: () => onFocus?.(),
    fill(label, value, index = 0) {
      if (label === 'Address') {
        const input = nodes(render()).filter(node => node.props.onChange && node.type === 'PhilippineAddressField')[index];
        assert.ok(input, 'Address picker');
        input.props.onChange(typeof value === 'string' ? { ...qcAddress, street: value } : value);
        return;
      }
      const input = nodes(render()).filter(node => node.props.onChangeText && (node.props.accessibilityLabel === label || node.props.placeholder === label))[index];
      assert.ok(input, `Input: ${label}`);
      input.props.onChangeText(value);
    },
    press(label) {
      const button = nodes(render()).find(node => node.props.onPress &&
        (node.props.accessibilityLabel === label || node.props.title === label || text(node).trim() === label));
      assert.ok(button, `Button: ${label}`);
      button.props.onPress();
    },
    error: () => nodes(render()).filter(node => node.props.accessibilityRole === 'alert' || node.type === 'FormError').map(text).filter(Boolean).join(' '),
  };
}

test('sign-up blocks malformed identifiers, blank passwords and mismatches before routing to Setup', () => {
  const screen = form('../src/app/sign-up.tsx');
  screen.fill('Email or Phone Number', '1234567890');
  screen.fill('Create a Password', 'password123'); screen.fill('Confirm Password', 'password123');
  screen.press('Next'); assert.equal(screen.routes.length, 0); assert.match(screen.error(), /phone number/);
  screen.fill('Email or Phone Number', 'person@example..com'); screen.press('Next');
  assert.match(screen.error(), /valid email/); assert.equal(screen.routes.length, 0);
  screen.fill('Email or Phone Number', 'person@gmail.co'); screen.press('Next');
  assert.match(screen.error(), /valid email/); assert.equal(screen.routes.length, 0);
  screen.fill('Email or Phone Number', 'person+alerts@example.org');
  screen.fill('Create a Password', '        '); screen.fill('Confirm Password', '        ');
  screen.press('Next'); assert.equal(screen.routes.length, 0);
  screen.fill('Create a Password', 'password123'); screen.fill('Confirm Password', 'different123');
  screen.press('Next'); assert.match(screen.error(), /do not match/);
  screen.fill('Confirm Password', 'password123'); screen.press('Next');
  assert.equal(screen.routes[0].pathname, '/set-up');
});

test('sign-in and recovery reject invalid contact formats without completing the action', () => {
  const signIn = form('../src/app/sign-in.tsx');
  signIn.fill('Email or phone number', '+6309171234567'); signIn.fill('Password', 'password123'); signIn.press('Sign In');
  assert.equal(signIn.writes.length, 0);
  signIn.fill('Email or phone number', 'person@gmail.co'); signIn.press('Sign In');
  assert.equal(signIn.writes.length, 0); assert.match(signIn.error(), /valid email/);
  signIn.fill('Email or phone number', '+63 917 123 4567'); signIn.press('Sign In');
  assert.equal(signIn.writes.length, 1);
  const recovery = form('../src/app/forgot-password.tsx');
  recovery.fill('Email address', 'person@gmail.co'); recovery.press('Request Password Reset');
  assert.match(recovery.error(), /valid email/);
  recovery.fill('Email address', ' person@example.org '); recovery.press('Request Password Reset');
  assert.match(text(recovery.render()), /no email sent/);
});

test('profile editing blocks invalid phone, email, date and height values while leaving names unrestricted', () => {
  const account = form('../src/components/profile-screen.tsx', { mode: 'account' });
  for (const [button, label, bad, good] of [
    ['Change Contact Number', 'Contact number', '0917123456', '(02) 8895-8243'],
    ['Change Email', 'Email address', 'name@gmail.co', 'name+alerts@example.org'],
    ['Change Address', 'Address', { ...qcAddress, barangayCode: '' }, qcAddress],
  ]) {
    const count = account.writes.length;
    account.press(button); account.fill(label, bad); account.press('Save Changes');
    assert.equal(account.writes.length, count); assert.ok(account.error());
    account.fill(label, good); account.press('Save Changes'); assert.equal(account.writes.length, count + 1);
  }
  const child = form('../src/components/profile-screen.tsx', { mode: 'child' });
  for (const [label, bad] of [['Birthdate', '02/30/2024'], ['Height', '90cm']]) {
    child.press(label); child.fill(label, bad); child.press('Save Changes');
    assert.equal(child.writes.length, 0); assert.ok(child.error()); child.press('Cancel');
  }
  const guardian = form('../src/components/profile-screen.tsx');
  guardian.press('Edit guardian name'); guardian.fill('Guardian name', "José O'Neil 李 Jr."); guardian.press('Save Changes');
  assert.equal(guardian.session.profile.guardian.fullName, "José O'Neil 李 Jr.");
});

test('emergency contacts show inline errors, allow an omitted email, and reject equivalent duplicate phone formats', () => {
  const screen = form('../src/app/emergency-contacts.tsx');
  screen.press('Add Contact. Maximum of 3 contacts only');
  screen.fill('Full Name', 'Contact One'); screen.fill('Address', qcAddress);
  screen.fill('Contact Number', 'bad-number'); screen.press('Save emergency contact');
  assert.equal(screen.writes.length, 0); assert.ok(screen.error());
  screen.fill('Contact Number', '09171234567'); screen.fill('Address', '123456');
  screen.press('Save emergency contact'); assert.equal(screen.writes.length, 0); assert.match(screen.error(), /address/);
  screen.fill('Address', '12 Sampaguita St., Quezon City');
  screen.fill('Contact Number', '09171234567'); screen.fill('Email Address (optional)', 'person@gmail.co');
  screen.press('Save emergency contact'); assert.equal(screen.writes.length, 0); assert.match(screen.error(), /email/);
  screen.fill('Email Address (optional)', ''); screen.press('Save emergency contact');
  assert.equal(screen.session.profile.contacts.length, 1);
  assert.equal(screen.session.profile.contacts[0].addressDetails.localityCode, qcAddress.localityCode);
  screen.press('Add Contact. Maximum of 3 contacts only');
  screen.fill('Full Name', 'Contact Two'); screen.fill('Address', qcAddress); screen.fill('Contact Number', '+63 917 123 4567');
  screen.press('Save emergency contact'); assert.match(screen.error(), /already added/);
  assert.equal(screen.session.profile.contacts.length, 1);
  screen.fill('Contact Number', '+1 202 555 0123'); screen.press('Save emergency contact');
  assert.equal(screen.session.profile.contacts.length, 2);
  screen.press('Edit Contact One');
  screen.fill('Address', { ...qcAddress, barangayCode: '' }); screen.press('Save contact changes');
  assert.match(screen.error(), /complete address/);
  assert.ok(screen.session.profile.contacts[0].addressDetails.barangayCode, 'An invalid edit must not replace saved address parts');
  screen.fill('Address', { ...qcAddress, street: 'Purok Ilaya' }); screen.press('Save contact changes');
  assert.match(screen.session.profile.contacts[0].address, /^Purok Ilaya, Commonwealth/);
});

test('Setup validates each step and catches duplicate contacts before creating the profile', () => {
  const screen = form('../src/app/set-up.tsx');
  screen.fill('Full Name', "O'Neil 李"); screen.fill('Address', qcAddress); screen.fill('Email', 'guardian@example.org');
  screen.fill('Contact Number', '1111111111'); screen.press('Next'); assert.ok(screen.error());
  screen.fill('Contact Number', '09171234567'); screen.fill('Address', 'test address'); screen.press('Next');
  assert.match(screen.error(), /address/);
  screen.fill('Address', { ...qcAddress, confirmed: false }); screen.press('Next');
  assert.equal(screen.error(), '', 'A valid address advances without the removed confirmation checkbox');
  screen.fill('Full Name', 'Child'); screen.fill('Birthdate (MM/DD/YYYY)', '02302024'); screen.press('Next');
  assert.match(screen.error(), /birthdate/);
  screen.fill('Birthdate (MM/DD/YYYY)', `0101${new Date().getFullYear() - 2}`); screen.fill('Height (cm)', '90');
  screen.press('Select sex'); screen.press('Female'); screen.press('Next');
  screen.fill('Full Name', 'Contact One'); screen.fill('Contact Number', '09181112222'); screen.fill('Address', '12 Main St., Pasig City');
  screen.press('Add Contact');
  screen.fill('Full Name', 'Contact Two', 1); screen.fill('Contact Number', '+63 918 111 2222', 1); screen.fill('Address', qcAddress, 1);
  screen.press('Connect a Camera'); assert.equal(screen.writes.length, 0); assert.match(screen.error(), /already added/);
  screen.fill('Contact Number', '09192223333', 1); screen.fill('Email (optional)', 'person@gmail.co', 1);
  screen.press('Connect a Camera'); assert.equal(screen.writes.length, 0); assert.match(screen.error(), /email/);
  screen.fill('Email (optional)', '', 1); screen.press('Connect a Camera'); assert.equal(screen.writes.length, 1);
});

test('camera setup accepts supported stream addresses and rejects malformed or unsupported URLs', () => {
  for (const value of ['rtsp://192.168.1.10:554/stream', 'https://camera.example.com/live']) assert.equal(validCameraAddress(value), true);
  for (const value of ['', 'not a URL', 'ftp://camera.example.com', 'https://', 'https://user:password@camera.example.com']) {
    assert.equal(validCameraAddress(value), false, value);
  }
});

test('blank sign-in passwords cannot enter a session', () => {
  const screen = form('../src/app/sign-in.tsx');
  screen.fill('Email or phone number', 'qa@example.org');
  for (const password of ['', '   ', '\t\n']) {
    screen.fill('Password', password);
    screen.press('Sign In');
    assert.equal(screen.writes.length, 0);
    assert.match(screen.error(), /enter your password/);
  }
  screen.fill('Password', ' legitimate spaces ');
  screen.press('Sign In');
  assert.equal(screen.writes.length, 1);
});

test('sign-up shares a synchronous submission guard with keyboard submit and resets on return', () => {
  const screen = form('../src/app/sign-up.tsx');
  screen.fill('Email or Phone Number', 'qa@example.org');
  screen.fill('Create a Password', 'test-only-123');
  screen.fill('Confirm Password', 'test-only-123');
  const tree = screen.render();
  const keyboard = nodes(tree).find(node => node.props.onSubmitEditing);
  const next = nodes(tree).find(node => node.props.onPress && text(node).trim() === 'Next');
  keyboard.props.onSubmitEditing();
  next.props.onPress();
  next.props.onPress();
  assert.equal(screen.routes.length, 1);
  screen.focus();
  screen.press('Next');
  assert.equal(screen.routes.length, 2, 'returning to Sign Up allows another attempt');
});

test('contacts saved from an empty production profile survive remounting and can be edited', () => {
  const screen = form('../src/app/emergency-contacts.tsx');
  screen.session.profile = null;
  screen.press('Add Contact. Maximum of 3 contacts only');
  screen.fill('Full Name', 'QA Contact');
  screen.fill('Contact Number', '09171234567');
  screen.fill('Address', qcAddress);
  screen.press('Save emergency contact');
  assert.equal(screen.session.profile.contacts[0].fullName, 'QA Contact');
  assert.equal(screen.session.profile.guardian.fullName, '', 'no invented profile details');
  const reopened = form('../src/app/emergency-contacts.tsx', {}, screen.session);
  assert.ok(text(reopened.render()).includes('QA Contact'));
  reopened.press('Edit QA Contact');
  reopened.fill('Full Name', 'Updated Contact');
  reopened.press('Save contact changes');
  assert.equal(screen.session.profile.contacts[0].fullName, 'Updated Contact');
});
