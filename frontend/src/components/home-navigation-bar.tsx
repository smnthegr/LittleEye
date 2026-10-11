import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlowButton } from '@/components/glow-button';
import { animateNavBubble, navBubbleProgress } from '@/components/navigation-transition';
import { BrandColors as C, BrandFonts as F } from '@/constants/brand';

type Props = { onOpenMenu: () => void };

export function HomeNavigationBar({ onOpenMenu }: Props) {
  const insets = useSafeAreaInsets();
  const dockHeight = 150 + insets.bottom;

  function returnHome() {
    navBubbleProgress.setValue(1);
    animateNavBubble(0, () => {
      if (router.canGoBack()) router.back();
      else router.replace('/home');
    });
  }

  return <View style={[s.fixedDock, { height: dockHeight, paddingBottom: 55 }]}>
    <Image source={require('../../assets/images/home-nav-wave.svg')} contentFit="fill" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" style={[s.bubble, s.bubbleOne]} /><View pointerEvents="none" style={[s.bubble, s.bubbleTwo]} />
    <View pointerEvents="none" style={[s.bubble, s.bubbleThree]} /><View pointerEvents="none" style={[s.bubble, s.bubbleFour]} />
    <GlowButton accessibilityRole="button" accessibilityLabel="Home" pressGlow={false} pressRippleScale={0.75} pressRippleSize={108} pressShimmer={false} onPress={returnHome} style={[s.fixedSide, s.fixedHome]}>
      <View style={s.homeCircle}>
        <Image source={require('../../assets/images/home-tab-icon-user.png')} contentFit="contain" transition={0} accessible={false} style={[s.homeTabImage, s.homeIconDown]} />
      </View><Text style={s.homeLabel}>Home</Text>
    </GlowButton>
    <View style={[s.fixedMainPosition, { top: dockHeight * (100 / 190) - 116 }]}>
      <Image pointerEvents="none" source={require('../../assets/images/home-button-bubbles.svg')} contentFit="contain" transition={0} accessible={false} style={s.floatBubbles} />
      <GlowButton accessibilityRole="button" accessibilityLabel="Open menu" pressRippleScale={0.75} pressRippleSize={108} pressShimmer={false} onPress={onOpenMenu} style={s.fixedMain}>
        <View pointerEvents="none" style={s.menuGlassMask}>
          <Image source={require('../../assets/images/home-menu-glass.png')} contentFit="contain" transition={0} accessible={false} style={s.menuGlassImage} />
        </View>
        <View style={[s.gridIcon, s.fixedGridIcon]}>{Array.from({ length: 4 }, (_, i) => <View key={i} style={s.gridTile} />)}</View>
      </GlowButton>
    </View>
    <GlowButton accessibilityRole="button" accessibilityLabel="First aid" pressGlow={false} pressRippleScale={0.75} pressRippleSize={108} pressShimmer={false} onPress={() => router.push('/first-aid-guidance')} style={[s.fixedSide, s.fixedAid]}>
      <View style={[s.aidCircle, s.aidIconDown]}>
        <Image pointerEvents="none" source={require('../../assets/images/home-tab-glass.png')} contentFit="contain" transition={0} accessible={false} style={s.homeCircleGlass} />
        <View style={s.aidBox}><View style={s.aidHandle} /><View style={s.aidPlusVertical} /><View style={s.aidPlusHorizontal} /></View>
      </View>
      <Text style={[s.fixedLabel, s.aidLabelDown]}>First-Aid</Text>
    </GlowButton>
  </View>;
}

const s = StyleSheet.create({
  fixedDock: { position: 'absolute', bottom: -21, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 30 },
  fixedMainPosition: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 3 },
  floatBubbles: { position: 'absolute', top: -28, left: '50%', marginLeft: -75, width: 150, height: 150 },
  fixedSide: { zIndex: 2, width: 82, height: 82, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  fixedHome: { transform: [{ translateX: -6 }] }, fixedAid: { transform: [{ translateX: 6 }], gap: 8 },
  homeCircle: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }, homeCircleGlass: { position: 'absolute', top: -6, right: -6, bottom: -6, left: -6 }, homeTabImage: { width: 50, height: 50, alignSelf: 'center', opacity: 0.56 }, homeIconDown: { transform: [{ translateY: 3 }] },
  aidCircle: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }, aidIconDown: { transform: [{ translateY: 3 }] },
  aidBox: { width: 38, height: 32, borderRadius: 7, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' }, aidHandle: { position: 'absolute', top: -6, width: 15, height: 7, borderWidth: 2, borderColor: C.blue, borderTopLeftRadius: 4, borderTopRightRadius: 4 }, aidPlusVertical: { position: 'absolute', width: 5, height: 17, borderRadius: 2, backgroundColor: C.white }, aidPlusHorizontal: { position: 'absolute', width: 17, height: 5, borderRadius: 2, backgroundColor: C.white },
  fixedLabel: { color: C.white, fontFamily: F.bold, fontSize: 13 }, homeLabel: { color: C.white, fontFamily: F.regular, fontSize: 13 }, aidLabelDown: { transform: [{ translateY: 2 }] },
  fixedMain: { width: 108, height: 108, borderRadius: 56, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' }, menuGlassMask: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 54, overflow: 'hidden' }, menuGlassImage: { position: 'absolute', width: 144, height: 144, top: -18, left: -18 }, fixedGridIcon: { transform: [{ translateX: -1 }] },
  gridIcon: { width: 44, height: 44, flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignContent: 'center', justifyContent: 'center' }, gridTile: { width: 19, height: 19, borderRadius: 4, backgroundColor: C.white },
  bubble: { position: 'absolute', borderRadius: 50, backgroundColor: 'rgba(148,176,213,.32)', borderWidth: 1, borderColor: 'rgba(255,255,255,.64)', boxShadow: '0 2px 8px rgba(50,80,123,.14), inset 1px 1px 3px rgba(255,255,255,.7)' },
  bubbleOne: { width: 25, height: 25, left: '40%', top: 0 }, bubbleTwo: { width: 18, height: 18, left: '46%', top: 17 }, bubbleThree: { width: 30, height: 30, left: '52%', top: 8 }, bubbleFour: { width: 12, height: 12, left: '49%', top: 39, backgroundColor: 'rgba(255,255,255,.56)' },
});
