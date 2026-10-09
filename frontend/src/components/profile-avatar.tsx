import { useState } from 'react';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { useAppSession } from './app-session';

export function ProfileAvatar({ size = 46 }: { size?: number }) {
  const { profilePhoto } = useAppSession();
  const photo = typeof profilePhoto === 'string' && profilePhoto ? profilePhoto : null;
  return <AvatarImage key={photo ?? 'mascot'} photo={photo} size={size} />;
}

function AvatarImage({ photo, size }: { photo: string | null; size: number }) {
  const [failed, setFailed] = useState(false);
  const hasPhoto = photo !== null && !failed;
  const scale = size / 46;
  const photoSize = size * .78;
  return <View pointerEvents="none" style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
    {hasPhoto ? <Image source={{ uri: photo }}
      contentFit="cover" transition={0} accessible={false} onError={() => setFailed(true)}
      style={{ width: photoSize, height: photoSize, left: (size - photoSize) / 2,
        top: (size - photoSize) / 2, borderRadius: photoSize / 2 }} /> :
      <Image source={require('../../assets/images/peeka-profile-light-horns-4k.png')}
        contentFit="contain" transition={0} accessible={false}
        style={{ position: 'absolute', width: 68 * scale, height: 38.25 * scale,
          left: -5.6 * scale, top: 2.9 * scale }} />}
  </View>;
}
