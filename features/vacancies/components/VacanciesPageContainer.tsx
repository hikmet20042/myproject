"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Plus, Search } from "lucide-react";
import { useLocalizedPath } from "@/lib/useLocalizedPath";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/feedback";
import VacanciesList from "@/features/vacancies/components/VacanciesList";
import VacancyDeleteDialog from "@/features/vacancies/components/VacancyDeleteDialog";
import type { VacancyItem } from "@/features/vacancies/components/types";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
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
  compensationOptions,
} from "@/features/vacancies/components/types";

const VACANCIES_STALE_MS = 30_000;

export default function VacanciesPageContainer() {
  const localePath = useLocalizedPath();
  const {
    vacancies,
    vacanciesLoading,
    vacanciesError,
    ensureFreshVacancies,
    refreshVacancies,
    removeVacancyById,
  } = useDashboardData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [compensationFilter, setCompensationFilter] = useState("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vacancyToDelete, setVacancyToDelete] = useState<VacancyItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackVariant, setFeedbackVariant] = useState<"success" | "error">("success");

  useEffect(() => {
    void ensureFreshVacancies(VACANCIES_STALE_MS);
  }, [ensureFreshVacancies]);

  const handleDeleteRequest = (vacancy: VacancyItem) => {
    setFeedbackMessage(null);
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
        removeVacancyById(vacancyToDelete._id);
        setFeedbackVariant("success");
        setFeedbackMessage("Vacancy deleted successfully.");
        setDeleteModalOpen(false);
        setVacancyToDelete(null);
      } else {
        setFeedbackVariant("error");
        setFeedbackMessage("Could not delete the vacancy. Please try again.");
      }
    } catch {
      setFeedbackVariant("error");
      setFeedbackMessage("Something went wrong while deleting the vacancy.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredVacancies = vacancies.filter((vacancy) => {
    const matchesSearch =
      vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacancy.description.toLowerCase().includes(searchTerm.toLowerCase());

    const vacancyStatus = vacancy.status || "pending";
    const matchesStatus = statusFilter === "all" || vacancyStatus === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || vacancy.category === categoryFilter;
    const matchesCompensation =
      compensationFilter === "all" ||
      vacancy.compensation.type === compensationFilter;

    return (
      matchesSearch && matchesStatus && matchesCategory && matchesCompensation
    );
  });

  const sectionState = resolveSectionState({
    dataState:
      vacanciesLoading && vacancies.length === 0
        ? "loading"
        : filteredVacancies.length === 0
          ? searchTerm.trim().length > 0 ||
            statusFilter !== "all" ||
            categoryFilter !== "all" ||
            compensationFilter !== "all"
            ? "filtered-empty"
            : "empty"
          : "success",
    errorState: vacanciesError ? "present" : "none",
    isRefreshing: vacanciesLoading && vacancies.length > 0,
  });
  const showRefreshingNotice = useRefreshVisibility(sectionState === "loading-refresh");

  const renderSectionBody = () =>
    renderSectionByState(sectionState, {
      "error-blocking": () => (
        <SectionErrorInline
          framed
          title="Vakansiyaları yükləmək mümkün olmadı"
          message={vacanciesError || "Vakansiyaları yükləmək mümkün olmadı."}
          onRetry={() => {
            void refreshVacancies();
          }}
        />
      ),
      "loading-initial": () => <SectionLoading variant="list" rows={3} />,
      "empty-list": () => (
        <VacanciesList
          vacancies={vacancies}
          filteredVacancies={filteredVacancies}
          onRequestDelete={handleDeleteRequest}
        />
      ),
      "empty-filtered": () => (
        <VacanciesList
          vacancies={vacancies}
          filteredVacancies={filteredVacancies}
          onRequestDelete={handleDeleteRequest}
        />
      ),
      content: () => (
        <VacanciesList
          vacancies={vacancies}
          filteredVacancies={filteredVacancies}
          onRequestDelete={handleDeleteRequest}
        />
      ),
    });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-100 text-cyan-700">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Your Vacancies</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage and track the vacancies you've published.
            </p>
          </div>
        </div>
        <Link href={localePath("/dashboard/vacancies/create")}>
          <Button variant="primary" size="sm" icon={Plus} className="rounded-xl">
            Create Vacancy
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
          title="Vakansiyalar yenilənmədi"
          message={vacanciesError || "Vakansiyaları yeniləmək mümkün olmadı."}
          onRetry={() => {
            void refreshVacancies();
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <Input
                placeholder={"Vakansiya adı və ya təşkilat adı axtar."}
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
            <Select
              options={compensationOptions}
              value={compensationFilter}
              onChange={(e) => setCompensationFilter(e.target.value)}
              placeholder={"Ödənişə görə filtr"}
              variant="indigo"
              className="h-12 border-blue-100 bg-white"
              disabled={sectionState === "loading-initial"}
            />
          </div>
        </CardContent>
      </Card>

      {showRefreshingNotice && (
        <Alert variant="info" title="Vakansiyalar yenilənir">
          Son yenilənmiş məlumatlar göstərilir.
        </Alert>
      )}

      {renderSectionBody()}

      <VacancyDeleteDialog
        isOpen={deleteModalOpen}
        vacancyToDelete={vacancyToDelete}
        deleting={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirmDelete={confirmDelete}
      />
    </div>
  );
}
