"use client";

import Link from "next/link";
import { Authenticated, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/app/useCurrentUser";
import { CreateFocusAreaDialog } from "./CreateFocusAreaDialog";
import { Plus, Share, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";

function SidebarSpaces() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const focusAreas = useQuery(
    api.users.getUserFocusAreas,
    user ? { userId: user._id } : "skip"
  );

  const loading = userLoading || focusAreas === undefined;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Your Spaces</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {loading ? (
            <>
              <SidebarMenuSkeleton />
              <SidebarMenuSkeleton />
              <SidebarMenuSkeleton />
            </>
          ) : focusAreas && focusAreas.length > 0 ? (
            focusAreas.map((area) => (
              <SidebarMenuItem key={area._id}>
                <SidebarMenuButton asChild={false}>
                  <span className="text-zinc-500 font-mono text-xs">g/</span>
                  <span>{area.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          ) : (
            <li className="px-2 py-3 text-xs text-zinc-400">
              No spaces yet. Create your first one below.
            </li>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <Authenticated>
        <SidebarHeader className="gap-3">
          <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600">
            <Link href="/submit">
              <Share className="h-4 w-4" />
              <span>Share a Tool</span>
            </Link>
          </Button>
          <CreateFocusAreaDialog>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4" />
              <span>Create Space</span>
            </Button>
          </CreateFocusAreaDialog>
        </SidebarHeader>

        <SidebarContent>
          <SidebarSpaces />
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/about">
                  <Info className="h-4 w-4" />
                  <span>About</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Authenticated>
    </Sidebar>
  );
}
