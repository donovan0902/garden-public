import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

// In Vercel preview deployments, NEXT_PUBLIC_WORKOS_REDIRECT_URI won't match the
// dynamic deployment URL, so fall back to constructing one from VERCEL_URL.
const redirectUri =
  process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/callback` : undefined);

// middlewareAuth is intentionally disabled: this is the public demo deployment,
// and unauthenticated visitors are auto-signed-in as a shared read-only guest user
// at the Convex layer (see getCurrentUser in convex/users.ts). If the middleware
// enforced auth here, it would redirect every non-whitelisted path to /sign-in
// before the guest-user code got a chance to run.
export default authkitMiddleware({
  redirectUri,
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)).*)',
  ],
};
