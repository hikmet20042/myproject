"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { EmptyState, LoadingState } from "@/components/shared";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useGlobalSearch } from "@/features/search/hooks/useGlobalSearch";
import { SearchResultsList } from "@/features/search/components/SearchResultsList";
import type { GlobalSearchType } from "@/features/search/types/search.types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const TYPE_OPTIONS: Array<{ key: "all" | GlobalSearchType; label: string }> = [
  { key: "all", label: "Hamısı" },
  { key: "vacancy", label: "Vakansiyalar" },
  { key: "event", label: "Tədbirlər" },
  { key: "blog", label: "Bloqlar" },
  { key: "organization", label: "Təşkilatlar" },
];

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

  const queryFromUrl = searchParams?.get('q') ?? ''
  const activeTypeFromUrl = resolveActiveType(searchParams?.get('type') ?? null)
  const pageFromUrl = resolvePage(searchParams?.get('page') ?? null)
  const currentParams = searchParams?.toString() ?? ''

  const [query, setQuery] = useState(queryFromUrl);
  const [activeType, setActiveType] = useState<"all" | GlobalSearchType>(
    activeTypeFromUrl,
  );
  const [page, setPage] = useState(pageFromUrl);

  useEffect(() => {
    setQuery(queryFromUrl);
    setActiveType(activeTypeFromUrl);
    setPage(pageFromUrl);
  }, [queryFromUrl, activeTypeFromUrl, pageFromUrl]);

  useEffect(() => {
    const next = buildSearchQueryString({ query, activeType, page });

    if (next === currentParams) return;

    router.replace(
      next ? localePath(`/search?${next}`) : localePath("/search"),
      { scroll: false },
    );
  }, [activeType, currentParams, localePath, page, query, router]);

  const selectedTypes = useMemo(
    () => (activeType === "all" ? undefined : [activeType]),
    [activeType],
  );

  const { items, total, pages, totalsByType, loading, error } = useGlobalSearch(
    {
      query,
      page,
      limit: 12,
      types: selectedTypes,
      enabled: query.trim().length > 0,
    },
  );

  const updateType = (type: "all" | GlobalSearchType) => {
    setActiveType(type);
    setPage(1);
  };

  return (
    <div className="section-padding min-h-screen bg-slate-50 py-10 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <Card className="rounded-3xl border-white/60 bg-white/70 p-6 backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Qlobal Axtarış
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600 md:text-base">
                Vakansiya, tədbir, bloq və təşkilatları bir yerdən axtar.
              </p>
            </div>

            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Açar söz yazın..."
              icon={Search}
              inputSize="lg"
            />

            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((option) => {
                const selected = activeType === option.key;
                const count =
                  option.key === "all"
                    ? total
                    : totalsByType[option.key as GlobalSearchType] || 0;

                return (
                  <Button
                    key={option.key}
                    variant="outline"
                    size="sm"
                    onClick={() => updateType(option.key)}
                    className={cn(
                      "rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-wide",
                      selected
                        ? "border-transparent bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                        : "border-slate-200/60 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {option.label} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>

        {!query.trim() ? (
          <EmptyState
            title="Axtarışa başlamaq üçün sorğu daxil edin"
            message="Məsələn: dizayn, könüllülük, tədbir, gənclər"
            fullPage={false}
          />
        ) : loading ? (
          <LoadingState text="Nəticələr axtarılır..." fullPage={false} />
        ) : error ? (
          <EmptyState title="Axtarış xətası" message={error} fullPage={false} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nəticə tapılmadı"
            message="Sorğunu və ya filtri dəyişərək yenidən yoxlayın."
            fullPage={false}
          />
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-600">
                {total} nəticə tapıldı
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Səhifə {page} / {Math.max(1, pages)}
              </p>
            </div>

            <SearchResultsList items={items} />

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-xl px-4 py-2 text-xs font-bold disabled:cursor-not-allowed"
                >
                  Əvvəlki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
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
