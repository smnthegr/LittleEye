# Settings preview

Settings lives in `src/app/settings.tsx` and can be developed independently of Home.

## Open it in a browser

From `frontend`, run:

```sh
npm run web
```

Open the local URL printed by Expo and append `/settings` (for example,
`http://localhost:8081/settings`). You do not need to sign in or connect a camera
in a development build. Without camera setup details, Settings shows a
**No camera connected** card and the account/preference categories.

To see the complete menu with a sample connected camera, open
`http://localhost:8081/settings?preview=connected` (use your Expo server's port).
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

Production access requires a signed-in session and accepted policies. The page
reads the camera name and connection status from `useAppSession()`; preview
access does not change the session or bypass guards for other pages.

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
page. It is disabled when no account is signed in.

Profile now follows the supplied Guardian, Child and Account & Privacy references.
`/profile` opens the guardian page; its Child's Profile button opens `/profile-child`
and Account & Privacy opens `/profile-account`. The connected preview parameter
is carried through all three pages. Guardian and child photos are separate; only
the guardian photo replaces the Settings header avatar. Profile name, email,
phone, shared address, birthdate, height and sex can be edited in the frontend
session. Password changes are unavailable until authentication is connected.
Emergency contacts show the entries supplied during setup. No personal sample
data is inserted into an empty account.

These categories navigate to separate pages with back buttons: Device Information,
Image & Sound Settings, Network & Connection, Fall Detection & Alerts,
Security & Access, Instructions & Help, and About LittleEye.
Notification Preferences opens a centered popup with its preview switches and a
Close button; Android Back also dismisses it. Preview switches reset when the
popup closes. The network row uses a bundled SVG Wi-Fi icon.

Device Information and About LittleEye follow the supplied screen references.
You can preview them directly at `/settings-pages/device-information` and
`/settings-pages/about`. About links to separate App Version, System Information,
Privacy Policy and Terms of Service pages. All Settings pages share the development
preview guard and production session guard.

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

The camera card uses `assets/images/littleeye-camera-4k.png`; camera setup uses
the bundled settings gear. No-camera Settings and its subpages only show a back
button in their navigation headers. Emergency Hotline, History,
Recorded Footage and First-Aid Guidance are not duplicated in Settings.
