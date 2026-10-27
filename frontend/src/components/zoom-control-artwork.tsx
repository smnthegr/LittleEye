import { memo, useId } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const decorativeAccessibility = Platform.OS === 'web'
  ? { 'aria-hidden': true as const }
  : { accessible: false };

/** Translucent pill with the narrow double glass rim from the zoom reference. */
export const ZoomPillArtwork = memo(function ZoomPillArtwork({ width, height }: { width: number; height: number }) {
  const id = `zoom-pill-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const unit = width / 60;
  const inset = unit;
  const innerInset = 2.8 * unit;
  const radius = (width - 2 * inset) / 2;
  const innerRadius = (width - 2 * innerInset) / 2;
  return <Svg pointerEvents="none" {...decorativeAccessibility} width={width} height={height}
    viewBox={`0 0 ${width} ${height}`} style={StyleSheet.absoluteFill}>
    <Defs>
      <LinearGradient id={`${id}-glass`} x1={0} y1={0} x2={width} y2={height} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor="#8AB2D7" stopOpacity={0.48} />
        <Stop offset={0.45} stopColor="#4974A3" stopOpacity={0.36} />
        <Stop offset={1} stopColor="#254D7C" stopOpacity={0.6} />
      </LinearGradient>
      <LinearGradient id={`${id}-rim`} x1={0} y1={0} x2={width} y2={height} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor="#E6F3FF" stopOpacity={0.88} />
        <Stop offset={0.36} stopColor="#BCD9F3" stopOpacity={0.46} />
        <Stop offset={0.7} stopColor="#B8D4EF" stopOpacity={0.38} />
        <Stop offset={1} stopColor="#E5F2FF" stopOpacity={0.76} />
      </LinearGradient>
    </Defs>
    <Rect x={inset} y={inset} width={width - 2 * inset} height={height - 2 * inset}
      rx={radius} ry={radius} fill={`url(#${id}-glass)`}
      stroke={`url(#${id}-rim)`} strokeWidth={1.1 * unit} />
    <Rect x={innerInset} y={innerInset} width={width - 2 * innerInset} height={height - 2 * innerInset}
      rx={innerRadius} ry={innerRadius} fill="none"
      stroke="#D2E7FA" strokeOpacity={0.27} strokeWidth={0.65 * unit} />
    <Path d={`M${width / 2} ${1.8 * unit} A${width / 2 - 1.8 * unit} ${width / 2 - 1.8 * unit} 0 0 0 ${1.8 * unit} ${width / 2} V${height - width / 2}`}
      fill="none" stroke="#F0F8FF" strokeOpacity={0.42} strokeWidth={0.65 * unit} strokeLinecap="round" />
  </Svg>;
});

/** Dark round wells; the interactive button and white glyph render above this layer. */
export const ZoomButtonArtwork = memo(function ZoomButtonArtwork({ size }: { size: number }) {
  const id = `zoom-well-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return <Svg pointerEvents="none" {...decorativeAccessibility} width={size} height={size}
    viewBox="0 0 50 50" style={StyleSheet.absoluteFill}>
    <Defs>
      <RadialGradient id={id} cx="40%" cy="32%" r="70%">
        <Stop offset={0} stopColor="#274A71" />
        <Stop offset={0.6} stopColor="#1C3A5F" />
        <Stop offset={1} stopColor="#193456" />
      </RadialGradient>
    </Defs>
    <Circle cx={25} cy={25} r={24.7} fill={`url(#${id})`}
      stroke="#76A0C9" strokeOpacity={0.18} strokeWidth={0.6} />
  </Svg>;
});
