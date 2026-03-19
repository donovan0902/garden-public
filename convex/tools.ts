import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { rag } from "./rag";
import { internal } from "./_generated/api";
import { hybridRank } from "@convex-dev/rag";

// Tool 1: The "Eye" (Search)
export const searchCatalog = createTool({
  description: "Search the catalog for projects and discussion threads matching the query using hybrid search (vector search and full text search).",
  args: z.object({ query: z.string() }).describe("The query to be used in the hybrid search to find projects and threads"),
  handler: async (ctx, { query }): Promise<string> => {
    // Don't search if query is too short
    if (query.trim().length < 2) {
      return "Query too short. Please provide at least 2 characters.";
    }

    // Run vector and full-text searches for both projects and threads in parallel
    const [
      projectVectorResults,
      fullTextSearchProjects,
      threadVectorResults,
      fullTextSearchThreads,
    ] = await Promise.all([
      rag.search(ctx, {
        namespace: "projects",
        query: query,
        limit: 15,
        vectorScoreThreshold: 0.2,
      }),
      ctx.runQuery(internal.projects.fullTextSearchProjects, {
        query: query,
        limit: 15,
      }),
      rag.search(ctx, {
        namespace: "threads",
        query: query,
        limit: 10,
        vectorScoreThreshold: 0.2,
      }),
      ctx.runQuery(internal.threads.fullTextSearchThreads, {
        query: query,
        limit: 10,
      }),
    ]);

    // ── Hybrid rank projects ──
    const projectEntryIds = projectVectorResults.entries.map((e: { entryId: string }) => e.entryId);
    const projectFullTextEntryIds = fullTextSearchProjects
      .map((p: { entryId?: string }) => p.entryId)
      .filter((id: string | undefined): id is string => id !== undefined);

    const hybridRankedProjectEntryIds = hybridRank(
      [projectEntryIds, projectFullTextEntryIds],
      {
        k: 15,
        weights: [2, 1],
        cutoffScore: 0.01,
      }
    );

    // Build project info map
    type ProjectInfo = { name: string; summary?: string };
    const projectMap = new Map<string, ProjectInfo>();

    fullTextSearchProjects.forEach((p: { entryId?: string; name: string; summary?: string }) => {
      if (p.entryId) {
        projectMap.set(p.entryId, { name: p.name, summary: p.summary });
      }
    });

    projectVectorResults.entries.forEach((e: { entryId: string; text: string }) => {
      if (!projectMap.has(e.entryId)) {
        const parts = e.text.split("\n\n");
        const name = parts[0] || "Untitled";
        const summary = parts.length > 1 ? parts.slice(1).join("\n\n") : undefined;
        projectMap.set(e.entryId, { name, summary });
      }
    });

    // ── Hybrid rank threads ──
    const threadEntryIds = threadVectorResults.entries.map((e: { entryId: string }) => e.entryId);
    const threadFullTextEntryIds = fullTextSearchThreads
      .map((t: { entryId?: string }) => t.entryId)
      .filter((id: string | undefined): id is string => id !== undefined);

    const hybridRankedThreadEntryIds = hybridRank(
      [threadEntryIds, threadFullTextEntryIds],
      {
        k: 10,
        weights: [2, 1],
        cutoffScore: 0.01,
      }
    );

    // Build thread info map
    type ThreadInfo = { title: string; body?: string };
    const threadMap = new Map<string, ThreadInfo>();

    fullTextSearchThreads.forEach((t: { entryId?: string; title: string; body?: string }) => {
      if (t.entryId) {
        threadMap.set(t.entryId, { title: t.title, body: t.body });
      }
    });

    threadVectorResults.entries.forEach((e: { entryId: string; text: string }) => {
      if (!threadMap.has(e.entryId)) {
        const parts = e.text.split("\n\n");
        const title = parts[0] || "Untitled";
        const body = parts.length > 1 ? parts.slice(1).join("\n\n") : undefined;
        threadMap.set(e.entryId, { title, body });
      }
    });

    // ── Format combined results ──
    const projectSection: string = hybridRankedProjectEntryIds
      .map((entryId: string, index: number) => {
        const project = projectMap.get(entryId);
        if (!project) return null;

        const lines = [
          `📋 [Project ${index + 1}]`,
          `Type: project`,
          `Entry ID: ${entryId}`,
          `Name: ${project.name}`,
        ];
        if (project.summary) {
          lines.push(`Summary: ${project.summary}`);
        }
        return lines.join("\n");
      })
      .filter((text: string | null): text is string => text !== null)
      .join("\n\n---\n\n");

    const threadSection: string = hybridRankedThreadEntryIds
      .map((entryId: string, index: number) => {
        const thread = threadMap.get(entryId);
        if (!thread) return null;

        const lines = [
          `🧵 [Thread ${index + 1}]`,
          `Type: thread`,
          `Entry ID: ${entryId}`,
          `Title: ${thread.title}`,
        ];
        if (thread.body) {
          lines.push(`Body: ${thread.body.slice(0, 200)}`);
        }
        return lines.join("\n");
      })
      .filter((text: string | null): text is string => text !== null)
      .join("\n\n---\n\n");

    const sections = [projectSection, threadSection].filter(Boolean);
    if (sections.length === 0) {
      return "No results found matching your query.";
    }
    if (sections.length === 1) {
      return sections[0];
    }
    return `${sections[0]}\n\n=== Discussion Threads ===\n\n${sections[1]}`;
  },
});

// Tool 2: The "Mouth" (Structured Output — Projects)
export const showProjects = createTool({
  description: "Display a list of project cards to the user. Use this when you find relevant projects.",
  args: z.object({
    projectIds: z.array(z.string()).describe("The entryIDs of the relevant projects"),
    summary: z.string().describe("A brief summary of why these were chosen"),
  }),
  handler: async () => {
    // We don't need to do backend logic here.
    // The mere fact that this tool was called is enough for the UI.
    return "Projects displayed to user.";
  },
});

// Tool 3: Display Thread Cards
export const showThreads = createTool({
  description: "Display a list of discussion thread cards to the user. Use this when you find relevant discussion threads.",
  args: z.object({
    threadIds: z.array(z.string()).describe("The entryIDs of the relevant threads"),
    summary: z.string().describe("A brief summary of why these threads were chosen"),
  }),
  handler: async () => {
    return "Threads displayed to user.";
  },
});
