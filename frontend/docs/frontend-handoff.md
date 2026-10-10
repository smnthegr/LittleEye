# Frontend menu handoff

Both teammates are working on frontend only. Backend integration is a later
task. Home is currently a placeholder in `src/app/home.tsx`; replace its contents
with the Home screen and menu. Keep the root `AppSessionProvider` and existing
route guards in `src/app/_layout.tsx`.

## Connect the existing menu items

```tsx
import { router } from 'expo-router';

// Profile menu item
router.push('/profile');

// Settings menu item
router.push('/settings');
```

Use these normal routes from Home without a preview query parameter. Profile
links to `/profile-child` and `/profile-account`; Settings already links to its
subpages and opens Notification Preferences as a popup. Their Back buttons return
to the previous page, including Home when opened from its menu. Settings supports
both no-camera and camera-added layouts automatically. The preview button is gone.

Emergency Hotline, First-aid Guidance and History are not implemented yet. Create
those screens in `src/app/`, register their names inside the signed-in/accepted
`Stack.Protected` group in `_layout.tsx`, and connect their menu buttons with
`router.push()` using the actual filenames. They do not need placeholder links
or changes to the completed Profile and Settings screens.

## Share the existing frontend state

```tsx
import { useAppSession } from '@/components/app-session';

const session = useAppSession();
// session.profile?.guardian: fullName, phone, email, address
// session.profile?.child: fullName, birthdate, height (cm), sex
// session.profile?.contacts: emergency contacts entered during setup
// session.camera: name, address, status
// session.profilePhoto: guardian photo URI
// session.childPhoto: child photo URI
```

Use `session.profile?.contacts` when building Emergency Hotline so it uses the
same contacts entered during setup. Read the profile from context instead of
copying it into another provider. `updateProfile(nextProfile)` replaces the
profile, so preserve the guardian, child and contacts that are not being edited.
Profile edits update this shared state immediately. Guardian and child photos
are separate, and sign-out clears both along with profile and camera details.

State currently lasts only for the running session and resets when the app
restarts. No accounts are authenticated and no photos are uploaded.

## Reuse the visual components

- `BackButton`: the shared circular back button with glow/ripple effects. Use
  `light` on white backgrounds and omit it on blue backgrounds; supply `onPress`.
- `ProfileAvatar`: mascot by default, selected guardian photo when available.
  Use it inside your Home profile button instead of a separate image state.
- `GlowButton`: existing animated press effects for other buttons.
- `BrandColors` / `BrandFonts`: the existing palette and typography.

The camera setup shortcut remains a Settings gear. Connected-layout Settings
and its subpages have the mascot/photo Profile shortcut.

## Current frontend boundaries

Camera setup saves validated details with `status: 'pending'` and opens Home;
the full camera settings menu appears when camera details exist. This is a
frontend navigation flow, not proof of a live connection. Do not needlessly set
`status: 'connected'` just to display Home or link the menu. A future camera
service will set that status when it has established a connection.

Settings image/audio and notification controls are UI previews that reset on
leaving the section. Reconnect opens camera setup. Live video, detection results,
notification delivery, camera commands, authentication/password changes and
sharing will be connected later. History should have an appropriate empty state
until incidents are supplied; no incident feed exists yet.

## Verification

Run typecheck and lint from `frontend`. Currently typecheck passes; lint has an
existing `react-hooks/set-state-in-effect` error in `use-color-scheme.web.ts`.
