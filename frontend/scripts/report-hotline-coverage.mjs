import { writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

// Run with Node 24+, matching the directory tests. This reports bundled coverage;
// it does not make calls or re-verify telephone availability.
const sourceRoot = new URL('../src/', import.meta.url).href;
const resolution = registerHooks({ resolve(specifier, context, next) {
  return next(context.parentURL?.startsWith(sourceRoot) && specifier.startsWith('.') && !specifier.endsWith('.ts')
    ? `${specifier}.ts` : specifier, context);
} });
const { EMERGENCY_LOCALITIES } = await import('../src/constants/emergency-hotlines.ts');
resolution.deregister();

const localCities = EMERGENCY_LOCALITIES.filter(city => city.hotlines.length);
const via911Cities = EMERGENCY_LOCALITIES.filter(city => !city.hotlines.length && city.via911);
const pending = EMERGENCY_LOCALITIES.filter(city => !city.hotlines.length && !city.via911);
const localNumbers = localCities.reduce((total, city) => total + city.hotlines.length, 0);
const reviewedThrough = localCities.flatMap(city => city.hotlines.map(contact => contact.checkedAt)).sort().at(-1);
const escape = value => value.replaceAll('|', '\\|');
const report = [
  '# Bundled Philippine hotline coverage',
  '',
  `Source pages reviewed through ${reviewedThrough}. Source review is not a live call or availability check.`,
  '',
  `- Selectable cities: ${EMERGENCY_LOCALITIES.length}.`,
  `- Cities with separately published local contacts: ${localCities.length} (${localNumbers} contacts).`,
  `- Additional cities with an explicit local 911 source: ${via911Cities.length}.`,
  `- Cities still needing a reviewed separate local contact: ${pending.length}.`,
  '',
  'Contact totals count city listings; shared provincial services are counted in each applicable city. 911 and Philippine Red Cross 143 remain available for every city. Missing local coverage is disclosed in the app. Police/fire-only contacts do not count as medical/rescue coverage without a documented response role.',
  '',
  '| City | Province / region | Local coverage | Published local contacts / official source |',
  '| --- | --- | --- | --- |',
  ...EMERGENCY_LOCALITIES.map(city => {
    const status = city.hotlines.length ? 'Local contacts available' : city.via911 ? 'Local source directs emergencies to 911' : 'Separate local contact not yet reviewed';
    const contacts = city.hotlines.length ? city.hotlines.map(contact => `[${escape(contact.name)}${contact.network ? ` (${escape(contact.network)})` : ''}: ${contact.number}${contact.extension ? ` ext. ${contact.extension}` : ''}](${contact.source.url})`).join('<br>')
      : city.via911 ? `[Local 911 source](${city.source.url})` : 'National hotlines only';
    return `| ${escape(city.name)} | ${escape(city.province || city.region)} | ${status} | ${contacts} |`;
  }),
  '',
].join('\n');

if (process.argv.includes('--write')) {
  writeFileSync(new URL('../docs/emergency-hotline-coverage.md', import.meta.url), report);
}
console.log(`${localCities.length}/${EMERGENCY_LOCALITIES.length} cities with ${localNumbers} local contacts; ${via911Cities.length} additional local 911 sources; ${pending.length} cities await separate local-contact review.`);
