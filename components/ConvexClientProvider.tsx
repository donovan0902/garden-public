'use client';

import '@/lib/amplify-config';

import { ReactNode, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ConvexReactClient, useMutation } from 'convex/react';
import { ConvexProviderWithAuth } from 'convex/react';
// signInWithRedirect must be imported here (layout level) so its
// side-effect OAuth callback listener is registered on every page.
// In Next.js, code-splitting drops it if only imported on the callback page.
import { fetchAuthSession, getCurrentUser, signInWithRedirect } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

import { api } from '@/convex/_generated/api';

// Prevent tree-shaking from removing the signInWithRedirect import
void signInWithRedirect;

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromCognito}>
      <EnsureUser />
      {children}
    </ConvexProviderWithAuth>
  );
}

function EnsureUser() {
  const ensureUser = useMutation(api.users.ensureUser);
  const hasEnsured = useRef(false);

  useEffect(() => {
    if (hasEnsured.current) return;

    async function check() {
      try {
        await getCurrentUser();
        hasEnsured.current = true;
        await ensureUser();
      } catch {
        // Not authenticated — nothing to do
      }
    }
    void check();
  }, [ensureUser]);

  return null;
}

function useAuthFromCognito() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth(source: string) {
      console.log(`[AUTH DEBUG] checkAuth called from: ${source}`);
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString() ?? null;
        console.log(`[AUTH DEBUG] fetchAuthSession result:`, {
          hasTokens: !!session.tokens,
          hasIdToken: !!idToken,
          idTokenPrefix: idToken ? idToken.substring(0, 30) + '...' : null,
        });
        setIsAuthenticated(!!idToken);
      } catch (err) {
        console.log(`[AUTH DEBUG] fetchAuthSession ERROR:`, err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    void checkAuth('initial mount');

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      console.log(`[AUTH DEBUG] Hub event: ${payload.event}`, payload);
      if (
        payload.event === 'signedIn' ||
        payload.event === 'signInWithRedirect' ||
        payload.event === 'tokenRefresh'
      ) {
        void checkAuth(`hub:${payload.event}`);
      } else if (payload.event === 'signedOut') {
        setIsAuthenticated(false);
      }
    });

    return unsubscribe;
  }, []);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const session = await fetchAuthSession({
          forceRefresh: forceRefreshToken,
        });
        const token = session.tokens?.idToken?.toString() ?? null;
        console.log(`[AUTH DEBUG] fetchAccessToken called (forceRefresh=${forceRefreshToken}):`, {
          hasToken: !!token,
          tokenPrefix: token ? token.substring(0, 30) + '...' : null,
        });
        return token;
      } catch (err) {
        console.log(`[AUTH DEBUG] fetchAccessToken ERROR:`, err);
        return null;
      }
    },
    [],
  );

  return useMemo(() => {
    console.log(`[AUTH DEBUG] useAuthFromCognito returning:`, { isLoading, isAuthenticated });
    return {
      isLoading,
      isAuthenticated,
      fetchAccessToken,
    };
  }, [isLoading, isAuthenticated, fetchAccessToken]);
}
