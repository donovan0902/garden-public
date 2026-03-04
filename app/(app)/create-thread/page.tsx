"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpaceIcon } from "@/components/SpaceIcon";

export default function CreateThreadPage() {
  const router = useRouter();
  const focusAreas = useQuery(api.focusAreas.listActive);
  const createThread = useMutation(api.threads.createThread);

  const [focusAreaId, setFocusAreaId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = focusAreaId && title.trim() && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const threadId = await createThread({
        title: title.trim(),
        body: body.trim() || undefined,
        focusAreaId: focusAreaId as Id<"focusAreas">,
      });
      router.push(`/thread/${threadId}`);
    } catch (error) {
      console.error("Failed to create thread:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-xl px-6 pt-10 pb-16">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-6">
          Start a Thread
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Space</label>
            <Select value={focusAreaId} onValueChange={setFocusAreaId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a space" />
              </SelectTrigger>
              <SelectContent>
                {focusAreas?.map((area) => (
                  <SelectItem key={area._id} value={area._id}>
                    <div className="flex items-center gap-2">
                      <SpaceIcon
                        icon={area.icon}
                        name={area.name}
                        size="sm"
                      />
                      <span>g/{area.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Title</label>
            <Input
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              placeholder="Thread title"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Body{" "}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <Textarea
              value={body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBody(e.target.value)
              }
              placeholder="Add more context"
              className="min-h-24"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "Creating..." : "Create Thread"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
