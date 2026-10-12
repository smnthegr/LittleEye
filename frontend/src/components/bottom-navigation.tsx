import { router, useFocusEffect, usePathname, useRoutePath } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { HomeNavigationBar } from '@/components/home-navigation-bar';
import { navigateWithTransition } from '@/components/navigation-transition';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { getHomeNavigationLayout } from '@/utils/responsive';

type NavigationPath = '/home' | '/first-aid-guidance';
type MenuState = { openMenu: () => void; menuOpen: boolean; hideNavigation: boolean };
type MenuRegistration = MenuState & { token: string };
type MenuSnapshot = {
  entries: ReadonlyMap<NavigationPath, MenuRegistration>;
  lastPath: NavigationPath;
};

function navigationPath(pathname: string | undefined): NavigationPath | undefined {
  if (pathname === '/home' || pathname === '/first-aid-guidance') return pathname;
  return undefined;
}

function createMenuStore() {
  let snapshot: MenuSnapshot = { entries: new Map(), lastPath: '/home' };
  const listeners = new Set<() => void>();

  function publish(entries: ReadonlyMap<NavigationPath, MenuRegistration>, lastPath = snapshot.lastPath) {
    snapshot = { entries, lastPath };
    listeners.forEach(listener => listener());
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    register(pathname: NavigationPath, token: string, menu: MenuState) {
      const entries = new Map(snapshot.entries);
      entries.set(pathname, { ...menu, token });
      publish(entries, pathname);

      return () => {
        // An outgoing screen must never clear a newer screen's registration.
        if (snapshot.entries.get(pathname)?.token !== token) return;
        const remainingEntries = new Map(snapshot.entries);
        remainingEntries.delete(pathname);
        publish(remainingEntries);
      };
    },
    update(pathname: NavigationPath, token: string, menu: MenuState) {
      const current = snapshot.entries.get(pathname);
      if (current?.token !== token) return;
      if (current.openMenu === menu.openMenu && current.menuOpen === menu.menuOpen && current.hideNavigation === menu.hideNavigation) return;
      const entries = new Map(snapshot.entries);
      entries.set(pathname, { ...menu, token });
      publish(entries);
    },
  };
}

type MenuStore = ReturnType<typeof createMenuStore>;
const BottomNavigationContext = createContext<MenuStore | undefined>(undefined);

export function BottomNavigationProvider({ children }: PropsWithChildren) {
  const [store] = useState(createMenuStore);
  return <BottomNavigationContext.Provider value={store}>{children}</BottomNavigationContext.Provider>;
}

function useMenuStore() {
  const store = useContext(BottomNavigationContext);
  if (!store) throw new Error('Bottom navigation must be inside BottomNavigationProvider.');
  return store;
}

/** Connect a screen's own menu to the navigation bar that remains outside the stack. */
export function useBottomNavigationMenu(openMenu: () => void, menuOpen: boolean, hideNavigation = false) {
  const store = useMenuStore();
  const globalPathname = usePathname();
  const routePathname = useRoutePath();
  // The local route stays correct when another route covers this mounted screen.
  const pathname = navigationPath(routePathname ?? globalPathname);
  const token = useId();
  const menu = useRef<MenuState>({ openMenu, menuOpen, hideNavigation });

  useEffect(() => {
    menu.current = { openMenu, menuOpen, hideNavigation };
    if (pathname) store.update(pathname, token, menu.current);
  }, [hideNavigation, menuOpen, openMenu, pathname, store, token]);

  useFocusEffect(useCallback(() => {
    if (!pathname) return;
    return store.register(pathname, token, menu.current);
  }, [pathname, store, token]));
}

/** Keep the dock stationary while the native stack slides the page above it. */
export function BottomNavigationHost() {
  const store = useMenuStore();
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const pathname = navigationPath(usePathname());
  const { pageWidth, insets } = useResponsiveLayout();
  const reducedMotion = useReducedMotion();
  const menu = pathname ? snapshot.entries.get(pathname) : undefined;
  const visible = pathname !== undefined && !(pathname === '/home' && menu?.hideNavigation);
  const [visibility] = useState(() => new Animated.Value(visible ? 1 : 0));
  const layout = getHomeNavigationLayout(pageWidth, insets.bottom);
  const activePathname = pathname ?? snapshot.lastPath;

  useEffect(() => {
    visibility.stopAnimation();
    if (reducedMotion) {
      visibility.setValue(visible ? 1 : 0);
      return;
    }
    const animation = Animated.timing(visibility, {
      toValue: visible ? 1 : 0,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, visibility, visible]);

  return <View
    pointerEvents={visible ? 'box-none' : 'none'}
    accessibilityElementsHidden={!visible}
    importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
    style={[styles.host, { left: insets.left, right: insets.right, height: layout.height }]}
  >
    <Animated.View pointerEvents="box-none" style={[
      styles.dock,
      {
        width: pageWidth,
        height: layout.height,
        opacity: visibility,
        transform: [{ translateY: visibility.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      },
    ]}>
      <HomeNavigationBar
        activeTab={activePathname === '/home' ? 'home' : 'first-aid'}
        menuOpen={menu?.menuOpen ?? false}
        visible={visible}
        onOpenMenu={() => menu?.openMenu()}
        onHomePress={() => navigateWithTransition(() => router.dismissTo('/home'))}
        onFirstAidPress={() => navigateWithTransition(() => router.navigate('/first-aid-guidance'))}
      />
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', bottom: 0, alignItems: 'center', zIndex: 20 },
  dock: { position: 'relative' },
});
