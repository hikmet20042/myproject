"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Building,
  CheckCircle,
  Clock,
  Eye,
  Search,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/shared";
import AdminActionModal from "@/components/admin/AdminActionModal";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/organizationTypes";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import AdminListLayout from "@/components/admin/AdminListLayout";

type Organization = {
  _id: string;
  organizationName: string;
  organizationType?: string;
  email: string;
  description: string;
  website?: string;
  contactPhone?: string;
  address?: string;
  registrationNumber?: string;
  focusAreas?: string[];
  status: "pending" | "approved" | "rejected";
  approvedAt?: string;
  approvedBy?: { _id: string; name: string; email: string };
  adminComment?: string;
  contactPerson: {
    name: string;
    email: string;
    phone?: string;
    position?: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export default function OrganizationsAdminPage() {
  const { showError, showSuccess } = useGlobalFeedback();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contentSearch, setContentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [organizationStats, setOrganizationStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [organizationPagination, setOrganizationPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const [showOrganizationDetailModal, setShowOrganizationDetailModal] =
    useState(false);
  const [organizationAction, setOrganizationAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [adminComment, setAdminComment] = useState("");
  const [deleteConfirmOrganization, setDeleteConfirmOrganization] = useState<
    Organization | null
  >(null);
  const [deletingOrganization, setDeletingOrganization] = useState(false);

  useEffect(() => {
    setLoading(true);
    loadOrganizations().finally(() => setLoading(false));
  }, []);

  const loadOrganizations = async () => {
    try {
      const params = new URLSearchParams({
        page: organizationPagination.page.toString(),
        limit: "20",
        ...(contentSearch && { search: contentSearch }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/admin/organizations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        setOrganizationStats(
          data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 },
        );
        setOrganizationPagination({
          page: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
        });
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
    }
  };

  const handleOrganizationAction = (
    organization: any,
    action: "approve" | "reject",
  ) => {
    setSelectedOrganization(organization);
    setOrganizationAction(action);
    setShowOrganizationModal(true);
  };

  const executeOrganizationAction = async () => {
    if (!selectedOrganization || !organizationAction) return;
    setIsProcessing(true);

    try {
      const body: any = {
        organizationId: selectedOrganization._id,
        action: organizationAction,
      };

      if (organizationAction === "reject" && adminComment.trim()) {
        body.rejectionReason = adminComment.trim();
      }

      const response = await fetch("/api/admin/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowOrganizationModal(false);
        setSelectedOrganization(null);
        setOrganizationAction(null);
        setAdminComment("");
        await loadOrganizations();
      }
    } catch (error) {
      console.error("Error executing organization action:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrganizationPageChange = async (page: number) => {
    setOrganizationPagination((prev) => ({ ...prev, page }));

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(contentSearch && { search: contentSearch }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/admin/organizations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        setOrganizationStats(
          data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 },
        );
        setOrganizationPagination({
          page: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
        });
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
    }
  };

  const handleDeleteOrganization = async (organizationId: string) => {
    setDeletingOrganization(true);
    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        await loadOrganizations();
        setDeleteConfirmOrganization(null);
        showSuccess("Təşkilat uğurla silindi");
      } else {
        showError("Təşkilatı silmək alınmadı");
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      showError("Təşkilatı silmək alınmadı");
    } finally {
      setDeletingOrganization(false);
    }
  };

  if (loading) {
    return <LoadingState text={"İdarəetmə paneli yüklənir..."} />;
  }

  return (
    <AdminListLayout title="Təşkilat İdarəetməsi" description="Təşkilat qeydiyyatlarını nəzərdən keçirin və moderasiya edin.">
      <div className="py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-yellow-500 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {"Gözləmədə"}
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {organizationStats.pending}
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
                  {organizationStats.approved}
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
                  {organizationStats.rejected}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-blue-500 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {"Cəmi Təşkilatlar"}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {organizationStats.total}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={
                    "Ad, təşkilat və ya e-poçt ilə Təşkilat axtar..."
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
              {"Təşkilat Qeydiyyatları"}
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {organizations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Shield className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {"Təşkilat tapılmadı"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {"Filterlərə uyğun Təşkilat qeydiyyatı yoxdur."}
                </p>
              </div>
            ) : (
              organizations.map((organization) => {
                const status = organization.status || "pending";
                return (
                  <div
                    key={organization._id}
                    className="px-6 py-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
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
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                          {organization.organizationName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {organization.email}
                        </p>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {organization.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {"Qeydiyyat tarixi"}:{" "}
                            {new Date(
                              organization.createdAt,
                            ).toLocaleDateString()}
                          </span>
                          {organization.focusAreas &&
                            organization.focusAreas.length > 0 && (
                              <span>
                                {organization.focusAreas.length}{" "}
                                {"Fəaliyyət Sahələri"}
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          onClick={() => {
                            setSelectedOrganization(organization);
                            setShowOrganizationDetailModal(true);
                          }}
                          variant="secondary"
                          size="sm"
                          className="inline-flex items-center whitespace-nowrap"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {"Ətraflı Bax"}
                        </Button>
                        {status === "pending" && (
                          <>
                            <Button
                              onClick={() =>
                                handleOrganizationAction(
                                  organization,
                                  "approve",
                                )
                              }
                              variant="primary"
                              size="sm"
                              className="inline-flex items-center whitespace-nowrap"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {"Təsdiq Et"}
                            </Button>
                            <Button
                              onClick={() =>
                                handleOrganizationAction(
                                  organization,
                                  "reject",
                                )
                              }
                              variant="danger"
                              size="sm"
                              className="inline-flex items-center whitespace-nowrap"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {"Rədd Et"}
                            </Button>
                          </>
                        )}
                        {status !== "pending" && (
                          <Button
                            onClick={() => setDeleteConfirmOrganization(organization)}
                            variant="danger"
                            size="sm"
                            className="inline-flex items-center whitespace-nowrap"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
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

          {organizationPagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {"Səhifə"} {organizationPagination.page} {"/"}{" "}
                  {organizationPagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      handleOrganizationPageChange(
                        organizationPagination.page - 1,
                      )
                    }
                    disabled={organizationPagination.page === 1}
                    variant="secondary"
                    size="sm"
                  >
                    {"Əvvəlki"}
                  </Button>
                  <Button
                    onClick={() =>
                      handleOrganizationPageChange(
                        organizationPagination.page + 1,
                      )
                    }
                    disabled={
                      organizationPagination.page ===
                      organizationPagination.totalPages
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

      {showOrganizationDetailModal && selectedOrganization && (
        <Dialog.Root
          open={showOrganizationDetailModal}
          onOpenChange={(open) => {
            if (!open) setShowOrganizationDetailModal(false);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white shadow-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  {"Təşkilat Qeydiyyat Məlumatları"}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </Dialog.Close>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedOrganization.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : selectedOrganization.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedOrganization.status === "approved" ? (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    ) : selectedOrganization.status === "rejected" ? (
                      <XCircle className="w-4 h-4 mr-1" />
                    ) : (
                      <Clock className="w-4 h-4 mr-1" />
                    )}
                    {selectedOrganization.status === "approved"
                      ? "Təsdiqlənmiş"
                      : selectedOrganization.status === "rejected"
                        ? "Rədd Edilmiş"
                        : "Gözləmədə"}
                  </span>
                </div>

                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedOrganization.organizationName}
                  </h4>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h5 className="font-semibold text-gray-900 mb-3">
                    {"Əlaqə Məlumatları"}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        {"E-poçt"}:
                      </span>
                      <p className="text-gray-600">
                        {selectedOrganization.email}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        {"Əlaqə Şəxsi"}:
                      </span>
                      <p className="text-gray-600">
                        {selectedOrganization.contactPerson.name}
                      </p>
                    </div>
                    {selectedOrganization.contactPerson.position && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Vəzifə"}:
                        </span>
                        <p className="text-gray-600">
                          {selectedOrganization.contactPerson.position}
                        </p>
                      </div>
                    )}
                    {selectedOrganization.contactPhone && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Telefon"}:
                        </span>
                        <p className="text-gray-600">
                          {selectedOrganization.contactPhone}
                        </p>
                      </div>
                    )}
                    {selectedOrganization.contactPerson.phone && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Əlaqə Telefonu"}:
                        </span>
                        <p className="text-gray-600">
                          {selectedOrganization.contactPerson.phone}
                        </p>
                      </div>
                    )}
                    {selectedOrganization.contactPerson.email &&
                      selectedOrganization.contactPerson.email !==
                        selectedOrganization.email && (
                        <div>
                          <span className="font-medium text-gray-700">
                            {"Əlaqə E-poçtu"}:
                          </span>
                          <p className="text-gray-600">
                            {selectedOrganization.contactPerson.email}
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">
                    {"Təsvir"}
                  </h5>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedOrganization.description}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h5 className="font-semibold text-gray-900 mb-3">
                    {"Təşkilat Məlumatları"}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {selectedOrganization.website && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Veb səhifə"}:
                        </span>
                        <a
                          href={selectedOrganization.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline block"
                        >
                          {selectedOrganization.website}
                        </a>
                      </div>
                    )}
                    {selectedOrganization.address && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Ünvan"}:
                        </span>
                        <p className="text-gray-600">
                          {selectedOrganization.address}
                        </p>
                      </div>
                    )}
                    {selectedOrganization.registrationNumber && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Qeydiyyat Nömrəsi"}:
                        </span>
                        <p className="text-gray-600">
                          {selectedOrganization.registrationNumber}
                        </p>
                      </div>
                    )}
                    {selectedOrganization.organizationType && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {"Təşkilat növü"}:
                        </span>
                        <p className="text-gray-600">
                          {ORGANIZATION_TYPE_LABELS[
                            selectedOrganization.organizationType as keyof typeof ORGANIZATION_TYPE_LABELS
                          ] || selectedOrganization.organizationType}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOrganization.focusAreas &&
                  selectedOrganization.focusAreas.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3">
                        {"Fəaliyyət Sahələri"}
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedOrganization.focusAreas.map(
                          (area: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                            >
                              {area}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {selectedOrganization.socialMedia &&
                  Object.values(selectedOrganization.socialMedia).some(
                    (val) => val,
                  ) && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3">
                        {"Sosial Media"}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {selectedOrganization.socialMedia.facebook && (
                          <a
                            href={selectedOrganization.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Facebook
                          </a>
                        )}
                        {selectedOrganization.socialMedia.twitter && (
                          <a
                            href={selectedOrganization.socialMedia.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Twitter
                          </a>
                        )}
                        {selectedOrganization.socialMedia.instagram && (
                          <a
                            href={selectedOrganization.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Instagram
                          </a>
                        )}
                        {selectedOrganization.socialMedia.linkedin && (
                          <a
                            href={selectedOrganization.socialMedia.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            LinkedIn
                          </a>
                        )}
                        {selectedOrganization.socialMedia.youtube && (
                          <a
                            href={selectedOrganization.socialMedia.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            YouTube
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                {selectedOrganization.adminComment &&
                  selectedOrganization.status === "rejected" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-semibold text-red-900 mb-2">
                        {"İdarəçi şərhi"}
                      </h5>
                      <p className="text-red-700 text-sm">
                        {selectedOrganization.adminComment}
                      </p>
                    </div>
                  )}

                <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
                  <p>
                    {"Qeydiyyat tarixi"}:{" "}
                    {new Date(
                      selectedOrganization.createdAt,
                    ).toLocaleDateString()}{" "}
                    {new Date(
                      selectedOrganization.createdAt,
                    ).toLocaleTimeString()}
                  </p>
                  {selectedOrganization.approvedAt && (
                    <p>
                      {"Təsdiq tarixi"}:{" "}
                      {new Date(
                        selectedOrganization.approvedAt,
                      ).toLocaleDateString()}{" "}
                      {new Date(
                        selectedOrganization.approvedAt,
                      ).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>

              {selectedOrganization.status === "pending" && (
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                  <Button
                    onClick={() => {
                      setShowOrganizationDetailModal(false);
                      handleOrganizationAction(selectedOrganization, "reject");
                    }}
                    variant="danger"
                    size="md"
                    className="inline-flex items-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {"Rədd Et"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowOrganizationDetailModal(false);
                      handleOrganizationAction(selectedOrganization, "approve");
                    }}
                    variant="primary"
                    size="md"
                    className="inline-flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {"Təsdiq Et"}
                  </Button>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {showOrganizationModal && selectedOrganization && (
        <Dialog.Root
          open={showOrganizationModal}
          onOpenChange={(open) => {
            if (!open) setShowOrganizationModal(false);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white shadow-md max-h-[90vh] overflow-y-auto">
              <Dialog.Description className="sr-only">
                Təşkilat qeydiyyatı üçün təsdiq və ya rədd qərarını idarə edin.
              </Dialog.Description>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  {organizationAction === "approve"
                    ? "Qeydiyyatı Təsdiqlə"
                    : "Qeydiyyatı Rədd Et"}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </Dialog.Close>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedOrganization.organizationName}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {"Əlaqə"}: {selectedOrganization.contactPerson.name} (
                    {selectedOrganization.email})
                  </p>
                  <p className="text-sm text-gray-700 mb-3">
                    {selectedOrganization.description}
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                    {selectedOrganization.website && (
                      <span>
                        {"Veb səhifə"}: {selectedOrganization.website}
                      </span>
                    )}
                    {selectedOrganization.contactPhone && (
                      <span>
                        {"Telefon"}: {selectedOrganization.contactPhone}
                      </span>
                    )}
                    {selectedOrganization.address && (
                      <span>{"Ünvan"}: {selectedOrganization.address}</span>
                    )}
                    {selectedOrganization.registrationNumber && (
                      <span>
                        {"Qeydiyyat Nömrəsi"}:{" "}
                        {selectedOrganization.registrationNumber}
                      </span>
                    )}
                  </div>
                  {selectedOrganization.focusAreas &&
                    selectedOrganization.focusAreas.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">
                          {"Fəaliyyət Sahələri"}:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedOrganization.focusAreas.map(
                            (area: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {area}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {organizationAction === "approve" && (
                  <div className="mb-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">
                            {"Qeydiyyatı Təsdiqlə"}
                          </h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>
                              {
                                "Təşkilat qeydiyyatını təsdiqləməzdən əvvəl məlumatları nəzərdən keçirin."
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {organizationAction === "reject" && (
                  <div className="mb-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <XCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            {"Qeydiyyatı Rədd Et"}
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>
                              {
                                "Təşkilatın təkmilləşdirməsinə kömək etmək üçün rədd səbəbini qeyd edin."
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {"İdarəçi şərhi"} ({"mütləq"})
                      </label>
                      <textarea
                        value={adminComment}
                        onChange={(e) => setAdminComment(e.target.value)}
                        placeholder={"Rədd etmə səbəbi..."}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Dialog.Close asChild>
                    <Button variant="outline" size="sm">
                      {"Ləğv Et"}
                    </Button>
                  </Dialog.Close>
                  <Button
                    onClick={executeOrganizationAction}
                    disabled={
                      isProcessing ||
                      (organizationAction === "reject" && !adminComment.trim())
                    }
                    variant={
                      organizationAction === "reject" ? "danger" : "primary"
                    }
                    size="sm"
                  >
                    {isProcessing
                      ? "Emal olunur..."
                      : organizationAction === "approve"
                        ? "Təsdiq Et"
                        : "Rədd Et"}
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <AdminActionModal
        isOpen={Boolean(deleteConfirmOrganization)}
        onClose={() => setDeleteConfirmOrganization(null)}
        title="Təşkilatı sil"
        description={
          deleteConfirmOrganization
            ? `\"${deleteConfirmOrganization.organizationName}\" qeydiyyatını həmişəlik silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmır.`
            : "Bu əməliyyat geri qaytarılmır."
        }
        actions={[
          {
            label: "Sil",
            variant: "danger",
            loading: deletingOrganization,
            disabled: deletingOrganization || !deleteConfirmOrganization,
            onClick: async () => {
              if (!deleteConfirmOrganization?._id) return;
              await handleDeleteOrganization(deleteConfirmOrganization._id);
            },
          },
        ]}
      />
    </AdminListLayout>
  );
}
