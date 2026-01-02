import { Agent, vStreamArgs } from "@convex-dev/agent";
import { searchProjects, showProjects } from "./tools";
import { components } from "./_generated/api";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { openai } from "@ai-sdk/openai";
import { action, mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const projectAgent = new Agent(components.agent, {
  name: "ProjectFinder",
  instructions: `
    You are a helpful project curator for a tool-sharing platform designed for the workplace, helping people find and share useful tools (also referred to as projects) they've built.
    1. Chat naturally with the user. When they ask about "tools" or "projects" you can assume they are referring to user-created items shared on the platform, and not about tools available for you to call—do not clarify or mention your internal access to 'searchProjects' and 'showProjects' to the user.
    2. If they ask for tools or projects, use 'searchProjects' to find them.
    3. Analyze the search results.
    4. If you find good matches, use 'showProjects' to display them.
    5. Once you have displayed the project(s) or tool(s), do not follow up with any more questions or comments.
  `,
  tools: { searchProjects, showProjects },
  languageModel: bedrock("us.anthropic.claude-haiku-4-5-20251001-v1:0"),
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  maxSteps: 10,
});

export const createThread = mutation({
  args: {},
  handler: async (ctx) => {

    const user = await getCurrentUserOrThrow(ctx);
    if (!user) {
      throw new Error("User not found");
    }

    const { threadId } = await projectAgent.createThread(ctx, {
      userId: user._id.toString(),
    });

    return threadId;
  },
});

export const sendMessageToAgent = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const { thread } = await projectAgent.continueThread(ctx, {
      threadId: args.threadId,
    });
    const result = await thread.streamText(
      { prompt: args.prompt },
      { saveStreamDeltas: true }
    );
    await result.consumeStream();
  },
});

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs
  },
  handler: async (ctx, args) => {
    // check if currently authenticated user is the owner of the thread
    const user = await getCurrentUserOrThrow(ctx);
    if (!user) {
      throw new Error("User not found");
    }
    const thread = await ctx.runQuery(components.agent.threads.getThread, { threadId: args.threadId });
    if (!thread) {
      throw new Error("Thread not found");
    }
    if (thread.userId !== user._id) {
       throw new Error("Unauthorized: User does not own this thread");
    }

    const paginated = await projectAgent.listMessages(ctx, { threadId: args.threadId, paginationOpts: args.paginationOpts });

    const streams = await projectAgent.syncStreams(ctx, { threadId: args.threadId, streamArgs: args.streamArgs });

    return {
      ...paginated,
      streams,
    }
  },
});