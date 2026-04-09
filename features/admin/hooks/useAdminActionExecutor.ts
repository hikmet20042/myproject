"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { runAdminAction } from "@/lib/admin-api";
import {
  adminConfig,
  AdminResourceKey,
  AdminAction,
  AdminItemFor,
  AdminApiParams,
} from "@/lib/admin-config";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";

export type AdminActionModalPayload<T> = {
  modalType?: string;
  actionKey: string;
  actionLabel: string;
  item: T;
  confirmMessage?: string;
};

export type AdminActionContext = {
  body?: Record<string, unknown>;
  params?: AdminApiParams;
  bypassConfirm?: boolean;
  onSuccess?: () => void | Promise<void>;
  optimistic?: {
    apply?: () => void;
    rollback?: () => void;
  };
} & Record<string, unknown>;

type UseAdminActionExecutorOptions = {
  onSuccess?: () => void | Promise<void>;
};

type LastFailedAction<T> = {
  resource: AdminResourceKey;
  actionKey: string;
  items: T[];
  context?: AdminActionContext;
};

const getItemId = <T,>(item: T) => {
  const withId = item as { _id?: string; id?: string };
  return withId._id || withId.id;
};

const normalizeActionError = (error: unknown) => {
  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("unauthorized") || lower.includes("forbidden")) {
      return "Bu əməliyyat üçün icazəniz yoxdur.";
    }
    if (lower.includes("not found")) {
      return "Məlumat tapılmadı. Siyahı yenilənir.";
    }
    if (
      lower.includes("network") ||
      lower.includes("failed to fetch") ||
      lower.includes("request failed")
    ) {
      return "Serverə qoşulmaq mümkün olmadı. Yenidən cəhd edin.";
    }
    if (
      error.message.trim() &&
      !lower.includes("unexpected token") &&
      !lower.includes("syntaxerror")
    ) {
      return error.message.trim();
    }
  }
  return "Əməliyyat tamamlanmadı. Yenidən cəhd edin.";
};

const getSuccessMessage = (actionLabel: string, count: number) => {
  if (count <= 1) {
    return `${actionLabel} uğurla tamamlandı.`;
  }
  return `${actionLabel}: ${count} element uğurla emal edildi.`;
};

export const useAdminActionExecutor = <T,>(
  currentRole?: string,
  options?: UseAdminActionExecutorOptions,
) => {
  const router = useRouter();
  const { success, error: showError, info } = useGlobalFeedback();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<LastFailedAction<T> | null>(
    null,
  );
  const [modalState, setModalState] = useState<AdminActionModalPayload<T> | null>(
    null,
  );

  const getLoadingKey = useCallback(
    (actionKey: string, item: T) => {
      const itemId = getItemId(item) || "unknown";
      return `${actionKey}:${itemId}`;
    },
    [],
  );

  const getBulkLoadingKey = useCallback((actionKey: string) => {
    return `bulk:${actionKey}`;
  }, []);

  const isActionLoading = useCallback(
    (actionKey: string, itemOrItems: T | T[]) => {
      const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
      if (!items.length) return false;
      if (items.length > 1) {
        return !!loadingMap[getBulkLoadingKey(actionKey)];
      }
      return !!loadingMap[getLoadingKey(actionKey, items[0])];
    },
    [getBulkLoadingKey, getLoadingKey, loadingMap],
  );

  const executeAction = useCallback(
    async (
      resource: AdminResourceKey,
      actionKey: string,
      itemOrItems: T | T[],
      context?: AdminActionContext,
    ) => {
      const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
      if (!items.length) {
        const message = "Əməliyyat üçün ən azı bir element seçilməlidir.";
        setError(message);
        showError(message);
        return;
      }

      const primaryItem = items[0];
      const action = adminConfig[resource].actions[
        actionKey
      ] as AdminAction<AdminItemFor<typeof resource>> | undefined;
      if (!action) {
        const message = "Əməliyyat konfiqurasiyası düzgün deyil.";
        setError(message);
        showError(message);
        return;
      }
      if (!action.type || !action.label || !action.key) {
        const message = "Əməliyyat konfiqurasiyasında tələb olunan sahələr çatışmır.";
        setError(message);
        showError(message);
        return;
      }

      if (action.roles && !action.roles.includes(currentRole || "")) {
        const message = "Bu əməliyyatı icra etmək üçün icazəniz yoxdur.";
        setError(message);
        showError(message);
        return;
      }

      if (action.type === "navigation") {
        const href = action.getHref?.(primaryItem as AdminItemFor<typeof resource>);
        if (!href) {
          const message = "Naviqasiya əməliyyatı üçün keçid ünvanı tapılmadı.";
          setError(message);
          showError(message);
          return;
        }
        info("Səhifəyə yönləndirilir...");
        router.push(href);
        return;
      }

      if (action.type === "modal") {
        if (!action.modalType) {
          const message = "Modal əməliyyatı üçün modal növü təyin olunmayıb.";
          setError(message);
          showError(message);
          return;
        }
        setModalState({
          modalType: action.modalType,
          actionKey,
          actionLabel: action.label,
          item: primaryItem,
        });
        return;
      }

      if (action.confirmMessage && !context?.bypassConfirm) {
        setModalState({
          modalType: "confirmAction",
          actionKey,
          actionLabel: action.label,
          item: primaryItem,
          confirmMessage: action.confirmMessage,
        });
        return;
      }

      const loadingKeys =
        action.scope === "bulk" || items.length > 1
          ? [getBulkLoadingKey(actionKey)]
          : [getLoadingKey(actionKey, primaryItem)];
      setLoadingMap((prev) => ({
        ...prev,
        ...Object.fromEntries(loadingKeys.map((key) => [key, true])),
      }));
      setError(null);
      let optimisticApplied = false;
      try {
        const ids = items.map((entry) => getItemId(entry)).filter(Boolean) as string[];
        const executionContext: AdminActionContext = {
          ...context,
          selectedItems: (context?.selectedItems as string[] | undefined) || ids,
        };

        if (context?.optimistic?.apply) {
          context.optimistic.apply();
          optimisticApplied = true;
        }

        const executeForItem = async (targetItem: T) => {
          const body = action.getBody
            ? action.getBody(targetItem as AdminItemFor<typeof resource>, executionContext)
            : executionContext.body;
          const params = action.getParams
            ? action.getParams(
                targetItem as AdminItemFor<typeof resource>,
                executionContext,
              )
            : executionContext.params;
          const id =
            (targetItem as AdminItemFor<typeof resource> & { _id?: string })._id ||
            (targetItem as AdminItemFor<typeof resource> & { id?: string }).id;
          return runAdminAction(resource, action, {
            id,
            body,
            params,
          });
        };

        const response =
          action.scope === "bulk"
            ? await executeForItem(primaryItem)
            : items.length === 1
              ? await executeForItem(primaryItem)
              : await Promise.all(items.map((entry) => executeForItem(entry)));

        success(getSuccessMessage(action.label, items.length));
        setLastFailedAction(null);
        try {
          if (options?.onSuccess) {
            await options.onSuccess();
          }
          if (context?.onSuccess) {
            await context.onSuccess();
          }
        } catch (_callbackError) {
          showError("Məlumat yenilənərkən xəta baş verdi.");
        }
        return response;
      } catch (err) {
        if (optimisticApplied) {
          context?.optimistic?.rollback?.();
        }
        const message = normalizeActionError(err);
        setError(message);
        showError(message);
        setLastFailedAction({ resource, actionKey, items, context });
        throw new Error(message);
      } finally {
        setLoadingMap((prev) => ({
          ...prev,
          ...Object.fromEntries(loadingKeys.map((key) => [key, false])),
        }));
      }
    },
    [router, currentRole, getBulkLoadingKey, getLoadingKey, options, showError, success],
  );

  const retryLastAction = useCallback(async () => {
    if (!lastFailedAction) return;
    try {
      await executeAction(
        lastFailedAction.resource,
        lastFailedAction.actionKey,
        lastFailedAction.items,
        lastFailedAction.context,
      );
    } catch (_error) {
    }
  }, [executeAction, lastFailedAction]);

  return {
    loading: Object.values(loadingMap).some(Boolean),
    loadingMap,
    error,
    modalState,
    setModalState,
    isActionLoading,
    executeAction,
    retryLastAction,
  };
};
