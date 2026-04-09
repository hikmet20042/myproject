"use client";

import { memo } from "react";
import { Check, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { type NotificationItem } from "@/features/notifications/context/NotificationContext";

interface NotificationListItemProps {
  notification: NotificationItem;
  isHighlighted?: boolean;
  isEntering?: boolean;
  isActionLoading?: boolean;
  isDeleting?: boolean;
  onOpen: (notification: NotificationItem) => void;
  onToggleRead: (notificationId: string, nextReadValue: boolean) => void;
  onDelete?: (notificationId: string) => void;
  compact?: boolean;
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "İndicə";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}d əvvəl`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s əvvəl`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}g əvvəl`;
  return date.toLocaleDateString();
}

function getNotificationTypeLabel(type: string) {
  const typeKey = type.toUpperCase().replace("-", "_");
  const typeLabels: Record<string, string> = {
    NEW_RELEVANT_ITEM: "Yeni uyğun imkan",
    SAVED_ITEM_UPDATE: "Saxlanılan imkan yeniliyi",
    SYSTEM: "Sistem bildirişi",
    BLOG_LIKE: "Bloq Bəyənməsi",
    BLOG_DISLIKE: "Bloq Bəyənməməsi",
    COMMENT_ADDED: "Yeni Şərh",
    COMMENT_REPLY: "Şərhə Cavab",
    COMMENT_LIKE: "Şərh Bəyənməsi",
    COMMENT_DISLIKE: "Şərh Bəyənməməsi",
    EVENT_DEADLINE: "Tədbir Son Tarixi",
    EVENT_UPDATED: "Tədbir Yeniləməsi",
    VACANCY_DEADLINE: "Vakansiya Son Tarixi",
    VACANCY_UPDATED: "Vakansiya Yeniləməsi",
    SYSTEM_ANNOUNCEMENT: "Sistem Elanı",
  };
  return typeLabels[typeKey] || type.replace("_", " ").toUpperCase();
}

function getNotificationTypeColor(type: string) {
  switch (type) {
    case "blog_like":
    case "blog_dislike":
    case "comment_reply":
    case "comment_like":
    case "comment_dislike":
      return "text-blue-700";
    case "event_deadline":
      return "text-amber-700";
    case "NEW_RELEVANT_ITEM":
    case "new_relevant_item":
      return "text-emerald-700";
    case "SYSTEM":
    case "system":
      return "text-slate-700";
    default:
      return "text-slate-500";
  }
}

const NotificationListItem = memo(function NotificationListItem({
  notification,
  isHighlighted = false,
  isEntering = false,
  isActionLoading = false,
  isDeleting = false,
  onOpen,
  onToggleRead,
  onDelete,
  compact = false,
}: NotificationListItemProps) {
  const unread = !notification.isRead;

  return (
    <div
      className={[
        compact ? "border-b border-blue-100" : "rounded-xl border border-slate-200",
        "transition-all duration-200",
        unread ? "bg-blue-100/70" : "bg-white",
        unread ? "hover:bg-blue-100" : "hover:bg-slate-50",
        isHighlighted ? "notification-highlight" : "",
        isEntering ? "notification-enter" : "",
        isDeleting ? "opacity-60 pointer-events-none" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={compact ? "group px-4 py-3" : "group p-4"}>
        <div className="flex justify-between items-start gap-3">
          <button
            type="button"
            onClick={() => onOpen(notification)}
            className="flex-1 min-w-0 text-left rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <div className="flex items-start gap-2">
              {!notification.isRead && (
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={unread ? "text-sm font-semibold text-slate-900" : "text-sm font-medium text-slate-700"}>
                  {notification.title}
                </p>
                <p className={unread ? "text-xs text-slate-700 mt-1 line-clamp-2" : "text-xs text-slate-500 mt-1 line-clamp-2"}>
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-semibold ${getNotificationTypeColor(notification.type)}`}>
                    {getNotificationTypeLabel(notification.type)}
                  </span>
                  <span className="text-xs text-slate-400">{formatRelativeTime(notification.createdAt)}</span>
                </div>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5 flex-shrink-0 pl-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleRead(notification._id, !notification.isRead);
              }}
              disabled={isActionLoading}
              className={[
                "p-1.5 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
                notification.isRead
                  ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  : "text-blue-700 hover:text-blue-800 hover:bg-blue-100",
              ].join(" ")}
              title={notification.isRead ? "Oxunmamış kimi işarələ" : "Oxunmuş kimi işarələ"}
              aria-label={notification.isRead ? "Oxunmamış kimi işarələ" : "Oxunmuş kimi işarələ"}
            >
              {isActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : notification.isRead ? (
                <CheckCheck className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification._id);
                }}
                disabled={isDeleting}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                title="Sil"
                aria-label="Sil"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default NotificationListItem;
