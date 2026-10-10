import { StyleSheet, View, type PressableProps } from 'react-native';
import { BrandColors } from '@/constants/brand';
import { GlowButton } from './glow-button';

type Props = Omit<PressableProps, 'children'> & { light?: boolean };

// Shared Sign Up / Set Up design, including GlowButton's ripple and press glow.
export function BackButton({ light = false, style, accessibilityLabel = 'Go back', ...props }: Props) {
  return <GlowButton {...props} accessibilityRole="button" accessibilityLabel={accessibilityLabel}
    hitSlop={props.hitSlop ?? 12}
    style={state => [s.button, light && s.light, typeof style === 'function' ? style(state) : style]}>
    <View pointerEvents="none" style={[s.arrow, light && s.lightArrow]} />
  </GlowButton>;
}

const s = StyleSheet.create({
  button: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  arrow: { width: 12, height: 12, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: BrandColors.white, transform: [{ rotate: '45deg' }], marginLeft: 6 },
  light: { backgroundColor: 'rgba(148,176,213,0.2)' }, lightArrow: { borderColor: BrandColors.blue },
});
