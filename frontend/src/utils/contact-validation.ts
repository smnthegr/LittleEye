// Target common Gmail entry mistakes without rejecting other providers or all .co domains.
const GMAIL_DOMAIN_TYPOS = new Set([
  'gmail.co', 'gmail.con', 'gmail.cm', 'gmail.cmo', 'gmail.om', 'gmail.com.ph', 'gmail.com.com',
  'gamil.com', 'gmial.com',
]);

/** Common mailbox syntax and known typo checks; ownership/delivery require the backend. */
export function isValidEmail(value: string) {
  const email = value.trim();
  if (email.length > 254) return false;
  const pieces = email.split('@');
  if (pieces.length !== 2) return false;
  const [local, domain] = pieces;
  if (GMAIL_DOMAIN_TYPOS.has(domain.toLowerCase())) return false;
  if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..') ||
      !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  const labels = domain.split('.');
  return labels.length >= 2 && labels.every(label => label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label))
    && /^[a-z]{2,}$/i.test(labels.at(-1)!);
}

/** An omitted contact email is valid; a supplied email can use any provider. */
export function isValidOptionalEmail(value: string) {
  return value.trim() === '' || isValidEmail(value);
}

export const ADDRESS_ERROR = 'Enter a complete address.';

export const PHONE_NUMBER_HINT = 'Enter a valid phone number.';

/** Format/sanity check, not a carrier, assigned-number, or reachability lookup. */
export function normalizePhoneNumber(value: string): string | null {
  const input = value.trim();
  if (!input || /[\r\n]/.test(input) || !/^\+?[0-9\s().-]+$/.test(input)) return null;
  // Formatting is allowed, but incomplete/misordered parentheses are not.
  let parentheses = 0;
  for (const char of input) {
    if (char === '(' && ++parentheses > 1) return null;
    if (char === ')' && --parentheses < 0) return null;
  }
  if (parentheses) return null;
  const compact = input.replace(/[\s().-]/g, '');
  const validPhilippineSubscriber = (subscriber: string) => /^(?:9\d{9}|2\d{8}|[3-8]\d{7,8})$/.test(subscriber);
  let normalized: string;
  if (compact.startsWith('+63')) {
    const subscriber = compact.slice(3);
    if (!validPhilippineSubscriber(subscriber)) return null;
    normalized = compact;
  } else if (compact.startsWith('+')) {
    // Preserve international contacts without imposing Philippine mobile rules.
    if (!/^\+[1-9]\d{6,14}$/.test(compact)) return null;
    normalized = compact;
  } else {
    const subscriber = compact.startsWith('63') ? compact.slice(2) : compact.startsWith('0') ? compact.slice(1) : compact;
    if (!validPhilippineSubscriber(subscriber)) return null;
    normalized = `+63${subscriber}`;
  }
  // Catch obvious repeated-digit placeholders without maintaining a carrier-prefix list.
  const subscriber = normalized.startsWith('+63') ? normalized.slice(3) : normalized.slice(1);
  return /^(\d)\1+$/.test(subscriber) ? null : normalized;
}

export function isValidPhoneNumber(value: string) {
  return normalizePhoneNumber(value) !== null;
}

/** Require a real calendar date, not a Date rollover such as February 30. */
export function isValidBirthdate(value: string, today = new Date()) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return false;
  const [, month, day, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  return year >= 1900 && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    && date.getTime() <= endOfToday.getTime();
}

export function getChildAge(value: string, today = new Date()) {
  if (!isValidBirthdate(value, today)) return -1;
  const [month, day, year] = value.trim().split('/').map(Number);
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
  return age;
}

/** Preserve the app's existing broad input limits; this is not a growth assessment. */
export function isValidChildHeight(value: string) {
  const height = value.trim();
  return /^\d{2,3}(\.\d{1,2})?$/.test(height) && Number(height) >= 40 && Number(height) <= 140;
}
