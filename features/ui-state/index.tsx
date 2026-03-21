"use client";

import { ReactNode } from "react";

type DataState = "loading-initial" | "error-blocking" | "empty-list" | "empty-filtered" | "content";

type ErrorState = "present" | "none";

export function deriveDataState({
  data,
  filteredData,
  hasActiveFilters,
  isLoading,
}: {
  data: unknown[];
  filteredData: unknown[];
  hasActiveFilters: boolean;
  isLoading: boolean;
}): DataState {
  if (isLoading && data.length === 0) return "loading-initial";
  if (data.length === 0) return "empty-list";
  if (filteredData.length === 0 && hasActiveFilters) return "empty-filtered";
  return "content";
}

export function SectionContainer({
  dataState,
  errorState,
  renderBody,
  renderNonBlockingError,
  renderRefreshingNotice,
}: {
  dataState: DataState;
  errorState: ErrorState;
  isRefreshing?: boolean;
  debugId?: string;
  enableDebug?: boolean;
  renderNonBlockingError?: () => ReactNode;
  renderRefreshingNotice?: () => ReactNode;
  renderBody: {
    "error-blocking": () => ReactNode;
    "loading-initial": () => ReactNode;
    "empty-list": () => ReactNode;
    "empty-filtered": () => ReactNode;
    content: () => ReactNode;
  };
}) {
  if (dataState === "content") {
    return (
      <>
        {errorState === "present" && renderNonBlockingError?.()}
        {renderRefreshingNotice?.()}
        {renderBody.content()}
      </>
    );
  }

  if (dataState === "loading-initial") return <>{renderBody["loading-initial"]()}</>;
  if (dataState === "error-blocking") return <>{renderBody["error-blocking"]()}</>;
  if (dataState === "empty-list") return <>{renderBody["empty-list"]()}</>;
  return <>{renderBody["empty-filtered"]()}</>;
}

export function SectionEmptyStateSlot({ children }: { kind: string; scope: string; children: ReactNode }) {
  return <>{children}</>;
}

export function SectionErrorInline({
  title,
  message,
  onRetry,
  className,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={className || "rounded-lg border border-red-200 bg-red-50 p-4"}>
      <p className="text-sm font-semibold text-red-700">{title}</p>
      <p className="mt-1 text-sm text-red-600">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function SectionLoading({ rows = 3 }: { variant: string; rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
      ))}
    </div>
  );
}
