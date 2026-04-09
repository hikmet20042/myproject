"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationContext } from "@/features/notifications/context/NotificationContext";
import { Alert } from "@/components/feedback";
import { Button } from "@/components/ui/Button";
import NotificationModal from "@/features/notifications/components/NotificationModal";
import { EmptyState, PageHeader, SectionCard } from "@/features/profile/components/ui";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";

export default function ProfileNotificationsPage() {
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
    } catch (e) {
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
    } catch (e) {
      setOptimisticReadMap(rollbackMap);
      showError("Bütün bildirişləri yeniləmək mümkün olmadı.");
    } finally {
      setMarkAllLoading(false);
    }
  };

  const { todayItems, earlierItems, unreadCount } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const today: any[] = [];
    const earlier: any[] = [];
    let unread = 0;

    normalizedNotifications.forEach((item) => {
      if (!item.isRead) unread += 1;
      const createdAt = new Date(item.createdAt).getTime();
      if (createdAt >= startOfToday) {
        today.push(item);
      } else {
        earlier.push(item);
      }
    });

    return { todayItems: today, earlierItems: earlier, unreadCount: unread };
  }, [normalizedNotifications]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bildirişlər"
        description="Sənə aid yenilikləri izlə və vacib bildirişləri vaxtında idarə et."
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={handleMarkAllAsRead} disabled={markAllLoading} loading={markAllLoading}>
              {markAllLoading ? "Yenilənir..." : `Hamısını oxunmuş et (${unreadCount})`}
            </Button>
          ) : undefined
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      <SectionCard>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="animate-pulse rounded-xl border border-gray-200 p-4">
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                <div className="mt-3 h-4 w-2/3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : normalizedNotifications.length === 0 ? (
          <EmptyState
            title="You’re all caught up"
            description="Hazırda yeni bildiriş yoxdur. Yenilik olduqda burada görünəcək."
          />
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Today</h3>
              {todayItems.length === 0 ? (
                <p className="text-sm text-gray-500">Bu gün üçün bildiriş yoxdur.</p>
              ) : (
                <div className="space-y-3">
                  {todayItems.map((item) => (
                    <button
                      key={item.id}
                      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 hover:shadow-sm ${item.isRead ? "border-gray-200 bg-white hover:border-gray-300" : "border-blue-200 bg-blue-50 hover:border-blue-300"}`}
                      onClick={() => {
                        setModalNotification(item);
                        setModalOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="mt-1 text-sm text-gray-700">{item.message}</p>
                          <p className="mt-2 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        {!item.isRead && <Bell className="w-4 h-4 text-blue-600 mt-1" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Earlier</h3>
              {earlierItems.length === 0 ? (
                <p className="text-sm text-gray-500">Əvvəlki bildiriş yoxdur.</p>
              ) : (
                <div className="space-y-3">
                  {earlierItems.map((item) => (
                    <button
                      key={item.id}
                      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 hover:shadow-sm ${item.isRead ? "border-gray-200 bg-white hover:border-gray-300" : "border-blue-200 bg-blue-50 hover:border-blue-300"}`}
                      onClick={() => {
                        setModalNotification(item);
                        setModalOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="mt-1 text-sm text-gray-700">{item.message}</p>
                          <p className="mt-2 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        {!item.isRead && <Bell className="w-4 h-4 text-blue-600 mt-1" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SectionCard>

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
