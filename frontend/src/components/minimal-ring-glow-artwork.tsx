import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, FeGaussianBlur, Filter, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { CENTER_RADIUS, DIRECTION_ROTATIONS, SEGMENT_PATH, SEGMENT_SCALE_TRANSFORM,
  type DPadControl, type DPadDirection } from '@/utils/minimal-ring-geometry';

export const AMBIENT_GLOW_MIN_OPACITY = .24;
export const AMBIENT_GLOW_MAX_OPACITY = .5;
export const AMBIENT_GLOW_DISABLED_OPACITY = .06;
export const PRESS_BLOOM_OPACITY = .35;

export function MinimalRingGlowArtwork({ control }: { control?: DPadControl }) {
  const id = `ring-glow-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return <Svg width="100%" height="100%" viewBox="-36 -36 372 372" pointerEvents="none">
    <Defs>
      {control && <ClipPath id={`${id}-clip`}>
        {control === 'center' ? <Circle cx={150} cy={150} r={CENTER_RADIUS} />
          : <Path d={SEGMENT_PATH} transform={`rotate(${DIRECTION_ROTATIONS[control]} 150 150) ${SEGMENT_SCALE_TRANSFORM}`} />}
      </ClipPath>}
      <Filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
        <FeGaussianBlur stdDeviation={control ? 5 : 11} />
      </Filter>
      <RadialGradient id={`${id}-halo`} cx={0.5} cy={0.5} r={0.5}>
        <Stop offset="0" stopColor="#B4E0FF" stopOpacity={.09} />
        <Stop offset={0.56} stopColor="#9ACFFF" stopOpacity={.22} />
        <Stop offset={0.8} stopColor="#82BFFF" stopOpacity={.82} />
        <Stop offset="1" stopColor="#B4DEFF" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <G clipPath={control ? `url(#${id}-clip)` : undefined}>
    <G filter={`url(#${id}-blur)`}>
      {!control && <Ellipse cx={150} cy={150} rx={153} ry={148} fill={`url(#${id}-halo)`} />}
      {(!control || control === 'center') && <Circle cx={150} cy={150} r={CENTER_RADIUS}
        fill="#9DD5FF" fillOpacity={control ? .5 : .18} stroke="#B6E2FF" strokeWidth={control ? 5 : 2} />}
      {(Object.keys(DIRECTION_ROTATIONS) as DPadDirection[]).filter(direction => !control || control === direction)
        .map(direction => <G key={direction} transform={`rotate(${DIRECTION_ROTATIONS[direction]} 150 150)`}>
          <Path d={SEGMENT_PATH} transform={SEGMENT_SCALE_TRANSFORM} fill="#95CEFF"
            fillOpacity={control ? .46 : .18} stroke="#B6E2FF" strokeOpacity={control ? .95 : .65}
            strokeWidth={control ? 5.5 : 3} />
        </G>)}
    </G>
    </G>
  </Svg>;
}
