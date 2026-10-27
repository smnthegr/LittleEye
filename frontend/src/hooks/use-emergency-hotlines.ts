import { useAppSession } from '@/components/app-session';
import { getEmergencyDirectory, type EmergencyAreaChoice } from '@/utils/emergency-directory';

export function useEmergencyHotlines() {
  const { profile, updateProfile } = useAppSession();
  const address = profile?.guardian.address.trim() ?? '';
  const localityCode = profile?.guardian.addressDetails?.localityCode;
  const addressLocation = profile?.guardian.addressDetails?.deviceLocation;
  return {
    address,
    localityCode,
    addressLocation,
    choice: profile?.emergencyArea,
    directory: getEmergencyDirectory(address, profile?.emergencyArea, localityCode),
    canEdit: !!profile,
    changeArea: (choice: EmergencyAreaChoice | undefined) => {
      if (profile) updateProfile({ ...profile, emergencyArea: choice });
    },
  };
}
