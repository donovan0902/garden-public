import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

// In Vercel preview deployments, NEXT_PUBLIC_WORKOS_REDIRECT_URI won't match the
// dynamic deployment URL, so fall back to constructing one from VERCEL_URL.
const redirectUri =
  process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/callback` : undefined);

export default authkitMiddleware({
  redirectUri,
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ['/', '/sign-in', '/sign-up', '/callback', '/ingest/:path*'],
  },
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)).*)',
  ],
};
