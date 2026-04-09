"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Plus, Search } from "lucide-react";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/feedback";
import EventsList from "@/features/events/components/EventsList";
import EventDeleteDialog from "@/features/events/components/EventDeleteDialog";
import type { EventItem } from "@/features/events/components/types";
import { useDeleteEvent, useEvents } from "@/lib/eventQueries";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import {
  renderSectionByState,
  resolveSectionState,
  SectionErrorInline,
  SectionLoading,
  useRefreshVisibility,
} from "@/features/ui-state";
import {
  statusOptions,
  categoryOptions,
} from "@/features/events/components/types";

export default function EventsPageContainer() {
  const localePath = useLocalizedPath();
  const { showSuccess, showError } = useGlobalFeedback();
  const eventsQuery = useEvents();
  const events = (eventsQuery.data || []) as EventItem[];
  const eventsLoading = eventsQuery.isLoading || eventsQuery.isFetching;
  const eventsError = eventsQuery.error instanceof Error ? eventsQuery.error.message : null;
  const deleteMutation = useDeleteEvent();
  useEffect(() => {
    if (deleteMutation.isSuccess) {
      showSuccess("Tədbir uğurla silindi.");
      setDeleteModalOpen(false);
      setEventToDelete(null);
      deleteMutation.reset();
    }
  }, [deleteMutation, deleteMutation.isSuccess, showSuccess]);

  useEffect(() => {
    if (deleteMutation.isError) {
      const message = deleteMutation.error instanceof Error
        ? deleteMutation.error.message
        : "Tədbiri silmək mümkün olmadı. Zəhmət olmasa yenidən cəhd edin.";
      showError(message);
      deleteMutation.reset();
    }
  }, [deleteMutation, deleteMutation.error, deleteMutation.isError, showError]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const handleDeleteRequest = (event: EventItem) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      setDeleting(true);
      await deleteMutation.mutateAsync(eventToDelete._id);
    } catch {
      showError("Tədbiri silmək zamanı xəta baş verdi.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const title = typeof event.title === "string" ? event.title : "";
    const description = typeof event.description === "string" ? event.description : "";
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "approved") {
      matchesStatus = event.status === "approved" && event.isPublished;
    } else if (statusFilter === "pending") {
      matchesStatus =
        event.status === "pending" ||
        (event.status === "approved" && !event.isPublished);
    } else if (statusFilter === "rejected") {
      matchesStatus = event.status === "rejected";
    }

    const matchesCategory =
      categoryFilter === "all" || event.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sectionState = resolveSectionState({
    dataState:
      eventsLoading && events.length === 0
        ? "loading"
        : filteredEvents.length === 0
          ? searchTerm.trim().length > 0 || statusFilter !== "all" || categoryFilter !== "all"
            ? "filtered-empty"
            : "empty"
          : "success",
    errorState: eventsError ? "present" : "none",
    isRefreshing: eventsLoading && events.length > 0,
  });
  const showRefreshingNotice = useRefreshVisibility(sectionState === "loading-refresh");

  const renderSectionBody = () =>
    renderSectionByState(sectionState, {
      "error-blocking": () => (
        <SectionErrorInline
          framed
          title="Tədbirləri yükləmək mümkün olmadı"
          message={eventsError || "Tədbirləri yükləmək mümkün olmadı."}
          onRetry={() => {
            void eventsQuery.refetch();
          }}
        />
      ),
      "loading-initial": () => <SectionLoading variant="list" rows={3} />,
      "empty-list": () => (
        <EventsList
          events={events}
          filteredEvents={filteredEvents}
          onRequestDelete={handleDeleteRequest}
        />
      ),
      "empty-filtered": () => (
        <EventsList
          events={events}
          filteredEvents={filteredEvents}
          onRequestDelete={handleDeleteRequest}
        />
      ),
      content: () => (
        <EventsList
          events={events}
          filteredEvents={filteredEvents}
          onRequestDelete={handleDeleteRequest}
        />
      ),
    });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-100 text-blue-700">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Your Events</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage and track the events you've created.
            </p>
          </div>
        </div>
        <Link href={localePath("/dashboard/events/create")}>
          <Button variant="primary" size="sm" icon={Plus} className="rounded-xl">
            Create Event
          </Button>
        </Link>
      </header>

      {sectionState === "error-nonblocking" && (
        <SectionErrorInline
          title="Tədbirlər yenilənmədi"
          message={eventsError || "Tədbirləri yeniləmək mümkün olmadı."}
          onRetry={() => {
            void eventsQuery.refetch();
          }}
        />
      )}

      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <CardContent padding="md" className="bg-white">
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Filters
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <Input
                placeholder={"Başlıq, təşkilatçı və ya təsvir üzrə axtar..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="indigo"
                className="h-12 border-blue-100 bg-white pl-7"
                disabled={sectionState === "loading-initial"}
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder={"Statusa görə filtr"}
              variant="indigo"
              className="h-12 border-blue-100 bg-white"
              disabled={sectionState === "loading-initial"}
            />
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder={"Kateqoriyaya görə filtr"}
              variant="indigo"
              className="h-12 border-blue-100 bg-white"
              disabled={sectionState === "loading-initial"}
            />
          </div>
        </CardContent>
      </Card>

      {showRefreshingNotice && (
        <Alert variant="info" title="Tədbirlər yenilənir">
          Son yenilənmiş məlumatlar göstərilir.
        </Alert>
      )}

      {renderSectionBody()}

      <EventDeleteDialog
        isOpen={deleteModalOpen}
        eventToDelete={eventToDelete}
        deleting={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirmDelete={confirmDelete}
      />
    </div>
  );
}
