import assert from 'node:assert/strict';
import test from 'node:test';
import { getChildAge, isValidBirthdate, isValidChildHeight, isValidEmail, isValidOptionalEmail, isValidPhoneNumber, normalizePhoneNumber } from '../src/utils/contact-validation.ts';

test('contact email can be omitted or cleared when editing', () => {
  assert.equal(isValidOptionalEmail(''), true);
  assert.equal(isValidOptionalEmail('   '), true);
});

test('supplied contact emails accept non-Gmail domains and surrounding whitespace', () => {
  for (const value of ['person@gmail.com', 'person@outlook.com', ' person@example.org ']) {
    assert.equal(isValidOptionalEmail(value), true);
  }
});

test('a supplied but invalid contact email is rejected', () => {
  for (const value of ['person', 'person@', '@example.com', 'person@example', 'two words@example.com',
    'person@example..com', '.person@example.com', 'person.@example.com', 'per..son@example.com',
    'person@-example.com', 'person@example-.com', 'person@exam_ple.com', 'person@@example.com',
    `${'a'.repeat(65)}@example.com`, `person@${'a'.repeat(64)}.com`]) {
    assert.equal(isValidOptionalEmail(value), false);
  }
});

test('required emails reject empty input and support common aliases, domains and punctuation', () => {
  assert.equal(isValidEmail(' '), false);
  for (const email of ["o'neil@example.org", 'person+alerts@example.com.ph', ' Person.Name@Example.COM ', 'a@b.co']) {
    assert.equal(isValidEmail(email), true, email);
  }
});

test('Gmail domain typos cannot pass either required or optional email validation', () => {
  for (const email of ['person@gmail.co', 'person@GMAIL.CO', ' person@gmail.con ', 'person@gmail.cm',
    'person@gmail.cmo', 'person@gmail.om', 'person@gmail.com.ph', 'person@gmail.com.com',
    'person@gamil.com', 'person@gmial.com']) {
    assert.equal(isValidEmail(email), false, email);
    assert.equal(isValidOptionalEmail(email), false, email);
  }
  for (const email of ['person@gmail.com', 'person+alerts@googlemail.com', 'person@outlook.com',
    'person@yahoo.com.ph', 'person@company.co', 'person@school.edu.ph']) {
    assert.equal(isValidEmail(email), true, email);
  }
});

test('equivalent Philippine contact formats share one identity for duplicate detection', () => {
  for (const phone of ['0917 123 4567', '+63 917 123 4567', '639171234567', '9171234567', '(0917) 123-4567']) {
    assert.equal(normalizePhoneNumber(phone), '+639171234567', phone);
  }
  for (const phone of ['(02) 8895-8243', '+63 2 8895 8243', '63288958243']) {
    assert.equal(normalizePhoneNumber(phone), '+63288958243', phone);
  }
  assert.equal(normalizePhoneNumber('(044) 940 5258'), '+63449405258');
  assert.equal(normalizePhoneNumber('+1 (202) 555-0123'), '+12025550123');
});

test('contact numbers reject incomplete numbers, malformed prefixes, letters and short emergency codes', () => {
  for (const phone of ['', '1234567890', '0917123456', '091712345678', '+63 09171234567',
    '+631712345678', '+63 917 123 45678', '0917-ABC-4567', '09171234567 ext 9', '++639171234567',
    '09171234567+', '(0917 1234567', '0917)1234567', '0917\n1234567', '+0123456789',
    '+1234567890123456', '(02) 895-8243', '911', '143', '00000000000']) {
    assert.equal(isValidPhoneNumber(phone), false, phone);
  }
});

test('birthdates reject impossible and future dates, including non-leap February 29', () => {
  const today = new Date(2026, 9, 22);
  for (const value of ['02/30/2024', '02/29/2023', '13/01/2024', '00/01/2024', '10/23/2026', '01/01/1899', 'NaN', '1/1/2024']) {
    assert.equal(isValidBirthdate(value, today), false, value);
  }
  assert.equal(isValidBirthdate('02/29/2024', today), true);
  assert.equal(isValidBirthdate('10/22/2026', today), true);
  assert.equal(getChildAge('10/23/2024', today), 1);
  assert.equal(getChildAge('10/22/2024', today), 2);
});

test('height fields require a finite decimal within the existing input bounds', () => {
  for (const value of ['40', '90.5', '140', ' 100.25 ']) assert.equal(isValidChildHeight(value), true, value);
  for (const value of ['', '0', '-80', 'NaN', 'Infinity', '1e2', '90cm', '39', '141', '90.123']) {
    assert.equal(isValidChildHeight(value), false, value);
  }
});
