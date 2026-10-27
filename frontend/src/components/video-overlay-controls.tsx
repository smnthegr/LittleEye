import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { GlowButton } from '@/components/glow-button';
import { StatusDot } from '@/components/status-dot';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';

type VideoOverlayButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Shared surface and touch size for controls over live and recorded footage. */
export function VideoOverlayButton({ children, style, hitSlop, ...props }: VideoOverlayButtonProps) {
  return <GlowButton {...props} accessibilityRole="button" hitSlop={hitSlop ?? { top: 3, bottom: 3 }}
    style={[s.surface, s.button, style]}>{children}</GlowButton>;
}

export function VideoCloseButton({ accessibilityLabel = 'Close video', ...props }: Omit<VideoOverlayButtonProps, 'children'>) {
  return <VideoOverlayButton {...props} accessibilityLabel={accessibilityLabel}>
    <View pointerEvents="none" style={s.closeIcon}>
      <View style={[s.closeLine, s.closeLineOne]} /><View style={[s.closeLine, s.closeLineTwo]} />
    </View>
  </VideoOverlayButton>;
}

export function VideoTimelineButton({ expanded, onPress, label = 'playback', disabled = false }: { expanded: boolean; onPress: () => void; label?: string; disabled?: boolean }) {
  return <VideoOverlayButton accessibilityLabel={`${expanded ? 'Hide' : 'Show'} ${label} timeline`}
    accessibilityState={{ expanded, selected: expanded, disabled }} disabled={disabled} style={disabled && { opacity: 0.45 }} onPress={onPress}>
    <View pointerEvents="none" style={[s.timelineIcon, expanded && s.timelineIconSelected]}>
      <View style={[s.timelineTick, expanded && s.timelineTickSelected]} />
      <View style={[s.timelineTick, s.timelinePlayhead, expanded && s.timelineTickSelected]} />
      <View style={[s.timelineTick, expanded && s.timelineTickSelected]} />
    </View>
  </VideoOverlayButton>;
}

export function VideoStatusBadge({ label, active, onPress, hint }: {
  label: 'LIVE' | 'Recorded' | 'Offline'; active: boolean; onPress?: () => void; hint?: string;
}) {
  return <VideoBadge label={label} active={active} onPress={onPress} hint={hint}
    color={label === 'Offline' ? '#9BAFC6' : label === 'LIVE' ? '#00E886' : '#E53935'} />;
}

/** Shared badge for footage status and instructional-video severity. */
export function VideoBadge({ label, color, active = false, onPress, hint }: {
  label: string; color: string; active?: boolean; onPress?: () => void; hint?: string;
}) {
  const children = <>
    <StatusDot color={color} size={8} active={active} />
    <Text style={s.label}>{label}</Text>
    {hint && <Text style={s.hint}>{hint}</Text>}
  </>;
  return onPress ? <GlowButton accessibilityRole="button" accessibilityLabel={hint ?? label}
    onPress={onPress} style={[s.surface, s.badge]}>{children}</GlowButton>
    : <View pointerEvents="none" style={[s.surface, s.badge]}>{children}</View>;
}

const s = StyleSheet.create({
  surface: { minHeight: 44, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.45)' },
  button: { flexShrink: 0, width: 44, minHeight: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  badge: { flexShrink: 1, minWidth: 0, minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 5 },
  label: { flexShrink: 1, minWidth: 0, color: C.white, fontFamily: F.bold, fontSize: 12, lineHeight: 18 },
  hint: { flexShrink: 1, minWidth: 0, color: '#DAE7F8', fontFamily: F.semiBold, fontSize: 11, lineHeight: 18 },
  closeIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  closeLine: { position: 'absolute', width: 20, height: 2, borderRadius: 1, backgroundColor: C.white },
  closeLineOne: { transform: [{ rotate: '45deg' }] },
  closeLineTwo: { transform: [{ rotate: '-45deg' }] },
  timelineIcon: { width: 21, height: 15, borderRadius: 3, borderWidth: 1.5, borderColor: C.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  timelineIconSelected: { borderColor: '#BBD6F7' },
  timelineTick: { width: 1.5, height: 6, borderRadius: 1, backgroundColor: C.white },
  timelineTickSelected: { backgroundColor: '#BBD6F7' },
  timelinePlayhead: { height: 19, width: 2 },
});
