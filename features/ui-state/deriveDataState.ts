import type { SectionDataState } from "./resolveSectionState";

interface DeriveDataStateInput<TData = unknown, TFiltered = TData> {
  data: TData[] | null | undefined;
  filteredData?: TFiltered[] | null | undefined;
  hasActiveFilters: boolean;
  isLoading: boolean;
}

function safeLength(value: unknown[] | null | undefined): number {
  return Array.isArray(value) ? value.length : 0;
}

export function deriveDataState<TData = unknown, TFiltered = TData>({
  data,
  filteredData,
  hasActiveFilters,
  isLoading,
}: DeriveDataStateInput<TData, TFiltered>): SectionDataState {
  const dataCount = safeLength(data);

  if (isLoading && dataCount === 0) {
    return "loading";
  }

  const filteredCount =
    typeof filteredData === "undefined" ? dataCount : safeLength(filteredData);

  if (filteredCount === 0) {
    return hasActiveFilters ? "filtered-empty" : "empty";
  }

  return "success";
}

export type { DeriveDataStateInput };