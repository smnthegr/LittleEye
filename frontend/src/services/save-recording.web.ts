import { Asset } from 'expo-asset';

export async function requestRecordingSavePermission() {}

export async function saveSampleRecording(start: number, duration: number) {
  const { exportSampleRecording } = await import('@/utils/export-sample-recording');
  const asset = Asset.fromModule(require('../../assets/sample-video.mp4'));
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error('The sample video could not be loaded.');
  const recording = await exportSampleRecording(new Uint8Array(await response.arrayBuffer()), start, duration);
  const url = URL.createObjectURL(new Blob([recording as Uint8Array<ArrayBuffer>], { type: 'video/mp4' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `LittleEye-${Date.now()}.mp4`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return 'Recording downloaded';
}
