export type SectionDataState =
  | "loading"
  | "success"
  | "empty"
  | "filtered-empty";

export type SectionErrorState = "none" | "present";

export type SectionStateKind =
  | "loading-initial"
  | "loading-refresh"
  | "error-blocking"
  | "error-nonblocking"
  | "empty-list"
  | "empty-filtered"
  | "content";

export interface ResolveSectionStateInput {
  dataState: SectionDataState;
  errorState: SectionErrorState;
  isRefreshing: boolean;
}

export function resolveSectionState({
  dataState,
  errorState,
  isRefreshing,
}: ResolveSectionStateInput): SectionStateKind {
  if (dataState === "loading") {
    return "loading-initial";
  }

  if (errorState === "present") {
    return dataState === "success" ? "error-nonblocking" : "error-blocking";
  }

  if (isRefreshing) {
    return "loading-refresh";
  }

  if (dataState === "filtered-empty") {
    return "empty-filtered";
  }

  if (dataState === "empty") {
    return "empty-list";
  }

  return "content";
}
