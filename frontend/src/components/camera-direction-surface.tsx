import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, FeGaussianBlur, Filter, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

const AnimatedGroup = Animated.createAnimatedComponent(G);

const keys = [
  { name: 'up', cx: 134, cy: 48, rx: 56, ry: 36, rotation: 0,
    path: 'M134 12C169 12 190 19 190 46C190 70 177 84 155 84H113C91 84 78 70 78 46C78 19 99 12 134 12Z' },
  { name: 'right', cx: 220, cy: 134, rx: 36, ry: 56, rotation: 90,
    path: 'M256 134C256 169 249 190 222 190C198 190 184 177 184 155V113C184 91 198 78 222 78C249 78 256 99 256 134Z' },
  { name: 'down', cx: 134, cy: 220, rx: 56, ry: 36, rotation: 180,
    path: 'M134 256C99 256 78 249 78 222C78 198 91 184 113 184H155C177 184 190 198 190 222C190 249 169 256 134 256Z' },
  { name: 'left', cx: 48, cy: 134, rx: 36, ry: 56, rotation: 270,
    path: 'M12 134C12 99 19 78 46 78C70 78 84 91 84 113V155C84 177 70 190 46 190C19 190 12 169 12 134Z' },
] as const;

// Rounded, filled triangles match the reference rather than the old chevrons.
const arrowPath = 'M132 37Q134 34 136 37L145 49Q147 53 143 53H125Q121 53 123 49Z';

function KeyFeedback({ progress, path }: { progress: SharedValue<number>; path: string }) {
  const props = useAnimatedProps(() => ({ opacity: progress.get() * .22 }));
  return <AnimatedGroup animatedProps={props}><Path d={path} fill="#FFFFFF" /></AnimatedGroup>;
}

/** Translucent bubble-glass disc with blue-tinted glass keys and a pause control. */
export function CameraDirectionSurface({ up, down, left, right, center, paused }: {
  up: SharedValue<number>; down: SharedValue<number>; left: SharedValue<number>; right: SharedValue<number>;
  center: SharedValue<number>; paused: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const gradient = (name: string) => `dpad-${name}-${id}`;
  const fill = (name: string) => `url(#${gradient(name)})`;
  const lights = { up, down, left, right };
  const centerProps = useAnimatedProps(() => ({ opacity: center.get() * .18 }));
  return <Svg width="115%" height="115%" viewBox="-20 -20 308 308" pointerEvents="none" accessible={false}
    style={{ position: 'absolute', left: '-7.5%', top: '-7.5%' }}>
    <Defs>
      <RadialGradient id={gradient('shadow')} cx={138} cy={145} rx={146} ry={143} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#668DCA" stopOpacity={.04} />
        <Stop offset={0.73} stopColor="#668DCA" stopOpacity={.08} />
        <Stop offset={0.9} stopColor="#8FAEDB" stopOpacity={.025} />
        <Stop offset="1" stopColor="#8FAEDB" stopOpacity={0} />
      </RadialGradient>
      <LinearGradient id={gradient('disc')} x1={36} y1={20} x2={232} y2={250} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#ECF6FF" stopOpacity={.12} />
        <Stop offset={0.36} stopColor="#8CAEDF" stopOpacity={.1} />
        <Stop offset={0.72} stopColor="#7BA1D4" stopOpacity={.14} />
        <Stop offset="1" stopColor="#B9D4F5" stopOpacity={.18} />
      </LinearGradient>
      <RadialGradient id={gradient('disc-refraction')} cx={134} cy={134} rx={132} ry={132} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#7098D2" stopOpacity={0} />
        <Stop offset={0.65} stopColor="#7098D2" stopOpacity={.02} />
        <Stop offset={0.83} stopColor="#7098D2" stopOpacity={.06} />
        <Stop offset={0.92} stopColor="#6C98D6" stopOpacity={.18} />
        <Stop offset={0.975} stopColor="#BBDFFE" stopOpacity={.48} />
        <Stop offset="1" stopColor="#F2FCFF" stopOpacity={.7} />
      </RadialGradient>
      <RadialGradient id={gradient('disc-gloss')} cx={35} cy={27} rx={225} ry={210} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={.22} />
        <Stop offset={0.38} stopColor="#FFFFFF" stopOpacity={.07} />
        <Stop offset={0.76} stopColor="#FFFFFF" stopOpacity={0} />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity={.04} />
      </RadialGradient>
      <RadialGradient id={gradient('halo')} cx={134} cy={134} rx={69} ry={69} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#548AF0" stopOpacity={.2} />
        <Stop offset={0.55} stopColor="#548AF0" stopOpacity={.26} />
        <Stop offset={0.7} stopColor="#4D8DF2" stopOpacity={.72} />
        <Stop offset={0.84} stopColor="#84AAFF" stopOpacity={.4} />
        <Stop offset="1" stopColor="#A9C6FF" stopOpacity={0} />
      </RadialGradient>
      <Filter id={gradient('key-soft-light')} x="-20%" y="-20%" width="140%" height="140%">
        <FeGaussianBlur stdDeviation={1.6} />
      </Filter>
      <LinearGradient id={gradient('key-edge')} x1={42} y1={22} x2={228} y2={250} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={.98} />
        <Stop offset={0.38} stopColor="#F0F8FF" stopOpacity={.4} />
        <Stop offset={0.65} stopColor="#C7E1FF" stopOpacity={.12} />
        <Stop offset="1" stopColor="#F0F8FF" stopOpacity={.5} />
      </LinearGradient>
      {keys.map(key => <G key={key.name}>
        <RadialGradient id={gradient(`${key.name}-shadow`)} cx={key.cx + 1} cy={key.cy + 6}
          rx={key.rx + 14} ry={key.ry + 14} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#467ABF" stopOpacity={.1} />
          <Stop offset={0.68} stopColor="#467ABF" stopOpacity={.16} />
          <Stop offset={0.85} stopColor="#467ABF" stopOpacity={.06} />
          <Stop offset="1" stopColor="#467ABF" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={gradient(`${key.name}-body`)} cx={key.cx + key.rx * .13} cy={key.cy + key.ry * .3}
          rx={key.rx * 1.2} ry={key.ry * 1.2} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#3D76BF" stopOpacity={.68} />
          <Stop offset={0.45} stopColor="#4F85C8" stopOpacity={.62} />
          <Stop offset={0.75} stopColor="#77A3DE" stopOpacity={.48} />
          <Stop offset={0.93} stopColor="#BDD9F9" stopOpacity={.46} />
          <Stop offset="1" stopColor="#DCEEFF" stopOpacity={.65} />
        </RadialGradient>
        <LinearGradient id={gradient(`${key.name}-gloss`)} x1={key.cx - key.rx * .65} y1={key.cy - key.ry}
          x2={key.cx + key.rx * .5} y2={key.cy + key.ry} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={.45} />
          <Stop offset={0.22} stopColor="#FFFFFF" stopOpacity={.1} />
          <Stop offset={0.52} stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset={0.8} stopColor="#DEEDFF" stopOpacity={.025} />
          <Stop offset="1" stopColor="#F6FBFF" stopOpacity={.14} />
        </LinearGradient>
      </G>)}
      <LinearGradient id={gradient('center-rim')} x1={107} y1={90} x2={161} y2={177} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#9EC9FF" stopOpacity={.55} />
        <Stop offset={0.35} stopColor="#639DEF" stopOpacity={.48} />
        <Stop offset={0.75} stopColor="#548BE6" stopOpacity={.55} />
        <Stop offset="1" stopColor="#99BDFF" stopOpacity={.6} />
      </LinearGradient>
      <RadialGradient id={gradient('center')} cx={143} cy={145} rx={54} ry={54} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#0F4E9F" stopOpacity={.78} />
        <Stop offset={0.58} stopColor="#1F59A8" stopOpacity={.74} />
        <Stop offset="1" stopColor="#487CC3" stopOpacity={.62} />
      </RadialGradient>
      <RadialGradient id={gradient('center-gloss')} cx={111} cy={105} rx={65} ry={61} gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#E1F2FF" stopOpacity={.4} />
        <Stop offset={0.4} stopColor="#B8D9FF" stopOpacity={.12} />
        <Stop offset={0.8} stopColor="#A4CDFF" stopOpacity={0} />
        <Stop offset="1" stopColor="#A4CDFF" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Ellipse cx={138} cy={145} rx={146} ry={143} fill={fill('shadow')} />
    <Circle cx={134} cy={134} r={132} fill={fill('disc')} stroke="#F6FBFF" strokeOpacity={.75} strokeWidth={1.1} />
    <Circle cx={134} cy={134} r={132} fill={fill('disc-refraction')} />
    <Circle cx={134} cy={134} r={131} fill={fill('disc-gloss')} />
    <Circle cx={134} cy={134} r={69} fill={fill('halo')} />
    {keys.map(key => <G key={key.name}>
      <Ellipse cx={key.cx + 1} cy={key.cy + 6} rx={key.rx + 14} ry={key.ry + 14} fill={fill(`${key.name}-shadow`)} />
      <Path d={key.path} fill={fill(`${key.name}-body`)} stroke={fill('key-edge')} strokeWidth={1.1} />
      <Path d={key.path} fill={fill(`${key.name}-gloss`)} />
      <Path d={key.path} fill="none" stroke={fill('key-edge')} strokeWidth={3} opacity={.32} filter={fill('key-soft-light')} />
      <KeyFeedback progress={lights[key.name]} path={key.path} />
      <Path d={arrowPath} fill="#F7FCFF" transform={`rotate(${key.rotation} 134 134)`} />
    </G>)}
    <Circle cx={134} cy={134} r={43.25} fill="none" stroke={fill('center-rim')} strokeWidth={5.5} />
    <Circle cx={134} cy={134} r={46} fill="none" stroke="#DDF2FF" strokeOpacity={.7} strokeWidth={1.2} />
    <Circle cx={134} cy={134} r={40.5} fill={fill('center')} />
    <Circle cx={134} cy={134} r={40.5} fill={fill('center-gloss')} />
    <AnimatedGroup animatedProps={centerProps}><Circle cx={134} cy={134} r={44} fill="#FFFFFF" /></AnimatedGroup>
    {paused ? <Path d="M128 122Q128 119 131 121L147 131Q151 134 147 137L131 147Q128 149 128 146Z" fill="#F7FCFF" />
      : <G fill="#F7FCFF"><Rect x={123} y={121} width={7} height={27} rx={3.5} /><Rect x={138} y={121} width={7} height={27} rx={3.5} /></G>}
  </Svg>;
}
