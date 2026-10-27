import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, FeGaussianBlur, Filter, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { CENTER_RADIUS, CHEVRON_PATH, DIRECTION_ROTATIONS, SEGMENT_PATH, SEGMENT_SCALE_TRANSFORM, SPARKLE_PATH,
  type DPadControl, type DPadDirection } from '@/utils/minimal-ring-geometry';

/** Transparent vector artwork. No baked-in sample background or filled outer disc. */
export function MinimalRingArtwork({ active = null, disabled = false, control, frameOnly = false,
  viewBox = '0 0 300 300' }: {
  active?: DPadControl | null; disabled?: boolean; control?: DPadControl; frameOnly?: boolean; viewBox?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const name = (value: string) => `minimal-ring-${id}-${value}`;
  const fill = (value: string) => `url(#${name(value)})`;
  const colors = {
    up: ['#F1F8FF', '#D3E2F2', '#E9F5FD'],
    right: ['#C0DEFF', '#9BB6EB', '#B6D2FA'],
    down: ['#DEEBF9', '#BFD5EB', '#DFEEFB'],
    left: ['#ABD7FC', '#7FBAED', '#B4E9FC'],
  };
  return <Svg width="100%" height="100%" viewBox={viewBox} pointerEvents="none" accessible={false}>
    <Defs>
      <Filter id={name('shadow')} x="-30%" y="-30%" width="160%" height="170%">
        <FeGaussianBlur stdDeviation={5} />
      </Filter>
      <LinearGradient id={name('ring')} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={.2} />
        <Stop offset={0.35} stopColor="#FFFFFF" stopOpacity={.64} />
        <Stop offset={0.7} stopColor="#FFFFFF" stopOpacity={.16} />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity={.32} />
      </LinearGradient>
      <LinearGradient id={name('edge')} x1={0.2} y1="0" x2={0.75} y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={.98} />
        <Stop offset={0.38} stopColor="#FFFFFF" stopOpacity={.55} />
        <Stop offset={0.72} stopColor="#F6FAFF" stopOpacity={.3} />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity={.85} />
      </LinearGradient>
      <RadialGradient id={name('reflection')} cx={0.48} cy={0.11} r={0.75}>
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={.3} />
        <Stop offset={0.42} stopColor="#FFFFFF" stopOpacity={.07} />
        <Stop offset={0.75} stopColor="#FFFFFF" stopOpacity={0} />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity={.16} />
      </RadialGradient>
      <RadialGradient id={name('frost')} cx={0.42} cy={0.4} r={0.68}>
        <Stop offset="0" stopColor="#C7E2F6" stopOpacity={.65} />
        <Stop offset={0.67} stopColor="#A4C8E7" stopOpacity={.76} />
        <Stop offset="1" stopColor="#C9E6F8" stopOpacity={.72} />
      </RadialGradient>
      {Object.entries(colors).map(([direction, palette]) => <LinearGradient key={direction}
        id={name(direction)} x1="0" y1="0" x2={0.8} y2="1">
        <Stop offset="0" stopColor={palette[0]} stopOpacity={.78} />
        <Stop offset={0.55} stopColor={palette[1]} stopOpacity={.82} />
        <Stop offset="1" stopColor={palette[2]} stopOpacity={.85} />
      </LinearGradient>)}
    </Defs>
    <G opacity={disabled ? .46 : 1}>
      {!frameOnly && <G transform="translate(0 5)" filter={fill('shadow')} fill="#18478F" opacity={.25}>
        {(Object.keys(DIRECTION_ROTATIONS) as DPadDirection[]).filter(direction => !control || control === direction).map(direction => <G key={direction}
          transform={`rotate(${DIRECTION_ROTATIONS[direction]} 150 150)`}>
          <Path d={SEGMENT_PATH} transform={SEGMENT_SCALE_TRANSFORM} />
        </G>)}
        {(!control || control === 'center') && <Circle cx={150} cy={150} r={CENTER_RADIUS} />}
      </G>}
      {!control && <G>
        <Ellipse cx={150} cy={150} rx={142} ry={136} fill="none" stroke={fill('ring')} strokeWidth={.8} />
        <G fill="#FFFFFF">
        <Circle cx={8} cy={150} r={4} /><Circle cx={292} cy={150} r={4} />
        <Circle cx={55} cy={55} r={1.3} opacity={.85} /><Circle cx={245} cy={55} r={1.3} opacity={.85} />
        <Circle cx={55} cy={245} r={1.3} opacity={.85} /><Circle cx={245} cy={245} r={1.3} opacity={.85} />
        </G>
      </G>}
      {!frameOnly && (Object.keys(DIRECTION_ROTATIONS) as DPadDirection[]).filter(direction => !control || control === direction).map(direction => <G key={direction}
        transform={`rotate(${DIRECTION_ROTATIONS[direction]} 150 150)`}>
        <G transform={SEGMENT_SCALE_TRANSFORM}>
        <Path d={SEGMENT_PATH} fill={fill(direction)} />
        <Path d={SEGMENT_PATH} fill={fill('reflection')} />
        <Path d={SEGMENT_PATH} fill="none" stroke="#FFFFFF" strokeOpacity={.09} strokeWidth={6} />
        <Path d={SEGMENT_PATH} fill="none" stroke={fill('edge')} strokeWidth={1.35} />
        <Path d="M91 58 C90 43 120 29.5 150 29.5 C181 29.5 209 43 209 58"
          fill="none" stroke="#FFFFFF" strokeWidth={2} strokeOpacity={.64} strokeLinecap="round" />
        <Path d={SEGMENT_PATH} fill="#F1FCFF" opacity={active === direction ? .36 : 0} />
        <Path d={SEGMENT_PATH} fill="none" stroke="#FFFFFF" strokeWidth={1.9} opacity={active === direction ? .9 : 0} />
        <Path d={CHEVRON_PATH} fill="none" stroke={direction === 'left' || direction === 'right' ? '#315A93' : '#6E8EAE'}
          strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
        </G>
      </G>)}
      {!frameOnly && (!control || control === 'center') && <G>
        <Circle cx={150} cy={150} r={CENTER_RADIUS} fill={fill('frost')} stroke="#FFFFFF" strokeOpacity={.53} strokeWidth={.85} />
        <Circle cx={150} cy={150} r={CENTER_RADIUS} fill="#E8F9FF" opacity={active === 'center' ? .42 : 0} />
        <Path d={SPARKLE_PATH} fill="#FFFFFF" />
      </G>}
    </G>
  </Svg>;
}
