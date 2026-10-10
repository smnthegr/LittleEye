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

## Profile and Settings

`/profile` shows Guardian's Profile and links to `/profile-child` and
`/profile-account`. The profile pages and Settings share the existing session.
Profile supports separate guardian and child photos, local gallery selection,
square cropping, removal and editing profile details. `ProfileAvatar` displays
the selected guardian photo or the default mascot. Photos and changes last for
the current session; persistence and uploads are not implemented.

Settings automatically shows account/preferences without camera details and
the complete menu after a camera is added. Its sign-out confirmation clears the
session and returns to the landing page. Terms and Privacy remain in About
LittleEye. The development query `?preview=connected` still supports layout
review, but the in-app preview button has been removed.