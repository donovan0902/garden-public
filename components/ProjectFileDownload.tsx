"use client";

import { useState } from "react";
import { File as FileIcon, Loader2 } from "lucide-react";

interface ProjectFileDownloadProps {
  files: Array<{
    filename: string;
    fileSize: number;
    url: string | null;
  }>;
}

export function ProjectFileDownload({ files }: ProjectFileDownloadProps) {
  const downloadableFiles = files.filter((f) => f.url);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

  if (downloadableFiles.length === 0) {
    return null;
  }

  const handleDownload = async (file: { filename: string; url: string }, index: number) => {
    setDownloadingIndex(index);
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fall back to direct navigation if blob download fails
      window.open(file.url, "_blank");
    } finally {
      setDownloadingIndex(null);
    }
  };

  return (
    <div className="space-y-2">
      {downloadableFiles.map((file, i) => (
        <button
          key={i}
          type="button"
          onClick={() => handleDownload({ filename: file.filename, url: file.url! }, i)}
          disabled={downloadingIndex === i}
          className="flex items-center gap-2 text-m font-medium text-zinc-700 hover:text-zinc-900 hover:underline disabled:opacity-50"
          aria-label={`Download ${file.filename}`}
        >
          {downloadingIndex === i ? (
            <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" aria-hidden="true" />
          ) : (
            <FileIcon className="h-5 w-5 text-zinc-400" aria-hidden="true" />
          )}
          {file.filename}
        </button>
      ))}
    </div>
  );
}
