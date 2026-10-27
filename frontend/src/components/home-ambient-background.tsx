import { memo, useId } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { NAVIGATION_CONTOUR_PATH, NAVIGATION_SHAPE_PATH } from '@/utils/navigation-contour';

export const HomeAmbientColors = {
  top: '#2A517F',
  bottom: '#84B2DE',
  navigationTop: '#457FB5',
  navigationBottom: '#326DA5',
} as const;

// Svg forwards native-only accessibility props to the DOM on web.
const decorativeAccessibility = Platform.OS === 'web'
  ? { 'aria-hidden': true as const }
  : { accessible: false };

/** Blue lower surface with the original curved upper silhouette restored. */
export const HomeAmbientBackground = memo(function HomeAmbientBackground({
  canvasHeight, feedBottom, controlsCenter, controlsHeight, transitionHeight,
}: { canvasHeight: number; feedBottom: number; controlsCenter: number; controlsHeight: number; transitionHeight: number }) {
  const id = `home-ambient-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const gradientTop = Math.max(0, feedBottom - controlsHeight * 0.35);
  const gradientBottom = Math.max(gradientTop + 1, controlsCenter + controlsHeight * 0.55);
  return <Svg pointerEvents="none" {...decorativeAccessibility} style={StyleSheet.absoluteFill}
    width="100%" height="100%" viewBox={`0 0 390 ${Math.max(1, canvasHeight)}`} preserveAspectRatio="none">
    <Defs>
      <LinearGradient id={`${id}-upper`} x1={0} y1={0} x2={0} y2={440} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor={HomeAmbientColors.top} />
        <Stop offset={0.4} stopColor={HomeAmbientColors.top} />
        <Stop offset={0.65} stopColor="#355D87" stopOpacity={0.95} />
        <Stop offset={0.83} stopColor="#446D96" stopOpacity={0.65} />
        <Stop offset={1} stopColor="#557FA8" stopOpacity={0.15} />
      </LinearGradient>
      <LinearGradient id={`${id}-base`} x1={0} y1={gradientTop} x2={0} y2={gradientBottom} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor={HomeAmbientColors.top} />
        <Stop offset={0.24} stopColor="#355D8A" />
        <Stop offset={0.48} stopColor="#527FAB" />
        <Stop offset={0.72} stopColor="#709CC9" />
        <Stop offset={0.9} stopColor="#8FB3D9" />
        <Stop offset={1} stopColor={HomeAmbientColors.bottom} />
      </LinearGradient>
      <RadialGradient id={`${id}-left`} cx="50%" cy="50%" r="50%">
        <Stop offset={0} stopColor="#C2D7F3" stopOpacity={0.62} />
        <Stop offset={0.45} stopColor="#C2D7F3" stopOpacity={0.35} />
        <Stop offset={0.78} stopColor="#C2D7F3" stopOpacity={0.1} />
        <Stop offset={1} stopColor="#C2D7F3" stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id={`${id}-right`} cx="50%" cy="50%" r="50%">
        <Stop offset={0} stopColor="#2E5B8B" stopOpacity={0.38} />
        <Stop offset={0.55} stopColor="#2E5B8B" stopOpacity={0.16} />
        <Stop offset={1} stopColor="#2E5B8B" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Rect width={390} height={Math.max(1, canvasHeight)} fill={`url(#${id}-base)`} />
    <Ellipse cx={22} cy={controlsCenter + controlsHeight * 0.28} rx={340} ry={controlsHeight * 0.95} fill={`url(#${id}-left)`} />
    <Ellipse cx={420} cy={controlsCenter} rx={260} ry={controlsHeight * 0.9} fill={`url(#${id}-right)`} />
    <Path d="M0 0H390V335C353 344 318 361 282 389C234 426 179 443 126 428C73 413 29 383 0 350V0Z"
      transform={`scale(1 ${transitionHeight / 500})`} fill={`url(#${id}-upper)`} />
    <Path d="M0 83C32 77 49 80 78 99C111 121 140 131 175 119C208 107 222 93 253 98C294 104 312 139 345 150C362 156 377 158 390 158V258L0 228V83Z"
      transform={`scale(1 ${transitionHeight / 500})`} fill="#94B0D5" fillOpacity={0.27} />
  </Svg>;
});

/** Lives in the controls' own coordinate frame, so its light always follows the D-pad. */
export const HomeControlsAmbient = memo(function HomeControlsAmbient() {
  const id = `home-controls-ambient-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return <Svg pointerEvents="none" {...decorativeAccessibility} width="160%" height="155%"
    viewBox="0 0 390 350" preserveAspectRatio="none" style={styles.controlLight}>
    <Defs>
      <RadialGradient id={`${id}-light`} cx="50%" cy="50%" r="50%">
        <Stop offset={0} stopColor="#C8DDF4" stopOpacity={0.2} />
        <Stop offset={0.45} stopColor="#C8DDF4" stopOpacity={0.09} />
        <Stop offset={0.78} stopColor="#C8DDF4" stopOpacity={0.03} />
        <Stop offset={1} stopColor="#C8DDF4" stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id={`${id}-contact`} cx="50%" cy="50%" r="50%">
        <Stop offset={0} stopColor="#345D8A" stopOpacity={0.08} />
        <Stop offset={0.5} stopColor="#345D8A" stopOpacity={0.03} />
        <Stop offset={1} stopColor="#345D8A" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Ellipse cx={195} cy={175} rx={190} ry={170} fill={`url(#${id}-light)`} />
    <Ellipse cx={195} cy={247} rx={83} ry={17} fill={`url(#${id}-contact)`} />
  </Svg>;
});

/** Home-only palette on the existing navigation silhouette. Icons and routes stay outside. */
export const HomeNavigationSurface = memo(function HomeNavigationSurface({ width, height }: { width: number; height: number }) {
  const id = `home-navigation-ambient-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return <Svg pointerEvents="none" {...decorativeAccessibility} width={width} height={height * 136 / 120}
    viewBox="0 0 390 136" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
    <Defs>
      <LinearGradient id={id} x1={0} y1={40} x2={0} y2={120} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor={HomeAmbientColors.navigationTop} />
        <Stop offset={0.5} stopColor="#3B75AC" />
        <Stop offset={1} stopColor={HomeAmbientColors.navigationBottom} />
      </LinearGradient>
    </Defs>
    <Path d={NAVIGATION_SHAPE_PATH} fill={`url(#${id})`} />
    <Path d={NAVIGATION_CONTOUR_PATH} fill="none" stroke="#DCEFFF" strokeOpacity={0.25} strokeWidth={0.8} />
  </Svg>;
});

const styles = StyleSheet.create({ controlLight: { position: 'absolute', left: '-30%', top: '-27.5%' } });
