'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The signInWithRedirect side-effect listener (imported in the
    // layout-level ConvexClientProvider) handles the code exchange.
    // We just wait for the auth event and redirect home.

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (
        payload.event === 'signedIn' ||
        payload.event === 'signInWithRedirect'
      ) {
        router.replace('/');
      }
      if (payload.event === 'signInWithRedirect_failure') {
        console.error('OAuth sign-in failed', payload);
        router.replace('/');
      }
    });

    // Fallback: if the token exchange already completed before the
    // listener attached, redirect immediately.
    getCurrentUser()
      .then(() => router.replace('/'))
      .catch(() => {
        // Not authenticated yet — wait for Hub event
      });

    return unsubscribe;
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">Signing you in…</p>
    </div>
  );
}
