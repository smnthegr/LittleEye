// Copyright (C) 2013 The Libphonenumber Authors
// SPDX-License-Identifier: Apache-2.0
// Adapted from google/libphonenumber resources/carrier/en/63.txt, reviewed 2026-10-23.
// https://raw.githubusercontent.com/google/libphonenumber/master/resources/carrier/en/63.txt
// Changes: TypeScript representation, DITO capitalization; supplemental 63817 from
// https://help.libon.com/en/articles/183097-list-of-globe-prefixes-in-the-philippines
// These describe prefix associations, not a ported number's current carrier.
// Full license: ../../docs/licenses/libphonenumber-Apache-2.0.txt
export type MobileCarrier = 'Smart' | 'Globe' | 'DITO';

export const MOBILE_CARRIER_PREFIXES: Readonly<Record<string, MobileCarrier>> = {
  '63813': 'Smart', '63817': 'Globe', '6389': 'DITO',
  '63905': 'Globe', '63906': 'Globe', '63907': 'Smart', '63908': 'Smart',
  '63909': 'Smart', '63910': 'Smart', '63911': 'Smart', '63912': 'Smart',
  '63914': 'Globe', '63915': 'Globe', '63916': 'Globe', '63917': 'Globe',
  '63918': 'Smart', '63919': 'Smart', '6392': 'Smart', '63924': 'DITO',
  '63926': 'Globe', '63927': 'Globe', '6393': 'Smart', '63934': 'DITO',
  '63935': 'Globe', '63936': 'Globe', '63937': 'Globe', '6394': 'Smart',
  '63944': 'DITO', '63945': 'Globe', '6395': 'Globe', '63950': 'Smart',
  '63951': 'Smart', '63958': 'Smart', '6396': 'Smart', '63965': 'Globe',
  '63966': 'Globe', '63967': 'Globe', '63970': 'Smart', '63971': 'Globe',
  '63972': 'Globe', '63975': 'Globe', '63976': 'Globe', '63977': 'Globe',
  '63978': 'Globe', '63981': 'Smart', '63983': 'Globe', '63985': 'Smart',
  '63986': 'Globe', '63987': 'Globe', '63988': 'Smart', '63991': 'DITO',
  '63992': 'DITO', '63993': 'DITO', '63994': 'DITO', '63995': 'Globe',
  '63996': 'Globe', '63997': 'Globe', '63998': 'Smart', '63999': 'Smart',
};
