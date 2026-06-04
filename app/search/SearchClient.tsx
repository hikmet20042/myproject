"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { EmptyState, LoadingState } from "@/components/shared";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useGlobalSearch } from "@/features/search/hooks/useGlobalSearch";
import { SearchResultsList } from "@/features/search/components/SearchResultsList";
import type { GlobalSearchType } from "@/features/search/types/search.types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Briefcase, BookOpen, Building2 } from "lucide-react";

const TYPE_OPTIONS: Array<{ key: "all" | GlobalSearchType; label: string; icon: typeof Calendar }> = [
  { key: "all", label: "Hamısı", icon: Search },
  { key: "vacancy", label: "Vakansiyalar", icon: Briefcase },
  { key: "event", label: "Tədbirlər", icon: Calendar },
  { key: "blog", label: "Bloqlar", icon: BookOpen },
  { key: "organization", label: "Təşkilatlar", icon: Building2 },
];

const SUGGESTED_QUERIES = ["dizayn", "könüllülük", "tədbir", "gənclər", "proqramlaşdırma", "marketinq"];

const resolveActiveType = (value: string | null): "all" | GlobalSearchType => {
  if (TYPE_OPTIONS.some((option) => option.key === value)) {
    return value as "all" | GlobalSearchType;
  }
  return "all";
};

const resolvePage = (value: string | null): number => {
  const parsed = Number.parseInt(value || "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
};

const buildSearchQueryString = ({
  query,
  activeType,
  page,
}: {
  query: string;
  activeType: "all" | GlobalSearchType;
  page: number;
}) => {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();
  if (trimmedQuery) params.set("q", trimmedQuery);
  if (activeType !== "all") params.set("type", activeType);
  if (page > 1) params.set("page", String(page));
  return params.toString();
};

export default function GlobalSearchPage() {
  const localePath = useLocalizedPath();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const queryFromUrl = searchParams?.get('q') ?? '';
  const activeTypeFromUrl = resolveActiveType(searchParams?.get('type') ?? null);
  const pageFromUrl = resolvePage(searchParams?.get('page') ?? null);

  const [query, setQuery] = useState(queryFromUrl);
  const [submittedQuery, setSubmittedQuery] = useState(queryFromUrl);
  const [activeType, setActiveType] = useState<"all" | GlobalSearchType>(activeTypeFromUrl);
  const [page, setPage] = useState(pageFromUrl);
  const [hasSearched, setHasSearched] = useState(!!queryFromUrl.trim());
  const isUserAction = useRef(false);

  useEffect(() => {
    if (isUserAction.current) {
      isUserAction.current = false;
      return;
    }
    setQuery(queryFromUrl);
    setSubmittedQuery(queryFromUrl);
    setActiveType(activeTypeFromUrl);
    setPage(pageFromUrl);
    setHasSearched(!!queryFromUrl.trim());
  }, [queryFromUrl, activeTypeFromUrl, pageFromUrl]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const selectedTypes = useMemo(
    () => (activeType === "all" ? undefined : [activeType]),
    [activeType],
  );

  const { items, total, pages, totalsByType, loading, error } = useGlobalSearch({
    query: submittedQuery,
    page,
    limit: 12,
    types: selectedTypes,
    enabled: hasSearched && submittedQuery.trim().length > 0,
    debounceMs: 200,
  });

  const updateUrl = useCallback((q: string, type: "all" | GlobalSearchType, p: number) => {
    const next = buildSearchQueryString({ query: q, activeType: type, page: p });
    router.replace(next ? localePath(`/search?${next}`) : localePath("/search"), { scroll: false });
  }, [localePath, router]);

  const executeSearch = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    isUserAction.current = true;
    setSubmittedQuery(trimmed);
    setHasSearched(true);
    setPage(1);
    updateUrl(trimmed, activeType, 1);
  }, [query, activeType, updateUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  };

  const clearSearch = useCallback(() => {
    isUserAction.current = true;
    setQuery('');
    setSubmittedQuery('');
    setHasSearched(false);
    setActiveType('all');
    setPage(1);
    router.replace(localePath("/search"), { scroll: false });
  }, [localePath, router]);

  const updateType = useCallback((type: "all" | GlobalSearchType) => {
    isUserAction.current = true;
    setActiveType(type);
    setPage(1);
    if (hasSearched) {
      updateUrl(submittedQuery, type, 1);
    }
  }, [submittedQuery, hasSearched, updateUrl]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    isUserAction.current = true;
    setQuery(suggestion);
    setSubmittedQuery(suggestion);
    setHasSearched(true);
    setPage(1);
    setActiveType("all");
    updateUrl(suggestion, "all", 1);
  }, [updateUrl]);

  const goToPage = useCallback((newPage: number) => {
    isUserAction.current = true;
    setPage(newPage);
    if (hasSearched) {
      updateUrl(submittedQuery, activeType, newPage);
    }
  }, [submittedQuery, activeType, hasSearched, updateUrl]);

  return (
    <div className="section-padding min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <Card className="rounded-3xl border-white/60 bg-white/80 p-6 backdrop-blur-xl shadow-lg shadow-slate-200/30 md:p-8">
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Axtarış
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500 md:text-base">
                Vakansiya, tədbir, bloq və təşkilatları bir yerdən axtar.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Açar söz yazın..."
                  icon={Search}
                  inputSize="lg"
                  className="pr-10"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                    aria-label="Təmizlə"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={executeSearch}
                disabled={!query.trim()}
                className="rounded-xl px-6 font-bold shrink-0"
              >
                <Search className="h-4 w-4 mr-1.5" />
                Axtar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((option) => {
                const selected = activeType === option.key;
                const count = option.key === "all" ? total : totalsByType[option.key as GlobalSearchType] || 0;
                const Icon = option.icon;

                return (
                  <Button
                    key={option.key}
                    variant="outline"
                    size="sm"
                    onClick={() => updateType(option.key)}
                    className={cn(
                      "rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-wide gap-1.5",
                      selected
                        ? "border-transparent bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                        : "border-slate-200/60 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {option.label}
                    {hasSearched && <span className={cn("ml-0.5", selected ? "text-white/70" : "text-slate-400")}>({count})</span>}
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>

        {!hasSearched || !submittedQuery.trim() ? (
          <div className="text-center py-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mb-4">
              <Search className="h-7 w-7 text-blue-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Nə axtarmaq istəyirsiniz?</h3>
            <p className="text-sm text-slate-500 mb-6">Populyar axtarışlar:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUERIES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : loading ? (
          <LoadingState text="Nəticələr axtarılır..." variant="spinner" />
        ) : error ? (
          <EmptyState title="Axtarış xətası" message={error} variant="card" />
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <EmptyState
              variant="inline"
              icon={Search}
              title="Nəticə tapılmadı"
              message={`"${submittedQuery}" üçün nəticə tapılmadı. Başqa açar söz ilə yoxlayın.`}
            />
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {SUGGESTED_QUERIES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-600">
                {total} nəticə tapıldı
              </p>
              {pages > 0 && (
                <p className="text-xs font-semibold text-slate-500">
                  Səhifə {page} / {pages}
                </p>
              )}
            </div>

            <SearchResultsList items={items} />

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="rounded-xl px-4 py-2 text-xs font-bold disabled:cursor-not-allowed"
                >
                  Əvvəlki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => goToPage(page + 1)}
                  className="rounded-xl px-4 py-2 text-xs font-bold disabled:cursor-not-allowed"
                >
                  Növbəti
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
