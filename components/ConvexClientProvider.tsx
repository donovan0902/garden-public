'use client';

import { ReactNode, useCallback, useEffect } from 'react';
import { ConvexReactClient, useMutation } from 'convex/react';
import { ConvexProviderWithAuth } from 'convex/react';
import { AuthKitProvider, useAuth, useAccessToken } from '@workos-inc/authkit-nextjs/components';
import { api } from '@/convex/_generated/api';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <AuthKitProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromAuthKit}>
        <EnsureGuestUser />
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  );
}

// Bootstrap: ensures the shared read-only guest user row exists so that unauthenticated
// visitors immediately resolve to a user via getCurrentUser. Idempotent — the mutation is a
// no-op once the row exists, so running it on every mount is cheap.
function EnsureGuestUser() {
  const ensureGuestUser = useMutation(api.users.ensureGuestUser);
  useEffect(() => {
    void ensureGuestUser();
  }, [ensureGuestUser]);
  return null;
}

function useAuthFromAuthKit() {
  const { user, loading: isLoading } = useAuth();
  const { getAccessToken, refresh } = useAccessToken();
  const isAuthenticated = !!user;

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}): Promise<string | null> => {
      if (!user) return null;
      try {
        if (forceRefreshToken) {
          return (await refresh()) ?? null;
        }
        return (await getAccessToken()) ?? null;
      } catch (error) {
        console.error('Failed to get access token:', error);
        return null;
      }
    },
    [user, refresh, getAccessToken],
  );

  return { isLoading, isAuthenticated, fetchAccessToken };
}
