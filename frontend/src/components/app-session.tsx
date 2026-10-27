import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { type CameraDetails } from '@/constants/camera';
import type { EmergencyAreaChoice } from '@/utils/emergency-directory';
import type { PhilippineAddress } from '@/utils/philippine-address';
import { mergeFallEvents, toFallEventEntry, type FallEventRecording, type ReadyFallEventEntry } from '@/utils/fall-event-recording';

export type Contact = { fullName: string; phone: string; email: string; address: string; addressDetails?: PhilippineAddress };
export type Profile = {
  guardian: Contact;
  child: { fullName: string; birthdate: string; height: string; sex: string };
  contacts: Contact[];
  emergencyArea?: EmergencyAreaChoice;
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
  fallEvents: ReadyFallEventEntry[];
  /** Replace history after an authenticated backend fetch. Does not trigger an alert. */
  replaceFallEvents: (records: FallEventRecording[]) => void;
  /** Receive a ready event from the backend subscription; repeated IDs are updated. */
  recordFallEvent: (record: FallEventRecording) => void;
  acceptPolicies: () => void;
  enterPreview: (profile?: Profile) => void;
  signOut: () => void;
  deleteAccount: () => void;
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
  const [fallEvents, setFallEvents] = useState<ReadyFallEventEntry[]>([]);
  const [eventSessionKey, setEventSessionKey] = useState(() => Symbol('fall-events'));
  const activeEventSession = useRef<symbol | null>(null);
  function clearSession() {
    activeEventSession.current = null;
    setProfile(null); setCamera(null); setProfilePhoto(null); setChildPhoto(null); setFallEvents([]); setSignedIn(false);
  }
  return <SessionContext.Provider value={{ accepted, signedIn, profile, camera, profilePhoto,
    setProfilePhoto, updateProfile: setProfile, childPhoto, setChildPhoto,
    saveCamera: setCamera,
    fallEvents,
    replaceFallEvents: records => {
      if (signedIn && activeEventSession.current === eventSessionKey) setFallEvents(mergeFallEvents([], records.map(toFallEventEntry)));
    },
    recordFallEvent: record => {
      if (!signedIn || activeEventSession.current !== eventSessionKey) return;
      const entry = toFallEventEntry(record);
      setFallEvents(previous => mergeFallEvents(previous, [entry]));
    },
    acceptPolicies: () => setAccepted(true),
    enterPreview: (value) => {
      const key = Symbol('fall-events');
      activeEventSession.current = key;
      setEventSessionKey(key);
      setProfile(value ?? null); setCamera(null); setProfilePhoto(null); setChildPhoto(null); setFallEvents([]); setSignedIn(true);
    },
    signOut: clearSession,
    deleteAccount: () => { clearSession(); setAccepted(false); },
  }}>{children}</SessionContext.Provider>;
}

export function useAppSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('AppSessionProvider is required.');
  return session;
}
