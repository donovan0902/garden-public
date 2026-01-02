"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectCardsDisplayProps {
  projectIds: string[];
  summary: string;
}

export function ProjectCardsDisplay({
  projectIds,
  summary,
}: ProjectCardsDisplayProps) {
  const projects = useQuery(api.projects.getProjectsByEntryIdsPublic, {
    entryIds: projectIds,
  });

  const isLoading = projects === undefined;

  return (
    <div className="space-y-3 py-2">
      {summary && (
        <p className="text-sm text-muted-foreground">{summary}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {isLoading ? (
          <>
            {[...Array(Math.min(projectIds.length, 4))].map((_, i) => (
              <Card key={i} className="py-3">
                <CardHeader className="px-3 py-0">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full mt-2" />
                  <Skeleton className="h-3 w-2/3 mt-1" />
                </CardHeader>
              </Card>
            ))}
          </>
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <Link
              key={project._id}
              href={`/project/${project._id}`}
              target="_blank"
            >
              <Card className="py-3 hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader className="px-3 py-0">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <span className="truncate">{project.name}</span>
                    <ArrowUpRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                  </CardTitle>
                  {project.summary && (
                    <CardDescription className="text-xs line-clamp-2">
                      {project.summary}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground col-span-2">
            No projects found.
          </p>
        )}
      </div>
    </div>
  );
}
