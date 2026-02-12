'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('[CALLBACK DEBUG] CallbackPage mounted, URL:', window.location.href);

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      console.log(`[CALLBACK DEBUG] Hub event: ${payload.event}`, payload);
      if (
        payload.event === 'signedIn' ||
        payload.event === 'signInWithRedirect'
      ) {
        router.replace('/');
      }
      if (payload.event === 'signInWithRedirect_failure') {
        console.error('[CALLBACK DEBUG] OAuth sign-in failed', payload);
        router.replace('/');
      }
    });

    // Fallback: if the token exchange already completed before the
    // listener attached, redirect immediately.
    getCurrentUser()
      .then((user) => {
        console.log('[CALLBACK DEBUG] getCurrentUser success:', user);
        router.replace('/');
      })
      .catch((err) => {
        console.log('[CALLBACK DEBUG] getCurrentUser failed (waiting for Hub):', err);
      });

    return unsubscribe;
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">Signing you in…</p>
    </div>
  );
}
