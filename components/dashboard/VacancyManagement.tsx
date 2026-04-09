"use client";

import { useState, useEffect } from "react";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";

interface Vacancy {
  _id: string;
  title: string;
  description: string;
  type: "job" | "volunteer" | "internship";
  category: string;
  workType: "remote" | "onsite" | "hybrid";
  location: {
    city?: string;
    country?: string;
    address?: string;
    isRemote: boolean;
  };
  experienceLevel: "entry" | "mid" | "senior" | "any";
  duration: {
    type: "permanent" | "contract" | "temporary";
    contractLength?: { value: number; unit: "months" | "years" };
  };
  compensation: {
    type: "paid" | "unpaid" | "stipend";
    amount?: number;
    currency?: string;
    period?: "hourly" | "monthly" | "yearly";
    benefits?: string[];
  };
  applicationProcess: {
    applicationLink?: string;
    email?: string;
    instructions: string;
    requiredDocuments: string[];
  };
  applicationDeadline: string;
  startDate?: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  skills: string[];
  languages?: string[];
  tags: string[];
  status: "pending" | "approved" | "rejected";
  adminComment?: string;
  approvedAt?: string;
  approvedBy?: string;
  isPublished: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: { _id: string; name: string; email: string };
}

const vacancyCategories = [
  "Program Management",
  "Communications & Media",
  "Fundraising & Development",
  "Research & Policy",
  "Education & Training",
  "Healthcare & Medical",
  "Legal & Advocacy",
  "Finance & Administration",
  "Technology & IT",
  "Human Resources",
  "Marketing & Outreach",
  "Project Coordination",
  "Field Work",
  "Volunteer Coordination",
  "Other",
];

// vacancyCategories is intentionally defined above; option labels are localized inside the component

export default function VacancyManagement() {
  const localePath = useLocalizedPath();
  const localizedStatusOptions = [
    { value: "all", label: "Bütün Statuslar" },
    { value: "pending", label: "Gözləmədə" },
    { value: "approved", label: "Təsdiqlənib" },
    { value: "rejected", label: "Rədd edilib" },
  ];

  const localizedCategoryOptions = [
    { value: "all", label: "Bütün Kateqoriyalar" },
    ...vacancyCategories.map((cat) => ({ value: cat, label: cat })),
  ];

  const localizedCompensationOptions = [
    { value: "all", label: "Bütün Növlər" },
    { value: "paid", label: "Ödənişli" },
    { value: "unpaid", label: "Ödənişsiz" },
    { value: "stipend", label: "Məvacib" },
  ];
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [compensationFilter, setCompensationFilter] = useState("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vacancyToDelete, setVacancyToDelete] = useState<Vacancy | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vacancies?author=me`);
      if (response.ok) {
        const data = await response.json();
        setVacancies(data.vacancies || data);
      }
    } catch (error) {
      console.error("Error fetching vacancies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vacancy: Vacancy) => {
    setVacancyToDelete(vacancy);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!vacancyToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/vacancies/${vacancyToDelete._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setVacancies(vacancies.filter((v) => v._id !== vacancyToDelete._id));
        setDeleteModalOpen(false);
        setVacancyToDelete(null);
      } else {
        console.error("Failed to delete vacancy");
      }
    } catch (error) {
      console.error("Error deleting vacancy:", error);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge
            variant="success"
            className="border border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            {"Təsdiqlənib"}
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="danger"
            className="border border-red-200 bg-red-50 text-red-700"
          >
            {"Rədd edilib"}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="warning"
            className="border border-amber-200 bg-amber-50 text-amber-700"
          >
            {"Gözləmədə"}
          </Badge>
        );
    }
  };

  const getCompensationBadge = (type: string, amount?: string) => {
    switch (type) {
      case "paid":
        return (
          <Badge
            variant="success"
            className="border border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            {amount ? `$${amount}` : "Ödənişli"}
          </Badge>
        );
      case "stipend":
        return (
          <Badge
            variant="secondary"
            className="border border-blue-200 bg-blue-50 text-blue-700"
          >
            {amount ? `$${amount} ${"Məvacib"}` : "Məvacib"}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="border border-slate-200 bg-slate-100 text-slate-700"
          >
            {"Ödənişsiz"}
          </Badge>
        );
    }
  };

  const getLocationBadge = (locationType: string) => {
    switch (locationType) {
      case "remote":
        return (
          <Badge
            variant="primary"
            className="border border-blue-200 bg-blue-50 text-blue-700"
          >
            {"Uzaqdan"}
          </Badge>
        );
      case "hybrid":
        return (
          <Badge
            variant="secondary"
            className="border border-cyan-200 bg-cyan-50 text-cyan-700"
          >
            {"Hibrid"}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="border border-slate-200 bg-slate-100 text-slate-700"
          >
            {"Ofisdə"}
          </Badge>
        );
    }
  };

  const filteredVacancies = vacancies.filter((vacancy) => {
    const matchesSearch =
      vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacancy.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Determine status based on approval fields
    const status = vacancy.status || "pending";
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || vacancy.category === categoryFilter;
    const matchesCompensation =
      compensationFilter === "all" ||
      vacancy.compensation.type === compensationFilter;

    return (
      matchesSearch && matchesStatus && matchesCategory && matchesCompensation
    );
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-100 text-cyan-700">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {"Vakansiya İdarəetməsi"}
            </h2>
            <p className="text-sm text-gray-600">
              {"Təşkilatınızın iş elanlarını idarə edin"}
            </p>
          </div>
        </div>
        <Link href={localePath("/dashboard/vacancies/create")}>
          <Button variant="primary" size="sm" icon={Plus} className="rounded-xl">
            {"Vakansiya yaradın"}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <CardContent padding="md" className="bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <Input
                placeholder={"Vakansiya adı və ya təşkilat adı axtar."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="indigo"
                className="h-12 border-blue-100 bg-white pl-10"
              />
            </div>
            <Select
              options={localizedStatusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder={"Statusa görə filtr"}
              variant="indigo"
              className="h-12 border-blue-100 bg-white"
            />
            <Select
              options={localizedCategoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder={"Kateqoriyaya görə filtr"}
              variant="indigo"
              className="h-12 border-blue-100 bg-white"
            />
            <Select
              options={localizedCompensationOptions}
              value={compensationFilter}
              onChange={(e) => setCompensationFilter(e.target.value)}
              placeholder={"Ödənişə görə filtr"}
              variant="indigo"
              className="h-12 border-blue-100 bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vacancies List */}
      {filteredVacancies.length === 0 ? (
        <Card className="overflow-hidden border border-slate-200 shadow-sm">
          <CardContent padding="md">
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-blue-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {"İmkan Tapılmadı"}
              </h3>
              <p className="text-gray-600 mb-4">
                {vacancies.length === 0
                  ? "Hələ vakansiya yaratmamısan."
                  : "Seçdiyiniz filtrə uyğun vakansiya yoxdur."}
              </p>
              {vacancies.length === 0 && (
                <Link href={localePath("/dashboard/vacancies/create")}>
                  <Button variant="primary" icon={Plus}>
                    {"İlk vakansiyanızı yaradın"}
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredVacancies.map((vacancy) => (
            <Card
              key={vacancy._id}
              className="border border-slate-200 bg-white shadow-sm"
            >
              <CardContent padding="md">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vacancy.title}
                      </h3>
                      {(() => {
                        const status = vacancy.status || "pending";
                        return getStatusIcon(status);
                      })()}
                      {(() => {
                        const status = vacancy.status || "pending";
                        return getStatusBadge(status);
                      })()}
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {vacancy.description}
                    </p>

                    <div className="mb-3 grid grid-cols-1 gap-3 text-sm text-gray-500 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-cyan-500" />
                        <span className="truncate">
                          {vacancy.location.city && vacancy.location.country
                            ? `${vacancy.location.city}, ${vacancy.location.country}`
                            : vacancy.location.city ||
                              vacancy.location.country ||
                              "Məkan dəqiqləşdiriləcək"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>{vacancy.duration.type}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span>
                          {(
                            {
                              paid: "Ödənişli",
                              unpaid: "Ödənişsiz",
                              stipend: "Məvacibli",
                            } as Record<string, string>
                          )[vacancy.compensation.type] ||
                            vacancy.compensation.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-indigo-500" />
                        <span>
                          {"Son tarix"}:{" "}
                          {new Date(
                            vacancy.applicationDeadline,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="border border-blue-200 bg-blue-50 text-blue-700"
                      >
                        {vacancy.category}
                      </Badge>
                      {getLocationBadge(vacancy.workType)}
                      {getCompensationBadge(
                        vacancy.compensation.type,
                        vacancy.compensation.amount?.toString(),
                      )}
                      {vacancy.tags.slice(0, 2).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="border border-cyan-200 bg-cyan-50 text-cyan-700"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {vacancy.tags.length > 2 && (
                        <Badge
                          variant="secondary"
                          className="border border-blue-100 bg-slate-100 text-gray-700"
                        >
                          +{vacancy.tags.length - 2} {"daha"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 lg:ml-4">
                    <Link
                      href={localePath(`/resources/vacancies/${vacancy._id}`)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        title={"Vakansiyaya bax"}
                        className="rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50"
                      />
                    </Link>
                    <Link
                      href={localePath(
                        `/dashboard/vacancies/${vacancy._id}/edit`,
                      )}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        title={"Vakansiyanı redaktə et"}
                        className="rounded-xl border border-transparent hover:border-cyan-200 hover:bg-cyan-50"
                      />
                    </Link>
                    <Button
                      onClick={() => handleDelete(vacancy)}
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      title={"Vakansiyanı sil"}
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
        title={"Vakansiyanı sil"}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {`"${vacancyToDelete?.title || ""}" vakansiyasını silmək istədiyinə əminsən? Bu əməliyyatı geri qaytarmaq mümkün deyil.`}
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
              {"Vakansiyanı sil"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
