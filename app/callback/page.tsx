'use client';

import '@/lib/amplify-config';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Importing signInWithRedirect registers a side-effect listener that
// detects the ?code= parameter and exchanges it for tokens. In Next.js
// (a multi-page app), this import must be present on the redirect target
// page, otherwise code-splitting drops the listener.
// See: https://docs.amplify.aws/gen1/nextjs/build-a-backend/auth/add-social-provider/
import { signInWithRedirect, getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

// Reference to prevent tree-shaking from removing the import
void signInWithRedirect;

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn' || payload.event === 'signInWithRedirect') {
        router.replace('/');
      }
      if (payload.event === 'signInWithRedirect_failure') {
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
