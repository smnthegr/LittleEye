import { Redirect, router } from 'expo-router';
import { BackHandler, Platform } from 'react-native';
import { useAppSession } from '@/components/app-session';
import { ConsentGate } from '@/components/consent-gate';

export default function PoliciesScreen() {
  const { accepted, acceptPolicies } = useAppSession();
  if (accepted) return <Redirect href="/sign-in" />;

  function decline() {
    if (Platform.OS === 'android') BackHandler.exitApp();
    else router.dismissTo('/');
  }

  return <ConsentGate onAccept={acceptPolicies} onDecline={decline} />;
}
