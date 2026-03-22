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
      externalUserId: event.data.id,
      email: event.data.email,
      emailLower: event.data.email?.toLowerCase(),
      name: `${event.data.firstName} ${event.data.lastName}`,
      onboardingCompleted: false,
      avatarUrlId: event.data.profilePictureUrl ?? undefined,
    });
  },
  "user.updated": async (ctx, event) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalUserId", (q) => q.eq("externalUserId", event.data.id))
      .unique();
    if (!user) {
      console.warn(`User not found: ${event.data.id}`);
      return;
    }
    await ctx.db.patch(user._id, {
      email: event.data.email,
      emailLower: event.data.email?.toLowerCase(),
      name: `${event.data.firstName} ${event.data.lastName}`,
    });
  },
  "user.deleted": async (ctx, event) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalUserId", (q) => q.eq("externalUserId", event.data.id))
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