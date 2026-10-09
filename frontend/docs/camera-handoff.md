# Camera setup handoff

The flow is landing → policies → sign-in or sign-up/setup → `/connect-camera`.
Camera setup contains search and manual-entry UI only. There are no sample devices,
device tabs, bottom navigation, video previews or monitoring controls.

Network discovery is currently unavailable. The backend/native connection team
can replace the search notice in `src/app/connect-camera.tsx` with actual discovery
results and pass a selected device into the connection action.

`saveDetails()` currently validates a name and HTTP/HTTPS/RTSP address, saves
`{ name, address, status: 'pending' }` in the in-memory session and opens `/home`.
This previews navigation without claiming a successful connection. When the
connection service is ready, await its success before saving `status: 'connected'`
and opening Home; keep errors on the setup form. Never treat address validation
alone as proof that a camera has connected.

The Home owner should replace `src/app/home.tsx`, which contains only a destination
placeholder, and read camera information with `useAppSession().camera`. The small
mascot opens `/profile`. Signing out clears the profile and camera setup details.

## Profile mascot asset

`assets/images/peeka-profile-4k.png` is a 3840×2160 transparent PNG, upscaled directly
from the supplied `ui  (2).png` with bicubic interpolation. No features were redrawn
or colors remapped. Upscaling preserves existing source detail; it cannot recover
detail absent from that source. Display framing removes transparent margins in
the button without modifying the asset.

The camera setup button now uses `peeka-profile-light-horns-4k.png`, a sibling
version with the horn fill changed to the requested `#94B0D5`. Its remaining
artwork is preserved. The button displays the mascot at a smaller scale for padding.

`ProfileAvatar` now shares the selected photo between the header and Profile page.
It shows this mascot when no photo is set or a photo fails to load. Profile supports
image-only gallery selection, square cropping and removal through Expo ImagePicker.
Selection is local to the current in-memory session; no image upload is implemented.
During camera setup (including a pending camera), Profile shows only its page
heading, Terms & Privacy and Sign out. Photo editing and profile details become
available when the connection service sets the camera status to `connected`.
The temporary portrait was removed after the user approved the appearance.
New sessions use the mascot by default; selected user photos override it.

An imagegen enhancement was inspected but rejected because it shifted details.
Its prompt requested only 4K edge enhancement with the original silhouette, horns,
eye, smile, cheeks, spots and palette unchanged; the final asset uses the original
instead of that generated variant.
