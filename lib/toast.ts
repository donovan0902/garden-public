import { toast } from "sonner";

/**
 * Surfaces mutation errors as toast notifications.
 * Detects the GUEST_BLOCKED prefix (thrown by getCurrentUserOrThrow when the
 * shared read-only guest account tries to write data) and shows a contextual
 * "read-only demo" message instead of the generic fallback.
 */
export function toastMutationError(error: unknown, fallbackMessage: string): void {
  if (error instanceof Error && error.message.includes("GUEST_BLOCKED")) {
    toast.error("This is a read-only demo. Sign in to interact.", {
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
