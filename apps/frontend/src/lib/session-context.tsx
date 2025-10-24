'use client';

import { createContext, useContext } from 'react';

import type { SessionUser } from '@proserv/shared';

const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionUser {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('SessionProvider is required to access session data');
  }
  return value;
}
