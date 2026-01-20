"use client";

import { FileArchive, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/fileSize";

interface ProjectFileDownloadProps {
  filename: string;
  fileSize: number;
  url: string | null;
}

export function ProjectFileDownload({ filename, fileSize, url }: ProjectFileDownloadProps) {
  if (!url) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileArchive className="h-8 w-8 text-zinc-500" />
          <div>
            <p className="text-sm font-medium text-zinc-900">{filename}</p>
            <p className="text-xs text-zinc-500">{formatFileSize(fileSize)}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={url} download={filename}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </a>
        </Button>
      </div>
    </div>
  );
}
