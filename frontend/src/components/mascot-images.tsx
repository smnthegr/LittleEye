import { Asset } from 'expo-asset';
import { Image, type ImageRef } from 'expo-image';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface MascotImages {
  welcome: ImageRef | number;
  signIn: ImageRef | number;
  signUp: ImageRef | number;
}

const MascotContext = createContext<MascotImages | null>(null);
let preloadPromise: Promise<MascotImages> | undefined;

async function loadLocalMascot(moduleId: number): Promise<ImageRef | number> {
  try {
    // Download through Expo's asset manager first so native decoding uses a local file,
    // rather than sending a Metro/tunnel asset URL straight to the native image loader.
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    return await Image.loadAsync({ uri: asset.localUri ?? asset.uri });
  } catch (error) {
    // A temporary development-server failure must not crash every screen.
    console.warn('Mascot preload failed; using the bundled image source.', error);
    return moduleId;
  }
}

function preloadMascots() {
  preloadPromise ??= Promise.all([
    loadLocalMascot(require('../../assets/images/weeka-welcome-brand-hd.png')),
    loadLocalMascot(require('../../assets/images/peeka-sign-in-4k.png')),
    loadLocalMascot(require('../../assets/images/peeka-sign-up-brand-4k.png')),
  ]).then(([welcome, signIn, signUp]) => ({ welcome, signIn, signUp }));
  return preloadPromise;
}

export function MascotImagesProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<MascotImages | null>(null);

  useEffect(() => {
    let active = true;
    preloadMascots().then((loaded) => { if (active) setImages(loaded); });
    return () => { active = false; };
  }, []);

  // Keep the native splash visible while local assets are prepared.
  if (!images) return null;
  return <MascotContext.Provider value={images}>{children}</MascotContext.Provider>;
}

export function useMascotImages() {
  const images = useContext(MascotContext);
  if (!images) throw new Error('Mascot images must be used inside MascotImagesProvider.');
  return images;
}
