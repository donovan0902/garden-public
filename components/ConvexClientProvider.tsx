'use client';

import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { ConvexReactClient, useConvexAuth, useMutation } from 'convex/react';
import { ConvexProviderWithAuth } from 'convex/react';
import { AuthKitProvider, useAuth, useAccessToken } from '@workos-inc/authkit-nextjs/components';

import { api } from '@/convex/_generated/api';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <AuthKitProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromAuthKit}>
        <EnsureUser />
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  );
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

function EnsureUser() {
  const ensureUser = useMutation(api.users.ensureUser);
  const { isAuthenticated } = useConvexAuth();
  const hasEnsured = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      hasEnsured.current = false;
      return;
    }
    if (hasEnsured.current) return;

    let cancelled = false;

    async function run() {
      try {
        await ensureUser();
        if (!cancelled) {
          hasEnsured.current = true;
        }
      } catch {
        // Mutation failed — will retry on next auth state change or remount
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, ensureUser]);

  return null;
}
