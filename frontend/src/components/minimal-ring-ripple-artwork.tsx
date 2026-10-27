import { useId, type ReactNode } from 'react';
import Svg, { Circle, ClipPath, Defs, FeGaussianBlur, Filter, G, Path } from 'react-native-svg';

import { CONTROL_BOUNDS, DIRECTION_ROTATIONS, SEGMENT_PATH, SEGMENT_SCALE_TRANSFORM,
  type DPadDirection } from '@/utils/minimal-ring-geometry';

export const RIPPLE_PEAK_OPACITY = .36;
export const RIPPLE_MID_OPACITY = .16;
export const RIPPLE_FILL_OPACITY = .1;

/** Keep the wave inside the exact curved glass silhouette, including its concave edge. */
export function MinimalRingRippleArtwork({ control, viewBox = '0 0 300 300', progress = 1, children }: {
  control: DPadDirection; viewBox?: string; progress?: number; children?: ReactNode;
}) {
  const clip = `ring-ripple-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const bounds = CONTROL_BOUNDS[control];
  const opacity = progress <= .12 ? progress / .12 * RIPPLE_PEAK_OPACITY
    : progress <= .6 ? RIPPLE_PEAK_OPACITY + (progress - .12) / .48 * (RIPPLE_MID_OPACITY - RIPPLE_PEAK_OPACITY)
      : RIPPLE_MID_OPACITY * (1 - progress) / .4;
  return <Svg width="100%" height="100%" viewBox={viewBox} pointerEvents="none">
    <Defs>
      <Filter id={`${clip}-soft`} x="-50%" y="-50%" width="200%" height="200%">
        <FeGaussianBlur stdDeviation={3.5} />
      </Filter>
      <ClipPath id={clip}>
        <Path d={SEGMENT_PATH} transform={`rotate(${DIRECTION_ROTATIONS[control]} 150 150) ${SEGMENT_SCALE_TRANSFORM}`} />
      </ClipPath>
    </Defs>
    <G clipPath={`url(#${clip})`}>
      <G filter={`url(#${clip}-soft)`}>
      {children ?? <Circle cx={bounds.left + bounds.width / 2} cy={bounds.top + bounds.height / 2}
        r={Math.min(bounds.width, bounds.height) / 2 * (.3 + progress * 1.35)} opacity={opacity}
        stroke="#6EBDFF" strokeWidth={8} fill="#4097FF" fillOpacity={RIPPLE_FILL_OPACITY} />}
      </G>
    </G>
  </Svg>;
}
