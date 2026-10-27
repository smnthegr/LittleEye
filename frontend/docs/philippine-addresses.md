# Single-field address and landmark search

Setup, Profile address editing and Emergency Contacts use the same
`PhilippineAddressField`: **one text input**, followed by pin-icon suggestions.
The current-location button now **autofills postal address text** using the phone's
native address service. Typing uses TomTom when its preview key is configured,
otherwise the existing Photon/OSM fallback. There is no movable map. The form keeps
only one input and the location button. The confirmation checkbox, “Location found”
status and Remove action have been removed. Detailed coordinates remain in the SOS address panel.

Setup and the Profile address editor show a compact city-based hotline preview
while editing. Address completeness still gates saving and setup completion,
without a separate checkbox. Setup keeps the mascot visible behind a transparent form;
individual controls and text labels use translucent blue backgrounds to retain
contrast over the lower white wave. The location button has
a solid blue surface, white text and a separate pressed state in both contexts.

The multiline input grows with the entire address and returns to its default
height when cleared with X or keyboard deletion. A non-interactive, inaccessible
text copy in normal layout measures the same value with matching typography;
the input fills that space. There is no fixed one-line height, maximum visible
height, internal scrolling, or remount on clear. TomTom/OSM attribution links
remain clickable with native text-press highlighting suppressed.

## Enable TomTom street and landmark suggestions

1. Create a [TomTom account and API key](https://docs.tomtom.com/platform/documentation/my-tomtom/how-to-get-a-tomtom-api-key).
   The [free tier](https://docs.tomtom.com/pricing) does not require a credit card;
   account limits apply. Do not enable paid usage for this preview.
2. Give the dedicated development key access to **Search API**. This integration
   uses the generally available Search API v2 Fuzzy Search endpoint with typeahead,
   country filter `PH`, and street/address/POI indexes.
3. Put the key in the ignored `frontend/.env.local` file:
   `EXPO_PUBLIC_TOMTOM_API_KEY=your_key`. Do not send it in chat or commit it.
4. Restart Expo. A nonempty key switches suggestions to TomTom; an invalid key
   produces an unavailable message and does not silently switch to another provider.

TomTom results are checked for Philippine country codes and valid coordinates,
deduplicated, and show TomTom attribution. They stay in the current form/session;
the app does not disk-cache them. Provider coverage is not a guarantee that every
street or house is indexed. The user's own address remains editable and is never
required to match a suggestion. A live test using the owner's locally configured
key returned five Philippine results for Rizal Park Manila on 2026-10-22; private
street coverage and actual-phone rendering have not been verified. No account or
paid plan was activated by code.

`EXPO_PUBLIC_` values are readable in the app bundle. This direct-key configuration
is for the local frontend preview. Use dedicated, product-restricted keys and
follow [TomTom's security guidance](https://docs.tomtom.com/platform/documentation/api-best-practices/api-key-management-best-practices).
The backend team should put production requests behind authenticated, rate-limited
server endpoints and review storage/data licensing before backend persistence.

Without a TomTom key, the fallback is `https://photon.komoot.io/api/`. It supports
search-as-you-type and permits reasonable project usage. The public demo is best
effort and may throttle or go down; production deployments with substantial traffic
should use a private/managed Photon instance. Set `EXPO_PUBLIC_PHOTON_URL` in
`.env.local` to change the fallback endpoint and restart Expo.
The public Nominatim endpoint is **not** used: it prohibits autocomplete.

Search starts after three characters and a 550 ms typing pause. All form fields
share a queue with at least 1.1 seconds between request starts and a bounded,
two-minute memory cache for Photon only. Typed queries go to the selected provider;
there is no query logging, disk cache, prefetching, batch download or automatic GPS
request. The provider sees typed search text and the device network request. The
preview privacy notice discloses this; finalize production operator details before release.

Photon requests use `countrycode=PH`. Responses are also filtered to Philippine results,
valid OSM IDs and coordinates. Broad city/province-only results are omitted.
Each suggestion shows its actual name and available street/district/city/province
context. Selecting it fills the single field and retains its OSM identity,
coordinates and available address. No separate details request is needed. The
form displays the [OpenStreetMap attribution and license link](https://www.openstreetmap.org/copyright).
Neither Photon nor this app promises that every business listed on Google Maps
exists in OpenStreetMap. No business is fabricated from the query text.

Editing or clearing a selection immediately removes its old landmark ID and map coordinates.
Debounced/in-flight searches are cancelled on edits, selection, closing/hiding or
unmounting; generation checks reject out-of-order responses. An eight-second
network timeout, unavailable-provider message and empty-results message keep the
input usable. If a place is unmapped, users can enter a full address themselves
in this same field, for example `12 Main Street, Commonwealth, Quezon City`.
A valid Philippine suggestion or complete manual/native street address can be saved
without a confirmation checkbox. This is a completeness check, not residence verification.

## Current location and address autofill

The guardian setup address and Profile address editor offer **Use my current
location**. Emergency-contact forms do not attach the guardian's current device
point to someone else's address. `expo-location` is installed for SDK 57.
Permission is requested only on the button press, only for foreground use; the
config disables background location, foreground services and motion permissions.
No last-known position is substituted. After a fresh GPS fix, the button makes one
native `reverseGeocodeAsync` request, using CoreLocation on iOS and the Android
Geocoder on Android. This requires no separate Google/Apple developer API key.
Coordinates may be sent to the phone's provider. The app formats actual street
number, street, district, city, province and postcode fields, removes duplicates,
and fills the existing input. A placemark/business `name` is not used as a street.
The existing text is preserved if lookup fails; the successful GPS estimate is
still retained with a single short message. An explicit button press may replace
previous draft text with the phone's returned address. The app cannot determine a
private apartment/unit number that the provider does not return.

A one-shot high-accuracy request records latitude, longitude, measured uncertainty
in meters and native capture time in `deviceLocation`. No extra success status or
Remove action is displayed below the field. A GPS estimate is not proof of an exact door, floor or unit. The
100 m uncertainty ceiling is an app input policy to reject very coarse estimates,
not a guarantee of emergency-response suitability. Missing accuracy, invalid
coordinates, coarse/reduced location authorization, a fix older than two minutes or dated in the future, timeout, disabled
services and denied permission produce short messages without fabricating a point.
The user can retry outdoors, or clear the field to enter a fresh manual address.
Native address lookup has an eight-second timeout; partial area-only results fill
only the known area and cannot pass as street-level addresses. Foreign country
results are rejected. Native address lookup is unavailable on web, which keeps
GPS/manual entry with a short message. No native geocoder is polled while typing.

GPS capture has a 20-second position timeout and a Cancel action; native one-shot
requests cannot be forcibly stopped, so late results are ignored. Duplicate taps,
closing/hiding a form and unmounting invalidate pending callbacks. Permission
resolution after cancellation cannot start a new location fetch. A refresh removes
the previous point until a fresh capture succeeds. Adding house/unit text preserves
the device estimate; choosing another map suggestion or
clearing the address removes the prior device point. GPS coordinates are sent only
to the native address provider for autofill; no background tracking is started.

Restart Metro after installing the module. Expo Go includes `expo-location`;
existing custom development/release binaries need rebuilding to include the native
module and permission configuration. Physical-device accuracy/permission UI has
not been verified by the automated tests.

## Validation, session data and backend handoff

The existing contact `address` string remains the display value.
`addressDetails` supports:

- `source: 'osm'`: `placeId` (`N/…`, `W/…` or `R/…`), `placeName`,
  `formattedAddress`, `countryCode: 'PH'`, `latitude`, `longitude`, and a PSGC
  `localityCode` only when the returned locality/province matches uniquely. Its
  top-level coordinates describe the selected map feature, not the device/home.
- `source: 'tomtom'`: TomTom result ID, available POI name, formatted address and
  map-feature coordinates. These also remain distinct from a measured device fix.
- `source: 'phone'`: native autofill text in `street`, `countryCode: 'PH'`,
  `addressLevel: 'street' | 'area'`, and optional unique PSGC locality match. Area
  results require the street details to be completed before saving. This source
  does not prove residence, unit number, or exact emergency dispatch suitability.
- `source: 'manual'`: raw text in `street`; no place ID/coordinates. Completeness
  requires at least three meaningful comma/semicolon/newline-separated parts and
  at most 500 characters. A city name or unselected business name alone cannot pass.
  This is a format check, not verification of residence or deliverability.
- Earlier structured PSGC records remain readable and valid when their street,
  locality and barangay are complete. Existing text-only addresses can be edited
  in the single field without forcing the former city/barangay dropdown flow.
- `confirmed` is a legacy field, ignored by validation and saved-location access.
  Removing the checkbox does not automatically set it to true or imply verification.
- Optional `deviceLocation: { latitude, longitude, accuracyMeters, capturedAt }`
  is separate from landmark coordinates. It is stored with the saved address,
  and shown as a saved estimate in the SOS full-address panel. It is not live
  emergency location tracking and is not automatically refreshed during a call.

The app session is still frontend memory. The future backend must repeat
validation and persist the source and metadata consistently with the display
address. A selected landmark is a reference point, not proof of a home's exact
entrance. Do not use a landmark coordinate as an automatically confirmed emergency
dispatch destination. The current `tel:` hotline handoff does **not** automatically
transmit the saved address or either set of coordinates to responders. Backend
integration/dispatch is not implemented. Hotline matching continues to use a known selected PSGC code
where available, otherwise conservative address text matching/manual area choice.

## Retained PSGC directory

The earlier offline dataset is retained for old profile compatibility and cautious
locality matching; it is no longer the suggestions UI. Source: Philippine Statistics
Authority PSGC, September 30, 2026 release (published October 12). Downloaded from
the [barangay mirror](https://github.com/bendlikeabamboo/barangay/tree/16ce5315dad13cf3df80d43edc15053646ae61a5)
on October 22, pinned commit `16ce5315dad13cf3df80d43edc15053646ae61a5`.
The PSA workbook download was blocked by a JavaScript challenge and was not
independently compared. The mirror has 1,643 localities and 42,010 barangays,
including Isabela City missing from the prior hotline-city snapshot; classification
counts differ from the PSA summary, so the app does not claim audited city counts.
PSA data: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Mirror MIT notice: `src/constants/addresses/LICENSE.txt`.
Rebuild with `python scripts/build-address-directory.py <barangay_flat.json>`
after deliberately reviewing the pinned source and any saved-code migrations.

References: [Photon API](https://github.com/komoot/photon/blob/master/docs/api-v1.md),
[Photon public-server usage](https://github.com/komoot/photon#demo-server),
[Nominatim autocomplete restriction](https://operations.osmfoundation.org/policies/nominatim/).
