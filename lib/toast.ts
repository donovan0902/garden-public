import { ConvexError } from "convex/values";
import { toast } from "sonner";

/**
 * Surfaces mutation errors as toast notifications.
 * Detects the GUEST_BLOCKED marker (thrown by getCurrentUserOrThrow as a
 * ConvexError when the shared read-only guest account tries to write data)
 * and shows a contextual "read-only demo" message instead of the generic
 * fallback. The server throws a ConvexError — not a plain Error — because
 * Convex redacts plain Error messages to "Server Error" in production builds.
 */
export function toastMutationError(error: unknown, fallbackMessage: string): void {
  if (isGuestBlockedError(error)) {
    toast.error("This is a read-only demo. Sign in to use this feature.", {
      action: {
        label: "Sign In",
        onClick: () => {
          window.location.href = "/sign-in";
        },
      },
    });
    return;
  }
  toast.error(fallbackMessage);
}

function isGuestBlockedError(error: unknown): boolean {
  if (error instanceof ConvexError && typeof error.data === "string" && error.data.includes("GUEST_BLOCKED")) {
    return true;
  }
  // Fallback for dev builds where Convex preserves the original message string.
  if (error instanceof Error && error.message.includes("GUEST_BLOCKED")) {
    return true;
  }
  return false;
}
