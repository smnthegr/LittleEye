import { useLocalSearchParams } from 'expo-router';
import { useAppSession } from '@/components/app-session';
import type { CameraDetails } from '@/constants/camera';

const previewCamera: CameraDetails = { name: 'LittleEye Camera 01', address: 'Sample device — no live stream', status: 'connected' };

/** Development-only display data. Never saves a camera or changes the session. */
export function useSettingsCamera() {
  const session = useAppSession();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const isPreview = __DEV__ && preview === 'connected';
  return { camera: isPreview ? previewCamera : session.camera, isPreview };
}
