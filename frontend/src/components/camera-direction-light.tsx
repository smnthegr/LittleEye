import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

const AnimatedGroup = Animated.createAnimatedComponent(G);

function SideLight({ progress, rotation, gradient, gloss }: {
  progress: SharedValue<number>; rotation: number; gradient: string; gloss: string;
}) {
  const props = useAnimatedProps(() => ({ opacity: progress.get() }));
  return <AnimatedGroup animatedProps={props} transform={`rotate(${rotation} 120 120)`}>
    <Rect width={240} height={240} fill={`url(#${gradient})`} />
    <Rect width={240} height={240} fill={`url(#${gloss})`} />
  </AnimatedGroup>;
}

/** Light a complete side of the glass, fading inward without a ring or a hard boundary. */
export function CameraDirectionLight({ up, down, left, right }: {
  up: SharedValue<number>; down: SharedValue<number>; left: SharedValue<number>; right: SharedValue<number>;
}) {
  const id = useId().replace(/:/g, '');
  const gradient = `direction-light-${id}`;
  const gloss = `direction-gloss-${id}`;
  const clip = `direction-surface-${id}`;
  return <Svg width="100%" height="100%" viewBox="0 0 240 240" pointerEvents="none" accessible={false}>
    <Defs>
      <ClipPath id={clip}><Circle cx={120} cy={120} r={114.5} /></ClipPath>
      <LinearGradient id={gradient} x1={120} y1={4} x2={120} y2={158} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#D9F7FF" stopOpacity={.95} />
        <Stop offset={0.3} stopColor="#82D9FF" stopOpacity={.85} />
        <Stop offset={0.65} stopColor="#8DCFFF" stopOpacity={.5} />
        <Stop offset="1" stopColor="#B5E9FF" stopOpacity={0} />
      </LinearGradient>
      <LinearGradient id={gloss} x1={120} y1={5} x2={120} y2={108} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={.15} />
        <Stop offset={0.23} stopColor="#FFFFFF" stopOpacity={.85} />
        <Stop offset={0.55} stopColor="#F0FCFF" stopOpacity={.35} />
        <Stop offset="1" stopColor="#F0FCFF" stopOpacity={0} />
      </LinearGradient>
    </Defs>
    <G clipPath={`url(#${clip})`}>
      <SideLight progress={up} rotation={0} gradient={gradient} gloss={gloss} />
      <SideLight progress={right} rotation={90} gradient={gradient} gloss={gloss} />
      <SideLight progress={down} rotation={180} gradient={gradient} gloss={gloss} />
      <SideLight progress={left} rotation={270} gradient={gradient} gloss={gloss} />
    </G>
  </Svg>;
}
