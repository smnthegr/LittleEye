export type CameraDetails = { name: string; address: string; status: 'pending' | 'connected' };

export function validCameraAddress(value: string) {
  try {
    const address = new URL(value.trim());
    return ['rtsp:', 'http:', 'https:'].includes(address.protocol) && !!address.hostname
      && !address.username && !address.password;
  } catch { return false; }
}
