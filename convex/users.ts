import { query, QueryCtx, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Sentinel externalUserId for the shared read-only guest user.
// Real WorkOS user ids are UUIDs, so this value can never collide.
export const GUEST_EXTERNAL_USER_ID = "guest";

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const currentWithFocusAreas = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const focusAreaLinks = await ctx.db
      .query("userFocusAreas")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const focusAreaIds = focusAreaLinks.map((link) => link.focusAreaId);

    return { ...user, focusAreaIds };
  },
});

// use this to get the current user document for linking _id to other documents and such. If the user is not found, throw an error.
// Throws GUEST_BLOCKED if the resolved user is the shared read-only guest account — this is the
// choke point that prevents unauthenticated visitors from writing data.
export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("User not found");
  }
  if (user.externalUserId === GUEST_EXTERNAL_USER_ID) {
    throw new Error("GUEST_BLOCKED: guests cannot modify data");
  }
  return user;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    // Unauthenticated visitors are auto-signed-in as the shared read-only guest user
    // (see ensureGuestUser below). Returns null if the guest row has not been seeded yet —
    // the client-side <EnsureGuestUser /> bootstrap will create it on first load.
    return await ctx.db
      .query("users")
      .withIndex("by_externalUserId", (q) =>
        q.eq("externalUserId", GUEST_EXTERNAL_USER_ID)
      )
      .unique();
  }

  return await ctx.db
    .query("users")
    .withIndex("by_externalUserId", (q) => q.eq("externalUserId", identity.subject))
    .unique();
}

// Shared helper: fetch focus areas for a user (used by getUserFocusAreas query and getProfile)
export async function fetchUserFocusAreas(ctx: QueryCtx, userId: Id<"users">) {
  const links = await ctx.db
    .query("userFocusAreas")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const focusAreas = await Promise.all(
    links.map((link) => ctx.db.get(link.focusAreaId))
  );

  return focusAreas.filter((fa) => fa !== null);
}

// Get focus areas for a specific user
export const getUserFocusAreas = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await fetchUserFocusAreas(ctx, args.userId);
  },
});

export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const viewer = await getCurrentUser(ctx);
    if (!viewer) {
      return null;
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    const [team, focusAreas, projects, follows] = await Promise.all([
      user.teamId ? ctx.db.get(user.teamId) : Promise.resolve(null),
      fetchUserFocusAreas(ctx, user._id),
      ctx.db
        .query("projects")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("adoptions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect(),
    ]);

    return {
      _id: user._id,
      name: user.name,
      avatarUrlId: user.avatarUrlId ?? "",
      email: user.email ?? null,
      team: team?.name ?? "",
      department: user.department ?? null,
      userIntent: user.userIntent ?? null,
      focusAreas: focusAreas.map((fa) => ({
        _id: fa._id,
        name: fa.name,
        group: fa.group,
        icon: fa.icon,
      })),
      projectCount: projects.length,
      followingCount: follows.length,
    };
  },
});

// Idempotent: creates the shared read-only guest user row on first call, no-op afterward.
// Called from the client on app mount so unauthenticated visitors always have a user record to
// resolve against via getCurrentUser.
export const ensureGuestUser = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_externalUserId", (q) =>
        q.eq("externalUserId", GUEST_EXTERNAL_USER_ID)
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      externalUserId: GUEST_EXTERNAL_USER_ID,
      name: "Guest",
      onboardingCompleted: true,
    });
  },
});

export const completeOnboarding = mutation({
  args: {
    teamId: v.optional(v.id("teams")),
    userIntent: v.optional(v.union(v.literal("looking"), v.literal("sharing"), v.literal("both"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await ctx.db.patch(user._id, {
      onboardingCompleted: true,
      teamId: args.teamId,
      userIntent: args.userIntent,
    });

    return { success: true };
  },
});


export const getEmailRecipient = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    return {
      name: user.name,
      email: user.email ?? null,
    };
  },
});
