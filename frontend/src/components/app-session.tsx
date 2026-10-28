import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { type CameraDetails } from '@/constants/camera';
import type { EmergencyAreaChoice } from '@/utils/emergency-directory';
import type { PhilippineAddress } from '@/utils/philippine-address';
import { mergeFallEvents, toFallEventEntry, type FallEventRecording, type ReadyFallEventEntry } from '@/utils/fall-event-recording';
import { createEmptyProfile } from '@/utils/profile';
import { clearPlaceSearchCache } from '@/utils/place-search-cache';

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
  /** In-memory identity for rejecting stale UI callbacks; not an authentication token. */
  sessionKey: symbol | null;
  isCurrentSession: () => boolean;
  profile: Profile | null;
  updateProfile: (profile: Profile) => void;
  updateContacts: (contacts: Contact[]) => void;
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
  function isCurrentSession() {
    return signedIn && activeEventSession.current === eventSessionKey;
  }
  function clearSession() {
    activeEventSession.current = null;
    clearPlaceSearchCache();
    setProfile(null); setCamera(null); setProfilePhoto(null); setChildPhoto(null); setFallEvents([]); setSignedIn(false);
  }
  return <SessionContext.Provider value={{ accepted, signedIn, sessionKey: signedIn ? eventSessionKey : null,
    isCurrentSession, profile, camera, profilePhoto,
    setProfilePhoto: uri => { if (isCurrentSession()) setProfilePhoto(uri); },
    updateProfile: value => { if (isCurrentSession()) setProfile(value); },
    childPhoto, setChildPhoto: uri => { if (isCurrentSession()) setChildPhoto(uri); },
    updateContacts: contacts => {
      if (!isCurrentSession()) return;
      setProfile(previous => ({ ...(previous ?? createEmptyProfile()), contacts }));
    },
    saveCamera: value => { if (isCurrentSession()) setCamera(value); },
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
      clearPlaceSearchCache();
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
