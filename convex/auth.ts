// convex/auth.ts
import { AuthKit, type AuthFunctions } from "@convex-dev/workos-authkit";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

const authFunctions: AuthFunctions = internal.auth;

export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
  authFunctions,
});

export const { authKitEvent } = authKit.events({
  "user.created": async (ctx, event) => {
    await ctx.db.insert("users", {
      workosUserId: event.data.id,
      email: event.data.email,
      name: `${event.data.firstName} ${event.data.lastName}`,
      avatarUrlId: event.data.profilePictureUrl ?? undefined,
      onboardingCompleted: false,
    });
  },
  "user.updated": async (ctx, event) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workosUserId", (q) => q.eq("workosUserId", event.data.id))
      .unique();
    if (!user) {
      console.warn(`User not found: ${event.data.id}`);
      return;
    }
    await ctx.db.patch(user._id, {
      email: event.data.email,
      name: `${event.data.firstName} ${event.data.lastName}`,
    });
  },
  "user.deleted": async (ctx, event) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workosUserId", (q) => q.eq("workosUserId", event.data.id))
      .unique();
    if (!user) {
      console.warn(`User not found: ${event.data.id}`);
      return;
    }
    await ctx.db.delete(user._id);
  },

  // Handle any event type
  "session.created": async (ctx, event) => {
    console.log("onCreateSession", event);
  },
});

// Action handlers (replaces your API route)
export const { authKitAction } = authKit.actions({
  userRegistration: async (ctx, action, response) => {
    // Your domain validation logic from the API route
    const emailDomain = action.userData.email.split("@")[1];
    // You can query Convex here or use WorkOS API
    // For now, simplified version:
    if (!emailDomain) {
      return response.deny("Email domain not allowed");
    }

    return response.allow();
  },
});