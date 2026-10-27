# Camera setup handoff

For the current frontend menu integration, see [frontend-handoff.md](frontend-handoff.md).

The flow is landing -> policies -> sign-in or sign-up/setup -> `/connect-camera`.
Camera setup contains search and manual-entry UI. Its gear shortcut opens Settings.

Network discovery is currently unavailable. `saveDetails()` validates a name and
HTTP/HTTPS/RTSP address, saves `{ name, address, status: 'pending' }` in the
in-memory session and opens `/home`. This previews navigation without claiming
that a camera has successfully connected. Home can read `useAppSession().camera`.

Both teammates are currently building frontend. The Home owner can replace
`src/app/home.tsx` and connect Profile and Settings with the existing routes.
No backend work is required to connect those menu buttons.

When backend/camera integration starts, await connection success before saving
`status: 'connected'`. Keep connection errors on the setup form. Address
validation alone does not establish a connection.

## Video availability

Home's sample video, fake footage images, simulated first-aid playback and the
sample Playback entry have been removed. Home shows an offline
video empty state until the camera adapter supplies a real source. Home controls
remain enabled and at full opacity; the camera setup flow gates entry to Home.
Recording currently reports that it is unavailable until real camera recording
is connected. No fabricated recording is created.
Playback and Events remain empty until actual recording/event data is supplied.
First-aid guidance keeps its written instructions and signs; it shows a video
unavailable state instead of a simulated demonstration. Its landscape button
works with or without a clip, and the landscape X button returns to the
selected severity in portrait. See [first-aid-videos.md](first-aid-videos.md) to
add real instructional clips.

The shared player accepts an explicit media source and does not loop fabricated
footage or preload media in an empty viewer. Timeline strips no longer repeat a
fake footage thumbnail. Recording metadata accepts actual video and thumbnail
URIs. Connected-device preview details have intentionally been left unchanged.
Existing media-export utilities and sample assets remain available to automated
tests. Video screens require real sources; the temporary event preview has been
removed.

## Fall alert integration

The temporary alert preview button has been removed from Home. The app still
mounts `FallAlertProvider` in `src/app/_layout.tsx`. The alert modal, looping
sound, dismiss action, and emergency-call flow remain in
`src/components/fall-alert.tsx`.

A camera or detection adapter rendered under that provider can use
`useFallAlert()` and call its `showFallAlert()` function when a confirmed fall
event arrives. This is the existing alert entry point; no preview button is
needed. The camera/detector event source is not connected yet.

History reads real incidents from `useAppSession().fallEvents`. The future
authenticated backend adapter supplies ready, physically trimmed clips through
`recordFallEvent(record)` or hydrates history through `replaceFallEvents(records)`.
The UI automatically renders Fall Detected cards and separates the real detection
time from the fall's offset within the short file.
See [fall-event-integration.md](fall-event-integration.md)
for the typed payload, recording flow, alert timing, clip clock and integration
responsibilities. The frontend does not create or infer real fall incidents.

## Profile and Settings

`/profile` shows Guardian's Profile and links to `/profile-child` and
`/profile-account`. The profile pages and Settings share the existing session.
Guardian Profile shows only the primary (first) emergency contact; all saved
contacts remain on the Emergency Contacts page. Add/Edit Contact accepts an
empty email and validates it only when supplied, without a Gmail-only rule.
Development mock sign-ins that skip setup use fictional profile details and
three contacts from `src/utils/preview-profile.ts` for layout review. Samples are
created only by the mock sign-in action; the session provider never fills a
missing profile with samples. Setup supplies its entered data directly. Production
builds do not supply sample details. Backend authentication must replace the mock
sign-in and load the real profile; frontend state changes still need persistence.
Profile supports separate guardian and child photos, local gallery selection,
square cropping, removal and editing profile details. `ProfileAvatar` displays
the selected guardian photo or the default mascot. Photos and changes last for
the current session; persistence and uploads are not implemented.

Settings automatically shows account/preferences without camera details and
the complete menu after a camera is added. Its sign-out confirmation clears the
session and returns to the landing page. Terms and Privacy remain in About
LittleEye. Sign-out removes camera setup, Settings and other account screens
from navigation history in development and production, so the landing page is
shown immediately and Back cannot return to a signed-out Settings preview.
The development query `?preview=connected` still supports layout review after
sign-in; it does not bypass the session guard. The in-app preview button has
been removed.
