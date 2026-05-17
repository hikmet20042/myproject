"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Bookmark,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { EventItem } from "@/features/events/types/items";
import { prefetchEventDetail } from "@/lib/eventQueries";

interface EventRowProps {
  event: EventItem;
  onRequestDelete: (event: EventItem) => void;
}

export default function EventRow({ event, onRequestDelete }: EventRowProps) {
  const localePath = useLocalizedPath();
  const queryClient = useQueryClient();
  const prefetchDetail = () => {
    void prefetchEventDetail(queryClient, event._id);
  };

  const getStatusIcon = () => {
    if (event.status === "approved") {
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    }
    if (event.status === "rejected") {
      return <XCircle className="h-4 w-4 text-rose-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-amber-500" />;
  };

  const getStatusBadge = () => {
    if (event.status === "approved") {
      return (
        <Badge
          variant="success"
          className="border border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          {"Təsdiqləndi"}
        </Badge>
      );
    }
    if (event.status === "rejected") {
      return (
        <Badge
          variant="danger"
          className="border border-red-200 bg-red-50 text-red-700"
        >
          {"Rədd Edildi"}
        </Badge>
      );
    }
    return (
      <Badge
        variant="warning"
        className="border border-amber-200 bg-amber-50 text-amber-700"
      >
        {"Gözləyir"}
      </Badge>
    );
  };

  const moderationHint =
    event.status === "pending"
      ? "Tədbir moderasiya mərhələsindədir."
      : event.status === "approved"
        ? "Redaktə etdikdən sonra tədbir yenidən moderasiyaya göndəriləcək."
        : "Dəyişiklik edib yenidən göndərə bilərsiniz.";

  const rejectionReason = event.rejectionReason || event.adminComment || null;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent padding="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
              {getStatusIcon()}
              {getStatusBadge()}
            </div>

            <p className="mb-3 line-clamp-2 text-gray-600">{event.description}</p>

            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {moderationHint}
            </div>

            {event.status === "rejected" && rejectionReason && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <span className="font-semibold">Rədd səbəbi:</span> {rejectionReason}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-500 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>{new Date(event.eventDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-cyan-500" />
                <span className="truncate">
                  {event.location.type === "online"
                    ? "Onlayn"
                    : event.location.type === "hybrid"
                      ? "Hibrid"
                      : `${event.location.city || ""} ${event.location.country || ""}`.trim() ||
                        "Fiziki"}
                </span>
              </div>
              {typeof event.views === 'number' && event.views > 0 && (
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-violet-500" />
                  <span>
                    {event.views.toLocaleString()} baxış
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Bookmark className="h-4 w-4 text-amber-500" />
                <span>{(event.saves || 0).toLocaleString()} saxlama</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="border border-blue-200 bg-blue-50 text-blue-700"
              >
                {event.category}
              </Badge>
              {event.tags.slice(0, 2).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="border border-cyan-200 bg-cyan-50 text-cyan-700"
                >
                  {tag}
                </Badge>
              ))}
              {event.tags.length > 2 && (
                <Badge
                  variant="secondary"
                  className="border border-blue-100 bg-slate-100 text-gray-700"
                >{`+${event.tags.length - 2} ${"daha"}`}</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:ml-4">
            <Link href={localePath(`/resources/events/${event.slug}`)} onMouseEnter={prefetchDetail} onFocus={prefetchDetail}>
              <Button
                variant="ghost"
                size="sm"
                icon={Eye}
                title={"Tədbirə bax"}
                className="rounded-xl hover:border-blue-200 hover:bg-blue-50"
              />
            </Link>
            <Link href={localePath(`/dashboard/events/${event._id || (event as any).id}/edit`)} onMouseEnter={prefetchDetail} onFocus={prefetchDetail}>
              <Button
                variant="ghost"
                size="sm"
                icon={Edit}
                title={"Tədbiri redaktə et"}
                className="rounded-xl hover:border-cyan-200 hover:bg-cyan-50"
              />
            </Link>
            <Button
              onClick={() => onRequestDelete(event)}
              variant="ghost"
              size="sm"
              icon={Trash2}
              title={"Tədbiri sil"}
              className="rounded-xl text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
