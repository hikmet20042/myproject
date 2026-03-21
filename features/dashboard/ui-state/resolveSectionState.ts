export type SectionStateKind =
  | "loading-initial"
  | "loading-refresh"
  | "error-blocking"
  | "error-nonblocking"
  | "empty-list"
  | "empty-filtered"
  | "content";

export interface ResolveSectionStateInput {
  isLoading: boolean;
  error?: string | null;
  hasData: boolean;
  hasFilteredData?: boolean;
  isFilterActive?: boolean;
}

export function resolveSectionState({
  isLoading,
  error,
  hasData,
  hasFilteredData,
  isFilterActive,
}: ResolveSectionStateInput): SectionStateKind {
  const hasError = Boolean(error);

  if (hasError && !hasData) {
    return "error-blocking";
  }

  if (isLoading && !hasData) {
    return "loading-initial";
  }

  if (hasError && hasData) {
    return "error-nonblocking";
  }

  if (isLoading && hasData) {
    return "loading-refresh";
  }

  if (typeof hasFilteredData === "boolean" && !hasFilteredData) {
    return isFilterActive ? "empty-filtered" : "empty-list";
  }

  return "content";
}
