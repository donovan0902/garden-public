"use client";

import { useMemo, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpaceIcon } from "@/components/SpaceIcon";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Space = {
  _id: Id<"focusAreas">;
  name: string;
  description?: string;
  icon?: string;
};

interface AdditionalSpacesPickerProps {
  spaces: Space[] | undefined;
  selectedSpaces: Id<"focusAreas">[];
  onSelectionChange: (selected: Id<"focusAreas">[]) => void;
  excludeSpaceId?: Id<"focusAreas"> | null;
  maxSpaces?: number;
}

export function AdditionalSpacesPicker({
  spaces,
  selectedSpaces,
  onSelectionChange,
  excludeSpaceId,
  maxSpaces = 3,
}: AdditionalSpacesPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const availableSpaces = useMemo(() => {
    if (!spaces) return [];
    return spaces.filter((s) => s._id !== excludeSpaceId);
  }, [spaces, excludeSpaceId]);

  const filteredSpaces = useMemo(() => {
    if (!search.trim()) return availableSpaces;
    const lower = search.toLowerCase();
    return availableSpaces.filter((s) => s.name.toLowerCase().includes(lower));
  }, [availableSpaces, search]);

  const selectedSpaceObjects = useMemo(() => {
    if (!spaces) return [];
    const selectedSet = new Set(selectedSpaces);
    return spaces.filter((s) => selectedSet.has(s._id));
  }, [spaces, selectedSpaces]);

  const toggleSpace = (spaceId: Id<"focusAreas">) => {
    if (selectedSpaces.includes(spaceId)) {
      onSelectionChange(selectedSpaces.filter((id) => id !== spaceId));
    } else if (selectedSpaces.length < maxSpaces) {
      onSelectionChange([...selectedSpaces, spaceId]);
    }
  };

  const removeSpace = (spaceId: Id<"focusAreas">) => {
    onSelectionChange(selectedSpaces.filter((id) => id !== spaceId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 max-w-xs justify-between rounded-full bg-background font-normal"
          >
            <span className="text-muted-foreground">
              {selectedSpaces.length === 0
                ? "Select additional spaces..."
                : `${selectedSpaces.length} space${selectedSpaces.length > 1 ? "s" : ""} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search spaces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />
          </div>
          <div className="max-h-48 overflow-y-auto px-1 pb-1">
            {filteredSpaces.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500">
                No spaces found.
              </div>
            ) : (
              filteredSpaces.map((space) => {
                const isSelected = selectedSpaces.includes(space._id);
                const isDisabled =
                  !isSelected && selectedSpaces.length >= maxSpaces;
                return (
                  <button
                    key={space._id}
                    type="button"
                    onClick={() => !isDisabled && toggleSpace(space._id)}
                    disabled={isDisabled}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      isDisabled
                        ? "cursor-not-allowed opacity-40"
                        : "cursor-pointer hover:bg-zinc-100"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <SpaceIcon
                      icon={space.icon}
                      name={space.name}
                      size="sm"
                    />
                    <span className="truncate">g/{space.name}</span>
                  </button>
                );
              })
            )}
          </div>
          {selectedSpaces.length >= maxSpaces && (
            <div className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-400">
              Maximum of {maxSpaces} additional spaces reached.
            </div>
          )}
        </PopoverContent>
      </Popover>

      {selectedSpaceObjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSpaceObjects.map((space) => (
            <Badge
              key={space._id}
              variant="secondary"
              className="gap-1 pl-1.5 pr-1"
            >
              <SpaceIcon icon={space.icon} name={space.name} size="sm" />
              g/{space.name}
              <button
                type="button"
                onClick={() => removeSpace(space._id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-300 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
