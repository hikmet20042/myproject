"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Briefcase,
  CheckCircle,
  Clock,
  Eye,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageStateGuard } from "@/components/shared";
import AdminActionModal from "@/components/admin/AdminActionModal";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import AdminListLayout from "@/components/admin/AdminListLayout";

export default function VacanciesAdminPage() {
  const localePath = useLocalizedPath();
  const { showError, showSuccess } = useGlobalFeedback();
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contentSearch, setContentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vacancyStats, setVacancyStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [vacancyPagination, setVacancyPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [selectedVacancy, setSelectedVacancy] = useState<any | null>(null);
  const [showVacancyModal, setShowVacancyModal] = useState(false);
  const [vacancyAction, setVacancyAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [vacancyRejectionReason, setVacancyRejectionReason] = useState("");
  const [deleteConfirmVacancy, setDeleteConfirmVacancy] = useState<any | null>(
    null,
  );
  const [deletingVacancy, setDeletingVacancy] = useState(false);

  useEffect(() => {
    setLoading(true);
    loadVacancies().finally(() => setLoading(false));
  }, []);

  const loadVacancies = async () => {
    try {
      const params = new URLSearchParams({
        page: vacancyPagination.page.toString(),
        limit: vacancyPagination.limit.toString(),
        adminView: "true",
      });

      if (contentSearch.trim()) {
        params.append("search", contentSearch.trim());
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/vacancies?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVacancies(data.vacancies || []);
        setVacancyPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
          limit: data.limit || 10,
        });
        setVacancyStats({
          pending: data.stats?.pending || 0,
          approved: data.stats?.approved || 0,
          rejected: data.stats?.rejected || 0,
          total: data.stats?.total || 0,
        });
      }
    } catch (error) {
      console.error("Error loading vacancies:", error);
    }
  };

  const handleVacancyAction = (vacancy: any, action: "approve" | "reject") => {
    setSelectedVacancy(vacancy);
    setVacancyAction(action);
    setShowVacancyModal(true);
  };

  const executeVacancyAction = async () => {
    if (!selectedVacancy || !vacancyAction) return;
    setIsProcessing(true);

    try {
      const body: any = { action: vacancyAction };

      if (vacancyAction === "reject" && vacancyRejectionReason.trim()) {
        body.adminComment = vacancyRejectionReason.trim();
      }

      const response = await fetch(`/api/vacancies/${selectedVacancy._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowVacancyModal(false);
        setSelectedVacancy(null);
        setVacancyAction(null);
        setVacancyRejectionReason("");
        await loadVacancies();
      }
    } catch (error) {
      console.error("Error executing vacancy action:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVacancyPageChange = async (page: number) => {
    setVacancyPagination((prev) => ({ ...prev, page }));

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: vacancyPagination.limit.toString(),
        adminView: "true",
      });

      if (contentSearch.trim()) {
        params.append("search", contentSearch.trim());
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/vacancies?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVacancies(data.vacancies || []);
        setVacancyPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
          limit: data.limit || 10,
        });
        setVacancyStats({
          pending: data.stats?.pending || 0,
          approved: data.stats?.approved || 0,
          rejected: data.stats?.rejected || 0,
          total: data.stats?.total || 0,
        });
      }
    } catch (error) {
      console.error("Error loading vacancies:", error);
    }
  };

  const handleDeleteVacancy = async (vacancyId: string) => {
    setDeletingVacancy(true);
    try {
      const response = await fetch(`/api/vacancies/${vacancyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadVacancies();
        setDeleteConfirmVacancy(null);
        showSuccess("Vakansiya uğurla silindi.");
      } else {
        showError("Vakansiyanı silmək alınmadı");
      }
    } catch (error) {
      console.error("Error deleting vacancy:", error);
      showError("Vakansiyanı silmək alınmadı");
    } finally {
      setDeletingVacancy(false);
    }
  };

  return (
    <PageStateGuard
      isLoading={loading}
      isError={false}
      isEmpty={false}
      loadingText="İdarəetmə paneli yüklənir..."
    >
    <AdminListLayout title="Vakansiya İdarəetməsi" description="Vakansiya təqdimatlarını moderasiya edin və statuslarını idarə edin.">
      <div className="py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-yellow-500 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {"Gözləmədə"}
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {vacancyStats.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-green-500 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {"Təsdiqlənmiş"}
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {vacancyStats.approved}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-red-500 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {"Rədd Edilmiş"}
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {vacancyStats.rejected}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-blue-500 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {"Cəmi Vakansiyalar"}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {vacancyStats.total}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={
                    "Başlıq, təşkilat və ya təsvir üzrə vakansiya axtar..."
                  }
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
              >
                <option value="all">{"Bütün Statuslar"}</option>
                <option value="pending">{"Gözləmədə"}</option>
                <option value="approved">{"Təsdiqlənmiş"}</option>
                <option value="rejected">{"Rədd Edilmiş"}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {"Vakansiya Təqdimləri"}
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {vacancies.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {"Vakansiya tapılmadı"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {"Filterlərə uyğun vakansiya təqdimatı yoxdur."}
                </p>
              </div>
            ) : (
              vacancies.map((vacancy) => {
                const status = vacancy.status || "pending";
                return (
                  <div
                    key={vacancy._id}
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
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {vacancy.category}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {vacancy.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {vacancy.description?.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            {"Təşkilat"}:{" "}
                            {vacancy.organizationName || "Naməlum"}
                          </span>
                          <span>•</span>
                          <span>
                            {"Son Tarix"}:{" "}
                            {new Date(
                              vacancy.applicationDeadline,
                            ).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>
                            {vacancy.location?.isRemote
                              ? "Uzaqdan"
                              : `${vacancy.location?.city || ""} ${vacancy.location?.country || ""}`.trim() ||
                                "Məkan dəqiqləşdiriləcək"}
                          </span>
                          <span>•</span>
                          <span>
                            {vacancy.compensation?.type}:{" "}
                            {vacancy.compensation?.amount
                              ? `${vacancy.compensation.amount} ${vacancy.compensation.currency || ""}`
                              : "Göstərilməyib"}
                          </span>
                        </div>
                        {vacancy.adminComment && status === "rejected" && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-700">
                              <strong>{"İdarəçi şərhi"}:</strong>{" "}
                              {vacancy.adminComment}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {status === "pending" && (
                          <>
                            <Button
                              onClick={() =>
                                handleVacancyAction(vacancy, "approve")
                              }
                              variant="primary"
                              size="sm"
                              className="inline-flex items-center text-xs"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {"Təsdiq Et"}
                            </Button>
                            <Button
                              onClick={() =>
                                handleVacancyAction(vacancy, "reject")
                              }
                              variant="danger"
                              size="sm"
                              className="inline-flex items-center text-xs"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              {"Rədd Et"}
                            </Button>
                          </>
                        )}
                        <Button
                          onClick={() =>
                            window.open(
                              localePath(
                                `/admin/preview/vacancies/${vacancy._id}`,
                              ),
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
                            onClick={() => setDeleteConfirmVacancy(vacancy)}
                            variant="danger"
                            size="sm"
                            className="inline-flex items-center text-xs"
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

          {vacancyPagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {"Səhifə"} {vacancyPagination.page} {"/"}{" "}
                  {vacancyPagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      handleVacancyPageChange(vacancyPagination.page - 1)
                    }
                    disabled={vacancyPagination.page === 1}
                    variant="secondary"
                    size="sm"
                  >
                    {"Əvvəlki"}
                  </Button>
                  <Button
                    onClick={() =>
                      handleVacancyPageChange(vacancyPagination.page + 1)
                    }
                    disabled={
                      vacancyPagination.page === vacancyPagination.totalPages
                    }
                    variant="secondary"
                    size="sm"
                  >
                    {"Növbəti"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showVacancyModal && selectedVacancy && (
        <Dialog.Root
          open={showVacancyModal}
          onOpenChange={(open) => {
            if (!open) setShowVacancyModal(false);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  {vacancyAction === "approve"
                    ? "Vakansiyanı Təsdiqlə"
                    : "Vakansiyanı Rədd Et"}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </Button>
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {selectedVacancy.title}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        {"Kateqoriya"}:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {selectedVacancy.category}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        {"Təşkilat"}:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {selectedVacancy.organizationName || "Naməlum"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        {"Son Tarix"}:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {new Date(
                          selectedVacancy.applicationDeadline,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        {"Yer"}:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {selectedVacancy.location?.isRemote
                          ? "Uzaqdan"
                          : selectedVacancy.location?.city ||
                            selectedVacancy.location?.country ||
                            "Naməlum"}
                      </span>
                    </div>
                  </div>
                </div>

                {vacancyAction === "reject" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {"Rədd etmə səbəbi"} ({"mütləq"})
                    </label>
                    <textarea
                      value={vacancyRejectionReason}
                      onChange={(e) =>
                        setVacancyRejectionReason(e.target.value)
                      }
                      placeholder={
                        "Zəhmət olmasa bu vakansiyanı rədd etmək üçün ətraflı şərh daxil edin..."
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Dialog.Close asChild>
                    <Button variant="outline" size="sm">
                      {"Ləğv Et"}
                    </Button>
                  </Dialog.Close>
                  <Button
                    onClick={executeVacancyAction}
                    disabled={
                      isProcessing ||
                      (vacancyAction === "reject" &&
                        !vacancyRejectionReason.trim())
                    }
                    variant={vacancyAction === "reject" ? "danger" : "primary"}
                    size="sm"
                  >
                    {isProcessing
                      ? "Emal olunur..."
                      : vacancyAction === "approve"
                        ? "Vakansiyanı Təsdiqlə"
                        : "Vakansiyanı Rədd Et"}
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <AdminActionModal
        isOpen={Boolean(deleteConfirmVacancy)}
        onClose={() => setDeleteConfirmVacancy(null)}
        title="Vakansiyanı sil"
        description={
          deleteConfirmVacancy
            ? `\"${deleteConfirmVacancy.title}\" vakansiyasını həmişəlik silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmır.`
            : "Bu əməliyyat geri qaytarılmır."
        }
        actions={[
          {
            label: "Sil",
            variant: "danger",
            loading: deletingVacancy,
            disabled: deletingVacancy || !deleteConfirmVacancy,
            onClick: async () => {
              if (!deleteConfirmVacancy?._id) return;
              await handleDeleteVacancy(deleteConfirmVacancy._id);
            },
          },
        ]}
      />
    </AdminListLayout>
    </PageStateGuard>
  );
}
