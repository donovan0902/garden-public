"use client";

import { Search } from "lucide-react";

export function SearchingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
      <Search className="h-4 w-4 animate-pulse" />
      <span>Searching the catalog...</span>
    </div>
  );
}
