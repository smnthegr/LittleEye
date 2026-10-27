import assert from 'node:assert/strict';
import test from 'node:test';
import { createPreviewProfile, getMockSignInProfile } from '../src/utils/preview-profile.ts';

test('production mock sign-in cannot supply a sample account profile', () => {
  assert.equal(getMockSignInProfile(false), undefined);
});

test('each explicit development mock sign-in starts with an independent profile', () => {
  const first = getMockSignInProfile(true);
  first.contacts.length = 0;
  first.guardian.email = '';
  const second = getMockSignInProfile(true);
  assert.equal(second.contacts.length, 3);
  assert.ok(second.guardian.email);
});

test('editing a preview profile cannot change the next preview session', () => {
  const edited = createPreviewProfile();
  const fresh = createPreviewProfile();
  edited.guardian.fullName = 'Changed guardian';
  edited.child.fullName = 'Changed child';
  edited.contacts[0].fullName = 'Changed contact';
  edited.contacts.pop();
  assert.notEqual(edited.guardian.fullName, fresh.guardian.fullName);
  assert.notEqual(edited.child.fullName, fresh.child.fullName);
  assert.notEqual(edited.contacts[0].fullName, fresh.contacts[0].fullName);
  assert.equal(fresh.contacts.length, 3);
});
