"use client";

import { useMemo } from "react";
import { Id } from "@/convex/_generated/dataModel";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

type FocusArea = {
  _id: Id<"focusAreas">;
  name: string;
  description?: string;
};

type FocusAreaOption = {
  id: Id<"focusAreas"> | "personal";
  label: string;
  description?: string;
};

interface FocusAreaPickerProps {
  focusAreas: FocusArea[] | undefined;
  selectedFocusArea: Id<"focusAreas"> | "personal" | null;
  onSelectionChange: (selected: Id<"focusAreas"> | "personal" | null) => void;
  currentUserName?: string;
}

export function FocusAreaPicker({
  focusAreas,
  selectedFocusArea,
  onSelectionChange,
  currentUserName,
}: FocusAreaPickerProps) {
  const allOptions = useMemo(() => {
    const options: FocusAreaOption[] = [];

    if (currentUserName) {
      options.push({
        id: "personal",
        label: `u/${currentUserName}`,
        description: "Your personal space",
      });
    }

    if (focusAreas) {
      for (const fa of focusAreas) {
        options.push({
          id: fa._id,
          label: `g/${fa.name}`,
          description: fa.description,
        });
      }
    }

    return options;
  }, [focusAreas, currentUserName]);

  const selectedOption = useMemo(
    () => allOptions.find((opt) => opt.id === selectedFocusArea) ?? null,
    [allOptions, selectedFocusArea]
  );

  return (
    <Combobox
      items={allOptions}
      itemToStringValue={(option: FocusAreaOption | null) => option?.label ?? ''}
      value={selectedOption}
      onValueChange={(option: FocusAreaOption | null) => {
        onSelectionChange(option?.id ?? null);
      }}
    >
      <ComboboxInput
        placeholder="Select a space..."
        className="rounded-full bg-background h-11 max-w-xs"
      />
      <ComboboxContent>
        <ComboboxEmpty>No spaces found.</ComboboxEmpty>
        <ComboboxList>
          {allOptions.map((option) => (
            <ComboboxItem key={option.id} value={option}>
              {option.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
