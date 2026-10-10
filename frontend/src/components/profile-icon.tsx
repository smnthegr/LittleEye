import { Image } from 'expo-image';

export type ProfileIconName = 'camera' | 'phone' | 'home' | 'lock' | 'mail' | 'calendar' | 'height' | 'sex' | 'edit';
const paths: Record<ProfileIconName, string> = {
  camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3Z"/><circle cx="12" cy="13" r="4"/>',
  phone: '<path d="M5 3h4l2 5-3 2c2 3 3 4 6 6l2-3 5 2v4c0 2-2 2-3 2C10 20 4 14 3 6c0-1 0-3 2-3Z"/>',
  home: '<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M12 14h2M17 14h1M7 18h2M12 18h2"/>',
  height: '<g transform="translate(3 0)"><rect x="9" y="3" width="7" height="18" rx="1"/><path d="M12 7h4M13 11h3M12 15h4M13 19h3M4 3v18m-2-2 2 2 2-2M2 5l2-2 2 2"/></g>',
  sex: '<circle cx="9" cy="10" r="5"/><path d="M9 15v7M6 19h6M13 6l7-4M16 2h4v4"/>',
  edit: '<path d="m4 16 12-12 4 4L8 20l-5 1 1-5ZM14 6l4 4"/>',
};
export function ProfileIcon({ name, size = 24, color = '#FFFFFF' }: { name: ProfileIconName; size?: number; color?: string }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
  return <Image accessible={false} source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }} style={{ width: size, height: size }} contentFit="contain" />;
}
