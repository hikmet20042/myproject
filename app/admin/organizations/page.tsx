"use client";

import { useEffect, useState } from "react";
import { Modal } from '@/components/ui/Modal'
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
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/Textarea";
import { LoadingState } from "@/components/shared";
import AdminActionModal from "@/components/admin/AdminActionModal";
import { FOCUS_AREA_LABELS_AZ, ORGANIZATION_TYPE_LABELS } from "@/lib/organizationTypes";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import AdminListLayout from "@/components/admin/AdminListLayout";
import { Card } from "@/components/ui/Card";
import { Select } from '@/components/ui/Select'
import { SocialLink } from '@/components/ui'
import { Badge } from '@/components/ui/Badge'

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

  const unwrapPayload = (responseData: any) =>
    responseData && typeof responseData === "object" && "data" in responseData
      ? responseData.data
      : responseData;

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
        const responseData = await response.json();
        const data = unwrapPayload(responseData);
        setOrganizations(data.organizations || []);
        setOrganizationStats(
          data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 },
        );
        setOrganizationPagination({
          page: data.pagination?.currentPage || 1,
          totalPages: data.pagination?.totalPages || 1,
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
        const responseData = await response.json();
        const data = unwrapPayload(responseData);
        setOrganizations(data.organizations || []);
        setOrganizationStats(
          data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 },
        );
        setOrganizationPagination({
          page: data.pagination?.currentPage || 1,
          totalPages: data.pagination?.totalPages || 1,
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
          <Card className="border-l-4 border-l-yellow-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {"Gözləmədə"}
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {organizationStats.pending}
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
                  {organizationStats.approved}
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
                  {organizationStats.rejected}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          <Card className="border-l-4 border-l-blue-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {"Cəmi Təşkilatlar"}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {organizationStats.total}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  icon={Search}
                  placeholder={
                    "Ad, təşkilat və ya e-poçt ilə Təşkilat axtar..."
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
              {"Təşkilat Qeydiyyatları"}
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {organizations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Shield className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">
                  {"Təşkilat tapılmadı"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
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
                        <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">
                          {organization.organizationName}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">
                          {organization.email}
                        </p>
                        <p className="text-sm text-slate-700 mb-2 line-clamp-2">
                          {organization.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
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
            <div className="px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">
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
        </Card>
      </div>

      {showOrganizationDetailModal && selectedOrganization && (
        <Modal
          isOpen={showOrganizationDetailModal}
          onClose={() => setShowOrganizationDetailModal(false)}
          title="Təşkilat Qeydiyyat Məlumatları"
          size="xl"
          className="max-h-[90vh] overflow-y-auto"
        >
              <div className="space-y-6">
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
                  <h4 className="text-2xl font-bold text-slate-900 mb-2">
                    {selectedOrganization.organizationName}
                  </h4>
                </div>

                <div className="bg-gray-50 rounded-md p-4 space-y-3">
                  <h5 className="font-semibold text-slate-900 mb-3">
                    {"Əlaqə Məlumatları"}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">
                        {"E-poçt"}:
                      </span>
                      <p className="text-slate-600">
                        {selectedOrganization.email}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">
                        {"Əlaqə Şəxsi"}:
                      </span>
                      <p className="text-slate-600">
                        {selectedOrganization.contactPerson.name}
                      </p>
                    </div>
                    {selectedOrganization.contactPerson.position && (
                      <div>
                        <span className="font-medium text-slate-700">
                          {"Vəzifə"}:
                        </span>
                        <p className="text-slate-600">
                          {selectedOrganization.contactPerson.position}
                        </p>
                      </div>
                    )}
                    {selectedOrganization.contactPhone && (
                      <div>
                        <span className="font-medium text-slate-700">
                          {"Telefon"}:
                        </span>
                        <p className="text-slate-600">
                          {selectedOrganization.contactPhone}
                        </p>
                      </div>
                    )}
                    {selectedOrganization.contactPerson.phone && (
                      <div>
                        <span className="font-medium text-slate-700">
                          {"Əlaqə Telefonu"}:
                        </span>
                        <p className="text-slate-600">
                          {selectedOrganization.contactPerson.phone}
                        </p>
                      </div>
                    )}
                    {selectedOrganization.contactPerson.email &&
                      selectedOrganization.contactPerson.email !==
                        selectedOrganization.email && (
                        <div>
                          <span className="font-medium text-slate-700">
                            {"Əlaqə E-poçtu"}:
                          </span>
                          <p className="text-slate-600">
                            {selectedOrganization.contactPerson.email}
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-slate-900 mb-2">
                    {"Təsvir"}
                  </h5>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedOrganization.description}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-md p-4 space-y-3">
                  <h5 className="font-semibold text-slate-900 mb-3">
                    {"Təşkilat Məlumatları"}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {selectedOrganization.website && (
                      <div>
                        <span className="font-medium text-slate-700">
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
                        <span className="font-medium text-slate-700">
                          {"Ünvan"}:
                        </span>
                        <p className="text-slate-600">
                          {selectedOrganization.address}
                        </p>
                      </div>
                    )}
                    {selectedOrganization.registrationNumber && (
                      <div>
                        <span className="font-medium text-slate-700">
                          {"Qeydiyyat Nömrəsi"}:
                        </span>
                        <p className="text-slate-600">
                          {selectedOrganization.registrationNumber}
                        </p>
                      </div>
                    )}
                    {selectedOrganization.organizationType && (
                      <div>
                        <span className="font-medium text-slate-700">
                          {"Təşkilat növü"}:
                        </span>
                        <p className="text-slate-600">
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
                      <h5 className="font-semibold text-slate-900 mb-3">
                        {"Fəaliyyət Sahələri"}
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedOrganization.focusAreas.map(
                          (area: string, index: number) => (
                            <Badge
                              key={index}
                              variant="primary"
                              size="md"
                            >
                              {FOCUS_AREA_LABELS_AZ[area as keyof typeof FOCUS_AREA_LABELS_AZ] || area}
                            </Badge>
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
                      <h5 className="font-semibold text-slate-900 mb-3">
                        {"Sosial Media"}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {[
                          { key: 'facebook', platform: 'facebook' as const, url: selectedOrganization.socialMedia.facebook },
                          { key: 'twitter', platform: 'twitter' as const, url: selectedOrganization.socialMedia.twitter },
                          { key: 'instagram', platform: 'instagram' as const, url: selectedOrganization.socialMedia.instagram },
                          { key: 'linkedin', platform: 'linkedin' as const, url: selectedOrganization.socialMedia.linkedin },
                          { key: 'youtube', platform: 'youtube' as const, url: selectedOrganization.socialMedia.youtube },
                        ].map(({ key, platform, url }) => url ? (
                          <SocialLink key={key} platform={platform} href={url} variant="compact" />
                        ) : null)}
                      </div>
                    </div>
                  )}

                {selectedOrganization.adminComment &&
                  selectedOrganization.status === "rejected" && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <h5 className="font-semibold text-red-900 mb-2">
                        {"İdarəçi şərhi"}
                      </h5>
                      <p className="text-red-700 text-sm">
                        {selectedOrganization.adminComment}
                      </p>
                    </div>
                  )}

                <div className="border-t pt-4 text-xs text-slate-500 space-y-1">
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
                <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-gray-50">
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
        </Modal>
      )}

      {showOrganizationModal && selectedOrganization && (
        <Modal
          isOpen={showOrganizationModal}
          onClose={() => setShowOrganizationModal(false)}
          title={
            organizationAction === "approve"
              ? "Qeydiyyatı Təsdiqlə"
              : "Qeydiyyatı Rədd Et"
          }
          size="sm"
          className="max-h-[90vh] overflow-y-auto"
        >
              <div>
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    {selectedOrganization.organizationName}
                  </h4>
                  <p className="text-sm text-slate-600 mb-2">
                    {"Əlaqə"}: {selectedOrganization.contactPerson.name} (
                    {selectedOrganization.email})
                  </p>
                  <p className="text-sm text-slate-700 mb-3">
                    {selectedOrganization.description}
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-xs text-slate-500">
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
                        <p className="text-xs text-slate-500 mb-1">
                          {"Fəaliyyət Sahələri"}:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedOrganization.focusAreas.map(
                            (area: string, index: number) => (
                              <Badge
                                key={index}
                                variant="primary"
                                size="sm"
                              >
                                {FOCUS_AREA_LABELS_AZ[area as keyof typeof FOCUS_AREA_LABELS_AZ] || area}
                              </Badge>
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
                    <TextArea
                      label={"İdarəçi şərhi (mütləq)"}
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder={"Rədd etmə səbəbi..."}
                      rows={4}
                      required
                    />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOrganizationModal(false)}
                  >
                    {"Ləğv Et"}
                  </Button>
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
        </Modal>
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
