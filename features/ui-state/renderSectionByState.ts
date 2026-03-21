import type { SectionStateKind } from "./resolveSectionState";

export type SectionBodyState =
  | "loading-initial"
  | "error-blocking"
  | "empty-list"
  | "empty-filtered"
  | "content";

export interface SectionBodyRenderMap<T> {
  "loading-initial": () => T;
  "error-blocking": () => T;
  "empty-list": () => T;
  "empty-filtered": () => T;
  content: () => T;
}

export function getSectionBodyState(state: SectionStateKind): SectionBodyState {
  if (state === "loading-initial" || state === "error-blocking") {
    return state;
  }

  if (state === "empty-list" || state === "empty-filtered") {
    return state;
  }

  return "content";
}

export function renderSectionByState<T>(
  state: SectionStateKind,
  renderMap: SectionBodyRenderMap<T>
): T {
  const bodyState = getSectionBodyState(state);
  return renderMap[bodyState]();
}
