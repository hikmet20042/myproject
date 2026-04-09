"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAdminList } from "@/lib/admin-api";
import {
  adminConfig,
  AdminResourceKey,
  AdminItemFor,
  AdminPagination as ConfigPagination,
} from "@/lib/admin-config";

export type AdminPagination = ConfigPagination;

export type AdminListOptions = {
  initialFilters?: Record<string, unknown>;
  initialPagination?: AdminPagination;
  onResponse?: (data: unknown) => void;
};

export const useAdminList = <K extends AdminResourceKey>(
  resource: K,
  options?: AdminListOptions,
) => {
  const { initialFilters, initialPagination, onResponse } = options || {};
  const [data, setData] = useState<AdminItemFor<K>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<Record<string, unknown>>(
    initialFilters || {},
  );
  const initialFiltersRef = useRef<Record<string, unknown>>(initialFilters || {});
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: initialPagination?.page || 1,
    limit: initialPagination?.limit,
    total: initialPagination?.total || 0,
    totalPages: initialPagination?.totalPages || 1,
  });

  const refresh = useCallback(async () => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminList(
        resource,
        {
          ...filters,
          page: pagination.page,
          limit: pagination.limit,
        },
        { signal: controller.signal },
      );
      if (requestIdRef.current !== requestId) return;
      const mapped = adminConfig[resource].mapResponse(response);
      setData(mapped.items as AdminItemFor<K>[]);
      if (mapped.pagination) {
        setPagination((prev) => ({ ...prev, ...mapped.pagination }));
      }
      if (onResponse) {
        onResponse(response);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      if (requestIdRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [resource, filters, pagination.page, pagination.limit, onResponse]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setFilters = useCallback((next: Record<string, unknown>) => {
    setFiltersState((prev) => ({ ...prev, ...next }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const replaceFilters = useCallback((next: Record<string, unknown>) => {
    setFiltersState({ ...next });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({ ...initialFiltersRef.current });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const mutateData = useCallback(
    (
      updater:
        | AdminItemFor<K>[]
        | ((current: AdminItemFor<K>[]) => AdminItemFor<K>[]),
    ) => {
      setData((prev) => (typeof updater === "function" ? updater(prev) : updater));
    },
    [],
  );

  return {
    data,
    loading,
    error,
    refresh,
    filters,
    setFilters,
    replaceFilters,
    resetFilters,
    pagination,
    setPage,
    setLimit,
    mutateData,
  };
};
