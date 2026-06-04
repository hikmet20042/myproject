"use client";

import { useEffect, useState } from "react";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'

const AUTO_DISMISS_MS = 4000;

const borderByType = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
} as const;

export default function GlobalFeedback() {
  const { messages, clear } = useGlobalFeedback();
  const [visible, setVisible] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!messages.length) return;
    const ids = new Set(messages.map((m) => m.id));
    setVisible(ids);

    const timers = messages.map((message) =>
      setTimeout(() => {
        clear(message.id);
        setVisible((prev) => {
          const next = new Set(prev);
          next.delete(message.id);
          return next;
        });
      }, AUTO_DISMISS_MS),
    );
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [messages, clear]);

  if (!messages.length) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm"
      role="alert"
      aria-live="polite"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-md border px-4 py-3 shadow-md flex items-start justify-between gap-3 transition-all duration-300 ${
            visible.has(message.id)
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-4"
          } ${borderByType[message.type]}`}
        >
          <span className="text-sm">{message.message}</span>
          <Button
            variant="ghost"
            size="xs"
            className="text-xs opacity-70 hover:opacity-100 shrink-0"
            onClick={() => clear(message.id)}
            aria-label="Bağla"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
