"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Eye, History, Trash2, ThumbsDown, ThumbsUp, Bookmark } from "lucide-react";
import { Modal } from '@/components/ui/Modal'
import { EmptyState, LoadingState } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { useSession } from "@/lib/auth/client";
import { blogQueryKeys, deleteBlog as deleteBlogRequest, fetchUserBlogs } from "@/lib/blogQueries";
import { getUserErrorMessage } from "@/lib/errorMessages";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { Card } from "@/components/ui/Card";
import { PageHeader, SectionCard } from "@/features/profile/components/ui";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-slate-700 border-slate-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  resubmitted: "bg-blue-100 text-blue-700 border-blue-200",
  update_request: "bg-violet-100 text-violet-700 border-violet-200",
};

type BlogFilter = "all" | "approved" | "pending" | "rejected";

type ModerationEvent = {
  id: string;
  title: string;
  timestamp: string | null;
  tone: "neutral" | "success" | "warning";
  details?: string;
};

const getBlogId = (blog: any) => blog?._id || blog?.id || "";

const getBlogDateValue = (blog: any, key: string) => {
  const snakeKey = key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  return blog?.[key] || blog?.[snakeKey] || null;
};

const resolveStatusPresentation = (blog: any) => {
  const status = blog?.status || "pending";
  const reviewedAt = getBlogDateValue(blog, "reviewedAt");
  const updatedAt = getBlogDateValue(blog, "updatedAt");
  const updateRequestFor = blog?.media?.updateRequestFor;

  if (updateRequestFor && status === "pending") {
    return { label: "Yenilənmə sorğusu gözləyir", style: STATUS_STYLES.update_request };
  }

  if (status === "pending" && reviewedAt && updatedAt && updatedAt > reviewedAt) {
    return { label: "Yenidən baxışda", style: STATUS_STYLES.resubmitted };
  }

  if (status === "approved") {
    return { label: "Yayımlanıb", style: STATUS_STYLES.approved };
  }

  if (status === "rejected") {
    return { label: "Rədd edilib", style: STATUS_STYLES.rejected };
  }

  return { label: "Yoxlanış gözləyir", style: STATUS_STYLES.pending };
};

const buildModerationTimeline = (blog: any): ModerationEvent[] => {
  const events: ModerationEvent[] = [];
  const createdAt = getBlogDateValue(blog, "createdAt");
  const updatedAt = getBlogDateValue(blog, "updatedAt");
  const reviewedAt = getBlogDateValue(blog, "reviewedAt");
  const comment = (blog?.adminComment || blog?.admin_comment || "").toString().trim();

  events.push({
    id: "submitted",
    title: "İlk dəfə göndərildi",
    timestamp: createdAt,
    tone: "neutral",
  });

  if (reviewedAt && blog?.status === "rejected") {
    events.push({
      id: "rejected",
      title: "Moderasiya rəyi: rədd",
      timestamp: reviewedAt,
      tone: "warning",
      details: comment || "Rədd səbəbi əlavə edilməyib.",
    });
  }

  if (reviewedAt && blog?.status === "approved") {
    events.push({
      id: "approved",
      title: "Moderasiya rəyi: təsdiq",
      timestamp: reviewedAt,
      tone: "success",
      details: comment || undefined,
    });
  }

  if (blog?.status === "pending" && reviewedAt && updatedAt && updatedAt > reviewedAt) {
    events.push({
      id: "resubmitted",
      title: "Müəllif tərəfindən yenidən göndərildi",
      timestamp: updatedAt,
      tone: "neutral",
      details: comment || "Son moderasiya rəyi qorunur.",
    });
  }

  return events;
};

const TIMELINE_TONE_STYLES: Record<ModerationEvent["tone"], string> = {
  neutral: "border-slate-200 bg-gray-50 text-slate-700",
  success: "border-green-200 bg-green-50 text-green-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export default function ProfileBlogsPage() {
  const router = useRouter();
  const localePath = useLocalizedPath();
  const { data: session } = useSession();
  const isOrganizationUser = session?.user?.accountType === "organization";
  const queryClient = useQueryClient();
  const { showError, showSuccess, showInfo } = useGlobalFeedback();
  const [navigatingEditId, setNavigatingEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "blog";
    id: string;
    title: string;
  } | null>(null);
  const [filter, setFilter] = useState<BlogFilter>("all");

  const userBlogsQuery = useQuery({
    queryKey: blogQueryKeys.user,
    queryFn: fetchUserBlogs,
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (id: string) => deleteBlogRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.user });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
      showSuccess("Bloq uğurla silindi.");
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      showError(getUserErrorMessage(error));
    },
  });

  const deleteBlog = (id: string) => {
    deleteBlogMutation.mutate(id);
  };

  const blogs = useMemo(() => userBlogsQuery.data?.items || [], [userBlogsQuery.data?.items]);
  const summary = useMemo(() => {
    const approved = blogs.filter((blog: any) => blog.status === "approved").length;
    const pending = blogs.filter((blog: any) => blog.status === "pending").length;
    const rejected = blogs.filter((blog: any) => blog.status === "rejected").length;

    return {
      total: blogs.length,
      approved,
      pending,
      rejected,
    };
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    if (filter === "all") return blogs;
    return blogs.filter((blog: any) => blog.status === filter);
  }, [blogs, filter]);

  useEffect(() => {
    if (userBlogsQuery.isError) {
      showError("Bloqları yükləmək mümkün olmadı.");
    }
  }, [userBlogsQuery.isError, showError]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bloqlarım"
        description="Yazdığın bloqları idarə et, statusunu izlə və lazım olduqda yenilə."
        actions={
          session?.user?.emailVerified ? (
            isOrganizationUser ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => router.push(localePath("/dashboard/events/create"))}>Tədbir paylaş</Button>
                <Button variant="outline" onClick={() => router.push(localePath("/dashboard/vacancies/create"))}>Vakansiya paylaş</Button>
              </div>
            ) : (
              <Button onClick={() => router.push(localePath("/submit/blog"))}>Yeni bloq yaz</Button>
            )
          ) : undefined
        }
      />

      {deleteConfirm && (
        <Modal
          isOpen
          onClose={() => setDeleteConfirm(null)}
          title="Bloqu silmək istədiyinizə əminsiniz?"
          size="sm"
          className="border-red-200 w-[92vw]"
        >
              <p className="mt-2 text-sm text-slate-600">
                <strong>{deleteConfirm.title}</strong> silinəcək və bu əməliyyat geri qaytarılmayacaq.
              </p>
              <div className="mt-5 flex gap-3">
                <Button
                  variant="danger"
                  onClick={() => deleteBlog(deleteConfirm.id)}
                  disabled={deleteBlogMutation.isPending}
                  loading={deleteBlogMutation.isPending}
                >
                  {deleteBlogMutation.isPending ? "Silinir..." : "Bəli, sil"}
                </Button>
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleteBlogMutation.isPending}>
                  Ləğv et
                </Button>
              </div>
        </Modal>
      )}

      <SectionCard title="Bloq idarəetməsi" description="Statusa görə filtrlə və bloqlarını bir yerdən idarə et.">
        {!userBlogsQuery.isLoading && !userBlogsQuery.isError && blogs.length > 0 && (
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-3">
              <p className="text-xs text-slate-500">Ümumi bloq</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{summary.total}</p>
            </Card>
            <div className="rounded-xl border border-green-200 bg-green-50 p-3">
              <p className="text-xs text-green-700">Yayımlanıb</p>
              <p className="mt-1 text-xl font-semibold text-green-800">{summary.approved}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">Yoxlanışda</p>
              <p className="mt-1 text-xl font-semibold text-amber-800">{summary.pending}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-700">Rədd edilib</p>
              <p className="mt-1 text-xl font-semibold text-red-800">{summary.rejected}</p>
            </div>
          </div>
        )}

        {!userBlogsQuery.isLoading && !userBlogsQuery.isError && blogs.length > 0 && (
          <div className="mb-5">
            <Tabs
              tabs={[
                { id: 'all', label: 'Hamısı' },
                { id: 'approved', label: 'Yayımlanıb' },
                { id: 'pending', label: 'Yoxlanışda' },
                { id: 'rejected', label: 'Rədd edilib' },
              ]}
              activeTab={filter}
              onTabChange={(tabId) => setFilter(tabId as BlogFilter)}
              variant="pills"
              size="sm"
            />
          </div>
        )}

        {userBlogsQuery.isLoading ? (
          <LoadingState variant="list" rows={3} />
        ) : userBlogsQuery.isError ? (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => userBlogsQuery.refetch()}>Yenidən cəhd et</Button>
          </div>
        ) : blogs.length === 0 ? (
          <EmptyState
            title="Hələ bloq yazmamısan"
            message={isOrganizationUser ? "Təşkilat hesabı ilə tədbir və vakansiya paylaşaraq aktivliyə başla." : "İlk bloqunu yazaraq məzmununu idarə etməyə başla."}
            actionText={session?.user?.emailVerified ? (isOrganizationUser ? "Tədbir paylaş" : "İlk bloqunu yaz") : undefined}
            onAction={
              session?.user?.emailVerified
                ? () => router.push(localePath(isOrganizationUser ? "/dashboard/events/create" : "/submit/blog"))
                : undefined
            }
          />
        ) : filteredBlogs.length === 0 ? (
          <EmptyState
            title="Bu statusda bloq yoxdur"
            message="Filtri dəyişərək digər bloqları görə bilərsən."
          />
        ) : (
          <div className="space-y-4">
            {filteredBlogs.map((blog: any) => {
              const blogId = getBlogId(blog);
              const timeline = buildModerationTimeline(blog);
              const statusView = resolveStatusPresentation(blog);
              const isApproved = blog.status === "approved";

              return (
                <Card key={blogId} className="p-4 transition-all duration-200 hover:border-slate-200 hover:shadow-sm sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${statusView.style}`}>
                          {statusView.label}
                        </span>
                        {isApproved ? (
                          <>
                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-slate-600">
                              <Eye className="w-3.5 h-3.5" />
                              {blog.views || 0}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              {blog.likes || 0}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700">
                              <ThumbsDown className="w-3.5 h-3.5" />
                              {blog.dislikes || 0}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
                              <Bookmark className="w-3.5 h-3.5" />
                              {blog.saves || 0}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs text-slate-600">
                            Statistika təsdiqdən sonra görünəcək
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900">{blog.title}</h3>
                      <p className="text-sm text-slate-500">
                        {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ""}
                      </p>

                      {blog.adminComment ? (
                        <p className="text-sm rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                          <strong>Son rəy:</strong> {blog.adminComment}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 lg:justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setNavigatingEditId(blogId);
                          showInfo(
                            blog.status === "approved"
                              ? "Yenilənmə sorğusu üçün redaktə səhifəsinə yönləndirilir..."
                              : "Redaktə səhifəsinə yönləndirilir..."
                          );
                          router.push(localePath(`/edit/blog/${blogId}`));
                        }}
                        loading={navigatingEditId === blogId}
                        disabled={navigatingEditId !== null}
                      >
                        <Edit3 className="w-4 h-4 mr-1.5" />
                        {navigatingEditId === blogId
                          ? "Yönləndirilir..."
                          : blog.status === "approved"
                            ? "Yenilənmə sorğusu"
                            : "Redaktə et"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm({ type: "blog", id: blogId, title: blog.title })}
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Sil
                      </Button>
                    </div>

                    <Card className="lg:col-span-2 bg-gray-50/80 p-3">
                      <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <History className="h-3.5 w-3.5" />
                        Moderasiya tarixçəsi
                      </p>
                      <div className="space-y-2">
                        {timeline.map((event, index) => (
                          <div key={`${blogId}-${event.id}`} className="flex gap-2">
                            <div className="mt-1 flex w-4 flex-col items-center">
                              <span className={`h-2.5 w-2.5 rounded-full ${event.tone === "success" ? "bg-green-500" : event.tone === "warning" ? "bg-amber-500" : "bg-gray-400"}`} />
                              {index < timeline.length - 1 ? <span className="mt-1 h-full w-px bg-gray-300" /> : null}
                            </div>
                            <div className={`flex-1 rounded-md border px-3 py-2 text-xs ${TIMELINE_TONE_STYLES[event.tone]}`}>
                              <p className="font-semibold">{event.title}</p>
                              {event.timestamp ? (
                                <p className="mt-0.5 text-[11px] opacity-80">
                                  {new Date(event.timestamp).toLocaleString("az-AZ")}
                                </p>
                              ) : null}
                              {event.details ? <p className="mt-1 text-[11px]">{event.details}</p> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
