// Replace these preview details and policies before releasing the connected app.
export const PolicyDetails = {
  operator: 'LittleEye Team',
  contact: 'privacy@littleeye.example', // Reserved example domain; not a working inbox.
  version: 'Preview v0.1',
};

export const Policies = {
  terms: [
    ['Welcome to LittleEye', 'LittleEye is a companion interface for guardians to set up a child profile and manage authorized cameras. These preview terms describe this frontend build. The operator name and privacy contact are placeholders pending finalization.'],
    ['Who may use the app', 'Profile setup is intended for an adult parent or authorized guardian of a child aged 1–4. Enter information you are authorized to provide, including emergency contact details. Children should not create or manage accounts themselves.'],
    ['Your cameras, your permission', 'Only add cameras you own or have explicit permission to use. Do not access another person’s device or record private spaces without authorization. Let people who may be filmed know about your camera use and follow applicable local requirements.'],
    ['This frontend preview', 'Sign-in and setup demonstrate the app flow; they do not create or verify an account. Camera search and connection are not yet available. You can enter setup details and continue to a Home placeholder. This build does not discover nearby cameras, connect to camera streams, record footage or send camera commands. Do not enter real camera credentials.'],
    ['Supervision and emergencies', 'LittleEye does not replace adult supervision, medical care or emergency services. A future camera feed or alert may be unavailable or delayed. If a child needs urgent help, seek appropriate emergency assistance directly.'],
    ['Responsible use', 'Use accurate information and respect the privacy of children, contacts and anyone within camera view. Do not use the app for unauthorized surveillance, harassment or sharing footage without permission.'],
    ['Changes and questions', `Before connected features are released, the team must finalize its operator details, support contact and terms for those features. You will need to review updated policies when they change. Preview contact: ${PolicyDetails.contact} (placeholder only; no messages are delivered).`],
  ],
  privacy: [
    ['Your privacy at a glance', 'This notice describes the current frontend preview of LittleEye, operated under the placeholder name LittleEye Team. It is not a description of a future backend or camera service. Contact details and production data practices must be finalized before release.'],
    ['Information you enter', 'Setup fields include guardian name, contact number, email and address; child name, birthdate, height and sex; and up to three emergency contacts. Emergency contact email is optional. You may optionally choose a profile photo. Camera setup accepts a device name and address for a local preview only.'],
    ['What this build does with it', 'Form values, the completed profile, policy acceptance and camera setup details are held in app memory during the current session. This flow does not send them to an application backend or database. Restarting or reloading the app resets this preview session. Password values are not copied into the profile or camera state. Selected profile photos are displayed locally and are not uploaded. The photo picker may create temporary cached copies on your device; the selected photo reference is cleared when you sign out or reload.'],
    ['Cameras and permissions', 'This build does not scan your network, request location or camera access, access live CCTV footage, make recordings or transmit camera commands. Do not submit camera passwords or other sensitive credentials in this preview.'],
    ['Children and other people', 'A guardian should provide only information they are authorized to share. Obtain permission from emergency contacts before adding their details. Consider the privacy of children and other people when positioning or using cameras.'],
    ['Your choices', 'You can view the landing page before agreeing. Selecting Get Started opens these notices before sign-in. On Android, declining requests an immediate app exit; on iOS and web, it returns to the landing page. Sign-in and the rest of the app require acceptance. You can review these notices from your profile. Signing out clears the completed profile and clears camera setup details; restarting clears all session data.'],
    ['Before the connected release', `The final notice must identify the actual operator and privacy contact, what data is collected and why, recipients, retention periods, safeguards and how people can exercise their rights. Connected authentication, discovery, footage and database storage require a notice that reflects their actual behavior. Preview contact: ${PolicyDetails.contact} (placeholder only; not an active inbox).`],
  ],
} as const;
