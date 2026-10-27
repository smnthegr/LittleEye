import { Asset as BundledAsset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';


export async function requestRecordingSavePermission() {
  const permission = await requestPermissionsAsync(true, ['video']);
  if (!permission.granted) {
    throw new Error('Allow LittleEye to add videos to Photos/Gallery in your phone settings, then try again.');
  }
}

export async function saveSampleRecording(start: number, duration: number) {
  const { exportSampleRecording } = await import('@/utils/export-sample-recording');
  const sample = BundledAsset.fromModule(require('../../assets/sample-video.mp4'));
  await sample.downloadAsync();
  if (!sample.localUri) throw new Error('The sample video is not available on this device yet.');
  const bytes = await new File(sample.localUri).bytes();
  const recording = await exportSampleRecording(bytes, start, duration);
  const file = new File(Paths.cache, `LittleEye-${Date.now()}.mp4`);
  file.write(recording);
  await Asset.create(file.uri);
  // A cache-cleanup failure must not report a successfully saved gallery video as failed.
  try {
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Could not remove temporary recording:', error);
  }
  return 'Saved to Photos/Gallery';
}
