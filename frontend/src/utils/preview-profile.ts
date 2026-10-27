import type { Profile } from '../components/app-session';

/** Called only by the explicit mock sign-in, never when reading account state. */
export function getMockSignInProfile(development: boolean): Profile | undefined {
  return development ? createPreviewProfile() : undefined;
}

/** Fictional, editable display data for development sign-ins that skip account setup. */
export function createPreviewProfile(): Profile {
  return {
    guardian: {
      fullName: 'Alex Reyes', phone: '09000000001',
      email: 'alex.reyes@example.com', address: 'Unit 12B, Building 3, Block 8 Lot 24, Sampaguita Street, Barangay Commonwealth, Quezon City, Metro Manila, Philippines',
    },
    child: { fullName: 'Mika Reyes', birthdate: '08/15/2023', height: '95', sex: 'Female' },
    contacts: [
      { fullName: 'Jamie Reyes', phone: '09000000002', email: 'jamie.reyes@example.com', address: 'Quezon City, Metro Manila' },
      { fullName: 'Sam Cruz', phone: '09000000003', email: '', address: 'Marikina City, Metro Manila' },
      { fullName: 'Taylor Santos', phone: '09000000004', email: 'taylor.santos@example.com', address: 'Pasig City, Metro Manila' },
    ],
  };
}
