# Form validation

Shared input checks live in `src/utils/contact-validation.ts`. Submit/save handlers
use them directly, including keyboard-submit actions where present. Invalid input
shows an accessible error message and cannot advance or change saved data. Editing
clears the displayed error; validation runs again on the next submit.

| Form | Checks |
| --- | --- |
| Sign In | Email or complete phone-number syntax; password required. Authentication remains a separate backend responsibility. |
| Sign Up | Same identifier checks; existing minimum eight-character password, nonblank password, matching confirmation. |
| Forgot Password | Required email syntax before showing the frontend request preview. |
| Setup — guardian | Required fields, email and phone syntax. |
| Setup — child | Real MM/DD/YYYY birthdate, no future dates, existing ages 1–4 setup rule, numeric height within the existing 40–140 cm bounds, sex selection. |
| Setup — emergency contacts | Required contact fields, phone syntax, optional email checked when supplied, duplicate-number detection. |
| Profile editing | Shared email/phone/date/height checks; sex must be an offered option. Existing required-field checks remain. |
| Emergency Contacts — add/edit | Same contact checks, canonical duplicate detection excluding the contact being edited; inline accessible errors. |
| Camera setup | Existing HTTP/HTTPS/RTSP URL check, hostname required, embedded credentials rejected. |
| Guardian / emergency-contact addresses | Full address in one field; optional guardian/home GPS estimate has separate accuracy/time validation. |
| Camera rename / names | Existing required-field checks only; no alphabet-only name rule. |
| City search | Free text with an empty-results message; no format validation. |

Contact emails accept common ASCII mailbox syntax and any provider; plus aliases,
apostrophes, multi-part domains and mixed case are supported. Malformed dots,
domain labels, missing components and overlong mailbox components are rejected.
An omitted emergency-contact email remains valid.

Known Gmail domain mistakes such as `gmail.co`, `gmail.con`, `gamil.com` and
`gmial.com` are rejected across all these forms. The app does not silently correct
an address. `gmail.com` and `googlemail.com` remain accepted, as do other providers
and legitimate `.co` domains. This targeted typo list is not DNS or mailbox
verification; unknown but well-formed domains still require backend verification.

Address checks apply in Setup, Profile address editing and Emergency Contacts.
The shared single-field input searches TomTom when configured, with Photon fallback,
with pin-icon suggestions. Selecting a Philippine result retains its actual name,
available address and coordinates. Users may instead type a complete address with
at least three meaningful comma/semicolon/newline-separated parts; a city or
unselected business name alone cannot pass. Editing removes prior map metadata.
There is no confirmation checkbox. A valid Philippine suggestion, native street
address or complete manual address can be saved directly; an unselected landmark
name alone cannot pass. The short error is “Enter a complete address.” Optional guardian/home GPS is requested only on button
press, with foreground permission, fresh-position and measured-accuracy checks.
It then autofills the available native postal address, excluding nearby POI names;
area-only results cannot pass as full street addresses. Adding address text preserves
the device estimate. No movable map pin is used. These
checks do not verify residence or guarantee door-level GPS precision.
See [address data and backend handoff](philippine-addresses.md).

Phone validation accepts Philippine mobile and area-code landline forms, including
`09…`, `+63…`, `63…`, and mobile `9…`. The Metro Manila subscriber format uses eight
digits following area code 2. International contacts use `+` and a country code,
with a basic E.164-length format check. Spaces, dots, hyphens and balanced
parentheses are allowed. Normalization is used for comparison; the entered display
format is retained. Short emergency codes belong to the curated hotline directory,
not personal-contact or account-identifier fields.

These are client-side syntax checks, not proof that an email or phone number exists
or belongs to the user. The future backend must repeat validation, authenticate
requests and implement email/phone ownership verification. The disabled Profile
password-change preview remains disabled until authentication is connected.

Number-format references: [ITU dialing procedures](https://www.ituob.org/datasets/994-E.164C/)
and [NTC Metro Manila eight-digit migration circular](https://www.ntc.gov.ph/wp-content/uploads/2018/MC/MC-04-07-2018.pdf).
