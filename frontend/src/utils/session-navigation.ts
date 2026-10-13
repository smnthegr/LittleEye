type SessionAccess = { signedIn: boolean; accepted: boolean; camera: unknown | null };

export function getHomeDestination(session: SessionAccess): '/' | '/home' | '/connect-camera' {
  if (!session.signedIn || !session.accepted) return '/';
  return session.camera ? '/home' : '/connect-camera';
}
