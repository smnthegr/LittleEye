import { readFileSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

function writeSummary(report) {
  const ok = report.sources.filter(source => source.status >= 200 && source.status < 300);
  const failed = report.sources.filter(source => !source.status || source.status >= 400);
  const escape = value => String(value).replaceAll('|', '\\|').replace(/\s+/g, ' ');
  const status = source => source.status === 403 ? 'HTTP 403 — access blocked from audit environment'
    : source.status ? `HTTP ${source.status}` : source.error;
  const lines = [
    '# Hotline source-link audit', '', `Checked at ${report.checkedAt} (UTC).`, '',
    `- Distinct bundled source URLs: ${report.sources.length}.`,
    `- Successful HTTP responses: ${ok.length}.`,
    `- Unavailable or blocked from this environment: ${failed.length}.`, '',
    'This is a point-in-time public-page check, not a guarantee that a site or telephone line works. A 403 may be anti-bot filtering; a timeout is inconclusive. Certificate errors and 502 responses must not be presented as successful live checks. An HTTP 200 alone does not prove that the right hotline is listed.', '',
    'Automated number matches below are review aids only. They remove formatting from HTML text; they cannot establish emergency purpose or currency. Short codes, numbers printed without their area code, JavaScript content, images and PDFs can require manual review even on HTTP 200 pages. No emergency test calls were made.', '',
    '| Published source | Fetch result | Automated HTML number matches | Needs manual content review |',
    '| --- | --- | --- | --- |',
    ...report.sources.map(source => `| [${escape(source.name)}](${source.url}) | ${escape(status(source))} | ${escape(source.textMatches?.join(', ') || 'None / not checked')} | ${escape(source.needsContentReview?.join(', ') || (source.contacts.length && !source.status ? 'Fetch failed' : 'See scope above'))} |`),
    '',
    'See [emergency-hotlines.md](emergency-hotlines.md#source-link-audit-2026-10-22) for the manual review and link corrections. The machine-readable results are in [hotline-source-audit.json](hotline-source-audit.json). Rerun with `node scripts/audit-hotline-sources.mjs`; generating only this summary from the saved results uses `--report-only`.', '',
  ];
  writeFileSync(new URL('../docs/hotline-source-audit.md', import.meta.url), lines.join('\n'));
}

if (process.argv.includes('--report-only')) {
  writeSummary(JSON.parse(readFileSync(new URL('../docs/hotline-source-audit.json', import.meta.url), 'utf8')));
  process.exit(0);
}

// Maintenance-only public source check. Never dials numbers or sends profile data.
const sourceRoot = new URL('../src/', import.meta.url).href;
const resolution = registerHooks({ resolve(specifier, context, next) {
  return next(context.parentURL?.startsWith(sourceRoot) && specifier.startsWith('.') && !specifier.endsWith('.ts')
    ? `${specifier}.ts` : specifier, context);
} });
const { EMERGENCY_LOCALITIES, NATIONAL_EMERGENCY_HOTLINES } = await import('../src/constants/emergency-hotlines.ts');
resolution.deregister();

const sources = new Map();
function add(source, hotline) {
  if (!sources.has(source.url)) sources.set(source.url, { ...source, contacts: [] });
  if (hotline && !sources.get(source.url).contacts.some(contact => contact.id === hotline.id)) {
    sources.get(source.url).contacts.push({ id: hotline.id, number: hotline.number, dialNumber: hotline.dialNumber });
  }
}
for (const hotline of NATIONAL_EMERGENCY_HOTLINES) add(hotline.source, hotline);
for (const city of EMERGENCY_LOCALITIES) {
  add(city.source);
  for (const hotline of city.hotlines) add(hotline.source, hotline);
}

const queue = [...sources.values()];
const results = [];
async function check(source) {
  try {
    const response = await fetch(source.url, { signal: AbortSignal.timeout(20000), redirect: 'follow' });
    const type = response.headers.get('content-type') ?? '';
    const html = type.includes('text/html') ? await response.text() : '';
    const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|amp|#\d+);/g, ' ');
    const digits = text.replace(/\D/g, '');
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
    // A match is a review aid, not proof of purpose/current availability. PDFs/images need manual review.
    const matched = source.contacts.filter(contact => contact.dialNumber.length >= 7 && digits.includes(contact.dialNumber));
    const unmatched = source.contacts.filter(contact => !matched.includes(contact));
    return { ...source, status: response.status, finalUrl: response.url, contentType: type, title,
      textMatches: matched.map(contact => contact.number), needsContentReview: unmatched.map(contact => contact.number) };
  } catch (error) {
    return { ...source, status: null, error: error.cause?.code ?? error.name };
  }
}
await Promise.all(Array.from({ length: 5 }, async () => {
  while (queue.length) {
    const result = await check(queue.shift());
    results.push(result);
    console.log(`${result.status ?? result.error} ${result.url} (${result.textMatches?.length ?? 0}/${result.contacts.length} text matches)`);
  }
}));
results.sort((a, b) => a.url.localeCompare(b.url));
const report = { checkedAt: new Date().toISOString(),
  note: 'HTTP accessibility and automated text checks only. Text matches are not verification of emergency purpose, currency, or working telephone lines. PDFs and image-only contacts require manual review.',
  sources: results };
writeFileSync(new URL('../docs/hotline-source-audit.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
writeSummary(report);
console.log(JSON.stringify({ sources: results.length, httpSuccess: results.filter(result => result.status >= 200 && result.status < 300).length,
  unavailable: results.filter(result => !result.status || result.status >= 400).length }));
