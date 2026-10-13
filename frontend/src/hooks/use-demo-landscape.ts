import { useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Platform, useWindowDimensions } from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

const ROTATION_WAIT_MS = 700;
type DimensionWait = { landscape: boolean; finish: () => void };

/** Keep the footage visible during rotation, with an in-place fullscreen fallback. */
export function useDemoLandscape() {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [landscape, setLandscape] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [opacity] = useState(() => new Animated.Value(1));
  const fullscreen = useRef(false);
  const busy = useRef(false);
  const focused = useRef(false);
  const generation = useRef(0);
  const dimensions = useRef(width > height);
  const dimensionWait = useRef<DimensionWait | null>(null);
  const orientationWait = useRef<(() => void) | null>(null);
  const orientationQueue = useRef<Promise<void>>(Promise.resolve());
  const ownsOrientation = useRef(false);

  useEffect(() => {
    dimensions.current = width > height;
    if (dimensionWait.current?.landscape === dimensions.current) dimensionWait.current.finish();
  }, [height, width]);

  const waitForDimensions = useCallback((wantLandscape: boolean) => {
    if (dimensions.current === wantLandscape) return Promise.resolve();
    return new Promise<void>(resolve => {
      const timer = setTimeout(finish, ROTATION_WAIT_MS);
      function finish() {
        clearTimeout(timer);
        if (dimensionWait.current?.finish === finish) dimensionWait.current = null;
        resolve();
      }
      dimensionWait.current = { landscape: wantLandscape, finish };
    });
  }, []);

  const lockOrientation = useCallback((lock: ScreenOrientation.OrientationLock, token?: number) => {
    // Serialize a late native lock with cleanup so it cannot leave another route rotated.
    const operation = orientationQueue.current.catch(() => {}).then(async () => {
      if (token !== undefined && (token !== generation.current || !focused.current)) return;
      await ScreenOrientation.lockAsync(lock);
    });
    orientationQueue.current = operation;
    return operation;
  }, []);

  const waitForLock = useCallback((lock: ScreenOrientation.OrientationLock, token: number) => {
    return new Promise<void>(resolve => {
      const timer = setTimeout(finish, ROTATION_WAIT_MS);
      function finish() {
        clearTimeout(timer);
        if (orientationWait.current === finish) orientationWait.current = null;
        resolve();
      }
      orientationWait.current = finish;
      void lockOrientation(lock, token).then(finish, finish);
    });
  }, [lockOrientation]);

  const animateOpacity = useCallback((value: number, duration: number) => {
    opacity.stopAnimation();
    if (reducedMotion) {
      opacity.setValue(value);
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      Animated.timing(opacity, { toValue: value, duration, useNativeDriver: true }).start(() => resolve());
    });
  }, [opacity, reducedMotion]);

  const toggle = useCallback(async () => {
    if (!focused.current || busy.current) return;
    const token = ++generation.current;
    const entering = !fullscreen.current;
    const stillCurrent = () => focused.current && token === generation.current;
    busy.current = true;
    setTransitioning(true);

    if (entering) {
      fullscreen.current = true;
      setLandscape(true);
      // Browsers often cannot rotate. They still get an immediately visible fullscreen view.
      opacity.setValue(1);
    }

    try {
      if (Platform.OS !== 'web') {
        // Allow React to remove the page controls before native orientation changes.
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        if (!stillCurrent()) return;
        ownsOrientation.current = true;
        const lock = entering ? ScreenOrientation.OrientationLock.LANDSCAPE : ScreenOrientation.OrientationLock.PORTRAIT_UP;
        // The view remains usable even if a native promise or dimension update never arrives.
        await waitForLock(lock, token);
        if (!stillCurrent()) return;
        await waitForDimensions(entering);
        if (!stillCurrent()) return;
      }

      if (entering) {
        // Fade only after rotation; keep unsupported devices visible throughout the fallback.
        if (Platform.OS !== 'web' && dimensions.current && !reducedMotion) opacity.setValue(0);
        await animateOpacity(1, 180);
      } else {
        await animateOpacity(0, 80);
        if (!stillCurrent()) return;
        fullscreen.current = false;
        setLandscape(false);
        opacity.setValue(1);
      }
    } finally {
      if (stillCurrent()) {
        busy.current = false;
        setTransitioning(false);
      }
    }
  }, [animateOpacity, opacity, reducedMotion, waitForDimensions, waitForLock]);

  const toggleRef = useRef(toggle);
  useEffect(() => { toggleRef.current = toggle; }, [toggle]);

  const reset = useCallback(() => {
    generation.current += 1;
    busy.current = false;
    fullscreen.current = false;
    orientationWait.current?.();
    dimensionWait.current?.finish();
    opacity.stopAnimation();
    opacity.setValue(1);
    setLandscape(false);
    setTransitioning(false);
    if (Platform.OS !== 'web' && ownsOrientation.current) {
      ownsOrientation.current = false;
      void lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
  }, [lockOrientation, opacity]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!fullscreen.current) return false;
      void toggleRef.current();
      return true;
    });
    return () => {
      focused.current = false;
      back.remove();
      reset();
    };
  }, [reset]));

  // Expo Router focus cleanup covers blur; explicit cleanup also covers removal while blurred.
  useEffect(() => () => {
    focused.current = false;
    reset();
  }, [reset]);

  return { landscape, opacity, transitioning, toggle };
}
