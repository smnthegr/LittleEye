export const SettingsSections = {
  'device-information': 'Device Information',
  'network-connection': 'Network & Connection',
  'image-sound': 'Image & Sound Settings',
  'fall-detection': 'Fall Detection & Alerts',
  notifications: 'Notification Preferences',
  security: 'Security & Access',
  help: 'Instructions & Help',
  about: 'About LittleEye',
  'app-version': 'App Version',
  'system-information': 'System Information',
  'privacy-policy': 'Privacy Policy',
  'terms-of-service': 'Terms of Service',
} as const;

export type SettingsSection = keyof typeof SettingsSections;
