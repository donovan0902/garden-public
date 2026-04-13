// src/useCurrentUser.ts
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function useCurrentUser() {
  const { isLoading: convexAuthLoading } = useConvexAuth();
  const user = useQuery(api.users.current);

  // Any resolved user (real WorkOS user or the shared guest) counts as authenticated
  // from the UI's perspective. Mutations are still gated server-side via
  // getCurrentUserOrThrow, which rejects the guest account.
  return {
    isLoading: convexAuthLoading || user === undefined,
    isAuthenticated: !!user,
    // true when the visitor is browsing as the shared read-only guest account
    isGuest: user?.externalUserId === "guest",
    user: user ?? null,
  };
}
