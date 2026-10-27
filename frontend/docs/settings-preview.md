# Settings preview

Settings lives in `src/app/settings.tsx` and can be developed independently of Home.

## Open it in a browser

From `frontend`, run:

```sh
npm run web
```

Open the local URL printed by Expo, complete the normal frontend sign-in flow,
then open Settings from camera setup. Settings and account pages require a
signed-in session with accepted policies in both development and production.
Without camera setup details, Settings shows a **No camera connected** card and
the account/preference categories. A signed-out `/settings` link returns to the
landing page.

To see the complete menu with a sample connected camera, open
`http://localhost:8081/settings?preview=connected` after signing in (use your Expo server's port).
This development-only display preview labels the camera **Online (preview)**,
preserves the sample state when opening Device Information and Network, and
does not modify the account, camera session or live connection.

The in-app connected-camera preview button has been removed. The development
URL above still supports layout review without changing the session.

For Expo Go, use the server's Expo URL with `/--/settings` appended, for example
`exp://192.168.1.5:8081/--/settings`.

## Connect Home later

Use Expo Router from the future Home menu:

```tsx
import { router } from 'expo-router';

// Inside the Settings button's onPress:
router.push('/settings');
```

Both development and production access require a signed-in session and accepted
policies. The page reads camera details from `useAppSession()`; the development
preview changes display data only and does not bypass session guards.

Camera setup's gear button opens Settings directly. Connected-camera Settings
and all its subpages show a circular Profile button with the mascot, blue glow
and animated press effects. It opens `/profile`, where choosing a photo replaces
the mascot in every Profile button. Photos are stored only in the current session;
removing the photo restores the mascot. The connected development preview also
supports this flow. With no camera, `/profile` redirects to Settings and the menu shows Notification Preferences,
Security & Access, Instructions & Help, and About LittleEye (including Terms and
Privacy). The no-camera card returns to camera setup. Device and monitoring
categories appear after camera details are added. Sign out sits at the bottom of
Settings, asks for confirmation, clears the session and returns to the landing
page. Signing out or deleting the frontend account removes camera setup,
Settings, nested Settings pages, and other account screens from the stack.
Back cannot reveal them after logout. Profile and Settings also redirect to the
landing page when their session clears, so a cleared camera cannot send an
outgoing Profile screen back into Settings. The isolated sign-out component
remains disabled without a session; that preview footer is not an app destination.

Profile now follows the supplied Guardian, Child and Account & Privacy references.
`/profile` opens the guardian page; its Child's Profile button opens `/profile-child`
and Account & Privacy opens `/profile-account`. The connected preview parameter
is carried through all three pages and their fixed Settings gear buttons. The
guardian page keeps only the Child's Profile button floating at the bottom, with
no footer panel. Scroll content has space below it to clear the button and the
phone's bottom safe area. Guardian and child photos are separate; only
the guardian photo replaces the Settings header avatar. Profile name, email,
phone, shared address, birthdate, height and sex can be edited in the frontend
session. Password changes are unavailable until authentication is connected.
Guardian Profile shows only the first (primary) emergency contact. The Emergency
Contacts page keeps all contacts, up to three. Contact email is optional in setup
and Add/Edit; a supplied email must be valid and may use any domain.

In a development build, the existing mock sign-in supplies fictional guardian,
child and three emergency-contact details when account setup was skipped. This
lets the usual sign-in -> camera setup -> Home flow preview a filled profile,
the primary-contact row and the three-card contact list. The sample is defined
in `src/utils/preview-profile.ts`; one contact has no email to preview that case.
Sample creation happens only in the mock sign-in action; the session provider
and profile screens never substitute samples for missing account data. Account
setup supplies its entered details directly, including optional empty emails.
Editing or deleting preview contacts updates the current session normally;
signing out clears it, and the next mock sign-in creates a fresh sample.
Production builds do not supply these sample details. `?preview=connected`
supplies display-only camera details after frontend sign-in; it does not bypass
session requirements.

When connecting the backend, replace the mock `signIn()` action with real
authentication and profile loading. Only start a signed-in session after those
requests succeed. Store the returned profile in the session without using
`getMockSignInProfile()`; handle missing or failed data explicitly. Connect profile
and contact edits, photos, sign-out and account deletion to their persistence/auth
operations. The current state setters are in-memory frontend behavior and do not
write to a database. Camera connection and calling remain separate integrations.

These categories navigate to separate pages with back buttons: Device Information,
Image & Sound Settings, Network & Connection, Fall Detection & Alerts,
Security & Access, Instructions & Help, and About LittleEye.
Notification Preferences opens a centered popup with its preview switches and a
Close button; Android Back also dismisses it. Preview switches reset when the
popup closes. The network row uses a bundled SVG Wi-Fi icon.

Device Information and About LittleEye follow the supplied screen references.
You can preview them directly at `/settings-pages/device-information` and
`/settings-pages/about`. About links to separate App Version, System Information,
Privacy Policy and Terms of Service pages. All Settings pages share the same
session guard in development and production.

Camera renaming updates an existing camera in the frontend session. Device
specifications, live connection checks and detection results remain unavailable
until integrations supply them. Image controls and notification switches are
labeled previews and reset when you leave the section. They do not send camera
commands, alter the AI stream or deliver notifications. Live reconnect commands, password
updates and shared camera access remain unavailable. The Network page has a
Reconnect button that opens camera setup for a signed-in session; in the direct
development preview it displays a sign-in/setup notice. It does not send a live
reconnect command. Last checked and live availability remain unverified.
Signing out uses the
existing session action after confirmation. About shows the version from
package.json and separate pages for the existing Terms and Privacy content.

## Sign-out regression verification (2026-10-22)

`tests/session-sign-out.test.mjs` invokes the production confirmation buttons and
session provider, evaluates the production root layout's guards, and exercises
the StackRouter reducer installed with Expo Router 57. It covers development and
production, with/without a camera, sign-out/account deletion, nested account
history, blocked re-entry with preview params, Back after logout, and a fresh
sign-in returning to camera setup. `tests/settings-entry.test.mjs` also verifies
that signed-out Profile and Settings components return a landing redirect
before rendering the no-camera preview state.

The complete Node suite passes 129 tests. This is automated component/navigation
verification, not a manual Android/iOS device check.

The camera card uses `assets/images/littleeye-camera-4k.png`; camera setup uses
the bundled settings gear. No-camera Settings and its subpages only show a back
button in their navigation headers. Emergency Hotline, History,
Recorded Footage and First-Aid Guidance are not duplicated in Settings.
