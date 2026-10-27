import type { VideoSource } from 'expo-video';

import type { Severity } from '@/constants/first-aid';

/** Replace null with require('../../assets/videos/first-aid/mild.mp4') or { uri: 'https://…/mild.mp4' }. */
export const firstAidVideos: Record<Severity, VideoSource> = {
  Mild: null,
  Moderate: null,
  Severe: null,
};
