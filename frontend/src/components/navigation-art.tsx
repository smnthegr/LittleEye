import { memo, useId, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, FeDropShadow, Filter, G, LinearGradient, Mask, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { interpolate, useAnimatedProps, type SharedValue } from 'react-native-reanimated';

import { NAVIGATION_CONTOUR_PATH, NAVIGATION_SHAPE_PATH } from '@/utils/navigation-contour';
import { HomeNavigationSurface } from '@/components/home-ambient-background';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedGroup = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function WaterRing({ progress, index, x, y, radius = 110 }: {
  progress: SharedValue<number>; index: number; x: number; y: number; radius?: number;
}) {
  const gradientId = `water-wave-${useId().replace(/:/g, '')}`;
  const props = useAnimatedProps(() => {
    const wave = Math.max(0, Math.min(1, progress.get() * 1.2 - index * 0.2));
    return {
      r: 8 + wave * radius,
      opacity: Math.min(1, wave / 0.12) * Math.min(1, (1 - wave) / 0.25) * 0.22,
    };
  });
  return <>
    <Defs>
      <RadialGradient id={gradientId} cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0" stopColor="#BFE8FF" stopOpacity={0.06} />
        <Stop offset="0.35" stopColor="#BFE8FF" stopOpacity={0.12} />
        <Stop offset="0.6" stopColor="#BFE8FF" stopOpacity={0.5} />
        <Stop offset="0.78" stopColor="#BFE8FF" stopOpacity={0.28} />
        <Stop offset="1" stopColor="#BFE8FF" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <AnimatedCircle animatedProps={props} cx={x} cy={y} fill={`url(#${gradientId})`} />
  </>;
}

/** Light the whole tapped side, following the rim through the safe-area footer. */
export function NavigationSideTapEffect({ width, height, artworkHeight, home, aid, homeRipple, aidRipple, sideCenter }: {
  width: number;
  height: number;
  artworkHeight: number;
  home: SharedValue<number>;
  aid: SharedValue<number>;
  homeRipple: SharedValue<number>;
  aidRipple: SharedValue<number>;
  sideCenter: number;
}) {
  const id = useId().replace(/:/g, '');
  const canvasHeight = height * 120 / artworkHeight;
  const homeProps = useAnimatedProps(() => ({ opacity: home.get() }));
  const aidProps = useAnimatedProps(() => ({ opacity: aid.get() }));

  return <Svg width={width} height={height} viewBox={`0 0 390 ${canvasHeight}`} preserveAspectRatio="none">
    <Defs>
      <ClipPath id={`tap-shape-${id}`}>
        <Path d={`${NAVIGATION_CONTOUR_PATH} V ${canvasHeight} H 0 Z`} />
      </ClipPath>
      <LinearGradient id={`tap-home-${id}`} x1={0} x2={195} y1={0} y2={0} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#BFE8FF" stopOpacity={0.24} />
        <Stop offset="0.55" stopColor="#85D2FF" stopOpacity={0.2} />
        <Stop offset="1" stopColor="#85D2FF" stopOpacity={0} />
      </LinearGradient>
      <LinearGradient id={`tap-aid-${id}`} x1={390} x2={195} y1={0} y2={0} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#BFE8FF" stopOpacity={0.24} />
        <Stop offset="0.55" stopColor="#85D2FF" stopOpacity={0.2} />
        <Stop offset="1" stopColor="#85D2FF" stopOpacity={0} />
      </LinearGradient>
    </Defs>
    <G clipPath={`url(#tap-shape-${id})`}>
      <AnimatedGroup animatedProps={homeProps}>
        <Rect width={195} height={canvasHeight} fill={`url(#tap-home-${id})`} />
      </AnimatedGroup>
      <AnimatedGroup animatedProps={aidProps}>
        <Rect x={195} width={195} height={canvasHeight} fill={`url(#tap-aid-${id})`} />
      </AnimatedGroup>
      {[0, 1].map(index => <WaterRing key={`home-${index}`} progress={homeRipple}
        index={index} x={sideCenter} y={84} />)}
      {[0, 1].map(index => <WaterRing key={`aid-${index}`} progress={aidRipple}
        index={index} x={390 - sideCenter} y={84} />)}
    </G>
  </Svg>;
}

type NavigationBackdropProps = {
  width: number;
  height: number;
  children?: ReactNode;
  homeAmbient?: boolean;
};

/** The exact navbar silhouette casts this shadow; its parent pulses opacity. */
export const NavigationBackdropShadow = memo(function NavigationBackdropShadow({ width, height }: Omit<NavigationBackdropProps, 'children'>) {
  const shadowId = `navigation-pulse-shadow-${useId().replace(/:/g, '')}`;

  return (
    <Svg width={width} height={height * 136 / 120} viewBox="0 0 390 136" preserveAspectRatio="none">
      <Defs>
        <Filter id={shadowId} x="-15%" y="-50%" width="130%" height="200%">
          <FeDropShadow dx={0} dy={-4} stdDeviation={6} floodColor="#173C65" floodOpacity={0.45} />
        </Filter>
      </Defs>
      <Path d={NAVIGATION_SHAPE_PATH} fill="#173C65" filter={`url(#${shadowId})`} />
    </Svg>
  );
});

/** The bar and its animation share this exact curve; no image assets are used. */
export function NavigationBackdrop({ width, height, children, homeAmbient = false }: NavigationBackdropProps) {
  const shapeId = `navigation-shape-${useId().replace(/:/g, '')}`;

  return (
    <View pointerEvents="none" style={{ width, height }}>
      {homeAmbient ? <HomeNavigationSurface width={width} height={height} />
        : <NavigationBackdropSurface width={width} height={height} />}
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

/** A soft reflection inside the bar's clip, fading before the solid footer. */
export function NavigationSurfaceSheen({ progress }: { progress: SharedValue<number> }) {
  const id = useId().replace(/:/g, '');
  const lightId = `navigation-sheen-${id}`;
  const fadeId = `navigation-sheen-fade-${id}`;
  const maskId = `navigation-sheen-mask-${id}`;
  const lightProps = useAnimatedProps(() => {
    // Linger offscreen at both ends so the loop has a quiet pause and no seam.
    const left = interpolate(progress.get(), [0, 0.12, 0.88, 1], [-200, -200, 410, 410]);
    return { x1: left, x2: left + 180 };
  });

  return (
    <>
      <Defs>
        <AnimatedLinearGradient id={lightId} animatedProps={lightProps} y1={0} y2={0} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#BEE7FF" stopOpacity={0} />
          <Stop offset="0.25" stopColor="#BEE7FF" stopOpacity={0.035} />
          <Stop offset="0.5" stopColor="#BEE7FF" stopOpacity={0.12} />
          <Stop offset="0.75" stopColor="#BEE7FF" stopOpacity={0.035} />
          <Stop offset="1" stopColor="#BEE7FF" stopOpacity={0} />
        </AnimatedLinearGradient>
        <LinearGradient id={fadeId} x1={0} y1={42} x2={0} y2={120} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.6} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
        <Mask id={maskId} x={0} y={0} width={390} height={120} maskUnits="userSpaceOnUse">
          <Rect width={390} height={120} fill={`url(#${fadeId})`} />
        </Mask>
      </Defs>
      <Rect width={390} height={120} fill={`url(#${lightId})`} mask={`url(#${maskId})`} />
    </>
  );
}

// Keep the filtered surface separate from the moving indicator so its shadow
// does not have to be redrawn with every animation frame.
const NavigationBackdropSurface = memo(function NavigationBackdropSurface({ width, height }: Omit<NavigationBackdropProps, 'children'>) {
  const id = useId().replace(/:/g, '');
  const fillId = `navigation-fill-${id}`;
  const shadowId = `navigation-shadow-${id}`;

  return (
    <Svg style={styles.layer} width={width} height={height * 136 / 120} viewBox="0 0 390 136" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#639BD2" />
          <Stop offset="0.5" stopColor="#376FA9" />
          <Stop offset="1" stopColor="#295D94" />
        </LinearGradient>
        <Filter id={shadowId} x="-15%" y="-35%" width="130%" height="170%">
          <FeDropShadow dx={0} dy={-3} stdDeviation={4} floodColor="#102C4C" floodOpacity={0.18} />
        </Filter>
      </Defs>
      <Path d={NAVIGATION_SHAPE_PATH} fill={`url(#${fillId})`} filter={`url(#${shadowId})`} />
    </Svg>
  );
});

/** Translucent blue petals and droplets surrounding the center menu control. */
export function NavigationMenuGlow({ width, height }: { width: number; height: number }) {
  const glowId = `navigation-menu-glow-${useId().replace(/:/g, '')}`;

  return (
    <Svg width={width} height={height} viewBox="0 0 160 128" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={`${glowId}-petal`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E5F3FF" stopOpacity={0.85} />
          <Stop offset="0.5" stopColor="#83BCFF" stopOpacity={0.65} />
          <Stop offset="1" stopColor="#4696EF" stopOpacity={0.4} />
        </LinearGradient>
        <RadialGradient id={glowId} cx="80" cy="64" rx="78" ry="62" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#75CFFF" stopOpacity={0.48} />
          <Stop offset="0.35" stopColor="#75CFFF" stopOpacity={0.4} />
          <Stop offset="0.6" stopColor="#75CFFF" stopOpacity={0.28} />
          <Stop offset="0.8" stopColor="#75CFFF" stopOpacity={0.09} />
          <Stop offset="1" stopColor="#75CFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={160} height={128} fill={`url(#${glowId})`} />
      <Circle cx={80} cy={64} r={51} stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={4} />
      {[0, 60, 120].map(angle => <Ellipse key={angle} cx={80} cy={64} rx={31} ry={58}
        transform={`rotate(${angle} 80 64)`} fill={`url(#${glowId}-petal)`}
        stroke="#B9DBFF" strokeOpacity={0.6} strokeWidth={0.8} />)}
      <G fill="#8BC6FF" opacity={0.85}>
        <Path d="M 19 40 C 4 36 7 23 14 27 C 19 29 20 36 19 40 Z" />
        <Path d="M 12 57 C -1 61 1 48 7 51 Z" />
        <Path d="M 140 30 C 140 13 155 15 151 23 C 149 27 144 29 140 30 Z" />
        <Path d="M 145 48 C 158 34 165 49 155 50 Z" />
        <Circle cx={27} cy={15} r={2.4} opacity={0.45} />
        <Circle cx={131} cy={12} r={2.4} opacity={0.45} />
      </G>
    </Svg>
  );
}

/** A few airy accents outside the menu's circular touch target. */
export function NavigationMenuAccents({ size }: { size: number }) {
  return <Svg width={size * 1.6} height={size * 1.4} viewBox="0 0 160 140" fill="none">
    <Path d="M 22 31 Q 22 37 28 37 Q 22 37 22 43 Q 22 37 16 37 Q 22 37 22 31 Z"
      fill="#B8DEFF" opacity={0.8} />
    <Path d="M 139 60 Q 139 64 143 64 Q 139 64 139 68 Q 139 64 135 64 Q 139 64 139 60 Z"
      fill="#C7E7FF" opacity={0.65} />
    <Circle cx={126} cy={28} r={2.2} fill="#8BC6FF" opacity={0.65} />
    <Circle cx={19} cy={81} r={1.7} fill="#B8DEFF" opacity={0.5} />
  </Svg>;
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
      <G stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        {name === 'home' ? (
          <>
            <Path d="M 4 13 L 14 5 L 24 13 M 7 11 V 23 H 21 V 11 M 11 23 V 17 H 17 V 23" />
          </>
        ) : (
          <>
            <Rect x={4} y={8} width={20} height={16} rx={3} />
            <Path d="M 10 8 V 5.5 Q 10 4 11.5 4 H 16.5 Q 18 4 18 5.5 V 8" />
            <Path d="M 14 12 V 20 M 10 16 H 18" />
          </>
        )}
      </G>
    </Svg>
  );
}

/** The fixed center control is drawn with gradients rather than a glass PNG. */
export function NavigationMenuArtwork({ size, glossOpacity }: { size: number; glossOpacity?: SharedValue<number> }) {
  const id = useId().replace(/:/g, '');
  const depthId = `navigation-menu-depth-${id}`;
  const lightId = `navigation-menu-light-${id}`;
  const glossId = `navigation-menu-gloss-${id}`;
  const glossProps = useAnimatedProps(() => ({
    opacity: glossOpacity?.get() ?? 0,
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 92 92" fill="none">
      <Defs>
        <LinearGradient id={depthId} x1="20" y1="2" x2="67" y2="90" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#639BD2" />
          <Stop offset="0.5" stopColor="#376FA9" />
          <Stop offset="1" stopColor="#295D94" />
        </LinearGradient>
        <RadialGradient id={lightId} cx="26" cy="16" rx="60" ry="65" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#C8E9FF" stopOpacity={0.2} />
          <Stop offset="0.58" stopColor="#C8E9FF" stopOpacity={0.04} />
          <Stop offset="1" stopColor="#C8E9FF" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={glossId} x1={46} y1={0} x2={46} y2={92} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#E6F6FF" stopOpacity={0.7} />
          <Stop offset="0.4" stopColor="#E6F6FF" stopOpacity={0.45} />
          <Stop offset="1" stopColor="#E6F6FF" stopOpacity={0.25} />
        </LinearGradient>
        <ClipPath id={`menu-surface-${id}`}>
          <Circle cx={46} cy={46} r={44.8} />
        </ClipPath>
      </Defs>
      <Circle cx={46} cy={46} r={44.8} fill={`url(#${depthId})`} />
      <Circle cx={46} cy={46} r={44.8} fill={`url(#${lightId})`} />
      {glossOpacity && <AnimatedGroup animatedProps={glossProps} clipPath={`url(#menu-surface-${id})`}>
        <Rect width={92} height={92} fill={`url(#${glossId})`} />
      </AnimatedGroup>}
      <G fill="#FFFFFF">
        <Rect x={33} y={27} width={26} height={4.5} rx={2.25} />
        <Rect x={33} y={35.5} width={26} height={4.5} rx={2.25} />
        <Rect x={33} y={44} width={26} height={4.5} rx={2.25} />
      </G>
      <SvgText x={46} y={69} textAnchor="middle" fill="#FFFFFF" fontSize={12} fontWeight="600" letterSpacing={1.4}>MENU</SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0 },
});
