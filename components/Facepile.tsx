"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Id } from "@/convex/_generated/dataModel";
import { Check, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

type Adopter = {
  _id: Id<"users">;
  name: string;
  avatarUrl: string;
};

type CurrentUser = {
  _id: Id<"users">;
  name: string;
  avatarUrl: string;
} | null;

interface FacepileProps {
  adopters: Adopter[];
  totalCount: number;
  maxVisible?: number;
  size?: "sm" | "md";
  // Interactive props
  hasAdopted?: boolean;
  currentUser?: CurrentUser;
  isAuthenticated?: boolean;
  onToggle?: () => void;
  showLabel?: boolean;
}

export function Facepile({
  adopters,
  totalCount,
  maxVisible = 4,
  size = "sm",
  hasAdopted = false,
  currentUser = null,
  isAuthenticated = false,
  onToggle,
  showLabel = true,
}: FacepileProps) {
  const isInteractive = onToggle !== undefined;
  const sizeClasses = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  // Filter out current user from adopters to avoid duplicate display
  const otherAdopters = currentUser
    ? adopters.filter((a) => a._id !== currentUser._id)
    : adopters;

  // Calculate how many "other" adopters to show
  // If user has adopted, their avatar takes one slot
  const slotsForOthers = hasAdopted ? maxVisible - 1 : maxVisible;
  const visibleOthers = otherAdopters.slice(0, Math.max(0, slotsForOthers));

  // Remaining count excludes visible others and current user (if adopted)
  const displayedCount = visibleOthers.length + (hasAdopted ? 1 : 0);
  const remainingCount = totalCount - displayedCount;

  // Empty state: show only the +You button if interactive
  if (totalCount === 0 && !isInteractive) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.();
  };

  // The +You button or user's avatar with checkmark
  const renderUserAction = () => {
    if (!isInteractive) return null;

    if (!isAuthenticated) {
      // Link to sign-in
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/sign-in"
              prefetch={false}
              onClick={(e) => e.stopPropagation()}
              className={`${sizeClasses} flex items-center justify-center rounded-full bg-zinc-100 font-medium text-zinc-500 ring-2 ring-white hover:bg-zinc-200 hover:text-zinc-700 transition-colors cursor-pointer`}
            >
              <Plus className={iconSize} />
            </Link>
          </TooltipTrigger>
          <TooltipContent>Sign in to mark as using</TooltipContent>
        </Tooltip>
      );
    }

    if (hasAdopted && currentUser) {
      // Show user's avatar with checkmark overlay
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileTap={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 800, damping: 20 }}
              onClick={handleClick}
              className="relative cursor-pointer"
            >
              <Avatar
                className={`${sizeClasses} bg-emerald-100 ring-2 ring-emerald-500`}
              >
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback className="font-semibold text-emerald-700 bg-emerald-100">
                  {(currentUser.name || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                <Check className="h-2 w-2 text-white" strokeWidth={3} />
              </div>
            </motion.button>
          </TooltipTrigger>
          <TooltipContent>You&apos;re using this · Click to remove</TooltipContent>
        </Tooltip>
      );
    }

    // Show +You button
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileTap={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 800, damping: 20 }}
            onClick={handleClick}
            className={`${sizeClasses} flex items-center justify-center rounded-full bg-zinc-100 font-medium text-zinc-500 ring-2 ring-white hover:bg-emerald-100 hover:text-emerald-600 hover:ring-emerald-200 transition-colors cursor-pointer`}
          >
            <Plus className={iconSize} />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>I use this</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      {showLabel && totalCount > 0 && (
        <span className="text-sm text-zinc-500 whitespace-nowrap">Used by</span>
      )}
      <div className="flex -space-x-2 [&_[data-slot=avatar]]:ring-2 [&_[data-slot=avatar]]:ring-white">
        {/* Other adopters */}
        {visibleOthers.map((adopter) => (
          <Tooltip key={adopter._id}>
            <TooltipTrigger asChild>
              <Avatar className={`${sizeClasses} bg-zinc-100 cursor-default`}>
                <AvatarImage src={adopter.avatarUrl} alt={adopter.name} />
                <AvatarFallback className="font-semibold text-zinc-600">
                  {(adopter.name || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{adopter.name}</TooltipContent>
          </Tooltip>
        ))}

        {/* Current user's avatar (if adopted) or +You button */}
        {renderUserAction()}

        {/* Remaining count badge */}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`${sizeClasses} flex items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-600 ring-2 ring-white cursor-default`}
              >
                +{remainingCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {remainingCount} more {remainingCount === 1 ? "person" : "people"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
