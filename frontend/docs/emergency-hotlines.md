# Philippine emergency hotlines

Implemented on 2026-10-21 and expanded with official local sources through 2026-10-23. Reviewing a page does not verify that a telephone line is currently reachable. No emergency test calls were placed.

## Equal service cards and expandable backups — 2026-10-25

All visible services, including **911 and Red Cross 143**, use the same card,
number size and Call action; no service is marked primary. Reviewed local citywide
services appear before national services. Setup/Profile/SOS previews use the same
groups and matching number typography.

The visible list includes city emergency hotlines and shortcodes, dispatch/EOC,
direct medical/rescue and ambulance services, and local Red Cross contacts.
QC therefore shows **122, both EOC network alternatives, and EMS/Search and Rescue**
without expanding anything. San Juan's emergency shortcode retains both department
extensions. A fixed one-service limit no longer hides another essential service.
These are presentation decisions based on the existing reviewed service roles,
not assertions that every source or phone line was reverified on this date.

Within each visible service, one number per listed network and one landline are
shown; distinct shortcodes/extensions remain distinct. Repeated same-network
numbers, neighbourhood/volunteer alternatives, provincial support contacts,
hospital switchboards and general medical-assistance contacts remain under the
softly filled, outlined **More emergency contacts** button. No bundled contact was
deleted, and no current-SIM detection filters numbers.

Bacolod's city rescue group prefers the city-charter EMS/ERS mobiles `0930 243 4706`,
`0936 940 1591`, and dispatch landline `(034) 432 3871`. Its other published
repeated alternatives remain in backups. Its Disaster Operations Center, local
Red Cross and rescue shortcode are also visible. This is an editorial grouping
based on service role and source context, not a live “active” status or a
reachability guarantee. Naga retains Smart and TNT,
and Cauayan retains Globe/TM, Smart and Sun.

`src/utils/hotline-presentation.ts` supplies the same shortlist to call cards and
Setup/Profile/SOS previews. Call numbers are grouped under their service, each
with its own action. Emergency Services uses an area-only picker above the call
cards instead of repeating the numbers. Disclosure closes when the area changes;
legacy links to a selected backup reveal that contact without placing a call.
Source links remain on service cards; review dates remain in contact metadata.
The complete directory and its existing calling validation remain unchanged.

## Carrier alternatives — 2026-10-23

Reviewed, fall-relevant alternatives are retained; neither SIM detection nor a
preferred carrier filters the directory. Each number has its own Call action.
Carrier labels appear in directory cards and the setup/profile preview rows.
Published labels take priority; missing labels now use the prefix fallback
described below. The bundled directory contains **265 local listings across 44 cities**
after the medical-relevance review; this is not a claim of complete national coverage.

The [Oct 23 content review](hotline-content-review-2026-10-23.md) records decisions
for all 52 previous source URLs and eight follow-ups, including blocked and
partially readable sources. Relevant rescue, ambulance, emergency dispatch,
Red Cross and emergency-directory hospital/health-office alternatives were added.
Pure police/fire contacts were removed from the fall view unless a reviewed
source establishes a rescue role. That narrower scope reduces the city count
despite substantially more relevant alternatives. Historical raw rows remain
for traceability; they do not automatically appear in the app.

Source labels now also preserve Ilagan's Globe/PLDT, Digos's Smart / TNT, and
Bayugan's Smart/Globe alternatives. Department extensions appear in both UI
surfaces. Call opens the base number; the user requests the displayed extension.
National options precede hospital switchboards and general medical-assistance
contacts. Hospital listings do not assert direct ambulance dispatch, 24/7 service,
or pediatric capabilities. No real calls were placed. The Sipalay PDF remains
blocked; this audit does not certify every link or contact as working.

The area preview groups alternate numbers under their service name and aligns
carrier labels and phone numbers in rows. Its visible list covers essential services; expanding
the backup section reveals the remaining contacts without wrapping uneven chips.

### Prefix fallback — 2026-10-23

`getHotlineNetworkLabel` preserves the official hotline source's `network` label.
When absent, it looks up a bundled snapshot of [Google libphonenumber's Philippine
carrier metadata](https://raw.githubusercontent.com/google/libphonenumber/master/resources/carrier/en/63.txt).
The data is adapted as a TypeScript table, with DITO capitalization and supplemental
0817 from [Libon's own Globe partner-prefix list](https://help.libon.com/en/articles/183097-list-of-globe-prefixes-in-the-philippines).
The snapshot retains the original copyright notice and
[Apache 2.0 license](licenses/libphonenumber-Apache-2.0.txt).

Lookup normalizes domestic and +63/63 forms and matches the longest prefix first,
so exceptions such as 0926 (Globe) override broader Smart ranges. UI labels now
use brand names only, without the word “prefix”. A second, dated brand-association
table from [PalawanPay's own BuyLoad support documentation](https://help.palawanpay.com/hc/en-us/articles/6254162190351-Acceptable-Network-Prefixes-for-BuyLoad)
distinguishes TNT, TM and GOMO where the table supports it, and retains **Smart / TNT**
or **Globe / TM** for shared ranges. Its published table is dated August 25, 2023;
it is a brand-association reference, not proof of the current SIM brand. It cannot
override a newer carrier-family allocation (e.g. DITO ranges formerly associated
with Sun). Inferred legacy Sun ranges say **Smart / Sun**, reflecting
[Smart's official Sun Postpaid rebranding announcement](https://blog.smart.com.ph/sun-postpaid-rebrands-to-smart-postpaid-for-a-better-mobile-experience-for-subscribers/).
Source-published labels remain intact. No metadata is silently rewritten to claim
source verification. Full landlines without a published label say **Landline**,
short emergency codes receive no carrier, and unmapped mobiles say **Mobile**.

[Google's carrier FAQ](https://github.com/google/libphonenumber/blob/master/FAQ.md#since-its-possible-to-change-the-carrier-for-a-phone-number-how-is-the-data-kept-up-to-date)
describes the original-carrier limitation. [Globe's MNP FAQ](https://www.globe.com.ph/help/mobile-number-portability)
confirms that a number can stay the same after switching networks. Thus prefix
labels are estimates of prefix association, not a live carrier lookup, a call-cost
promise or a reason to filter/hide alternatives. Lookup runs entirely offline;
no hotline or profile phone number is sent to a lookup service.

- [Quezon City emergency listing](https://quezoncity.gov.ph/emergency-hotline-numbers/):
  EOC Globe and Smart alternatives, plus EMS/Search and Rescue Smart and landline.
- [Marikina contact page](https://www.marikina.gov.ph/contact-us): Globe,
  all three listed Smart mobiles, and fully specified rescue landline numbers.
- [Cauayan Rescue 922](https://www.cityofcauayan.gov.ph/contact): Globe/TM,
  Smart and Sun alternatives; police-only rows no longer appear in the fall directory.
- [Muntinlupa April 2026 advisory](https://muntinlupacity.gov.ph/iwasan-ang-heat-stroke/):
  Smart, Globe, 137-175 and the published landline.
- [Candon official page](https://candoncity.gov.ph/page/18/): both existing
  numbers now show their published Globe/Smart labels. This path replaces the
  homepage URL, which redirected to another city's site during this review.
- [Naga COMCEN emergency numbers](https://www2.naga.gov.ph/): explicitly records
  `0908 525 3000` as **Smart** and `0963 220 9700` as **TNT**. These source labels
  are stored with the entries and override brand/prefix fallback in every display.
- [Dasmariñas emergency services](https://cityofdasmarinas.gov.ph/cdrrmo-emergency-assistance-services/)
  and [Naga, Cebu ambulance services](https://cityofnagacebu.gov.ph/office-of-the-city-disaster-risk-reduction-management/):
  added fully specified operational landline alternatives; no carrier was guessed
  for mobiles whose source does not name one.

Source review dates are updated only for the entries/groups re-read in this pass.
The earlier link audit below remains a historical snapshot; it was not rerun or
relabelled as a new all-source/live-call check.

## User flow

1. Enter the guardian's Philippine address in Setup. A hotline-area card appears below the address, matching against all 149 PSA cities. Cities sharing a name require a province; the app never silently chooses the first Naga, San Fernando, San Carlos, or Talisay.
2. Use **Change area** to search by city/province, correct the match, choose a city while elsewhere, or select national hotlines. This does not change the saved home address. Municipalities can use the national-hotlines option.
3. Complete Setup. Emergency Services and the saved-address card on the SOS screen use the same profile address and area choice. Existing profiles automatically receive the feature without another setup step.
4. Editing the profile address invalidates an old manual area choice and computes a new match. The card explicitly distinguishes the saved address from live location.
5. **SOS / Call 911** is a single-tap shortcut to the national emergency number, without a long press, service picker, or extra LittleEye navigation. Repeated taps are ignored while the OS handoff is pending. **Emergency Services** is the directory for choosing a particular service or reviewed local number.
6. Each directory action is labelled **Call** and hands its reviewed `tel:` number to the operating system. The default UI shows 911, Red Cross 143 and one local service with network alternatives; other contacts expand under More emergency contacts. The complete data directory retains its ordering separately. The UI never reports a connected emergency call, plays simulated ringing, or calls automatically. Old `/call?kind=hotline` links also show real calling options instead of entering the simulated contact-call screen.

National numbers remain available when a city is missing, ambiguous, or unlisted. The app does not substitute a neighboring city's number. Phone dialing and opening official-source links require explicit taps. Unsupported phone handlers show the number for manual dialing.

**Phone-platform limit:** the app removes its own delays, but cannot promise a connected call without phone-level interaction. [Apple's phone-link documentation](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/PhoneLinks/PhoneLinks.html) requires system confirmation for native `tel:` links on iOS 10.3 and later. [Android's Intent documentation](https://developer.android.com/reference/android/content/Intent#ACTION_CALL) does not allow `ACTION_CALL` for emergency numbers and directs applications to `ACTION_DIAL`. No direct-call permission or custom native calling module was added.

## Nationwide city coverage

`src/constants/philippine-cities.ts` bundles all **149 cities** listed by the [Philippine Statistics Authority PSGC city table](https://psa.gov.ph/classification/psgc/cities), with unique PSGC codes, region, and geographic province hints from the [PSGC province table](https://psa.gov.ph/classification/psgc/provinces). Geographic hints do not assert administrative control over independent/highly urbanized cities. The data was retrieved on 2026-10-21; the city table states 149 cities as of 2025-07-31, and the latest published 2026-09-30 PSGC release still reports 149. PSA data is attributed under CC BY 4.0; application changes normalize display names, add aliases, and preserve the seven existing application IDs.

Every city can be selected and receives national 911 and Philippine Red Cross 143. **City-list completeness does not mean a complete local-phone directory.** The Oct 23 medical-relevance review provides **265 local listings across 44 cities**, counting shared provincial contacts for each applicable city. Five additional cities have an explicit official source directing local emergency calls to 911. **100 cities still lack a reviewed separate fall-relevant contact.** Their cards disclose this gap; the implementation does not fabricate numbers to fill the remaining rows. The earlier Oct 22 expansion had 104 contacts across 59 cities, including police/fire-only entries now excluded from the fall view.

The [149-city coverage audit](emergency-hotline-coverage.md) lists every city's current status, numbers, and sources. It is generated from the actual bundled data with `node scripts/report-hotline-coverage.mjs --write`. The original police/fire-only coverage in Valenzuela and 15 Central Luzon cities is no longer counted as medical/rescue coverage; national hotlines remain available there.

Alaminos, Legazpi, and Cagayan de Oro now have explicit local-911 provenance alongside the original Davao and Baguio entries. A common 911 number can be intentional: [DILG's Unified 911 announcement](https://pia.gov.ph/news/one-number-for-all-emergencies-unified-911-to-launch-nationwide/) describes integrating police, fire, medical, disaster, and LGU emergency response. That does not justify calling an incomplete local-contact database complete.

## Reviewed directory

| Coverage | Number used | Primary source |
| --- | --- | --- |
| Philippines | 911 | [DILG Unified 911 campaign](https://ncr.dilg.gov.ph/dilg-leads-nationwide-campaign-for-unified-911-emergency-hotline/) |
| Philippine Red Cross | 143 | [PRC Contact Us](https://redcross.org.ph/contact-us/) |
| Quezon City | 122; 0947 885 9929 | [QC emergency hotlines](https://quezoncity.gov.ph/emergency-hotline-numbers/) |
| Marikina City | 0917 584 2168 | [Marikina city contact page](https://www.marikina.gov.ph/contact-us) |
| Pasig City | (02) 8643 0000 | [Pasig city directory](https://pasigcity.gov.ph/about-pasig-city/directory) |
| Makati City | (02) 8895 8243 | [Makati city directory](https://www.makati.gov.ph/city) |
| General Trias, Cavite | 0919 077 1760 | [General Trias directory, Emergency Hotlines](https://web.generaltrias.gov.ph/about/directory-of-offices) |
| Davao City | Existing 911 row, with city source | [Davao Central 911](https://davaocity.gov.ph/departments/social-services/central-911/) |
| Baguio City | Existing 911 row, with city source | [Baguio CDRRMO contact page](https://www.cdrrmo.baguio.gov.ph/contact-us) |

The table above records the original seven-area seed. See the generated coverage audit for the expanded directory. Administrative office numbers were not added as emergency alternatives. Entries carry official-source links in the UI and source-review dates in their metadata. No response-time, network availability, or call-cost guarantee is made.

## Local-source review rules

### Source-link audit, 2026-10-22

The first live audit checked all 51 distinct bundled public source URLs: 31
returned HTTP success and 20 were blocked or unavailable. This is **not** an
all-links-working directory. The original result is preserved in
[hotline-source-audit-before-fixes.json](hotline-source-audit-before-fixes.json).

After the source corrections below, the [historical Oct 22 52-link audit](hotline-source-audit.md)
records 32 HTTP-success pages, 12 HTTP 403 access blocks, five connection timeouts,
two certificate errors and one HTTP 502. The extra source is the separate Naga
fire-station document. A 403 from this environment does not establish that a
normal phone browser is blocked. Search-index content can support a published
listing but does not override a failed live HTTPS request. Do not disable TLS
verification or send users to insecure HTTP to make an audit look successful.

Corrections and manual checks:

- QC's `/qc-emergency-hotlines/` returns 502. The more explicit official
  [emergency-hotline post](https://quezoncity.gov.ph/emergency-hotline-numbers/)
  lists both `122` and `0947-885-9929` in readable published text. It replaces
  the original citation, but **also returns 502 in the direct live check**. The
  city's site remains unavailable from this check; this is not a repaired server.
- Cauayan's canonical `www.cityofcauayan.gov.ph/contact` loads successfully and
  directly lists all three bundled rescue/fire contacts. The bare-host link was
  blocked in the initial audit.
- Malaybalay now links to its readable CDRRMO contact directory rather than the
  older charter PDF. Mandaluyong links to its Government page, whose HOTLINES
  section names the police, fire and rescue numbers. San Juan links to the
  directory row explicitly associating `137-135` with CDRRMO. Muntinlupa links to
  its April 2026 advisory listing `137-175` and both mobile contacts. These pages
  returned HTTP success; short codes/landlines still need contextual manual
  checks instead of the script's full domestic-number text comparison.
- Naga, Camarines Sur's homepage confirms the two COMCEN numbers but did not
  expose the bundled fire contact in the current HTML. That contact now has a
  separate official BFP document naming Naga City Central Fire Station and
  `0923 083 9429`; its direct fetch is access-blocked (403), so it is not claimed
  as a successful live page check.
- Pasig's citation now points to the August 29, 2026 city advisory explicitly
  naming `(02) 8643-0000`. HTTPS certificate-chain verification still fails in
  this environment. Cavite City's bare and `www` hosts both failed certificate
  validation; switching to the canonical `www` URL does not fix that certificate.
- The DILG and Philippine Red Cross pages returned HTTP success and were manually
  checked for the national `911` and Red Cross `143` listings. Makati's published
  directory identifies `8895-8243` as Makati Rescue; its JavaScript-rendered page
  and omitted `(02)` prefix prevent a full-string HTML match in the script.

The UI now says **published local numbers** and **Source reviewed**. The source
review date is not a link-health guarantee, a live call verification, or a new
publication date. No numbers were changed by this source-link correction.

- `src/constants/local-emergency-contacts.ts` groups published local service numbers by their primary source. Source rows must identify exactly one PSA city; duplicate city names require a province. Runtime joins use the existing stable city IDs and PSGC codes.
- Visible entries are limited to documented rescue/dispatch, emergency medical assistance, Red Cross, clearly labelled emergency hotlines, and hospital/health-office contacts offered in emergency directories. Pure police and fire-only rows are retained only as historical raw data and are excluded from the fall view. General city-hall numbers, fax numbers, text-only services, individual officers' numbers, and utility/customer-service contacts are excluded. Trunks specifically assigned to emergency departments retain their published extensions.
- A page's public status alone is insufficient: the Urdaneta page containing a `0912 345 6789` / lorem-ipsum placeholder and Biñan development pages were not imported. Several other official sites timed out, returned missing pages, or showed hotline headings without readable numbers; third-party reposts were not substituted as verified local data.
- Formatting removes separators and restores domestic trunk prefixes. Local landlines use their source's regional dialing context (e.g. 032 Mandaue, 033 Iloilo, 034 Bacolod, 047 Olongapo); subscriber digits are not invented. Ambiguous short notation and obsolete seven-digit Metro Manila numbers are withheld. Original source links remain attached to each entry.

## Architecture and limitations

- `src/constants/philippine-cities.ts`, `src/constants/emergency-hotlines.ts`, and `src/constants/local-emergency-contacts.ts`: nationwide cities joined to curated sources, display numbers, dial numbers, city aliases, and review dates. The directory is bundled, so reading it does not require internet access.
- `src/utils/emergency-directory.ts`: conservative address matching, province-aware duplicate-name handling, address-bound manual selection, deduplication, and reviewed-number dial URL validation. Precompiled city patterns avoid rebuilding all patterns for each keystroke. This is text matching, not geocoding or comprehensive address/country validation. Full city names are preferable; unsupported formats can be corrected in the picker.
- `src/hooks/use-emergency-hotlines.ts` and the optional `Profile.emergencyArea`: shared selection for Setup, Services, and SOS. Storage follows the application's existing **in-memory profile session**. This task does not add backend persistence; a production profile API must also save/restore this field for choices to survive a fresh session.
- `src/components/emergency-area-card.tsx`: address match preview and searchable, virtualized 149-city `FlatList`. `emergency-hotline-list.tsx`: reusable Call/source cards. The picker scrolls on short screens and respects safe areas.
- `src/app/emergency-hotline.tsx`: single-tap SOS handler, pending-handoff guard, and explicit Call 911 text. `emergency-services.tsx` and legacy `call.tsx` provide the service-directory route.
- `src/services/emergency-dialer.ts`: user-triggered OS handoff and honest failure alerts. Personal emergency-contact calling remains the existing separate flow.
- No new dependency, GPS permission, address lookup API, analytics transmission, or background network lookup was introduced. Matching stays on-device. A source link opens a public page without appending the user's address.

For additional areas, verify the emergency contact on the LGU/DRRMO's official page, distinguish rescue numbers from administrative lines, record the source and review date, add unambiguous aliases and tests, then release the updated directory. Remove or correct numbers when official notices change them. Do not populate missing cities with guessed numbers or silently fetch unreviewed search results during an emergency.

## Validation

### Shortlist presentation

- Full suite: **182 tests passed**; TypeScript and Expo lint passed.
- New checks cover compact Bacolod dispatch choices, all 149 cities retaining
  their complete contacts across primary/backup sections, source network labels,
  production disclosure buttons, separate primary/backup call handoffs, area
  changes, Setup/Profile previews, area-only mode, and selected legacy backups.
- Component tests use mocked native views and phone handoffs. No new actual-phone
  visual verification or emergency test calls were performed.

### Oct 23 medical-relevance expansion

- `node --test tests/*.test.mjs`: **175 passed**.
- `npx.cmd tsc --noEmit` and `npx.cmd expo lint`: passed.
- Regression checks cover all included source rows matching exactly one city,
  provincial boundaries, source-published Ilagan/Digos/Bayugan labels, Naga TNT,
  medical alternatives and printed phone ranges, safe base-number dialing with
  separate extensions, shared trunks with distinct departments, excluded
  police/fire-only rows, and 911 preceding hospital switchboards.
- Official Roxas, Batac and Panabo posters and relevant Bacolod/Legazpi PDF tables
  were visually inspected for source content. This is source verification, not
  visual QA of the mobile UI. No new emulator/device screenshots or native call
  checks were performed, and no emergency number was called.

### Earlier implementation checks (historical)

- `npx.cmd tsc --noEmit`: passed.
- `npx.cmd expo lint`: passed.
- `node --test tests/*.test.mjs`: 126 tests passed, including 16 hotline tests. Coverage includes all 149 unique city records and their address/manual matches, every new source row matching exactly one city, local contacts appearing first, duplicate-name disambiguation, no cross-city contacts, phone format and placeholder rejection, street/province false positives, setup save, shared profile updates, stale selections, national fallback, deduplication, reviewed-number enforcement, mocked dialing failures, and legacy-call routing without simulated audio. The SOS test verifies an immediate 911 request, no hold/picker/navigation, rapid-tap protection, retry after handoff, and no call from an unfocused screen.
- Production area-card/list components were rendered in an isolated Expo web validation fixture with a fictional address at 390×844, 320×640, and 844×390. Verified Naga province disambiguation, city/province search, changing to Camarines Sur, and selecting Zamboanga near the end of the full list on a small screen. Previous validation also covered national-only selection and address changes.
- The actual SOS component was rendered at 390×844 and 320×640 with an isolated navigation-context fixture. Call 911 text and the services/contacts rows remained visible or scrollable. This does not verify full app navigation or native calling.
- Earlier previews from 2026-10-21: [nationwide picker](validation/emergency-hotlines/nationwide-picker-390.jpg), [small-screen picker](validation/emergency-hotlines/nationwide-picker-320.jpg), [landscape picker](validation/emergency-hotlines/nationwide-picker-landscape.jpg), [SOS](validation/emergency-hotlines/sos-call-911-390.jpg), [small-screen SOS](validation/emergency-hotlines/sos-call-911-320.jpg). These browser fixtures predate the expanded local-contact data and local-first ordering. They are not current directory screenshots or native device screenshots. No new visual verification was performed for the 2026-10-22 data expansion. The older `address-match-390.jpg` is also historical and shows superseded wording.
- No Android/iOS device or native phone-handler verification was performed. No emergency number was called. Native keyboard behavior and OS dialer presentation still need device QA without placing emergency test calls.

The temporary fixture and its development server were removed after verification. The screenshot is retained as visual evidence.
