import { useEffect, type ReactNode } from 'react';
import { Animated, Modal, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { SafeAreaProvider, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import type { useVideoFullscreen } from '@/hooks/use-video-fullscreen';

type Controller = ReturnType<typeof useVideoFullscreen>;
type Props = { controller: Controller; onClose: () => void; footage: ReactNode; interactiveFootage?: boolean; children: (insets: EdgeInsets) => ReactNode };

/** One isolated fullscreen surface for Live, Playback, and fall-event highlights. */
export function VideoFullscreen({ controller, onClose, footage, interactiveFootage, children }: Props) {
  return <Modal visible={controller.visible} animationType="none"
    presentationStyle="fullScreen" supportedOrientations={['portrait', 'landscape']}
    statusBarTranslucent navigationBarTranslucent hardwareAccelerated backdropColor="#000"
    onShow={controller.onShow} onDismiss={controller.onDismiss} onRequestClose={onClose}>
    <StatusBar hidden />
    <NavigationBar hidden />
    <SafeAreaProvider>
      <FullscreenSurface controller={controller} onClose={onClose} footage={footage} interactiveFootage={interactiveFootage}>{children}</FullscreenSurface>
    </SafeAreaProvider>
  </Modal>;
}

function FullscreenSurface({ controller, onClose, footage, interactiveFootage, children }: Props) {
  const insets = useSafeAreaInsets();
  const { onInsetsChange } = controller;
  useEffect(() => { onInsetsChange(); }, [insets.bottom, insets.left, insets.right, insets.top, onInsetsChange]);
  return <View onLayout={controller.onLayout} style={s.screen} accessibilityViewIsModal
    accessibilityState={{ busy: controller.transitioning }} onAccessibilityEscape={onClose}>
    <View pointerEvents={interactiveFootage && !controller.transitioning ? 'box-none' : 'none'} style={StyleSheet.absoluteFill}>{footage}</View>
    <Animated.View pointerEvents={controller.transitioning ? 'none' : 'box-none'}
      accessibilityElementsHidden={controller.transitioning}
      importantForAccessibility={controller.transitioning ? 'no-hide-descendants' : 'auto'}
      style={[s.content, controller.contentStyle, !controller.controlsReady && s.hiddenControls]}>
      {children(insets)}
    </Animated.View>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  content: { flex: 1, overflow: 'hidden' },
  hiddenControls: { opacity: 0 },
});
