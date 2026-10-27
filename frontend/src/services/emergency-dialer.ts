import { Alert, Linking } from 'react-native';
import type { EmergencyHotline } from '@/constants/emergency-hotlines';
import { getEmergencyDialUrl } from '@/utils/emergency-directory';

/** Invoked only by a user tap. The OS handles dialing; the app never claims a connection. */
export async function openEmergencyDialer(hotline: EmergencyHotline) {
  let url: string;
  try { url = getEmergencyDialUrl(hotline); }
  catch {
    Alert.alert('Hotline unavailable', 'Choose a number from the reviewed emergency directory.');
    return;
  }
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Open your phone app', `Dial ${hotline.number} for ${hotline.name}. This device could not open the phone dialer.`, [{ text: 'OK' }]);
  }
}

export async function openHotlineSource(url: string) {
  try { await Linking.openURL(url); }
  catch { Alert.alert('Source could not open', 'Please try again when a browser and internet connection are available.'); }
}
