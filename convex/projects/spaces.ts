import { v } from "convex/values";
import { query } from "../_generated/server";
import { internalMutation as internalMutationFromFunctions } from "../functions";
import { getCurrentUser } from "../users";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

const MAX_SECONDARY_SPACES = 3;

// ─── Internal mutations ──────────────────────────────────────────────────────

export const syncSecondarySpaces = internalMutationFromFunctions({
  args: {
    projectId: v.id("projects"),
    primaryFocusAreaId: v.optional(v.id("focusAreas")),
    additionalFocusAreaIds: v.array(v.id("focusAreas")),
  },
  handler: async (ctx, args) => {
    // Enforce max and filter out primary
    const desired = Array.from(
      new Set(
        args.additionalFocusAreaIds.filter(
          (id) => id !== args.primaryFocusAreaId
        )
      )
    ).slice(0, MAX_SECONDARY_SPACES);

    // Get existing secondary space rows
    const existing = await ctx.db
      .query("projectSpaces")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const existingIds = new Set(existing.map((row) => row.focusAreaId));
    const desiredIds = new Set(desired);

    // Delete removed ones
    for (const row of existing) {
      if (!desiredIds.has(row.focusAreaId)) {
        await ctx.db.delete(row._id);
      }
    }

    // Insert new ones
    for (const focusAreaId of desired) {
      if (!existingIds.has(focusAreaId)) {
        await ctx.db.insert("projectSpaces", {
          projectId: args.projectId,
          focusAreaId,
        });
      }
    }
  },
});

export const deleteSecondarySpaces = internalMutationFromFunctions({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("projectSpaces")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
  },
});

// ─── Shared query helper ─────────────────────────────────────────────────────

export async function getSecondarySpacesForProject(
  ctx: QueryCtx,
  projectId: Id<"projects">
) {
  const rows = await ctx.db
    .query("projectSpaces")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const spaces = await Promise.all(
    rows.map(async (row) => {
      const fa = await ctx.db.get(row.focusAreaId);
      if (!fa || !fa.isActive) return null;
      return {
        _id: fa._id,
        name: fa.name,
        group: fa.group,
        icon: fa.icon,
      };
    })
  );

  return spaces.filter(
    (s): s is NonNullable<typeof s> => s !== null
  );
}

// ─── Public query: secondary projects in a space ─────────────────────────────

export const listSecondaryProjectsBySpace = query({
  args: {
    focusAreaId: v.id("focusAreas"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const userId = currentUser?._id;

    // Get all project IDs tagged with this space as secondary
    const rows = await ctx.db
      .query("projectSpaces")
      .withIndex("by_focusArea", (q) => q.eq("focusAreaId", args.focusAreaId))
      .collect();

    if (rows.length === 0) return [];

    // Fetch project docs, filter to active
    const projects = (
      await Promise.all(
        rows.map(async (row) => {
          const project = await ctx.db.get(row.projectId);
          if (!project || project.status !== "active") return null;
          return project;
        })
      )
    ).filter((p): p is NonNullable<typeof p> => p !== null);

    if (projects.length === 0) return [];

    // Enrich with the shared helper
    const { enrichProjects } = await import("./helpers");
    const enriched = await enrichProjects(ctx, projects, userId);

    // Sort by hotScore desc
    return enriched.sort(
      (a, b) => (b.hotScore ?? 0) - (a.hotScore ?? 0)
    );
  },
});
