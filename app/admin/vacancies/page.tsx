"use client";

import { useEffect, useState } from "react";
import { Modal } from '@/components/ui/Modal'
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
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/Textarea";
import { PageStateGuard } from "@/components/shared";
import AdminActionModal from "@/components/admin/AdminActionModal";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import AdminListLayout from "@/components/admin/AdminListLayout";
import { Card } from "@/components/ui/Card";
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'

const getTypeLabel = (type?: string) => {
  if (type === "full_time") return "Tam ştat";
  if (type === "part_time") return "Yarım ştat";
  if (type === "volunteer") return "Könüllü";
  if (type === "intern") return "Intern";
  return "Naməlum";
};

const getLocationLabel = (vacancy: any) => {
  const city = vacancy?.city;
  const address = vacancy?.address;
  if (city && address) return `${city}, ${address}`;
  if (city) return city;
  return "Məkan dəqiqləşdiriləcək";
};

const getPaymentLabel = (vacancy: any) => {
  if (!vacancy?.isPaid) return "Ödənişsiz";
  if (vacancy?.paymentMode === "fixed") {
    return `${vacancy?.paymentAmount || 0} AZN`;
  }
  if (vacancy?.paymentMode === "range") {
    return `${vacancy?.paymentMin || 0} - ${vacancy?.paymentMax || 0} AZN`;
  }
  return "Ödənişli";
};

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

  const unwrapPayload = (responseData: any) =>
    responseData && typeof responseData === "object" && "data" in responseData
      ? responseData.data
      : responseData;

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
        const responseData = await response.json();
        const data = unwrapPayload(responseData);
        setVacancies(data.vacancies || []);
        setVacancyPagination({
          page: data.pagination?.currentPage || data.page || 1,
          totalPages:
            data.pagination?.totalPages || data.pagination?.pages || data.totalPages || 1,
          total:
            data.pagination?.totalVacancies || data.pagination?.total || data.total || 0,
          limit: data.pagination?.limit || data.limit || 10,
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
        body.rejectionReason = vacancyRejectionReason.trim();
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
        const responseData = await response.json();
        const data = unwrapPayload(responseData);
        setVacancies(data.vacancies || []);
        setVacancyPagination({
          page: data.pagination?.currentPage || data.page || 1,
          totalPages:
            data.pagination?.totalPages || data.pagination?.pages || data.totalPages || 1,
          total:
            data.pagination?.totalVacancies || data.pagination?.total || data.total || 0,
          limit: data.pagination?.limit || data.limit || 10,
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
          <Card className="border-l-4 border-l-yellow-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {"Gözləmədə"}
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {vacancyStats.pending}
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
                  {vacancyStats.approved}
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
                  {vacancyStats.rejected}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          <Card className="border-l-4 border-l-blue-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {"Cəmi Vakansiyalar"}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {vacancyStats.total}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-500" />
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
                    "Başlıq, təşkilat və ya təsvir üzrə vakansiya axtar..."
                  }
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2">
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
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              {"Vakansiya Təqdimləri"}
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {vacancies.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">
                  {"Vakansiya tapılmadı"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
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
                          <Badge variant="primary" size="sm">
                            {getTypeLabel(vacancy.type)}
                          </Badge>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-1">
                          {vacancy.title}
                        </h4>
                        <p className="text-sm text-slate-600 mb-2">
                          {vacancy.description?.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
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
                            {getLocationLabel(vacancy)}
                          </span>
                          <span>•</span>
                          <span>{getPaymentLabel(vacancy)}</span>
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
            <div className="px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">
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
        </Card>
      </div>

      {showVacancyModal && selectedVacancy && (
        <Modal
          isOpen={showVacancyModal}
          onClose={() => setShowVacancyModal(false)}
          title={
            vacancyAction === "approve"
              ? "Vakansiyanı Təsdiqlə"
              : "Vakansiyanı Rədd Et"
          }
          size="lg"
        >

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-semibold text-slate-900 mb-2">
                    {selectedVacancy.title}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">
                        {"Növ"}:
                      </span>
                      <span className="ml-2 text-slate-600">
                        {getTypeLabel(selectedVacancy.type)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">
                        {"Təşkilat"}:
                      </span>
                      <span className="ml-2 text-slate-600">
                        {selectedVacancy.organizationName || "Naməlum"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">
                        {"Son Tarix"}:
                      </span>
                      <span className="ml-2 text-slate-600">
                        {new Date(
                          selectedVacancy.applicationDeadline,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">
                        {"Yer"}:
                      </span>
                      <span className="ml-2 text-slate-600">
                        {getLocationLabel(selectedVacancy)}
                      </span>
                    </div>
                  </div>
                </div>

                {vacancyAction === "reject" && (
                  <div>
                    <TextArea
                      label={"Rədd etmə səbəbi (mütləq)"}
                      value={vacancyRejectionReason}
                      onChange={(e) =>
                        setVacancyRejectionReason(e.target.value)
                      }
                      placeholder={
                        "Zəhmət olmasa bu vakansiyanı rədd etmək üçün ətraflı şərh daxil edin..."
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
                    onClick={() => setShowVacancyModal(false)}
                  >
                    {"Ləğv Et"}
                  </Button>
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
        </Modal>
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
