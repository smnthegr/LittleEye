import { createContext, useContext, useState, type ReactNode } from 'react';
import { type CameraDetails } from '@/constants/camera';

type Contact = { fullName: string; phone: string; email: string; address: string };
export type Profile = {
  guardian: Contact;
  child: { fullName: string; birthdate: string; height: string; sex: string };
  contacts: Contact[];
};
type Session = {
  accepted: boolean;
  signedIn: boolean;
  profile: Profile | null;
  updateProfile: (profile: Profile) => void;
  childPhoto: string | null;
  setChildPhoto: (uri: string | null) => void;
  profilePhoto: string | null;
  setProfilePhoto: (uri: string | null) => void;
  camera: CameraDetails | null;
  saveCamera: (camera: CameraDetails) => void;
  acceptPolicies: () => void;
  enterPreview: (profile?: Profile) => void;
  signOut: () => void;
};
const SessionContext = createContext<Session | null>(null);

// Frontend-only session. No credentials are stored and no account is verified.
export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [childPhoto, setChildPhoto] = useState<string | null>(null);
  const [camera, setCamera] = useState<CameraDetails | null>(null);
  return <SessionContext.Provider value={{ accepted, signedIn, profile, camera, profilePhoto,
    setProfilePhoto, updateProfile: setProfile, childPhoto, setChildPhoto,
    saveCamera: setCamera,
    acceptPolicies: () => setAccepted(true),
    enterPreview: (value) => { setProfile(value ?? null); setCamera(null); setProfilePhoto(null); setChildPhoto(null); setSignedIn(true); },
    signOut: () => { setProfile(null); setCamera(null); setProfilePhoto(null); setChildPhoto(null); setSignedIn(false); },
  }}>{children}</SessionContext.Provider>;
}

export function useAppSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('AppSessionProvider is required.');
  return session;
}
