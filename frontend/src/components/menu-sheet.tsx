import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Image } from 'expo-image';
import { Animated, Easing, Modal, PanResponder, Pressable, ScrollView, StyleSheet, useWindowDimensions, View,
  type PanResponderGestureState, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { shouldDismissMenuSheet, shouldStartMenuDrag } from '@/utils/menu-sheet-motion';

type Props = {
  visible: boolean;
  onClose: () => void;
  sheetStyle: StyleProp<ViewStyle>;
  artwork?: ReactNode;
  children: ReactNode;
};

export function MenuSheet(props: Props) {
  return props.visible ? <OpenMenuSheet {...props} /> : null;
}

export function MenuSheetMascot() {
  const { scaleSize } = useResponsiveLayout();
  return <Image pointerEvents="none" source={require('../../assets/images/menu-mascot-4k-sharp.png')}
    contentFit="contain" transition={0} accessible={false}
    style={{ position: 'absolute', width: scaleSize(700), height: scaleSize(394), top: scaleSize(64), right: -scaleSize(296) }} />;
}

function OpenMenuSheet({ onClose, sheetStyle, artwork, children }: Props) {
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const { scaleSize, pageWidth, insets } = useResponsiveLayout();
  const sheetBottomPadding = StyleSheet.flatten(sheetStyle)?.paddingBottom;
  const bottomPadding = typeof sheetBottomPadding === 'number' ? sheetBottomPadding : 0;
  const [offset] = useState(() => new Animated.Value(reducedMotion ? 0 : height));
  const sheetHeight = useRef(height);
  const closing = useRef(false);

  const settle = useCallback(() => {
    Animated.timing(offset, {
      toValue: 0, duration: reducedMotion ? 0 : 300,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [offset, reducedMotion]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(offset, {
      toValue: sheetHeight.current + 24, duration: reducedMotion ? 0 : 200,
      easing: Easing.in(Easing.quad), useNativeDriver: true,
    }).start(({ finished }) => { if (finished) onClose(); });
  }, [offset, onClose, reducedMotion]);

  const shouldCapture = useCallback((_: GestureResponderEvent, gesture: PanResponderGestureState) =>
    !closing.current && shouldStartMenuDrag(gesture.dy, gesture.dx), []);
  const release = useCallback((_: GestureResponderEvent, gesture: PanResponderGestureState) => {
    if (shouldDismissMenuSheet(gesture.dy, gesture.vy, sheetHeight.current)) close();
    else settle();
  }, [close, settle]);

  // PanResponder only registers these callbacks; refs are read when a gesture fires.
  // eslint-disable-next-line react-hooks/refs
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: shouldCapture,
    onMoveShouldSetPanResponder: shouldCapture,
    onPanResponderGrant: () => offset.stopAnimation(),
    onPanResponderMove: (_, gesture) => offset.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: release,
    onPanResponderTerminate: settle,
    onPanResponderTerminationRequest: () => false,
  }), [offset, release, settle, shouldCapture]);

  // The empty header is dedicated to dragging, so it claims the touch immediately.
  // eslint-disable-next-line react-hooks/refs
  const handlePan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => offset.stopAnimation(),
    onPanResponderMove: (_, gesture) => offset.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: release,
    onPanResponderTerminate: settle,
    onPanResponderTerminationRequest: () => false,
  }), [offset, release, settle]);

  return <Modal visible supportedOrientations={['portrait', 'landscape']} transparent animationType="none" onShow={settle} onRequestClose={close}>
    <View {...pan.panHandlers} style={styles.overlay}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, {
        opacity: offset.interpolate({ inputRange: [0, height], outputRange: [1, 0], extrapolate: 'clamp' }),
      }]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={close} style={StyleSheet.absoluteFill} />
      <Animated.View accessibilityViewIsModal
        onAccessibilityEscape={close}
        onLayout={event => { sheetHeight.current = event.nativeEvent.layout.height; }}
        style={[sheetStyle, {
          width: pageWidth, maxHeight: height - insets.top - scaleSize(8),
          paddingBottom: 0,
          transform: [{ translateY: offset }],
        }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>{artwork}</View>
        {/* Keep the row shadows inside a viewport that spans the full sheet. */}
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} removeClippedSubviews={false}
          style={styles.optionsScroll} contentContainerStyle={{
            paddingHorizontal: scaleSize(30), paddingTop: scaleSize(60), paddingBottom: scaleSize(8) + bottomPadding,
          }}>
          {children}
        </ScrollView>
        <View {...handlePan.panHandlers} style={[styles.dragArea, {
          height: scaleSize(56),
        }]}>
          <View pointerEvents="none" style={[styles.handle, { width: scaleSize(37), height: scaleSize(3) }]} />
        </View>
      </Animated.View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', touchAction: 'none' } as ViewStyle,
  backdrop: { backgroundColor: 'rgba(0,0,0,.32)' },
  dragArea: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1, touchAction: 'none' } as ViewStyle,
  handle: { width: 37, height: 3, borderRadius: 2, backgroundColor: '#A5B8D1' },
  optionsScroll: { flexGrow: 0, flexShrink: 1 },
});
