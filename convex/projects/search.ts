import { action, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { rag } from "../rag";
import type { Id } from "../_generated/dataModel";
import { hybridRank } from "@convex-dev/rag";

export const fullTextSearchProjects = internalQuery({
  args: {
    query: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withSearchIndex("allFields", (q) => q.search("allFields", args.query))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit);
  },
});

export const searchCatalog = action({
  args: {
    query: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<
    Array<{
      _id: string;
      entryId: string;
      type: "project" | "thread";
      name: string;
      summary?: string;
    }>
  > => {
    if (args.query.trim().length < 2) {
      return [];
    }

    // Search both projects and threads in parallel
    const [
      projectVectorResults,
      fullTextProjects,
      threadVectorResults,
      fullTextThreads,
    ] = await Promise.all([
      rag.search(ctx, {
        namespace: "projects",
        query: args.query,
        limit: 15,
        vectorScoreThreshold: 0.5,
      }),
      ctx.runQuery(internal.projects.fullTextSearchProjects, {
        query: args.query,
        limit: 15,
      }),
      rag.search(ctx, {
        namespace: "threads",
        query: args.query,
        limit: 10,
        vectorScoreThreshold: 0.5,
      }),
      ctx.runQuery(internal.threads.fullTextSearchThreads, {
        query: args.query,
        limit: 10,
      }),
    ]);

    // Hybrid rank projects
    const projectEntryIds = projectVectorResults.entries.map((e: { entryId: string }) => e.entryId);
    const projectFullTextEntryIds = fullTextProjects
      .map((p: { entryId?: string }) => p.entryId)
      .filter((id: string | undefined): id is string => id !== undefined);
    const hybridRankedProjectEntryIds = hybridRank(
      [projectEntryIds, projectFullTextEntryIds],
      { k: 10, weights: [1.5, 1], cutoffScore: 0.05 }
    );

    // Hybrid rank threads
    const threadEntryIds = threadVectorResults.entries.map((e: { entryId: string }) => e.entryId);
    const threadFullTextEntryIds = fullTextThreads
      .map((t: { entryId?: string }) => t.entryId)
      .filter((id: string | undefined): id is string => id !== undefined);
    const hybridRankedThreadEntryIds = hybridRank(
      [threadEntryIds, threadFullTextEntryIds],
      { k: 5, weights: [1.5, 1], cutoffScore: 0.05 }
    );

    // Fetch actual records in parallel
    const [allProjects, allThreads] = await Promise.all([
      ctx.runQuery(internal.projects.getProjectsByEntryIds, {
        entryIds: hybridRankedProjectEntryIds,
        excludeProjectId: undefined,
      }),
      ctx.runQuery(internal.threads.getThreadsByEntryIdsInternal, {
        entryIds: hybridRankedThreadEntryIds,
      }),
    ]);

    // Build ordered project results
    type ProjectWithEntryId = (typeof allProjects)[number];
    const projectMap = new Map(allProjects.map((p: ProjectWithEntryId) => [p.entryId!, p]));
    const projectResults = hybridRankedProjectEntryIds
      .map((entryId) => {
        const p = projectMap.get(entryId);
        if (!p) return null;
        return {
          _id: p._id as string,
          entryId,
          type: "project" as const,
          name: p.name,
          summary: p.summary,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // Build ordered thread results
    type ThreadRecord = (typeof allThreads)[number];
    const threadMap = new Map(allThreads.map((t: ThreadRecord) => [t.entryId!, t]));
    const threadResults = hybridRankedThreadEntryIds
      .map((entryId) => {
        const t = threadMap.get(entryId);
        if (!t) return null;
        return {
          _id: t._id as string,
          entryId,
          type: "thread" as const,
          name: t.title,
          summary: t.body,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    // Projects first, then threads
    return [...projectResults, ...threadResults];
  },
});

export const getSimilarProjects = action({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (
    ctx,
    args
  ): Promise<
    Array<{
      _id: Id<"projects">;
      name: string;
      summary?: string;
      team: string;
      upvotes: number;
      creatorId: Id<"users">;
      creatorName: string;
      creatorAvatar: string;
    }>
  > => {
    const project = await ctx.runQuery(internal.projects.getProject, {
      projectId: args.projectId,
    });
    if (!project) {
      return [];
    }
    const text = project.summary ? `${project.name}\n\n${project.summary}` : project.name;
    const { entries } = await rag.search(ctx, {
      namespace: "projects",
      query: text,
      limit: 5,
      vectorScoreThreshold: 0.6,
    });
    const similarProjects = await ctx.runQuery(
      internal.projects.getProjectsByEntryIds,
      {
        entryIds: entries.map((e) => e.entryId),
        excludeProjectId: args.projectId,
      }
    );
    const projectsWithCounts = await ctx.runQuery(
      internal.projects.populateProjectDetails,
      { projects: similarProjects }
    );
    return projectsWithCounts;
  },
});

export const searchSimilarProjectsByText = action({
  args: {
    name: v.string(),
    summary: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<
    Array<{
      _id: Id<"projects">;
      name: string;
      summary?: string;
      team: string;
      upvotes: number;
      creatorId: Id<"users">;
      creatorName: string;
      creatorAvatar: string;
    }>
  > => {
    const summaryLength = args.summary?.trim().length ?? 0;
    if (args.name.trim().length < 2 && summaryLength < 2) {
      return [];
    }
    const text = args.summary ? `${args.name}\n\n${args.summary}` : args.name;
    const { entries } = await rag.search(ctx, {
      namespace: "projects",
      query: text,
      limit: 5,
      vectorScoreThreshold: 0.6,
    });
    const similarProjects = await ctx.runQuery(
      internal.projects.getProjectsByEntryIds,
      {
        entryIds: entries.map((e) => e.entryId),
        excludeProjectId: undefined,
      }
    );
    const projectsWithCounts = await ctx.runQuery(
      internal.projects.populateProjectDetails,
      { projects: similarProjects }
    );
    return projectsWithCounts;
  },
});
