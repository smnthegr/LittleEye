import { useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, useWindowDimensions, type LayoutChangeEvent } from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { createVideoLayoutGate } from '@/utils/video-layout-gate';

/** Keep footage visible during rotation; settle the controls before a small entrance movement. */
export function useVideoFullscreen() {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [controlsReady, setControlsReady] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));
  const [layout] = useState(createVideoLayoutGate);
  const fullscreen = useRef(false);
  const busy = useRef(false);
  const focused = useRef(false);
  const generation = useRef(0);
  const ownsOrientation = useRef(false);
  const orientationQueue = useRef<Promise<unknown>>(Promise.resolve());
  const pendingWaits = useRef(new Set<() => void>());
  const presentationReady = useRef<(() => void) | undefined>(undefined);
  const dismissalReady = useRef<(() => void) | undefined>(undefined);

  useEffect(() => { layout.invalidate(); }, [height, layout, width]);

  const waitFor = useCallback((start: (finish: () => void) => void, timeoutMs = 850) => new Promise<void>(resolve => {
    const timer = setTimeout(finish, timeoutMs);
    function finish() {
      clearTimeout(timer);
      pendingWaits.current.delete(finish);
      resolve();
    }
    pendingWaits.current.add(finish);
    start(finish);
  }), []);

  const lockOrientation = useCallback((lock: ScreenOrientation.OrientationLock, token?: number) => {
    // Cleanup must follow any late native lock so another route cannot stay rotated.
    const operation = orientationQueue.current.catch(() => {}).then(async () => {
      if (token !== undefined && (token !== generation.current || !focused.current)) return false;
      await ScreenOrientation.lockAsync(lock);
      return true;
    });
    orientationQueue.current = operation;
    return operation;
  }, []);

  const rotate = useCallback(async (entering: boolean, token: number) => {
    if (Platform.OS === 'web') return undefined;
    ownsOrientation.current = true;
    let locked = false;
    await waitFor(finish => {
      void lockOrientation(entering ? ScreenOrientation.OrientationLock.LANDSCAPE : ScreenOrientation.OrientationLock.PORTRAIT_UP, token)
        .then(result => { locked = result; finish(); }, finish);
    });
    // Unsupported orientations still open fullscreen in the available screen size.
    return locked ? entering : undefined;
  }, [lockOrientation, waitFor]);

  const animate = useCallback((toValue: number, duration: number) => {
    progress.stopAnimation();
    return new Promise<void>(resolve => {
      Animated.timing(progress, {
        toValue, duration: reducedMotion ? 0 : duration,
        easing: Easing.inOut(Easing.cubic), useNativeDriver: true,
      }).start(() => resolve());
    });
  }, [progress, reducedMotion]);

  const toggle = useCallback(async () => {
    if (!focused.current || busy.current) return;
    const token = ++generation.current;
    const entering = !fullscreen.current;
    const current = () => focused.current && token === generation.current;
    busy.current = true;
    setTransitioning(true);
    try {
      if (entering) {
        layout.reset();
        progress.setValue(0);
        setControlsReady(false);
        fullscreen.current = true;
        // Wait for the modal to cover the page before asking the OS to rotate.
        const presented = waitFor(finish => { presentationReady.current = finish; });
        setVisible(true);
        await presented;
        if (!current()) return;
        presentationReady.current = undefined;
      } else {
        // Only the overlays are concealed; footage stays fully visible during rotation.
        setControlsReady(false);
      }
      if (!current()) return;
      const targetOrientation = await rotate(entering, token);
      if (!current()) return;
      await layout.wait(targetOrientation);
      if (!current()) return;
      if (entering) {
        setControlsReady(true);
        await animate(1, 180);
      }
      else {
        fullscreen.current = false;
        const dismissed = waitFor(finish => { dismissalReady.current = finish; }, 30);
        setVisible(false);
        await dismissed;
        if (!current()) return;
        dismissalReady.current = undefined;
      }
    } finally {
      if (current()) {
        busy.current = false;
        setTransitioning(false);
      }
    }
  }, [animate, layout, progress, rotate, waitFor]);

  const reset = useCallback(() => {
    generation.current += 1;
    busy.current = false;
    fullscreen.current = false;
    for (const finish of pendingWaits.current) finish();
    presentationReady.current = undefined;
    dismissalReady.current = undefined;
    layout.reset();
    progress.stopAnimation();
    progress.setValue(0);
    setVisible(false);
    setControlsReady(false);
    setTransitioning(false);
    if (Platform.OS !== 'web' && ownsOrientation.current) {
      ownsOrientation.current = false;
      void lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
  }, [layout, lockOrientation, progress]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => { focused.current = false; reset(); };
  }, [reset]));

  const onShow = useCallback(() => { presentationReady.current?.(); }, []);
  const onDismiss = useCallback(() => { dismissalReady.current?.(); }, []);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    layout.update(width, height);
  }, [layout]);
  const onInsetsChange = useCallback(() => { layout.invalidate(); }, [layout]);
  const contentStyle = useMemo(() => ({
    transform: [{ translateY: reducedMotion ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
  }), [progress, reducedMotion]);

  return { visible, transitioning, controlsReady, toggle, onShow, onDismiss, onLayout, onInsetsChange, contentStyle };
}
