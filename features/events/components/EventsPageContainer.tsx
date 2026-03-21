"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Plus, Search } from "lucide-react";
import { useLocalizedPath } from "@/lib/useLocalizedPath";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/feedback";
import EventsList from "@/features/events/components/EventsList";
import EventDeleteDialog from "@/features/events/components/EventDeleteDialog";
import type { EventItem } from "@/features/events/components/types";
import { useDashboardData } from "@/features/dashboard/context/DashboardDataProvider";
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
  const EVENTS_STALE_MS = 2 * 60 * 1000;
  const localePath = useLocalizedPath();
  const {
    events,
    eventsLoading,
    eventsError,
    ensureFreshEvents,
    refreshEvents,
    removeEventById,
  } = useDashboardData();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackVariant, setFeedbackVariant] = useState<"success" | "error">("success");

  useEffect(() => {
    void ensureFreshEvents(EVENTS_STALE_MS);
  }, [ensureFreshEvents]);

  const handleDeleteRequest = (event: EventItem) => {
    setFeedbackMessage(null);
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/events/${eventToDelete._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        removeEventById(eventToDelete._id);
        setFeedbackVariant("success");
        setFeedbackMessage("Event deleted successfully.");
        setDeleteModalOpen(false);
        setEventToDelete(null);
      } else {
        setFeedbackVariant("error");
        setFeedbackMessage("Could not delete the event. Please try again.");
      }
    } catch {
      setFeedbackVariant("error");
      setFeedbackMessage("Something went wrong while deleting the event.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());

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
            void refreshEvents();
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

      {feedbackMessage && (
        <Alert
          variant={feedbackVariant}
          dismissible
          onDismiss={() => setFeedbackMessage(null)}
        >
          {feedbackMessage}
        </Alert>
      )}

      {sectionState === "error-nonblocking" && (
        <SectionErrorInline
          title="Tədbirlər yenilənmədi"
          message={eventsError || "Tədbirləri yeniləmək mümkün olmadı."}
          onRetry={() => {
            void refreshEvents();
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
