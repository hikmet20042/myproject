"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type GlobalFeedbackType = "success" | "error" | "info";

export type GlobalFeedbackMessage = {
  id: string;
  type: GlobalFeedbackType;
  message: string;
  createdAt: number;
};

const GLOBAL_FEEDBACK_EVENT = "app:global-feedback";

type GlobalFeedbackEventPayload = {
  type: GlobalFeedbackType;
  message: string;
};

export const emitGlobalFeedback = (type: GlobalFeedbackType, message: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<GlobalFeedbackEventPayload>(GLOBAL_FEEDBACK_EVENT, {
      detail: { type, message },
    })
  );
};

type GlobalFeedbackContextValue = {
  messages: GlobalFeedbackMessage[];
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  clear: (id?: string) => void;
};

const GlobalFeedbackContext = createContext<GlobalFeedbackContextValue | null>(null);

export const GlobalFeedbackProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [messages, setMessages] = useState<GlobalFeedbackMessage[]>([]);

  const push = useCallback((type: GlobalFeedbackType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMessages((prev) => [
      ...prev,
      { id, type, message, createdAt: Date.now() },
    ]);
  }, []);

  const clear = useCallback((id?: string) => {
    if (!id) {
      setMessages([]);
      return;
    }
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    push("success", message);
  }, [push]);

  const showError = useCallback((message: string) => {
    push("error", message);
  }, [push]);

  const showInfo = useCallback((message: string) => {
    push("info", message);
  }, [push]);

  useEffect(() => {
    const onGlobalFeedback = (event: Event) => {
      const customEvent = event as CustomEvent<GlobalFeedbackEventPayload>;
      const payload = customEvent.detail;
      if (!payload?.message || !payload?.type) return;
      push(payload.type, payload.message);
    };

    window.addEventListener(GLOBAL_FEEDBACK_EVENT, onGlobalFeedback as EventListener);
    return () => {
      window.removeEventListener(GLOBAL_FEEDBACK_EVENT, onGlobalFeedback as EventListener);
    };
  }, [push]);

  const value = useMemo(
    () => ({
      messages,
      showSuccess,
      showError,
      showInfo,
      success: showSuccess,
      error: showError,
      info: showInfo,
      clear,
    }),
    [messages, showSuccess, showError, showInfo, clear],
  );

  return (
    <GlobalFeedbackContext.Provider value={value}>
      {children}
    </GlobalFeedbackContext.Provider>
  );
};

export const useGlobalFeedback = () => {
  const context = useContext(GlobalFeedbackContext);
  if (!context) {
    throw new Error("useGlobalFeedback must be used within GlobalFeedbackProvider");
  }
  return context;
};
