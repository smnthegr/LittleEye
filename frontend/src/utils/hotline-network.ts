import { MOBILE_CARRIER_PREFIXES, type MobileCarrier } from '../constants/mobile-carrier-prefixes';
import { MOBILE_BRAND_PREFIXES } from '../constants/mobile-brand-prefixes';

const prefixes = Object.entries(MOBILE_CARRIER_PREFIXES).sort(([a], [b]) => b.length - a.length);

/** Offline prefix inference only; never looks up a number or checks its current SIM/network. */
export function inferMobileCarrier(input: string): MobileCarrier | undefined {
  if (!/^\+?[\d\s().-]+$/.test(input.trim())) return undefined;
  const digits = input.replace(/\D/g, '');
  const international = /^0[89]\d{9}$/.test(digits) ? `63${digits.slice(1)}` : digits;
  if (!/^63[89]\d{9}$/.test(international)) return undefined;
  return prefixes.find(([prefix]) => international.startsWith(prefix))?.[1];
}

/** Brand associations can overlap; do not invent a unique brand for shared ranges. */
export function inferMobileBrand(input: string): string | undefined {
  const carrier = inferMobileCarrier(input);
  if (!carrier || carrier === 'DITO') return carrier;
  const digits = input.replace(/\D/g, '');
  const prefix = (digits.startsWith('63') ? `0${digits.slice(2)}` : digits).slice(0, 4);
  const includes = (brand: keyof typeof MOBILE_BRAND_PREFIXES) =>
    (MOBILE_BRAND_PREFIXES[brand] as readonly string[]).includes(prefix);
  if (carrier === 'Globe') {
    if (includes('GOMO')) return 'GOMO';
    const brands = (['Globe', 'TM'] as const).filter(includes);
    return brands.length ? brands.join(' / ') : carrier;
  }
  // Sun Postpaid rebranded to Smart in 2022; retain both names for legacy ranges.
  if (includes('Sun')) return 'Smart / Sun';
  const brands = (['Smart', 'TNT'] as const).filter(includes);
  return brands.length ? brands.join(' / ') : carrier;
}

/** Source-published labels take priority; the UI uses brand names without suffixes. */
export function getHotlineNetworkLabel(hotline: { dialNumber: string; network?: string }): string | undefined {
  if (hotline.network?.trim()) return hotline.network.trim();
  const brand = inferMobileBrand(hotline.dialNumber);
  if (brand) return brand;
  if (/^0[89]\d{9}$/.test(hotline.dialNumber)) return 'Mobile';
  if (/^0[2-8]\d{8}$/.test(hotline.dialNumber)) return 'Landline';
  return undefined; // Short emergency codes do not identify a carrier.
}
