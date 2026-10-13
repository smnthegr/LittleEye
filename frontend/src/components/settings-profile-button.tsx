import { useResponsiveLayout, useResponsiveStyles } from '@/hooks/use-responsive-layout';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { GlowButton } from './glow-button';
import { ProfileAvatar } from './profile-avatar';
import { useSettingsCamera } from '@/hooks/use-settings-camera';
import { getPageHeaderLayout } from '@/utils/responsive';

export function SettingsProfileButton() {
  const s = useResponsiveStyles(baseStyles);
  const { pageWidth, insets } = useResponsiveLayout();
  const { buttonSize } = getPageHeaderLayout(pageWidth, insets.top);
  const { isPreview } = useSettingsCamera();
  return <GlowButton accessibilityRole="button" accessibilityLabel="Open your profile"
    onPress={() => router.push({ pathname: '/profile', params: isPreview ? { preview: 'connected' } : {} })}
    style={[s.button, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}><ProfileAvatar size={40} /></GlowButton>;
}

const baseStyles = StyleSheet.create({
  button: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(148,176,213,.22)',
    borderWidth: 1, borderColor: 'rgba(148,176,213,.45)', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 20px 5px rgba(148,176,213,.32), 0 5px 14px rgba(24,42,67,.16)' },
});
