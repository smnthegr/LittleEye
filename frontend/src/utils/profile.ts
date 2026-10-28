import type { Profile } from '../components/app-session';

/** A real, incomplete frontend profile; never fills missing data with samples. */
export function createEmptyProfile(): Profile {
  return {
    guardian: { fullName: '', phone: '', email: '', address: '' },
    child: { fullName: '', birthdate: '', height: '', sex: '' },
    contacts: [],
  };
}
