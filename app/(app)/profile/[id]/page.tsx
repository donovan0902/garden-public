"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCurrentUser } from "@/app/useCurrentUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FocusAreaBadges } from "@/components/FocusAreaBadges";
import { ReadinessBadge } from "@/components/ReadinessBadge";

const intentLabels: Record<string, string> = {
  looking: "Looking for tools",
  sharing: "Sharing tools",
  both: "Looking + sharing",
};

type Profile = {
  _id: Id<"users">;
  name: string;
  avatarUrlId: string;
  team: string;
  userIntent: "looking" | "sharing" | "both" | null;
  focusAreas: Array<{ _id: Id<"focusAreas">; name: string; group: string }>;
  projectCount: number;
  adoptionCount: number;
};

type Project = {
  _id: Id<"projects">;
  name: string;
  summary?: string;
  team: string;
  upvotes: number;
  status: "pending" | "active";
  readinessStatus?: "in_progress" | "ready_to_use";
};

type AdoptedProject = {
  _id: Id<"projects">;
  name: string;
  summary?: string;
  readinessStatus?: "in_progress" | "ready_to_use";
  team: string;
  upvotes: number;
  creatorName: string;
  creatorAvatar: string;
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isLoading, isAuthenticated, user: currentUser } = useCurrentUser();
  const userId = id as Id<"users">;
  const isOwner = currentUser?._id === userId;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  const profile = useQuery(
    api.users.getProfile,
    isAuthenticated ? { userId } : "skip"
  ) as Profile | null | undefined;

  const projects = useQuery(
    api.projects.getByUserId,
    isAuthenticated
      ? {
          userId,
          includePending: isOwner,
        }
      : "skip"
  ) as Project[] | undefined;

  const adoptedProjects = useQuery(
    api.projects.getAdoptedByUser,
    isAuthenticated ? { userId } : "skip"
  ) as AdoptedProject[] | undefined;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto w-full max-w-5xl px-6 py-16">
          <p className="text-center text-zinc-500">Loading profile...</p>
        </main>
      </div>
    );
  }

  if (profile === undefined) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto w-full max-w-5xl px-6 py-16">
          <p className="text-center text-zinc-500">Loading profile...</p>
        </main>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="text-center">
            <p className="text-xl font-semibold text-zinc-900">
              Profile not found
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/")}
            >
              Back to home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const intentLabel = profile.userIntent
    ? intentLabels[profile.userIntent]
    : "";

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto w-full max-w-5xl space-y-10 px-6 pb-16 pt-10">
        <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-zinc-900/5">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-zinc-200">
                <AvatarImage src={profile.avatarUrlId} alt={profile.name} />
                <AvatarFallback>
                  {(profile.name || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-semibold text-zinc-900">
                  {profile.name}
                </h1>
                {profile.team && (
                  <p className="mt-1 text-sm text-zinc-500">
                    Team <span className="text-zinc-900">{profile.team}</span>
                  </p>
                )}
              </div>
            </div>
            {intentLabel && (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {intentLabel}
              </span>
            )}
          </div>

          {profile.focusAreas.length > 0 && (
            <div className="mt-4">
              <FocusAreaBadges
                focusAreas={profile.focusAreas}
                className="text-sm"
              />
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <StatCard label="Projects" value={profile.projectCount} />
            <StatCard label="Adopted Tools" value={profile.adoptionCount} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900">Projects</h2>
            {isOwner && (
              <Button variant="outline" asChild>
                <Link href="/submit" prefetch={false}>
                  Share a project
                </Link>
              </Button>
            )}
          </div>
          {projects === undefined ? (
            <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-zinc-500">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-zinc-500">
              {isOwner
                ? "You have not shared any projects yet."
                : "No public projects yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900">
            Adopted Tools
          </h2>
          {adoptedProjects === undefined ? (
            <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-zinc-500">
              Loading adopted tools...
            </div>
          ) : adoptedProjects.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-zinc-500">
              No adopted tools yet.
            </div>
          ) : (
            <div className="space-y-3">
              {adoptedProjects.map((project) => (
                <AdoptedCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/project/${project._id}`}
      className="block rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 transition hover:shadow-md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-zinc-900">
                {project.name}
              </h3>
              {project.status === "pending" && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  Pending
                </span>
              )}
              <ReadinessBadge status={project.readinessStatus} />
            </div>
            {project.summary && (
              <p className="mt-1 text-sm text-zinc-500">
                {project.summary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
            <span>↑</span>
            <span>{project.upvotes}</span>
          </div>
        </div>
        <div className="text-sm text-zinc-500">
          {project.team
            ? `Team ${project.team}`
            : "Independent build"}
        </div>
      </div>
    </Link>
  );
}

function AdoptedCard({ project }: { project: AdoptedProject }) {
  return (
    <Link
      href={`/project/${project._id}`}
      className="block rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-900/5 transition hover:shadow-md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-zinc-900">
                {project.name}
              </h3>
              <ReadinessBadge status={project.readinessStatus} />
            </div>
            {project.summary && (
              <p className="mt-1 text-sm text-zinc-500">
                {project.summary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
            <span>↑</span>
            <span>{project.upvotes}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <span className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-zinc-100 text-xs font-semibold text-zinc-600">
              <AvatarImage src={project.creatorAvatar} alt={project.creatorName} />
              <AvatarFallback>
                {(project.creatorName || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>
              By <span className="text-zinc-900">{project.creatorName}</span>
            </span>
          </span>
          {project.team && <span>Team {project.team}</span>}
        </div>
      </div>
    </Link>
  );
}
