"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "@/lib/auth/client";
import type { VacancyItem } from "@/features/vacancies/types/items";

type DashboardDataContextValue = {
  vacancies: VacancyItem[];
  vacanciesLoading: boolean;
  vacanciesError: string | null;
  vacanciesLastFetchedAt: number | null;
  vacanciesDirty: boolean;
  refreshVacancies: () => Promise<void>;
  ensureFreshVacancies: (maxAgeMs?: number) => Promise<void>;
  markVacanciesDirty: () => void;
  removeVacancyById: (id: string) => void;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

export function DashboardVacancyDataContainer({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(false);
  const [vacanciesError, setVacanciesError] = useState<string | null>(null);
  const [vacanciesLastFetchedAt, setVacanciesLastFetchedAt] = useState<number | null>(null);
  const [vacanciesDirty, setVacanciesDirty] = useState(false);
  const hasFetchedVacanciesRef = useRef(false);

  const safeResetVacancies = useCallback(() => {
    setVacancies([]);
    setVacanciesLoading(false);
    setVacanciesError(null);
    setVacanciesLastFetchedAt(null);
    setVacanciesDirty(false);
    hasFetchedVacanciesRef.current = false;
  }, []);

  const canFetchVacancies =
    Boolean(session?.user?.id) &&
    session?.user?.accountType === "organization" &&
    session?.user?.organizationStatus === "approved";

  const refreshVacancies = useCallback(async () => {
    if (status === "loading") {
      return;
    }

    if (!canFetchVacancies) {
      safeResetVacancies();
      return;
    }

    setVacanciesLoading(true);
    setVacanciesError(null);

    try {
      const response = await fetch("/api/vacancies?author=me");

      if (response.status === 401 || response.status === 403) {
        safeResetVacancies();
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload?.error?.message || payload?.error || "Vakansiyaları yükləmək mümkün olmadı.";
        setVacanciesError(message);
        return;
      }

      const responseJson = await response.json();
      const data = responseJson?.data || {};
      const nextVacancies = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.vacancies)
          ? data.vacancies
          : Array.isArray(responseJson)
            ? responseJson
          : [];
      setVacancies(nextVacancies as VacancyItem[]);
      setVacanciesLastFetchedAt(Date.now());
      setVacanciesDirty(false);
    } catch {
      setVacanciesError("Vakansiyaları yükləmək mümkün olmadı.");
    } finally {
      setVacanciesLoading(false);
    }
  }, [canFetchVacancies, safeResetVacancies, status]);

  const ensureFreshVacancies = useCallback(
    async (maxAgeMs = 30_000) => {
      if (status === "loading") {
        return;
      }

      if (!canFetchVacancies) {
        safeResetVacancies();
        return;
      }

      const isStale =
        vacanciesLastFetchedAt === null || Date.now() - vacanciesLastFetchedAt > maxAgeMs;

      if (vacanciesDirty || isStale) {
        await refreshVacancies();
      }
    },
    [
      canFetchVacancies,
      refreshVacancies,
      safeResetVacancies,
      status,
      vacanciesDirty,
      vacanciesLastFetchedAt,
    ],
  );

  const markVacanciesDirty = useCallback(() => {
    setVacanciesDirty(true);
  }, []);

  const removeVacancyById = useCallback((id: string) => {
    setVacancies((prev) => prev.filter((vacancy) => vacancy._id !== id));
  }, []);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!canFetchVacancies) {
      safeResetVacancies();
      return;
    }

    if (hasFetchedVacanciesRef.current) {
      return;
    }

    hasFetchedVacanciesRef.current = true;
    void refreshVacancies();
  }, [canFetchVacancies, refreshVacancies, safeResetVacancies, status]);

  const value = useMemo<DashboardDataContextValue>(
    () => ({
      vacancies,
      vacanciesLoading,
      vacanciesError,
      vacanciesLastFetchedAt,
      vacanciesDirty,
      refreshVacancies,
      ensureFreshVacancies,
      markVacanciesDirty,
      removeVacancyById,
    }),
    [
      ensureFreshVacancies,
      markVacanciesDirty,
      refreshVacancies,
      removeVacancyById,
      vacancies,
      vacanciesDirty,
      vacanciesError,
      vacanciesLastFetchedAt,
      vacanciesLoading,
    ],
  );

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardVacancyData() {
  const context = useContext(DashboardDataContext);

  if (!context) {
    throw new Error("useDashboardVacancyData must be used within DashboardVacancyDataContainer");
  }

  return context;
}
