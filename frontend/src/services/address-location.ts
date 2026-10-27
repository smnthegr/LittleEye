import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { phoneAddress } from '@/utils/phone-address';
import type { AddressDeviceLocation, PhilippineAddress } from '@/utils/philippine-address';

export type AddressLocationResult = { deviceLocation: AddressDeviceLocation; address?: PhilippineAddress; notice?: string };

function checkCancelled(signal: AbortSignal) {
  if (signal.aborted) throw new Error('Location request cancelled.');
}

function bounded<T>(task: () => Promise<T>, signal: AbortSignal, duration: number, message: string) {
  checkCancelled(signal);
  let timeout: ReturnType<typeof setTimeout>;
  let abort: () => void;
  const stopped = new Promise<never>((_, reject) => {
    abort = () => reject(new Error('Location request cancelled.'));
    signal.addEventListener('abort', abort, { once: true });
    timeout = setTimeout(() => reject(new Error(message)), duration);
  });
  // Native requests cannot be stopped; ignore late completion after cancel/timeout.
  return Promise.race([Promise.resolve().then(() => { checkCancelled(signal); return task(); }), stopped])
    .finally(() => { clearTimeout(timeout); signal.removeEventListener('abort', abort); });
}

/** One button press obtains GPS and a postal address from the phone's native geocoder. */
export async function requestAddressLocation(signal: AbortSignal): Promise<AddressLocationResult> {
  checkCancelled(signal);
  if (!await Location.hasServicesEnabledAsync()) throw new Error('Turn on location services.');
  checkCancelled(signal);
  const permission = await Location.requestForegroundPermissionsAsync();
  checkCancelled(signal);
  if (!permission.granted) throw new Error(permission.canAskAgain ? 'Allow location access to use GPS.' : 'Enable location permission in Settings.');
  if (permission.android?.accuracy === 'coarse' || permission.ios?.accuracy === 'reduced') {
    throw new Error('Enable precise location in Settings.');
  }
  let position: Location.LocationObject;
  try { position = await bounded(() => Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, mayShowUserSettingsDialog: true }), signal, 20_000, 'Location timed out; try again.'); }
  catch (error) {
    if (error instanceof Error && /cancelled|timed out/.test(error.message)) throw error;
    throw new Error('Could not get your location; try outdoors.');
  }
  checkCancelled(signal);
  const { latitude, longitude, accuracy } = position.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new Error('Could not read your GPS location.');
  }
  if (!Number.isFinite(position.timestamp) || Date.now() - position.timestamp > 120_000 || position.timestamp > Date.now() + 10_000) {
    throw new Error('Location is outdated; try again.');
  }
  if (accuracy === null || !Number.isFinite(accuracy) || accuracy < 0) throw new Error('GPS accuracy is unavailable; try again.');
  if (accuracy > 100) throw new Error(`GPS accuracy is ±${Math.ceil(accuracy)} m; try outdoors.`);
  const deviceLocation = { latitude, longitude, accuracyMeters: accuracy, capturedAt: new Date(position.timestamp).toISOString() };
  if (Platform.OS === 'web') return { deviceLocation, notice: 'Address autofill is available in the mobile app.' };
  try {
    const results = await bounded(() => Location.reverseGeocodeAsync({ latitude, longitude }), signal, 8000, 'Address lookup timed out.');
    checkCancelled(signal);
    const address = results.map(phoneAddress).find(item => item?.addressLevel === 'street') ?? results.map(phoneAddress).find(Boolean);
    if (address) return { deviceLocation, address,
      ...(address.addressLevel === 'area' && { notice: 'Street unavailable; add your street address.' }),
    };
    if (results.some(item => item.isoCountryCode && item.isoCountryCode.toUpperCase() !== 'PH')) throw new Error('Current location is outside the Philippines.');
  } catch (error) {
    checkCancelled(signal);
    if (error instanceof Error && error.message === 'Current location is outside the Philippines.') throw error;
  }
  return { deviceLocation, notice: 'Address unavailable; enter your full address.' };
}
