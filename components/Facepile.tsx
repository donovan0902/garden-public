"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Id } from "@/convex/_generated/dataModel";

type Adopter = {
  _id: Id<"users">;
  name: string;
  avatarUrl: string;
};

interface FacepileProps {
  adopters: Adopter[];
  totalCount: number;
  maxVisible?: number;
  size?: "sm" | "md";
}

export function Facepile({
  adopters,
  totalCount,
  maxVisible = 4,
  size = "sm",
}: FacepileProps) {
  if (totalCount === 0) {
    return null;
  }

  const visibleAdopters = adopters.slice(0, maxVisible);
  const remainingCount = totalCount - visibleAdopters.length;
  const sizeClasses = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm";

  const tooltipText =
    totalCount === 1
      ? `${visibleAdopters[0]?.name} uses this`
      : `${totalCount} people use this`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex -space-x-2 [&_[data-slot=avatar]]:ring-2 [&_[data-slot=avatar]]:ring-white cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {visibleAdopters.map((adopter) => (
            <Avatar key={adopter._id} className={`${sizeClasses} bg-zinc-100`}>
              <AvatarImage src={adopter.avatarUrl} alt={adopter.name} />
              <AvatarFallback className="font-semibold text-zinc-600">
                {(adopter.name || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {remainingCount > 0 && (
            <div
              className={`${sizeClasses} flex items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-600 ring-2 ring-white`}
            >
              +{remainingCount}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
