import { useId } from 'react';
import Svg, { Circle, Defs, Image, Mask, RadialGradient, Stop } from 'react-native-svg';

/** Keep the generated water texture airy, with a clean silhouette and a softly lit center. */
export function CameraBubbleSurface() {
  const id = useId().replace(/:/g, '');
  const transparency = `bubble-transparency-${id}`;
  const mask = `bubble-mask-${id}`;
  const glow = `bubble-glow-${id}`;
  return <Svg width="100%" height="100%" viewBox="0 0 240 240" pointerEvents="none" accessible={false}>
    <Defs>
      <RadialGradient id={transparency} cx={120} cy={120} rx={114.5} ry={114.5} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={.25} />
        <Stop offset={0.5} stopColor="#FFFFFF" stopOpacity={.2} />
        <Stop offset={0.72} stopColor="#FFFFFF" stopOpacity={.3} />
        <Stop offset={0.9} stopColor="#FFFFFF" stopOpacity={.55} />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity={.68} />
      </RadialGradient>
      <Mask id={mask} x={0} y={0} width={240} height={240} maskUnits="userSpaceOnUse">
        <Circle cx={120} cy={120} r={114.5} fill={`url(#${transparency})`} />
      </Mask>
      <RadialGradient id={glow} cx={120} cy={120} rx={84} ry={84} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#F6FDFF" stopOpacity={.14} />
        <Stop offset={0.45} stopColor="#E9F9FF" stopOpacity={.07} />
        <Stop offset="1" stopColor="#E9F9FF" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Image href={require('../../assets/images/home-dpad-bubble.png')} x={-4} y={-4} width={248} height={248}
      preserveAspectRatio="xMidYMid meet" mask={`url(#${mask})`} />
    <Circle cx={120} cy={120} r={84} fill={`url(#${glow})`} />
  </Svg>;
}
