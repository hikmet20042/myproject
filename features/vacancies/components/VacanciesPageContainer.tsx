"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Plus, Search } from "lucide-react";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/feedback";
import VacanciesSection from "@/features/vacancies/components/VacanciesSection";
import VacancyDeleteDialog from "@/features/vacancies/components/VacancyDeleteDialog";
import type { VacancyItem } from "@/features/vacancies/types/items";
import { useDashboardVacancyData } from "@/components/containers/DashboardVacancyDataContainer";
import {
  renderSectionByState,
  resolveSectionState,
  SectionErrorInline,
  SectionLoading,
  useRefreshVisibility,
} from "@/features/ui-state";
import {
  statusOptions,
} from "@/features/vacancies/types/items";

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
  } = useDashboardVacancyData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
        setFeedbackMessage("Vakansiya uğurla silindi.");
        setDeleteModalOpen(false);
        setVacancyToDelete(null);
      } else {
        setFeedbackVariant("error");
        setFeedbackMessage("Vakansiyanı silmək mümkün olmadı. Zəhmət olmasa yenidən cəhd edin.");
      }
    } catch {
      setFeedbackVariant("error");
      setFeedbackMessage("Vakansiya silinərkən xəta baş verdi.");
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

    return matchesSearch && matchesStatus;
  });

  const sectionState = resolveSectionState({
    dataState:
      vacanciesLoading && vacancies.length === 0
        ? "loading"
        : filteredVacancies.length === 0
          ? searchTerm.trim().length > 0 ||
            statusFilter !== "all"
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
        <VacanciesSection
          vacancies={vacancies}
          filteredVacancies={filteredVacancies}
          onRequestDelete={handleDeleteRequest}
        />
      ),
      "empty-filtered": () => (
        <VacanciesSection
          vacancies={vacancies}
          filteredVacancies={filteredVacancies}
          onRequestDelete={handleDeleteRequest}
        />
      ),
      content: () => (
        <VacanciesSection
          vacancies={vacancies}
          filteredVacancies={filteredVacancies}
          onRequestDelete={handleDeleteRequest}
        />
      ),
    });

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-100 text-cyan-700">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Vakansiyalarınız</h1>
            <p className="mt-1 text-sm text-slate-600">
              Paylaşdığınız vakansiyaları idarə edin və izləyin.
            </p>
          </div>
        </div>
        <Link href={localePath("/dashboard/vacancies/create")}>
          <Button variant="primary" size="sm" icon={Plus} className="rounded-xl">
            Vakansiya yarat
          </Button>
        </Link>
      </Card>

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
              Filtrlər
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <Input
                placeholder={"Vakansiya adı və ya təşkilat adı axtar."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 border-slate-200 bg-white pl-7"
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
