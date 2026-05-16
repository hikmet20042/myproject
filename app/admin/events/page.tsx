"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from '@/components/ui/Modal'
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/Textarea";
import { LoadingState } from "@/components/shared";
import AdminActionModal from "@/components/admin/AdminActionModal";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import AdminListLayout from "@/components/admin/AdminListLayout";
import {
  AZERBAIJAN_CITIES,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_VALUES,
  type EventTypeValue,
} from "@/lib/events/eventConfig";
import { Card } from "@/components/ui/Card";
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'

type AdminEventsPayload = {
  items: any[];
  pagination: { page: number; pages: number; total: number; limit: number };
  stats: { pending: number; approved: number; rejected: number; total: number };
};

const defaultStats = { pending: 0, approved: 0, rejected: 0, total: 0 };

export default function EventsAdminPage() {
  const localePath = useLocalizedPath();
  const { showSuccess, showError } = useGlobalFeedback();
  const queryClient = useQueryClient();
  const [contentSearch, setContentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [eventPage, setEventPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventAction, setEventAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [eventRejectionReason, setEventRejectionReason] = useState("");
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<any | null>(null);

  useEffect(() => {
    setEventPage(1);
  }, [contentSearch, statusFilter, eventTypeFilter, locationFilter, dateFromFilter, dateToFilter]);

  const queryFilters = useMemo(
    () => ({
      page: eventPage,
      limit: 20,
      ...(contentSearch ? { search: contentSearch } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(eventTypeFilter !== "all" ? { eventType: eventTypeFilter } : {}),
      ...(locationFilter !== "all" ? { location: locationFilter } : {}),
      ...(dateFromFilter ? { dateFrom: dateFromFilter } : {}),
      ...(dateToFilter ? { dateTo: dateToFilter } : {}),
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
    [contentSearch, eventPage, eventTypeFilter, locationFilter, dateFromFilter, dateToFilter, statusFilter],
  );

  const unwrapPayload = (responseData: any): AdminEventsPayload => {
    const payload =
      responseData && typeof responseData === "object" && "data" in responseData
        ? responseData.data
        : responseData;
    return {
      items: payload?.items || payload?.events || [],
      pagination: payload?.pagination || {
        page: 1,
        pages: 1,
        total: 0,
        limit: 20,
      },
      stats: payload?.stats || defaultStats,
    };
  };

  const parseApiError = async (response: Response, fallback: string) => {
    try {
      const data = await response.json();
      return data?.error || data?.message || fallback;
    } catch {
      return fallback;
    }
  };

  const eventsQuery = useQuery({
    queryKey: ["events", queryFilters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.entries(queryFilters).map(([key, value]) => [key, String(value)]),
      );
      const response = await fetch(`/api/admin/events?${params}`);
      if (!response.ok) {
        throw new Error(await parseApiError(response, "Tədbirləri yükləmək mümkün olmadı."));
      }
      const responseData = await response.json();
      const data = unwrapPayload(responseData);
      return data as AdminEventsPayload;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const events = eventsQuery.data?.items || [];
  const eventStats = eventsQuery.data?.stats || defaultStats;
  const eventPagination = {
    page: eventsQuery.data?.pagination?.page || eventPage,
    totalPages: eventsQuery.data?.pagination?.pages || 1,
  };

  const handleEventAction = (event: any, action: "approve" | "reject") => {
    setSelectedEvent(event);
    setEventAction(action);
    setShowEventModal(true);
  };

  const moderationMutation = useMutation({
    mutationFn: async ({
      eventId,
      action,
      rejectionReason,
    }: {
      eventId: string;
      action: "approve" | "reject";
      rejectionReason?: string;
    }) => {
      const body: Record<string, any> = { action };
      if (action === "reject" && rejectionReason?.trim()) {
        body.rejectionReason = rejectionReason.trim();
      }
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response, "Moderasiya əməliyyatını tamamlamaq mümkün olmadı."));
      }
      const payload = await response.json();
      const data = unwrapPayload(payload) as any;
      return data?.event || null;
    },
    onSuccess: (updatedEvent) => {
      const eventId = String(updatedEvent?._id || updatedEvent?.id || "");
      if (!eventId) {
        return;
      }
      queryClient.setQueriesData({ queryKey: ["events"] }, (old: any) => {
        if (!old || !Array.isArray(old.items)) {
          return old;
        }
        const nextEvents = old.items.map((event: any) =>
          (event?._id || event?.id) === eventId ? { ...event, ...updatedEvent } : event
        );
        const nextStats = nextEvents.reduce(
          (acc: any, event: any) => {
            const status = event?.status || "pending";
            acc.total += 1;
            if (status === "approved") acc.approved += 1;
            else if (status === "rejected") acc.rejected += 1;
            else acc.pending += 1;
            return acc;
          },
          { pending: 0, approved: 0, rejected: 0, total: 0 }
        );
        return { ...old, items: nextEvents, stats: nextStats };
      });
      queryClient.setQueryData(["event", eventId], (previous: any) => ({ ...(previous || {}), ...updatedEvent }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await parseApiError(response, "Tədbiri silmək alınmadı"));
      }
      return eventId;
    },
    onSuccess: (eventId) => {
      queryClient.setQueriesData({ queryKey: ["events"] }, (old: any) => {
        if (!old || !Array.isArray(old.items)) {
          return old;
        }
        const nextEvents = old.items.filter((event: any) => (event?._id || event?.id) !== eventId);
        const nextStats = nextEvents.reduce(
          (acc: any, event: any) => {
            const status = event?.status || "pending";
            acc.total += 1;
            if (status === "approved") acc.approved += 1;
            else if (status === "rejected") acc.rejected += 1;
            else acc.pending += 1;
            return acc;
          },
          { pending: 0, approved: 0, rejected: 0, total: 0 }
        );
        return { ...old, items: nextEvents, stats: nextStats };
      });
      queryClient.removeQueries({ queryKey: ["event", eventId] });
    },
  });

  const executeEventAction = async () => {
    if (!selectedEvent || !eventAction) return;
    if (eventAction === "approve" && selectedEvent.status === "approved") {
      showError("Bu tədbir artıq təsdiqlənib.");
      return;
    }
    if (eventAction === "reject" && selectedEvent.status === "rejected") {
      showError("Bu tədbir artıq rədd edilib.");
      return;
    }

    try {
      await moderationMutation.mutateAsync({
        eventId: selectedEvent._id,
        action: eventAction,
        rejectionReason: eventAction === "reject" ? eventRejectionReason : undefined,
      });
      setShowEventModal(false);
      setSelectedEvent(null);
      setEventAction(null);
      setEventRejectionReason("");
      showSuccess(
        eventAction === "approve"
          ? "Tədbir uğurla təsdiqləndi."
          : "Tədbir uğurla rədd edildi.",
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : "Moderasiya əməliyyatını tamamlamaq mümkün olmadı.");
    }
  };

  const handleEventPageChange = (page: number) => {
    setEventPage(page);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteMutation.mutateAsync(eventId);
      showSuccess("Tədbir uğurla silindi.");
      setDeleteConfirmEvent(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Tədbiri silmək alınmadı");
    }
  };

  const isProcessing = moderationMutation.isPending || deleteMutation.isPending;

  if (eventsQuery.isLoading) {
    return <LoadingState text={"İdarəetmə paneli yüklənir..."} />;
  }

  if (eventsQuery.isError) {
    return (
      <AdminListLayout title="Tədbir İdarəetməsi" description="Tədbir təqdimatlarını moderasiya edin və statuslarını idarə edin.">
        <div className="py-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {eventsQuery.error instanceof Error
              ? eventsQuery.error.message
              : "Tədbirləri yükləmək mümkün olmadı."}
          </div>
        </div>
      </AdminListLayout>
    );
  }

  return (
    <AdminListLayout title="Tədbir İdarəetməsi" description="Tədbir təqdimatlarını moderasiya edin və statuslarını idarə edin.">
      <div className="py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-yellow-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {"Gözləmədə"}
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {eventStats.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="border-l-4 border-l-green-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {"Təsdiqlənmiş"}
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {eventStats.approved}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="border-l-4 border-l-red-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {"Rədd Edilmiş"}
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {eventStats.rejected}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          <Card className="border-l-4 border-l-blue-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {"Cəmi Tədbirlər"}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {eventStats.total}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  icon={Search}
                  placeholder={
                    "Başlıq, təşkilat və ya təsvir üzrə tədbir axtar..."
                  }
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                label="Növ"
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Bütün növlər' },
                  ...EVENT_TYPE_VALUES.map((type) => ({ value: type, label: EVENT_TYPE_LABELS[type] })),
                ]}
                variant="default"
              />
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Bütün Statuslar' },
                  { value: 'pending', label: 'Gözləmədə' },
                  { value: 'approved', label: 'Təsdiqlənmiş' },
                  { value: 'rejected', label: 'Rədd Edilmiş' },
                ]}
              />
              <Select
                label="Məkan"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Bütün məkanlar' },
                  { value: 'online', label: 'Onlayn/Hibrid' },
                  { value: 'physical', label: 'Fiziki/Hibrid' },
                  ...AZERBAIJAN_CITIES.map((city) => ({ value: city, label: city })),
                ]}
              />
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="px-3 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-slate-900"
                aria-label="Tarixdən"
              />
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="px-3 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-slate-900"
                aria-label="Tarixə"
              />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              {"Tədbir Təqdimləri"}
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {events.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">
                  {"Tədbir tapılmadı"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {"Filterlərə uyğun tədbir təqdimatı yoxdur."}
                </p>
              </div>
            ) : (
              events.map((event) => {
                const status = event.status || "pending";
                return (
                  <div
                    key={event._id}
                    className="px-6 py-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              status === "approved"
                                ? "bg-green-100 text-green-800"
                                : status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {status === "approved" ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : status === "rejected" ? (
                              <XCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {status === "approved"
                              ? "Təsdiqlənmiş"
                              : status === "rejected"
                                ? "Rədd Edilmiş"
                                : "Gözləmədə"}
                          </span>
                          <Badge variant="primary" size="sm" className="capitalize">
                            {EVENT_TYPE_LABELS[event.eventType as EventTypeValue] || event.eventType || "Tədbir"}
                          </Badge>
                          <Badge variant="primary" size="sm">
                            {event.category}
                          </Badge>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-1">
                          {event.title}
                        </h4>
                        <p className="text-sm text-slate-600 mb-2">
                          {event.description?.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>
                            {"Təşkilatçı"}:{" "}
                            {event.organizationName || "Naməlum"}
                          </span>
                          <span>•</span>
                          <span>
                            {"Tarix"}:{" "}
                            {new Date(event.eventDate).toLocaleDateString()}
                          </span>
                          {event.endDate && (
                            <>
                              <span>-</span>
                              <span>
                                {new Date(event.endDate).toLocaleDateString()}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            {"Yer"}:{" "}
                            {event.location?.type || "Naməlum məkan"}
                          </span>
                        </div>
                        {event.adminComment && status === "rejected" && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-700">
                              <strong>{"İdarəçi şərhi"}:</strong>{" "}
                              {event.adminComment}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          onClick={() => handleEventAction(event, "approve")}
                          variant="primary"
                          size="sm"
                          className="inline-flex items-center text-xs"
                          disabled={isProcessing || status === "approved"}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {"Təsdiq Et"}
                        </Button>
                        <Button
                          onClick={() => handleEventAction(event, "reject")}
                          variant="danger"
                          size="sm"
                          className="inline-flex items-center text-xs"
                          disabled={isProcessing || status === "rejected"}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          {"Rədd Et"}
                        </Button>
                        <Button
                          onClick={() =>
                            window.open(
                              localePath(`/admin/preview/events/${event._id}`),
                              "_blank",
                            )
                          }
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center text-xs"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {"Bax"}
                        </Button>
                        {status !== "pending" && (
                          <Button
                            onClick={() => setDeleteConfirmEvent(event)}
                            variant="danger"
                            size="sm"
                            className="inline-flex items-center text-xs"
                            disabled={isProcessing}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {"Sil"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {eventPagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">
                  {"Səhifə"} {eventPagination.page} {"/"}{" "}
                  {eventPagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      handleEventPageChange(eventPagination.page - 1)
                    }
                    disabled={eventPagination.page === 1}
                    variant="secondary"
                    size="sm"
                  >
                    {"Əvvəlki"}
                  </Button>
                  <Button
                    onClick={() =>
                      handleEventPageChange(eventPagination.page + 1)
                    }
                    disabled={eventPagination.page === eventPagination.totalPages}
                    variant="secondary"
                    size="sm"
                  >
                    {"Növbəti"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {showEventModal && selectedEvent && (
        <Modal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          title={eventAction === "approve" ? "Tədbiri Təsdiqlə" : "Tədbiri Rədd Et"}
          size="lg"
        >

              <div className="space-y-4">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {eventAction === "approve"
                    ? "Bu tədbiri təsdiqləmək istədiyinizə əminsiniz?"
                    : "Bu tədbiri rədd etmək istədiyinizə əminsiniz?"}
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-semibold text-slate-900 mb-2">
                    {selectedEvent.title}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">
                        {"Kateqoriya"}:
                      </span>
                      <span className="ml-2 text-slate-600">
                        {selectedEvent.category}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">
                        {"Yaradan"}:
                      </span>
                      <span className="ml-2 text-slate-600">
                        {selectedEvent.organizationName || "Naməlum"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">
                        {"Başlama Tarixi"}:
                      </span>
                      <span className="ml-2 text-slate-600">
                        {new Date(
                          selectedEvent.eventDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">
                        {"Yer"}:
                      </span>
                      <span className="ml-2 text-slate-600">
                        {selectedEvent.location?.type || "Naməlum"}
                      </span>
                    </div>
                  </div>
                </div>

                {eventAction === "reject" && (
                  <div>
                    <TextArea
                      label={"Rədd etmə səbəbi (mütləq)"}
                      value={eventRejectionReason}
                      onChange={(e) => setEventRejectionReason(e.target.value)}
                      placeholder={
                        "Zəhmət olmasa bu tədbiri rədd etmək üçün ətraflı şərh daxil edin..."
                      }
                      rows={4}
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEventModal(false)}
                  >
                    {"Ləğv Et"}
                  </Button>
                  <Button
                    onClick={executeEventAction}
                    disabled={
                      isProcessing ||
                      (eventAction === "reject" &&
                        !eventRejectionReason.trim())
                    }
                    variant={eventAction === "reject" ? "danger" : "primary"}
                    size="sm"
                  >
                    {isProcessing
                      ? "Emal olunur..."
                      : eventAction === "approve"
                        ? "Tədbiri Təsdiqlə"
                        : "Tədbiri Rədd Et"}
                  </Button>
                </div>
              </div>
        </Modal>
      )}

      <AdminActionModal
        isOpen={Boolean(deleteConfirmEvent)}
        onClose={() => setDeleteConfirmEvent(null)}
        title="Tədbiri sil"
        description={
          deleteConfirmEvent
            ? `\"${deleteConfirmEvent.title}\" tədbirini həmişəlik silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmır.`
            : "Bu əməliyyat geri qaytarılmır."
        }
        actions={[
          {
            label: "Sil",
            variant: "danger",
            loading: deleteMutation.isPending,
            disabled: deleteMutation.isPending || !deleteConfirmEvent,
            onClick: async () => {
              if (!deleteConfirmEvent?._id) return;
              await handleDeleteEvent(deleteConfirmEvent._id);
            },
          },
        ]}
      />
    </AdminListLayout>
  );
}
