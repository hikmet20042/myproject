"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/feedback";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import NotificationModal from "@/components/ui/notifications/NotificationModal";
import NotificationItemRow from "@/components/ui/notifications/NotificationItem";
import { Card } from "@/components/ui/Card";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { useNotificationContext } from "@/features/notifications/context/NotificationContext";

type FilterValue = "all" | "unread" | "read";

export default function NotificationsPageContainer() {
  const {
    notifications,
    isLoading,
    error,
    ensureFreshNotifications,
    toggleNotificationRead,
    markAllAsRead,
  } = useNotificationContext();
  const { showSuccess, showError } = useGlobalFeedback();

  const [modalNotification, setModalNotification] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [optimisticReadMap, setOptimisticReadMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void ensureFreshNotifications(5000);
  }, [ensureFreshNotifications]);

  const normalizedNotifications = useMemo(() => {
    return notifications.map((item) => {
      const optimistic = optimisticReadMap[item.id];
      return {
        ...item,
        isRead: typeof optimistic === "boolean" ? optimistic : item.isRead,
        createdAt: item.createdAt,
      };
    });
  }, [notifications, optimisticReadMap]);

  const optimisticToggleRead = async (notificationId: string, nextRead: boolean) => {
    const prevRead = normalizedNotifications.find((n) => n.id === notificationId)?.isRead;
    setOptimisticReadMap((prev) => ({ ...prev, [notificationId]: nextRead }));
    try {
      await toggleNotificationRead(notificationId, nextRead);
      showSuccess(nextRead ? "Bildiriş oxunmuş kimi işarələndi." : "Bildiriş oxunmamış kimi işarələndi.");
    } catch {
      setOptimisticReadMap((prev) => ({ ...prev, [notificationId]: Boolean(prevRead) }));
      showError("Bildiriş statusu yenilənmədi. Yenidən cəhd edin.");
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkAllLoading(true);
    const rollbackMap = Object.fromEntries(normalizedNotifications.map((n) => [n.id, n.isRead]));
    setOptimisticReadMap((prev) => {
      const next = { ...prev };
      normalizedNotifications.forEach((n) => {
        next[n.id] = true;
      });
      return next;
    });
    try {
      await markAllAsRead();
      showSuccess("Bütün bildirişlər oxunmuş kimi işarələndi.");
    } catch {
      setOptimisticReadMap(rollbackMap);
      showError("Bütün bildirişləri yeniləmək mümkün olmadı.");
    } finally {
      setMarkAllLoading(false);
    }
  };

  const { filteredItems, unreadCount } = useMemo(() => {
    const filtered = normalizedNotifications.filter((item) => {
      if (filter === "unread") return !item.isRead;
      if (filter === "read") return item.isRead;
      return true;
    });

    let unread = 0;
    normalizedNotifications.forEach((item) => {
      if (!item.isRead) unread += 1;
    });

    return { filteredItems: filtered, unreadCount: unread };
  }, [normalizedNotifications, filter]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Bildirişlər</h1>
            <p className="mt-1 text-sm text-gray-600">Sənə aid yenilikləri izlə və vacib bildirişləri vaxtında idarə et.</p>
          </div>
          {unreadCount > 0 ? (
            <Button variant="outline" onClick={handleMarkAllAsRead} disabled={markAllLoading} loading={markAllLoading}>
              {markAllLoading ? "Yenilənir..." : `Hamısını oxunmuş et (${unreadCount})`}
            </Button>
          ) : null}
        </div>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      <Card className="rounded-2xl p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Bildiriş siyahısı</h2>
          <p className="mt-1 text-sm text-gray-600">Filtrlə və vacib bildirişləri daha sürətli tap.</p>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50/40 px-3 py-2">
            <p className="text-xs text-gray-500">Ümumi</p>
            <p className="text-base font-semibold text-gray-900">{normalizedNotifications.length}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
            <p className="text-xs text-blue-700">Oxunmamış</p>
            <p className="text-base font-semibold text-blue-800">{unreadCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-700">Oxunmuş</p>
            <p className="text-base font-semibold text-emerald-800">{Math.max(normalizedNotifications.length - unreadCount, 0)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
            <p className="text-xs text-gray-500">Filtr</p>
            <p className="text-base font-semibold text-gray-900">
              {filter === "all" ? "Hamısı" : filter === "unread" ? "Oxunmamış" : "Oxunmuş"}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <Tabs
            tabs={[
              { id: 'all', label: 'Hamısı' },
              { id: 'unread', label: 'Oxunmamış' },
              { id: 'read', label: 'Oxunmuş' },
            ]}
            activeTab={filter}
            onTabChange={(tabId) => setFilter(tabId as FilterValue)}
            variant="pills"
            size="sm"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="animate-pulse rounded-xl border border-gray-200 p-4">
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                <div className="mt-3 h-4 w-2/3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Bildiriş tapılmadı"
            message="Seçilmiş filtrə uyğun bildiriş yoxdur."
          />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <NotificationItemRow
                key={item.id}
                notification={item}
                onOpen={(notification) => {
                  setModalNotification(notification);
                  setModalOpen(true);
                }}
                onToggleRead={(notificationId, nextReadValue) => {
                  void optimisticToggleRead(notificationId, nextReadValue);
                }}
              />
            ))}
          </div>
        )}
      </Card>

      <NotificationModal
        open={modalOpen && !!modalNotification}
        onClose={() => setModalOpen(false)}
        title={modalNotification?.title || ""}
        message={modalNotification?.message || ""}
        createdAt={modalNotification?.createdAt || ""}
        isRead={modalNotification?.isRead}
        onMarkRead={
          modalNotification && !modalNotification.isRead
            ? async () => {
                await optimisticToggleRead(modalNotification.id, true);
                setModalOpen(false);
              }
            : undefined
        }
        onMarkUnread={
          modalNotification && modalNotification.isRead
            ? async () => {
                await optimisticToggleRead(modalNotification.id, false);
                setModalOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}
