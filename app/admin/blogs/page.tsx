"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Filter, SortAsc, SortDesc } from "lucide-react";
import DOMPurify from "dompurify";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageStateGuard } from "@/components/shared";
import AdminListLayout from "@/components/admin/AdminListLayout";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import AdminActionModal from "@/components/admin/AdminActionModal";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import {
  adminConfig,
  AdminAction,
  BlogAdminItem,
} from "@/lib/admin-config";
import { useAdminActionExecutor } from "@/features/admin/hooks/useAdminActionExecutor";
import { useAdminRole } from "@/components/admin/AdminRoleProvider";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";

const BlocknoteReadOnly = dynamic(
  () => import("@/components/BlocknoteReadOnly"),
  { ssr: false },
);

const defaultFilters = {
  status: "all",
  search: "",
  author: "",
  dateFrom: "",
  dateTo: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const REJECTION_TEMPLATES = [
  "Məzmun keyfiyyəti yetərli deyil. Daha konkret faktlar və daha aydın struktur əlavə edin.",
  "Platforma qaydalarına uyğunluq problemi var. Zəhmət olmasa həssas məlumatları çıxarın.",
  "Formatlama problemi var. Başlıq/mətn axını və oxunaqlılığı yaxşılaşdırın.",
];

const getBlogStatusLabel = (blog: BlogAdminItem) => {
  const status = blog.status;
  const reviewedAt = (blog as any).reviewedAt || (blog as any).reviewed_at;
  const updatedAt = (blog as any).updatedAt || (blog as any).updated_at;
  const updateRequestFor = (blog as any)?.media?.updateRequestFor;

  if (updateRequestFor && status === "pending") return "yenilənmə sorğusu";
  if (status === "pending" && reviewedAt && updatedAt && updatedAt > reviewedAt) return "yenidən baxışda";
  return status;
};

export default function BlogsAdminPage() {
  const { showError, showInfo } = useGlobalFeedback();
  const [adminComment, setAdminComment] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<AdminAction<BlogAdminItem> | null>(
    null,
  );
  const [bulkComment, setBulkComment] = useState("");
  const [availableFilters, setAvailableFilters] = useState<{
    tags: string[];
    authors: Array<{ id: string; name: string }>;
  }>({ tags: [], authors: [] });
  const [showFilters, setShowFilters] = useState(false);

  const onResponse = useCallback((data: unknown) => {
    const payload = data as {
      data?: {
        filters?: { tags?: string[]; authors?: Array<{ id: string; name: string }> };
      };
    };
    setAvailableFilters({
      tags: payload.data?.filters?.tags || [],
      authors: payload.data?.filters?.authors || [],
    });
  }, []);

  const {
    data: blogs,
    loading,
    error,
    filters,
    setFilters,
    resetFilters,
    refresh,
    mutateData,
  } = useAdminList("blogs", {
    initialFilters: defaultFilters,
    initialPagination: { page: 1, limit: 50 },
    onResponse,
  });

  const statusFilter = (filters.status as string) || "all";
  const contentSearch = (filters.search as string) || "";
  const authorFilter = (filters.author as string) || "";
  const dateFromFilter = (filters.dateFrom as string) || "";
  const dateToFilter = (filters.dateTo as string) || "";
  const sortBy = (filters.sortBy as string) || "createdAt";
  const sortOrder = (filters.sortOrder as string) || "desc";
  const blogActions = adminConfig.blogs.actions;
  const { role: currentRole } = useAdminRole();
  const {
    modalState,
    setModalState,
    isActionLoading,
    executeAction,
  } = useAdminActionExecutor<BlogAdminItem>(currentRole, {
    onSuccess: refresh,
  });

  const selectedBlogs = useMemo(
    () => blogs.filter((blog) => selectedItems.includes(blog._id)),
    [blogs, selectedItems],
  );

  useEffect(() => {
    setSelectedItems((prev) =>
      prev.filter((id) => blogs.some((blog) => blog._id === id)),
    );
  }, [blogs]);

  const buildOptimisticContext = useCallback(
    (
      actionKey: string,
      targetIds: string[],
      comment?: string | null,
    ): {
      apply: () => void;
      rollback: () => void;
    } => {
      const previous = [...blogs];
      return {
        apply: () => {
          if (actionKey === blogActions.delete.key || actionKey === blogActions.bulkDelete.key) {
            mutateData((current) =>
              current.filter((item) => !targetIds.includes(item._id)),
            );
            return;
          }
          if (actionKey === blogActions.approve.key || actionKey === blogActions.bulkApprove.key) {
            mutateData((current) =>
              current.map((item) =>
                targetIds.includes(item._id)
                  ? {
                      ...item,
                      status: "approved",
                      adminComment: comment || undefined,
                    }
                  : item,
              ),
            );
            return;
          }
          if (actionKey === blogActions.reject.key || actionKey === blogActions.bulkReject.key) {
            mutateData((current) =>
              current.map((item) =>
                targetIds.includes(item._id)
                  ? {
                      ...item,
                      status: "rejected",
                      adminComment: comment || item.adminComment,
                    }
                  : item,
              ),
            );
          }
        },
        rollback: () => {
          mutateData(previous);
        },
      };
    },
    [blogActions, blogs, mutateData],
  );

  const handleBulkAction = useCallback((action: AdminAction<BlogAdminItem>) => {
    if (selectedItems.length === 0) return;
    setBulkAction(action);
    setShowBulkModal(true);
  }, [selectedItems.length]);

  const executeBulkAction = useCallback(async () => {
    if (!bulkAction || selectedBlogs.length === 0) return;

    const hasUpdateRequest = selectedBlogs.some(
      (item: any) => Boolean((item as any)?.media?.updateRequestFor),
    );
    if (
      hasUpdateRequest &&
      (bulkAction.key === blogActions.bulkApprove.key ||
        bulkAction.key === blogActions.bulkReject.key)
    ) {
      showInfo("Yenilənmə sorğuları üçün toplu təsdiq/rədd deaktivdir. Hər bloqu ayrıca yoxlayın.");
      return;
    }

    const normalizedComment = bulkComment.trim();
    await executeAction("blogs", bulkAction.key, selectedBlogs, {
      selectedItems: selectedBlogs.map((item) => item._id),
      adminComment: bulkAction.key === "bulkReject" ? normalizedComment : undefined,
      optimistic: buildOptimisticContext(
        bulkAction.key,
        selectedBlogs.map((item) => item._id),
        normalizedComment || null,
      ),
    });
    setShowBulkModal(false);
    setBulkAction(null);
    setBulkComment("");
    setSelectedItems([]);
  }, [
    bulkAction,
    bulkComment,
    buildOptimisticContext,
    executeAction,
    selectedBlogs,
  ]);

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.length === blogs.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(blogs.map((item) => item._id));
    }
  }, [blogs, selectedItems.length]);

  const clearFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const columns = useMemo<AdminTableColumn<BlogAdminItem>[]>(
    () => [
      {
        key: "select",
        header: (
          <input
            type="checkbox"
            checked={blogs.length > 0 && selectedItems.length === blogs.length}
            onChange={toggleSelectAll}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
        ),
        render: (blog) => (
          <input
            type="checkbox"
            checked={selectedItems.includes(blog._id)}
            onChange={() => toggleItemSelection(blog._id)}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
        ),
        className: "w-12",
        headerClassName: "w-12",
      },
      {
        key: "content",
        header: "Bloq",
        render: (blog) => {
          const author =
            typeof blog.author === "string" ? undefined : blog.author;
          const authorName =
            typeof blog.author === "string"
              ? blog.author
              : author?.name || author?.email;
          return (
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                    blog.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : blog.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                    {getBlogStatusLabel(blog)}
                </span>
                <span className="text-sm text-gray-500">
                  {"tərəfindən"}{" "}
                  {blog.isAnonymous ? (
                    "Anonim"
                  ) : (author as any)?.urlHandle ? (
                    <Link
                      href={`/u/${(author as any).urlHandle}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      target="_blank"
                    >
                      {authorName || "Naməlum"}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-700">{authorName || "Naməlum"}</span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(blog.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {blog.title}
              </h3>
              {blog.abstract && (
                <p className="text-sm text-gray-600 mb-2">{blog.abstract}</p>
              )}
              {blog.adminComment && (
                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    {"İdarəçi şərhi"}:
                  </p>
                  <p className="text-sm text-red-700">{blog.adminComment}</p>
                </div>
              )}
            </div>
          );
        },
      },
    ],
    [blogs.length, selectedItems, toggleItemSelection, toggleSelectAll],
  );

  const tableActions = useMemo(
    () => [
      {
        key: blogActions.preview.key,
      },
      {
        key: blogActions.review.key,
        show: (row: BlogAdminItem) => row.status === "pending",
      },
      {
        key: blogActions.delete.key,
        show: (row: BlogAdminItem) => row.status !== "pending",
        context: (row: BlogAdminItem) => ({
          optimistic: buildOptimisticContext(blogActions.delete.key, [row._id]),
        }),
      },
    ],
    [blogActions, buildOptimisticContext],
  );

  const activeBulkLoading = bulkAction
    ? isActionLoading(bulkAction.key, selectedBlogs)
    : false;

  return (
    <PageStateGuard
      isLoading={loading}
      isError={Boolean(error)}
      isEmpty={false}
      loadingText="İdarəetmə paneli yüklənir..."
      errorTitle="Bloqlar yüklənmədi"
      errorMessage={error || "Bloq siyahısını yükləmək alınmadı."}
      retryText="Yenidən cəhd et"
      onRetry={refresh}
    >
    <AdminListLayout title="Bloq İdarəetməsi" description="Bloq təqdimatlarını nəzərdən keçirin və statuslarını idarə edin.">
      <div className="py-6 space-y-6">
        <AdminFilters
          searchValue={contentSearch}
          onSearchChange={(value) => setFilters({ search: value })}
          searchPlaceholder={"Başlıq, məzmun və ya etiketlər üzrə bloq axtar..."}
          actions={
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="md"
              className="flex items-center gap-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              <Filter className="w-4 h-4" />
              {"Filterlər"}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </Button>
          }
        >
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {"Status"}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setFilters({ status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="all">{"Bütün Statuslar"}</option>
                  <option value="pending">{"Gözləmədə"}</option>
                  <option value="approved">{"Təsdiqlənmiş"}</option>
                  <option value="rejected">{"Rədd Edilmiş"}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {"Müəllif"}
                </label>
                <select
                  value={authorFilter}
                  onChange={(e) => setFilters({ author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">{"Bütün Müəlliflər"}</option>
                  {availableFilters.authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {"Sırala"}
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setFilters({ sortBy: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="createdAt">{"Tarix"}</option>
                    <option value="title">{"Başlıq"}</option>
                    <option value="author">{"Müəllif"}</option>
                  </select>
                  <Button
                    onClick={() =>
                      setFilters({
                        sortOrder: sortOrder === "asc" ? "desc" : "asc",
                      })
                    }
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all"
                  >
                    {sortOrder === "asc" ? (
                      <SortAsc className="w-4 h-4" />
                    ) : (
                      <SortDesc className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {"Tarix Aralığı"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setFilters({ dateFrom: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <span className="self-center text-gray-500">{"dən"}</span>
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setFilters({ dateTo: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="md"
                  className="w-full text-gray-600 border-gray-300 hover:border-red-500 hover:text-red-600 transition-all"
                >
                  {"Hamısını Təmizlə"}
                </Button>
              </div>
            </div>
          )}

          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mt-4">
              <span className="text-sm font-medium text-blue-800">
                {`${selectedItems.length} element seçildi`}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleBulkAction(blogActions.bulkApprove)}
                  variant="primary"
                  size="sm"
                  loading={isActionLoading(blogActions.bulkApprove.key, selectedBlogs)}
                  disabled={isActionLoading(blogActions.bulkApprove.key, selectedBlogs)}
                >
                  {blogActions.bulkApprove.label}
                </Button>
                <Button
                  onClick={() => handleBulkAction(blogActions.bulkReject)}
                  variant="danger"
                  size="sm"
                  loading={isActionLoading(blogActions.bulkReject.key, selectedBlogs)}
                  disabled={isActionLoading(blogActions.bulkReject.key, selectedBlogs)}
                >
                  {blogActions.bulkReject.label}
                </Button>
                <Button
                  onClick={() => handleBulkAction(blogActions.bulkDelete)}
                  variant="secondary"
                  size="sm"
                  loading={isActionLoading(blogActions.bulkDelete.key, selectedBlogs)}
                  disabled={isActionLoading(blogActions.bulkDelete.key, selectedBlogs)}
                >
                  {blogActions.bulkDelete.label}
                </Button>
              </div>
            </div>
          )}
        </AdminFilters>

        <AdminTable
          data={blogs}
          columns={columns}
          rowKey={(row) => row._id}
          rowClassName={(row) =>
            selectedItems.includes(row._id) ? "bg-blue-50" : ""
          }
          resource="blogs"
          currentRole={currentRole}
          executeAction={executeAction}
          isActionLoading={isActionLoading}
          actions={tableActions}
          emptyState={
            <div className="text-center py-12">
              <p className="text-gray-500">{"Bloq tapılmadı"}</p>
            </div>
          }
        />
      </div>

      {modalState?.modalType === "reviewBlog" && (
        <AdminActionModal
          isOpen={modalState.modalType === "reviewBlog"}
          onClose={() => {
            setAdminComment("");
            setModalState(null);
          }}
          title={blogActions.review.label}
          actions={[
            {
              label: blogActions.reject.label,
              onClick: async () => {
                if (!adminComment.trim()) {
                  showError("Zəhmət olmasa rədd etmə səbəbini daxil edin");
                  return;
                }
                await executeAction("blogs", blogActions.reject.key, modalState.item, {
                  adminComment: adminComment.trim(),
                  optimistic: buildOptimisticContext(
                    blogActions.reject.key,
                    [modalState.item._id],
                    adminComment.trim(),
                  ),
                });
                setAdminComment("");
                setModalState(null);
              },
              variant: blogActions.reject.variant,
              disabled: isActionLoading(blogActions.reject.key, modalState.item),
              loading: isActionLoading(blogActions.reject.key, modalState.item),
            },
            {
              label: blogActions.approve.label,
              onClick: async () => {
                await executeAction("blogs", blogActions.approve.key, modalState.item, {
                  adminComment: adminComment.trim() || null,
                  optimistic: buildOptimisticContext(
                    blogActions.approve.key,
                    [modalState.item._id],
                    adminComment.trim() || null,
                  ),
                });
                setAdminComment("");
                setModalState(null);
              },
              variant: blogActions.approve.variant,
              disabled: isActionLoading(blogActions.approve.key, modalState.item),
              loading: isActionLoading(blogActions.approve.key, modalState.item),
            },
          ]}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {modalState.item.title}
              </h4>
              <div className="flex items-center space-x-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {"bloq"}
                </span>
                <span className="text-sm text-gray-500">
                  {"müəllif: "}{" "}
                  {modalState.item.isAnonymous
                    ? "Anonim"
                    : (typeof modalState.item.author === "object"
                        ? modalState.item.author?.name ||
                          modalState.item.author?.email
                        : modalState.item.author) || "Naməlum"}
                </span>
              </div>
              {modalState.item.abstract && (
                <p className="text-sm text-gray-600 mb-4">
                  {modalState.item.abstract}
                </p>
              )}
              <div className="prose max-w-none max-h-96 overflow-y-auto">
                {modalState.item.content &&
                typeof modalState.item.content === "object" ? (
                  <BlocknoteReadOnly initialJSON={modalState.item.content} />
                ) : modalState.item.contentHtml &&
                  modalState.item.contentHtml.trim() ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(modalState.item.contentHtml),
                    }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap break-words text-sm bg-gray-100 p-2 rounded">
                    {typeof modalState.item.content === "string"
                      ? modalState.item.content
                      : JSON.stringify(modalState.item.content, null, 2)}
                  </pre>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {"Şərh"}
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {REJECTION_TEMPLATES.map((template) => (
                  <button
                    key={template}
                    type="button"
                    className="rounded-full border border-gray-300 px-2.5 py-1 text-[11px] text-gray-600 hover:border-red-300 hover:text-red-700"
                    onClick={() => setAdminComment(template)}
                  >
                    Şablon
                  </button>
                ))}
              </div>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                rows={3}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder={"Şərh əlavə edin..."}
              />
            </div>
          </div>
        </AdminActionModal>
      )}

      {modalState?.modalType === "confirmAction" && (
        <AdminActionModal
          isOpen={modalState.modalType === "confirmAction"}
          onClose={() => setModalState(null)}
          title={modalState.actionLabel}
          description={
            modalState.confirmMessage ||
            "Bu əməliyyatı davam etdirmək istədiyinizə əminsiniz?"
          }
          actions={[
            {
              label: modalState.actionLabel,
              variant: "danger",
              loading: isActionLoading(modalState.actionKey, modalState.item),
              disabled: isActionLoading(modalState.actionKey, modalState.item),
              onClick: async () => {
                const actionKey = modalState.actionKey;
                const itemId = modalState.item._id;
                await executeAction("blogs", actionKey, modalState.item, {
                  bypassConfirm: true,
                  optimistic:
                    actionKey === blogActions.delete.key
                      ? buildOptimisticContext(actionKey, [itemId])
                      : undefined,
                });
                setModalState(null);
              },
            },
          ]}
        />
      )}

      <AdminActionModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={bulkAction?.label || ""}
        actions={[
          {
            label: bulkAction?.label || "",
            onClick: executeBulkAction,
            variant: bulkAction?.variant || "primary",
            disabled:
              (bulkAction?.key === "bulkReject" && !bulkComment.trim()) ||
              activeBulkLoading,
            loading: activeBulkLoading,
          },
        ]}
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            {`${selectedItems.length} bloq üçün əməliyyatı təsdiqləyin`}
          </p>
          <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
            {selectedItems.map((id) => {
              const item = blogs.find((b) => b._id === id);
              return (
                <div key={id} className="text-sm text-gray-700 mb-1">
                  • {item?.title || "Naməlum"}
                </div>
              );
            })}
          </div>
        </div>

        {(bulkAction?.key === "bulkReject" ||
          bulkAction?.key === "bulkApprove") && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {"Şərh"}{" "}
              {bulkAction?.key === "bulkReject" ? "(mütləq)" : "(ixtiyari)"}
            </label>
            <textarea
              value={bulkComment}
              onChange={(e) => setBulkComment(e.target.value)}
              placeholder={"Şərh əlavə edin..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        )}
      </AdminActionModal>
    </AdminListLayout>
    </PageStateGuard>
  );
}
