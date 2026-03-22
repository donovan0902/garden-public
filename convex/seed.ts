import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { rag } from "./rag";

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const at = (offsetMs: number) => now + offsetMs;

    // ── 1. Focus Areas ────────────────────────────────────────────────────────
    const focusAreaIds: Id<"focusAreas">[] = [];
    const focusAreas = [
      { name: "AI Infrastructure", group: "Technical", description: "Systems and tooling for AI.", icon: "🤖" },
      { name: "Go-to-Market", group: "Business", description: "Launch and distribution strategy.", icon: "🚀" },
      { name: "UX Research", group: "Design", description: "User discovery and research.", icon: "🔬" },
      { name: "Data Privacy", group: "Compliance", description: "Privacy and governance.", icon: "🔒" },
      { name: "Developer Productivity", group: "Technical", description: "Tools to speed up engineering workflows.", icon: "⚡" },
    ];
    for (let i = 0; i < focusAreas.length; i++) {
      const id = await ctx.db.insert("focusAreas", {
        ...focusAreas[i],
        isActive: i !== focusAreas.length - 1, // last one inactive
        createdAt: at(i * 10),
      });
      focusAreaIds.push(id);
    }

    // ── 2. Teams ──────────────────────────────────────────────────────────────
    const teamIds: Id<"teams">[] = [];
    const teams = [
      { name: "Velocity Lab", description: "R&D skunkworks." },
      { name: "Product Studio", description: "Product design and launch." },
      { name: "Community Collective", description: undefined },
    ];
    for (let i = 0; i < teams.length; i++) {
      const id = await ctx.db.insert("teams", {
        ...teams[i],
        createdAt: at(1000 + i * 10),
      });
      teamIds.push(id);
    }

    // ── 3. Users ──────────────────────────────────────────────────────────────
    const userIds: Id<"users">[] = [];
    const usersData = [
      { name: "Alex Johnson",   teamId: teamIds[0], userIntent: "sharing" as const, department: "Engineering",  onboarding: true  },
      { name: "Riley Chen",     teamId: teamIds[0], userIntent: "looking" as const, department: "Product",      onboarding: true  },
      { name: "Jordan Lee",     teamId: teamIds[1], userIntent: "both"    as const, department: "Design",       onboarding: true  },
      { name: "Casey Patel",    teamId: undefined,  userIntent: undefined,           department: undefined,      onboarding: true  },
      { name: "Morgan Brooks",  teamId: teamIds[1], userIntent: "sharing" as const, department: "Marketing",    onboarding: false }, // incomplete onboarding
      { name: "Sam Rivera",     teamId: teamIds[0], userIntent: "looking" as const, department: "Engineering",  onboarding: true  },
      { name: "Taylor Nguyen",  teamId: undefined,  userIntent: "both"    as const, department: "Data Science", onboarding: true  },
      { name: "Jamie Ortiz",    teamId: teamIds[1], userIntent: "looking" as const, department: "Legal",        onboarding: true  },
      { name: "Devon Blake",    teamId: teamIds[2], userIntent: undefined,           department: "Ops",          onboarding: true  },
    ];
    for (let i = 0; i < usersData.length; i++) {
      const u = usersData[i];
      const id = await ctx.db.insert("users", {
        name: u.name,
        email: i === 3 ? undefined : `preview_user_${String(i + 1).padStart(2, "0")}@example.com`,
        emailLower: i === 3 ? undefined : `preview_user_${String(i + 1).padStart(2, "0")}@example.com`,
        externalUserId: `user_preview_${String(i + 1).padStart(2, "0")}`,
        workosUserId: `wos_preview_${String(i + 1).padStart(2, "0")}`,
        avatarUrlId: i % 2 === 0 ? `avatar_seed_${i + 1}` : undefined,
        onboardingCompleted: u.onboarding,
        teamId: u.teamId,
        userIntent: u.userIntent,
        department: u.department,
        emailPreferences: i === 0 ? {
          weeklyDigest: true,
          spaceActivity: true,
          projectActivity: true,
          followedProjectComment: true,
          followedProjectUpdate: false,
        } : undefined,
      });
      userIds.push(id);
    }

    // ── 4. User Focus Areas ───────────────────────────────────────────────────
    const userFocusAreaMappings = [
      { userId: userIds[0], areas: [focusAreaIds[0], focusAreaIds[2]] },
      { userId: userIds[1], areas: [focusAreaIds[1]] },
      { userId: userIds[2], areas: [focusAreaIds[3]] },
      { userId: userIds[3], areas: [focusAreaIds[0]] },
      { userId: userIds[4], areas: [focusAreaIds[1], focusAreaIds[3]] },
      { userId: userIds[5], areas: [focusAreaIds[0]] },
      { userId: userIds[6], areas: [focusAreaIds[2]] },
      { userId: userIds[7], areas: [focusAreaIds[1], focusAreaIds[2]] },
      { userId: userIds[8], areas: [focusAreaIds[4]] },
    ];
    let userFocusAreaCount = 0;
    for (const m of userFocusAreaMappings) {
      for (const focusAreaId of m.areas) {
        await ctx.db.insert("userFocusAreas", { userId: m.userId, focusAreaId, createdAt: at(2000) });
        userFocusAreaCount++;
      }
    }

    // ── 5. Projects ───────────────────────────────────────────────────────────
    const projectIds: Id<"projects">[] = [];
    const projectsData = [
      {
        name: "Signal Atlas",
        summary: "Discover competitor signals across the web with automated tracking.",
        userId: userIds[0], teamId: teamIds[0], focusAreaId: focusAreaIds[0],
        status: "active" as const, readinessStatus: "ready_to_use" as const,
        upvotes: 12, viewCount: 120,
        links: [{ url: "https://example.com/signal-atlas", label: "Signal Atlas" }],
        pinned: true, engagementScore: 78, hotScore: 92,
        versionCount: 2, lastVersionAt: at(-86400000),
      },
      {
        name: "Launch Compass",
        summary: "Plan and execute launch playbooks with step-by-step guidance.",
        userId: userIds[1], teamId: teamIds[0], focusAreaId: focusAreaIds[1],
        status: "active" as const, readinessStatus: "early_prototype" as const,
        upvotes: 5, viewCount: 60,
        links: [{ url: "https://example.com/launch-compass", label: "Launch Compass" }],
        pinned: false, engagementScore: 52, hotScore: 40,
        versionCount: 1, lastVersionAt: at(-172800000),
      },
      {
        name: "Insight Vault",
        summary: "Organize user research artifacts in one searchable place.",
        userId: userIds[2], teamId: teamIds[1], focusAreaId: focusAreaIds[2],
        status: "pending" as const, readinessStatus: "mostly_working" as const,
        upvotes: 3, viewCount: 30,
        links: [{ url: "https://example.com/insight-vault", label: "Insight Vault" }],
        pinned: undefined, engagementScore: undefined, hotScore: undefined,
        versionCount: undefined, lastVersionAt: undefined,
      },
      {
        name: "Privacy Pulse",
        summary: "Track privacy posture and surface compliance gaps across your stack.",
        userId: userIds[3], teamId: undefined, focusAreaId: focusAreaIds[3],
        status: "active" as const, readinessStatus: "ready_to_use" as const,
        upvotes: 20, viewCount: 200,
        links: [{ url: "https://example.com/privacy-pulse", label: "Privacy Pulse" }],
        pinned: true, engagementScore: 90, hotScore: 98,
        versionCount: 3, lastVersionAt: at(-43200000),
      },
      {
        name: "Signal Forge",
        summary: undefined,
        userId: userIds[8], teamId: teamIds[2], focusAreaId: focusAreaIds[4],
        status: "pending" as const, readinessStatus: "just_an_idea" as const,
        upvotes: 0, viewCount: 5,
        links: undefined,
        pinned: false, engagementScore: 12, hotScore: 10,
        versionCount: undefined, lastVersionAt: undefined,
      },
    ];

    for (const p of projectsData) {
      const allFields = [p.name, p.summary].filter(Boolean).join(" ");
      const id = await ctx.db.insert("projects", {
        name: p.name,
        summary: p.summary,
        userId: p.userId,
        teamId: p.teamId,
        status: p.status,
        readinessStatus: p.readinessStatus,
        upvotes: p.upvotes,
        viewCount: p.viewCount,
        links: p.links,
        pinned: p.pinned,
        engagementScore: p.engagementScore,
        hotScore: p.hotScore,
        versionCount: p.versionCount,
        lastVersionAt: p.lastVersionAt,
        allFields,
      });
      projectIds.push(id);
      await ctx.db.insert("projectSpaces", {
        projectId: id,
        focusAreaId: p.focusAreaId,
        isPrimary: true,
        hotScore: p.hotScore ?? 0,
      });
    }

    // Multi-space: Signal Atlas also lives in Developer Productivity
    await ctx.db.insert("projectSpaces", {
      projectId: projectIds[0],
      focusAreaId: focusAreaIds[4],
      isPrimary: false,
      hotScore: 92,
    });

    // ── 6. Project Versions ───────────────────────────────────────────────────
    const versionIds: Id<"projectVersions">[] = [];
    const versionsData = [
      // Signal Atlas
      {
        projectId: projectIds[0], userId: userIds[0],
        tag: "v1.0", title: "Initial release",
        body: "First public version with basic signal tracking.",
        links: [{ url: "https://example.com/signal-atlas/v1", label: "v1 Changelog" }],
        createdAt: at(-172800000),
      },
      {
        projectId: projectIds[0], userId: userIds[0],
        tag: "v1.1", title: "Performance improvements",
        body: "50% faster signal aggregation and dark mode support.",
        links: undefined,
        createdAt: at(-86400000),
      },
      // Privacy Pulse
      {
        projectId: projectIds[3], userId: userIds[3],
        tag: "v1.0", title: "MVP launch",
        body: "Core dashboard with GDPR checklist.",
        links: undefined,
        createdAt: at(-259200000),
      },
      {
        projectId: projectIds[3], userId: userIds[3],
        tag: "v1.1", title: "CCPA support",
        body: "Added California Consumer Privacy Act coverage.",
        links: undefined,
        createdAt: at(-172800000),
      },
      {
        projectId: projectIds[3], userId: userIds[3],
        tag: "v2.0", title: "Automated scanning",
        body: "Automated daily privacy scans across connected services.",
        links: [{ url: "https://example.com/privacy-pulse/v2", label: "Release notes" }],
        createdAt: at(-43200000),
      },
      // Launch Compass
      {
        projectId: projectIds[1], userId: userIds[1],
        tag: "v0.1", title: "Alpha release",
        body: "Early prototype — feedback welcome.",
        links: undefined,
        createdAt: at(-172800000),
      },
    ];
    for (const v of versionsData) {
      const id = await ctx.db.insert("projectVersions", v);
      versionIds.push(id);
    }

    // ── 7. Comments (projects) ────────────────────────────────────────────────
    const commentIds: Id<"comments">[] = [];
    const commentsData = [
      { projectId: projectIds[0], userId: userIds[1], content: "Love the direction — how does the signal scoring work?", upvotes: 2 },
      { projectId: projectIds[0], userId: userIds[2], content: "Would love a live demo session.", upvotes: 1 },
      { projectId: projectIds[1], userId: userIds[0], content: "Great execution on the playbook templates.", upvotes: undefined },
      { projectId: projectIds[2], userId: userIds[3], content: "Interesting approach to research organization.", upvotes: 2 },
      { projectId: projectIds[3], userId: userIds[5], content: "This has been a huge help for our GDPR review.", upvotes: 3 },
    ];
    for (const c of commentsData) {
      const id = await ctx.db.insert("comments", { ...c, createdAt: at(4000) });
      commentIds.push(id);
    }
    // A reply
    const replyId = await ctx.db.insert("comments", {
      projectId: projectIds[0],
      userId: userIds[0],
      content: "Happy to walk you through it — I'll post a Loom.",
      parentCommentId: commentIds[0],
      createdAt: at(4200),
      upvotes: 1,
    });
    commentIds.push(replyId);
    // A soft-deleted comment
    await ctx.db.insert("comments", {
      projectId: projectIds[2],
      userId: userIds[2],
      content: "Removed.",
      createdAt: at(4300),
      isDeleted: true,
      upvotes: 0,
    });

    // ── 8. Project Upvotes ────────────────────────────────────────────────────
    const projectUpvoteMappings = [
      { projectId: projectIds[0], userIds: [userIds[1], userIds[2], userIds[5], userIds[6]] },
      { projectId: projectIds[1], userIds: [userIds[0], userIds[3]] },
      { projectId: projectIds[3], userIds: [userIds[0], userIds[1], userIds[2], userIds[5], userIds[7]] },
    ];
    for (const m of projectUpvoteMappings) {
      for (const userId of m.userIds) {
        await ctx.db.insert("upvotes", { projectId: m.projectId, userId, createdAt: at(5000) });
      }
    }

    // ── 9. Adoptions ──────────────────────────────────────────────────────────
    const adoptionMappings = [
      { projectId: projectIds[0], userIds: [userIds[1], userIds[2], userIds[3], userIds[5], userIds[6]] },
      { projectId: projectIds[1], userIds: [userIds[0], userIds[2], userIds[4]] },
      { projectId: projectIds[3], userIds: [userIds[1], userIds[7], userIds[8]] },
    ];
    for (const m of adoptionMappings) {
      for (const userId of m.userIds) {
        await ctx.db.insert("adoptions", { projectId: m.projectId, userId, createdAt: at(5200) });
      }
    }

    // ── 10. Comment Upvotes ───────────────────────────────────────────────────
    const commentUpvoteMappings = [
      { commentId: commentIds[0], userIds: [userIds[0], userIds[3]] },
      { commentId: commentIds[1], userIds: [userIds[1]] },
      { commentId: commentIds[4], userIds: [userIds[0], userIds[2], userIds[7]] },
    ];
    for (const m of commentUpvoteMappings) {
      for (const userId of m.userIds) {
        await ctx.db.insert("commentUpvotes", { commentId: m.commentId, userId, createdAt: at(5400) });
      }
    }

    // ── 11. Project Views ─────────────────────────────────────────────────────
    const projectViewsData = [
      { projectId: projectIds[0], viewerId: "anon_001" },
      { projectId: projectIds[0], viewerId: "anon_002" },
      { projectId: projectIds[0], viewerId: `usr_${String(userIds[5])}` },
      { projectId: projectIds[1], viewerId: "anon_001" },
      { projectId: projectIds[3], viewerId: "anon_003" },
      { projectId: projectIds[3], viewerId: `usr_${String(userIds[2])}` },
    ];
    for (const v of projectViewsData) {
      await ctx.db.insert("projectViews", { ...v, viewedAt: at(5600) });
    }

    // ── 12. Threads ───────────────────────────────────────────────────────────
    const threadIds: Id<"threads">[] = [];
    const threadsData = [
      {
        title: "What's your go-to prompt engineering trick for code generation?",
        body: "I've been experimenting with chain-of-thought prompting and seeing big gains. Curious what patterns others have found useful.",
        userId: userIds[0], focusAreaId: focusAreaIds[0],
        upvoteCount: 8, commentCount: 3, engagementScore: 11, hotScore: 55,
        createdAt: at(-86400000),
      },
      {
        title: "Launch checklist template — share yours",
        body: "Compiling a universal pre-launch checklist. What always gets forgotten?",
        userId: userIds[1], focusAreaId: focusAreaIds[1],
        upvoteCount: 5, commentCount: 2, engagementScore: 7, hotScore: 38,
        createdAt: at(-172800000),
      },
      {
        title: "Best tools for async user interviews?",
        body: undefined,
        userId: userIds[2], focusAreaId: focusAreaIds[2],
        upvoteCount: 3, commentCount: 1, engagementScore: 4, hotScore: 20,
        createdAt: at(-259200000),
      },
      {
        title: "GDPR vs CCPA — practical differences for SaaS",
        body: "Looking for a plain-English comparison, not legal-ese.",
        userId: userIds[7], focusAreaId: focusAreaIds[3],
        upvoteCount: 12, commentCount: 4, engagementScore: 16, hotScore: 72,
        createdAt: at(-43200000),
      },
    ];
    for (const t of threadsData) {
      const allFields = [t.title, t.body].filter(Boolean).join(" ");
      const id = await ctx.db.insert("threads", { ...t, allFields });
      threadIds.push(id);
    }

    // ── 13. Thread Upvotes ────────────────────────────────────────────────────
    const threadUpvoteMappings = [
      { threadId: threadIds[0], userIds: [userIds[1], userIds[2], userIds[5], userIds[6], userIds[7]] },
      { threadId: threadIds[1], userIds: [userIds[0], userIds[3], userIds[4]] },
      { threadId: threadIds[3], userIds: [userIds[0], userIds[1], userIds[2], userIds[5], userIds[6], userIds[8]] },
    ];
    for (const m of threadUpvoteMappings) {
      for (const userId of m.userIds) {
        await ctx.db.insert("threadUpvotes", { threadId: m.threadId, userId, createdAt: at(6000) });
      }
    }

    // ── 14. Thread Comments ───────────────────────────────────────────────────
    const threadCommentIds: Id<"threadComments">[] = [];
    const threadCommentsData = [
      { threadId: threadIds[0], userId: userIds[1], content: "Few-shot examples beat chain-of-thought for me on smaller models.", upvotes: 2 },
      { threadId: threadIds[0], userId: userIds[5], content: "I always include a 'think step by step' suffix — doubles accuracy.", upvotes: 1 },
      { threadId: threadIds[1], userId: userIds[2], content: "Analytics setup and rollback plan are always the ones we miss.", upvotes: 3 },
      { threadId: threadIds[3], userId: userIds[3], content: "CCPA requires opt-out; GDPR requires opt-in. That's the biggest practical delta.", upvotes: 5 },
      { threadId: threadIds[3], userId: userIds[0], content: "Also the right-to-deletion timelines differ significantly.", upvotes: 2 },
    ];
    for (const c of threadCommentsData) {
      const id = await ctx.db.insert("threadComments", { ...c, createdAt: at(6200) });
      threadCommentIds.push(id);
    }
    // A reply to first thread comment
    await ctx.db.insert("threadComments", {
      threadId: threadIds[0],
      userId: userIds[0],
      content: "Good point — I use few-shot for tasks with clear patterns, CoT for reasoning-heavy ones.",
      parentCommentId: threadCommentIds[0],
      createdAt: at(6400),
      upvotes: 1,
    });

    // ── 15. Thread Comment Upvotes ────────────────────────────────────────────
    const threadCommentUpvoteMappings = [
      { commentId: threadCommentIds[0], userIds: [userIds[0], userIds[3]] },
      { commentId: threadCommentIds[3], userIds: [userIds[0], userIds[1], userIds[2], userIds[7], userIds[8]] },
    ];
    for (const m of threadCommentUpvoteMappings) {
      for (const userId of m.userIds) {
        await ctx.db.insert("threadCommentUpvotes", { commentId: m.commentId, userId, createdAt: at(6600) });
      }
    }

    // ── 16. Notifications ─────────────────────────────────────────────────────
    const notificationsData = [
      { recipientUserId: userIds[0], actorUserId: userIds[1], projectId: projectIds[0], type: "comment" as const,        commentId: commentIds[0], count: 1,    isRead: false },
      { recipientUserId: userIds[1], actorUserId: userIds[0], projectId: projectIds[1], type: "upvote" as const,         commentId: undefined,     count: 3,    isRead: true  },
      { recipientUserId: userIds[2], actorUserId: userIds[3], projectId: projectIds[2], type: "follow" as const,         commentId: undefined,     count: 2,    isRead: false },
      { recipientUserId: userIds[3], actorUserId: userIds[0], projectId: projectIds[3], type: "project_update" as const, commentId: undefined,     count: undefined, isRead: true  },
      { recipientUserId: userIds[0], actorUserId: userIds[2], projectId: projectIds[0], type: "reply" as const,          commentId: commentIds[1], count: 1,    isRead: false },
      { recipientUserId: userIds[5], actorUserId: userIds[1], projectId: projectIds[0], type: "followed_project_comment" as const, commentId: commentIds[0], count: undefined, isRead: true },
    ];
    for (let i = 0; i < notificationsData.length; i++) {
      const n = notificationsData[i];
      await ctx.db.insert("notifications", {
        ...n,
        createdAt: at(7000 + i * 10),
        lastActivityAt: at(7100 + i * 10),
      });
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    return {
      success: true,
      summary: {
        focusAreas: focusAreaIds.length,
        teams: teamIds.length,
        users: userIds.length,
        userFocusAreas: userFocusAreaCount,
        projects: projectIds.length,
        projectVersions: versionIds.length,
        comments: commentIds.length + 1, // +1 soft-deleted
        threads: threadIds.length,
        threadComments: threadCommentIds.length + 1, // +1 reply
        notifications: notificationsData.length,
      },
      projectsForRag: projectsData.map((p, i) => ({
        projectId: projectIds[i],
        name: p.name,
        summary: p.summary,
      })),
      threadsForRag: threadsData.map((t, i) => ({
        threadId: threadIds[i],
        title: t.title,
        body: t.body,
      })),
    };
  },
});

// Run full seed: test data + RAG indexing for projects and threads
export const seedAll = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; summary: unknown; ragIndexed: number }> => {
    console.log("Running full seed...");

    const result = await ctx.runMutation(internal.seed.seed, {});
    console.log("Test data seeded:", result.summary);

    let ragIndexed = 0;

    // Index projects
    for (const p of result.projectsForRag) {
      const text = p.summary ? `${p.name}\n\n${p.summary}` : p.name;
      const { entryId } = await rag.add(ctx, { namespace: "projects", text, key: p.projectId });
      await ctx.runMutation(internal.projects.updateEntryId, { projectId: p.projectId, entryId });
      ragIndexed++;
    }

    // Index threads
    for (const t of result.threadsForRag) {
      const text = t.body ? `${t.title}\n\n${t.body}` : t.title;
      const { entryId } = await rag.add(ctx, { namespace: "threads", text, key: t.threadId });
      await ctx.runMutation(internal.threads.updateThreadEntryId, { threadId: t.threadId, entryId });
      ragIndexed++;
    }

    console.log(`RAG indexing complete: ${ragIndexed} entries indexed`);
    return { success: true, summary: result.summary, ragIndexed };
  },
});
