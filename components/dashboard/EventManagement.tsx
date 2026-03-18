"use client";

import { useState, useEffect } from "react";
import { useLocalizedPath } from "@/lib/useLocalizedPath";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";

interface Event {
  _id: string;
  title: string;
  description: string;
  eventDate: string;
  endDate?: string;
  location: {
    type: "online" | "physical" | "hybrid";
    address?: string;
    city?: string;
    country?: string;
    onlineLink?: string;
  };
  category: string;
  eventType: string;
  maxParticipants?: number;
  applicationDeadline?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  tags: string[];
  status: "pending" | "approved" | "rejected";
  adminComment?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { _id: string; name: string; organizationName?: string };
}

const eventCategories = [
  "Workshop",
  "Conference",
  "Seminar",
  "Art Performance",
  "Cultural Event",
  "Fundraising",
  "Community Gathering",
  "Awareness Campaign",
  "Protest/Rally",
  "Educational Event",
  "Networking",
  "Celebration",
  "Other",
];

const statusOptions = [
  { value: "all", label: "Bütün statuslar" },
  { value: "pending", label: "Gözləmədə" },
  { value: "approved", label: "Təsdiqlənib" },
  { value: "rejected", label: "Rədd edilib" },
];

const categoryOptions = [
  { value: "all", label: "Bütün Kateqoriyalar" },
  ...eventCategories.map((cat) => ({ value: cat, label: cat })),
];

export default function EventManagement() {
  const localePath = useLocalizedPath();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events?author=me`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (event: Event) => {
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
        setEvents(events.filter((e) => e._id !== eventToDelete._id));
        setDeleteModalOpen(false);
        setEventToDelete(null);
      } else {
        console.error("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = (event: Event) => {
    if (event.status === "approved" && event.isPublished) {
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    } else if (event.status === "rejected") {
      return <XCircle className="h-4 w-4 text-rose-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (event: Event) => {
    if (event.status === "approved" && event.isPublished) {
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

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-100 text-blue-700">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {"Tədbir İdarəetməsi"}
            </h2>
            <p className="text-sm text-gray-600">
              {"Təşkilatınızın tədbirlərini idarə edin"}
            </p>
          </div>
        </div>
        <Link href={localePath("/dashboard/events/create")}>
          <Button variant="primary" size="sm" icon={Plus} className="rounded-xl">
            {"Tədbir yaradın"}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <CardContent padding="md" className="bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <Input
                placeholder={"Başlıq, təşkilatçı və ya təsvir üzrə axtar..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="indigo"
                className="h-12 border-blue-100 bg-white pl-10"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder={"Statusa görə filtr"}
              variant="indigo"
              className="h-12 border-blue-100 bg-white"
            />
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder={"Kateqoriyaya görə filtr"}
              variant="indigo"
              className="h-12 border-blue-100 bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card className="overflow-hidden border border-slate-200 shadow-sm">
          <CardContent padding="md">
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-blue-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {"Tədbir tapılmadı."}
              </h3>
              <p className="text-gray-600 mb-4">
                {events.length === 0
                  ? "Hələ tədbir yaratmamısan."
                  : "Seçdiyiniz filtrə uyğun tədbir yoxdur."}
              </p>
              {events.length === 0 && (
                <Link href={localePath("/dashboard/events/create")}>
                  <Button variant="primary" icon={Plus}>
                    {"İlk Tədbiri Yarat"}
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <Card
              key={event._id}
              className="border border-slate-200 bg-white shadow-sm"
            >
              <CardContent padding="md">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {event.title}
                      </h3>
                      {getStatusIcon(event)}
                      {getStatusBadge(event)}
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="grid grid-cols-1 gap-3 text-sm text-gray-500 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span>
                          {new Date(event.eventDate).toLocaleDateString()}
                        </span>
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
                      {event.maxParticipants && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-emerald-500" />
                          <span>
                            {"Maks"} {event.maxParticipants}
                          </span>
                        </div>
                      )}
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
                    <Link href={localePath(`/resources/events/${event._id}`)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        title={"Tədbirə bax"}
                        className="rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50"
                      />
                    </Link>
                    <Link
                      href={localePath(`/dashboard/events/${event._id}/edit`)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        title={"Tədbiri redaktə et"}
                        className="rounded-xl border border-transparent hover:border-cyan-200 hover:bg-cyan-50"
                      />
                    </Link>
                    <Button
                      onClick={() => handleDelete(event)}
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      title={"Tədbiri sil"}
                      className="rounded-xl border border-transparent text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={"Tədbiri sil"}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {`"${eventToDelete?.title || ""}" tədbirini silmək istədiyinə əminsən? Bu əməliyyatı geri qaytarmaq mümkün deyil.`}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              {"Ləğv et"}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>
              {"Tədbiri sil"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
