"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/feedback";
import NotificationModal from "@/components/NotificationModal";
import NotificationListItem from "@/components/notifications/NotificationListItem";
import {
  deriveDataState,
  SectionContainer,
  SectionEmptyStateSlot,
  SectionErrorInline,
  SectionLoading,
} from "@/features/ui-state/index";
import {
  useNotificationContext,
  type NotificationItem,
} from "@/components/NotificationContext";

type StatusFilter = "all" | "unread" | "read";
type DateFilter = "all" | "today" | "last7days" | "last30days";
type NotificationDateGroup = "Today" | "Yesterday" | "Earlier";

const STATUS_FILTERS: StatusFilter[] = ["all", "unread", "read"];
const DATE_FILTERS: DateFilter[] = ["all", "today", "last7days", "last30days"];
const INITIAL_VISIBLE_COUNT = 15;
const VISIBLE_COUNT_STEP = 10;

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: "All Dates",
  today: "Today",
  last7days: "Last 7 Days",
  last30days: "Last 30 Days",
};

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isWithinPastDays(candidate: Date, dayCount: number, now: Date) {
  const threshold = new Date(now.getTime() - dayCount * 24 * 60 * 60 * 1000);
  return candidate >= threshold && candidate <= now;
}

function getNotificationDateGroup(createdAt: string, now: Date): NotificationDateGroup {
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) {
    return "Earlier";
  }

  if (isSameCalendarDay(createdDate, now)) {
    return "Today";
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameCalendarDay(createdDate, yesterday)) {
    return "Yesterday";
  }

  return "Earlier";
}

export default function DashboardNotificationsPageContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    notifications,
    unreadCount,
    toggleNotificationRead,
    markAllAsRead,
    isLoading,
    error,
    refreshNotifications,
    ensureFreshNotifications,
  } = useNotificationContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNotification, setModalNotification] = useState<NotificationItem | null>(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeFilters = useMemo(() => {
    const filterValue = searchParams?.get("filter") || "all";
    const rawTokens = filterValue
      .split(",")
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);

    const statusFilter = rawTokens.includes("unread")
      ? "unread"
      : rawTokens.includes("read")
        ? "read"
        : "all";
    const dateFilter = rawTokens.includes("today")
      ? "today"
      : rawTokens.includes("last7days")
        ? "last7days"
        : rawTokens.includes("last30days")
          ? "last30days"
          : "all";

    return {
      statusFilter: statusFilter as StatusFilter,
      dateFilter: dateFilter as DateFilter,
    };
  }, [searchParams]);

  const filteredNotifications = useMemo(() => {
    const now = new Date();

    return notifications.filter((notification) => {
      const matchesStatus =
        activeFilters.statusFilter === "all" ||
        (activeFilters.statusFilter === "unread" ? !notification.isRead : notification.isRead);

      if (!matchesStatus) {
        return false;
      }

      if (activeFilters.dateFilter === "all") {
        return true;
      }

      const createdDate = new Date(notification.createdAt);
      if (Number.isNaN(createdDate.getTime())) {
        return false;
      }

      if (activeFilters.dateFilter === "today") {
        return isSameCalendarDay(createdDate, now);
      }

      if (activeFilters.dateFilter === "last7days") {
        return isWithinPastDays(createdDate, 7, now);
      }

      return isWithinPastDays(createdDate, 30, now);
    });
  }, [activeFilters.dateFilter, activeFilters.statusFilter, notifications]);

  const visibleNotifications = useMemo(
    () => filteredNotifications.slice(0, visibleCount),
    [filteredNotifications, visibleCount]
  );

  const groupedVisibleNotifications = useMemo(() => {
    const groups: Record<NotificationDateGroup, NotificationItem[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };
    const now = new Date();

    visibleNotifications.forEach((notification) => {
      const group = getNotificationDateGroup(notification.createdAt, now);
      groups[group].push(notification);
    });

    return (Object.entries(groups) as Array<[NotificationDateGroup, NotificationItem[]]>).filter(
      ([, items]) => items.length > 0
    );
  }, [visibleNotifications]);

  const isFilterActive =
    activeFilters.statusFilter !== "all" || activeFilters.dateFilter !== "all";
  const dataState = deriveDataState({
    data: notifications,
    filteredData: filteredNotifications,
    hasActiveFilters: isFilterActive,
    isLoading,
  });
  const errorState = error ? "present" : "none";
  const isRefreshing = isLoading && notifications.length > 0;
  const canLoadMore = visibleCount < filteredNotifications.length;

  useEffect(() => {
    void ensureFreshNotifications(45_000);
  }, [ensureFreshNotifications]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeFilters.dateFilter, activeFilters.statusFilter]);

  const setFilters = useCallback(
    (nextStatusFilter: StatusFilter, nextDateFilter: DateFilter) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      const tokens: string[] = [];

      if (nextStatusFilter !== "all") {
        tokens.push(nextStatusFilter);
      }
      if (nextDateFilter !== "all") {
        tokens.push(nextDateFilter);
      }

      params.set("filter", tokens.length > 0 ? tokens.join(",") : "all");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const setStatusFilter = useCallback(
    (statusFilter: StatusFilter) => {
      setFilters(statusFilter, activeFilters.dateFilter);
    },
    [activeFilters.dateFilter, setFilters]
  );

  const setDateFilter = useCallback(
    (dateFilter: DateFilter) => {
      setFilters(activeFilters.statusFilter, dateFilter);
    },
    [activeFilters.statusFilter, setFilters]
  );

  const handleMarkAllAsRead = async () => {
    if (!markAllAsRead || markAllLoading || unreadCount === 0) {
      return;
    }

    setActionError(null);
    setMarkAllLoading(true);
    try {
      await markAllAsRead();
    } catch {
      setActionError("Bütün bildirişləri oxunmuş kimi işarələmək mümkün olmadı.");
    } finally {
      setMarkAllLoading(false);
    }
  };

  const handleToggleRead = async (notificationId: string, isRead: boolean) => {
    if (!notificationId || activeNotificationId === notificationId) {
      return;
    }

    setActionError(null);
    setActiveNotificationId(notificationId);
    try {
      await toggleNotificationRead(notificationId, isRead);
    } catch {
      setActionError("Bildiriş statusunu yeniləmək mümkün olmadı.");
    } finally {
      setActiveNotificationId(null);
    }
  };

  const handleLoadMore = useCallback(() => {
    setVisibleCount((previousCount) => previousCount + VISIBLE_COUNT_STEP);
  }, []);

  const renderNotificationsContent = () => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <p className="text-xs text-slate-500">
        Showing {Math.min(visibleNotifications.length, filteredNotifications.length)} of {filteredNotifications.length}{" "}
        notifications
      </p>

      <div className="space-y-4">
        {groupedVisibleNotifications.map(([groupName, groupItems]) => (
          <section key={groupName} className="space-y-2">
            <h3 className="sticky top-0 z-10 rounded-lg bg-slate-100/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 backdrop-blur">
              {groupName}
            </h3>

            <div className="space-y-3">
              {groupItems.map((notification) => {
                const notificationId = notification.id || notification._id;
                const isActionLoading = activeNotificationId === notificationId;

                return (
                  <NotificationListItem
                    key={notificationId}
                    notification={notification}
                    isActionLoading={isActionLoading}
                    onOpen={(selected) => {
                      setModalNotification(selected);
                      setModalOpen(true);
                    }}
                    onToggleRead={(notificationId, nextReadValue) => {
                      void handleToggleRead(notificationId, nextReadValue);
                    }}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {canLoadMore ? (
        <div className="flex justify-center pt-1">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={handleLoadMore}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-100 text-indigo-700">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
            <p className="mt-1 text-sm text-slate-600">
              Track updates about your organization content and activity.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="rounded-xl"
          onClick={handleMarkAllAsRead}
          disabled={markAllLoading || unreadCount === 0}
        >
          {markAllLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
          Mark All as Read
        </Button>
      </header>

      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <CardContent padding="md" className="bg-white">
          {actionError && (
            <div className="mb-4">
              <Alert variant="error" dismissible onDismiss={() => setActionError(null)}>
                {actionError}
              </Alert>
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Inbox</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{unreadCount}</span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                {STATUS_FILTERS.map((filter) => {
                  const isActive = filter === activeFilters.statusFilter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={[
                        "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      ].join(" ")}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                Date
                <select
                  value={activeFilters.dateFilter}
                  onChange={(event) => setDateFilter(event.target.value as DateFilter)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  aria-label="Filter notifications by date"
                >
                  {DATE_FILTERS.map((filter) => (
                    <option key={filter} value={filter}>
                      {DATE_FILTER_LABELS[filter]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <SectionContainer
            dataState={dataState}
            errorState={errorState}
            isRefreshing={isRefreshing}
            debugId="dashboard-notifications"
            enableDebug={process.env.NEXT_PUBLIC_UI_STATE_DEBUG === "true"}
            renderNonBlockingError={() => (
              <SectionErrorInline
                className="mb-4"
                title="Bildirişlər yenilənmədi"
                message={error || "Bildirişləri yeniləmək mümkün olmadı."}
                onRetry={() => {
                  void refreshNotifications({ force: true });
                }}
              />
            )}
            renderRefreshingNotice={() => (
              <div className="mb-4">
                <Alert variant="info" title="Bildirişlər yenilənir">
                  Son yenilənmiş məlumatlar göstərilir.
                </Alert>
              </div>
            )}
            renderBody={{
              "error-blocking": () => (
                <SectionErrorInline
                  title="Bildirişləri yükləmək mümkün olmadı"
                  message={error || "Bildirişləri yükləmək mümkün olmadı."}
                  onRetry={() => {
                    void refreshNotifications({ force: true });
                  }}
                />
              ),
              "loading-initial": () => <SectionLoading variant="notifications" rows={3} />,
              "empty-list": () => (
                <SectionEmptyStateSlot kind="empty-list" scope="dashboard-notifications">
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 px-6 py-12 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
                      <Bell className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No matching notifications</h3>
                    <p className="mt-2 text-sm text-gray-600">New updates will appear here as they arrive.</p>
                  </div>
                </SectionEmptyStateSlot>
              ),
              "empty-filtered": () => (
                <SectionEmptyStateSlot kind="empty-filtered" scope="dashboard-notifications">
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 px-6 py-12 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
                      <Bell className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No matching notifications</h3>
                    <p className="mt-2 text-sm text-gray-600">Try another filter to view more notifications.</p>
                  </div>
                </SectionEmptyStateSlot>
              ),
              content: renderNotificationsContent,
            }}
          />
        </CardContent>
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
                const notificationId = modalNotification.id || modalNotification._id;
                await handleToggleRead(notificationId, true);
                setModalOpen(false);
              }
            : undefined
        }
        onMarkUnread={
          modalNotification && modalNotification.isRead
            ? async () => {
                const notificationId = modalNotification.id || modalNotification._id;
                await handleToggleRead(notificationId, false);
                setModalOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}