import { memo, useId, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, FeDropShadow, Filter, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { NAVIGATION_CONTOUR_PATH, NAVIGATION_SHAPE_PATH } from '@/utils/navigation-contour';

type NavigationBackdropProps = {
  width: number;
  height: number;
  children?: ReactNode;
};

/** The bar and its animation share this exact curve; no image assets are used. */
export function NavigationBackdrop({ width, height, children }: NavigationBackdropProps) {
  const shapeId = `navigation-shape-${useId().replace(/:/g, '')}`;

  return (
    <View pointerEvents="none" style={{ width, height }}>
      <NavigationBackdropSurface width={width} height={height} />
      <Svg style={styles.layer} width={width} height={height} viewBox="0 0 390 120" preserveAspectRatio="none">
        <Defs>
          <ClipPath id={shapeId}>
            <Path d={NAVIGATION_SHAPE_PATH} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${shapeId})`}>{children}</G>
      </Svg>
    </View>
  );
}

// Keep the filtered surface separate from the moving indicator so its shadow
// does not have to be redrawn with every animation frame.
const NavigationBackdropSurface = memo(function NavigationBackdropSurface({ width, height }: Omit<NavigationBackdropProps, 'children'>) {
  const id = useId().replace(/:/g, '');
  const fillId = `navigation-fill-${id}`;
  const shadowId = `navigation-shadow-${id}`;

  return (
    <Svg style={styles.layer} width={width} height={height} viewBox="0 0 390 120" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#3B5D88" />
          <Stop offset="1" stopColor="#32507B" />
        </LinearGradient>
        <Filter id={shadowId} x="-15%" y="-35%" width="130%" height="170%">
          <FeDropShadow dx={0} dy={-3} stdDeviation={4} floodColor="#102C4C" floodOpacity={0.18} />
        </Filter>
      </Defs>
      <Path d={NAVIGATION_SHAPE_PATH} fill={`url(#${fillId})`} filter={`url(#${shadowId})`} />
      <Path d={NAVIGATION_CONTOUR_PATH} fill="none" stroke="#F1F8FF" strokeOpacity={0.12} strokeWidth={0.75} />
    </Svg>
  );
});

/** A diffuse pool of light behind the menu, without a visible ring or edge. */
export function NavigationMenuGlow({ width, height }: { width: number; height: number }) {
  const glowId = `navigation-menu-glow-${useId().replace(/:/g, '')}`;

  return (
    <Svg width={width} height={height} viewBox="0 0 160 128" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id={glowId} cx="80" cy="64" rx="78" ry="62" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#A7DFFF" stopOpacity={0.4} />
          <Stop offset="0.35" stopColor="#A7DFFF" stopOpacity={0.25} />
          <Stop offset="0.65" stopColor="#A7DFFF" stopOpacity={0.1} />
          <Stop offset="0.83" stopColor="#A7DFFF" stopOpacity={0.025} />
          <Stop offset="1" stopColor="#A7DFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={160} height={128} fill={`url(#${glowId})`} />
    </Svg>
  );
}

type NavigationIconProps = {
  name: 'home' | 'first-aid';
  size: number;
  color?: string;
};

/** A matched pair of rounded outlines, drawn on the same optical grid. */
export function NavigationIcon({ name, size, color = '#FFFFFF' }: NavigationIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <G stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        {name === 'home' ? (
          <>
            <Path d="M 4.25 12 L 12.35 4.95 Q 14 3.5 15.65 4.95 L 23.75 12" />
            <Path d="M 7 10.15 V 22.3 Q 7 24 8.7 24 H 11 V 18 Q 11 16.7 12.3 16.7 H 15.7 Q 17 16.7 17 18 V 24 H 19.3 Q 21 24 21 22.3 V 10.15" />
          </>
        ) : (
          <>
            <Rect x={4.5} y={9} width={19} height={15} rx={3.1} />
            <Path d="M 10 9 V 6.4 Q 10 4.8 11.6 4.8 H 16.4 Q 18 4.8 18 6.4 V 9" />
            <Path d="M 14 13 V 20 M 10.5 16.5 H 17.5" />
          </>
        )}
      </G>
    </Svg>
  );
}

/** The fixed center control is drawn with gradients rather than a glass PNG. */
export function NavigationMenuArtwork({ size }: { size: number }) {
  const id = useId().replace(/:/g, '');
  const depthId = `navigation-menu-depth-${id}`;
  const lightId = `navigation-menu-light-${id}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 92 92" fill="none">
      <Defs>
        <LinearGradient id={depthId} x1="20" y1="2" x2="67" y2="90" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#496F9B" />
          <Stop offset="0.5" stopColor="#315780" />
          <Stop offset="1" stopColor="#234367" />
        </LinearGradient>
        <RadialGradient id={lightId} cx="26" cy="16" rx="60" ry="65" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#C8E9FF" stopOpacity={0.2} />
          <Stop offset="0.58" stopColor="#C8E9FF" stopOpacity={0.04} />
          <Stop offset="1" stopColor="#C8E9FF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={46} cy={46} r={44.8} fill={`url(#${depthId})`} />
      <Circle cx={46} cy={46} r={44.8} fill={`url(#${lightId})`} />
      <Circle cx={46} cy={46} r={44.8} stroke="#D7EDFF" strokeOpacity={0.3} strokeWidth={0.8} />
      <Path d="M 57 6.5 A 41 41 0 0 1 75 17.5" stroke="#F4FAFF" strokeOpacity={0.33} strokeWidth={2.8} strokeLinecap="round" />
      <G fill="#FFFFFF">
        <Rect x={26.5} y={26.5} width={17} height={17} rx={4} />
        <Rect x={48.5} y={26.5} width={17} height={17} rx={4} />
        <Rect x={26.5} y={48.5} width={17} height={17} rx={4} />
        <Rect x={48.5} y={48.5} width={17} height={17} rx={4} />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0 },
});
