"use client";

import { useEffect } from "react";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { Button } from '@/components/ui/Button'

const AUTO_DISMISS_MS = 4000;

export default function GlobalFeedback() {
  const { messages, clear } = useGlobalFeedback();

  useEffect(() => {
    if (!messages.length) return;
    const timers = messages.map((message) =>
      setTimeout(() => clear(message.id), AUTO_DISMISS_MS),
    );
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [messages, clear]);

  if (!messages.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-md border px-4 py-3 shadow-md flex items-start justify-between gap-3 ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : message.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
          }`}
        >
          <span className="text-sm">{message.message}</span>
          <Button variant="ghost" size="xs" className="text-xs opacity-70 hover:opacity-100" onClick={() => clear(message.id)}>
            {"Bağla"}
          </Button>
        </div>
      ))}
    </div>
  );
}
