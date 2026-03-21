import { useEffect, useRef, useState } from "react";

interface UseRefreshVisibilityOptions {
  showDelayMs?: number;
  minVisibleMs?: number;
}

export function useRefreshVisibility(
  isRefreshing: boolean,
  options: UseRefreshVisibilityOptions = {}
) {
  const { showDelayMs = 180, minVisibleMs = 220 } = options;
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isRefreshing) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      if (!visible && !showTimerRef.current) {
        showTimerRef.current = setTimeout(() => {
          setVisible(true);
          shownAtRef.current = Date.now();
          showTimerRef.current = null;
        }, showDelayMs);
      }

      return;
    }

    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }

    if (!visible) {
      return;
    }

    const shownAt = shownAtRef.current ?? Date.now();
    const elapsed = Date.now() - shownAt;
    const remaining = Math.max(0, minVisibleMs - elapsed);

    if (remaining === 0) {
      setVisible(false);
      shownAtRef.current = null;
      return;
    }

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      shownAtRef.current = null;
      hideTimerRef.current = null;
    }, remaining);
  }, [isRefreshing, minVisibleMs, showDelayMs, visible]);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return visible;
}
