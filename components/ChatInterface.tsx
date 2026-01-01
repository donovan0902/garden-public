"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageList } from "./MessageList";

const EXAMPLE_PROMPTS = [
  "Power Automate flows for approvals",
  "Scripts to clean up Excel data",
  "Copilot prompts for writing emails",
];

export function ChatInterface() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const createThread = useMutation(api.ragbot.createThread);

  const sendMessageToAgent = useAction(api.ragbot.sendMessageToAgent);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    try {
      let currentThreadId = threadId;

      // Create thread on first message if it doesn't exist
      if (!currentThreadId) {
        currentThreadId = await createThread();
        setThreadId(currentThreadId);
      }

      await sendMessageToAgent({ threadId: currentThreadId, prompt: userMessage });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[700px] border rounded-xl overflow-hidden bg-background shadow-sm">
      {threadId ? (
        <MessageList threadId={threadId} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-foreground">What are you trying to do?</h3>
            <p className="text-sm text-muted-foreground">
              Describe your problem and I&apos;ll help you find tools
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleExampleClick(prompt)}
                className="px-3 py-1.5 text-sm rounded-full border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t bg-muted/10">
        <form className="flex gap-2" onSubmit={handleSendMessage}>
          <Input
            className="flex-1"
            placeholder="e.g., Power Automate flows for approvals..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={!inputValue.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

