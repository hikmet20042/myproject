"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Eye, Trash2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Alert } from "@/components/feedback";
import { Button } from "@/components/ui/Button";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { useSession } from "@/lib/auth/client";
import { blogQueryKeys, deleteBlog as deleteBlogRequest, fetchUserBlogs } from "@/lib/blogQueries";
import { getUserErrorMessage } from "@/lib/errorMessages";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { EmptyState, PageHeader, SectionCard } from "@/features/profile/components/ui";

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for review",
  approved: "Published",
  rejected: "Rejected",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700 border-gray-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function ProfileBlogsPage() {
  const router = useRouter();
  const localePath = useLocalizedPath();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { showError, showSuccess, showInfo } = useGlobalFeedback();
  const [navigatingEditId, setNavigatingEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "blog";
    id: string;
    title: string;
  } | null>(null);

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

  const blogs = userBlogsQuery.data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bloqlarım"
        description="Yazdığın bloqları idarə et, statusunu izləyin və lazım olduqda yenilə."
        actions={
          session?.user?.emailVerified ? (
            <Button onClick={() => router.push(localePath("/submit/blog/step1"))}>Yeni bloq yaz</Button>
          ) : undefined
        }
      />

      {deleteConfirm && (
        <Dialog.Root open onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-red-200 bg-white p-6 shadow-lg">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Bloqu silmək istədiyinizə əminsiniz?
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-gray-600">
                <strong>{deleteConfirm.title}</strong> silinəcək və bu əməliyyat geri qaytarılmayacaq.
              </Dialog.Description>
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
              {deleteBlogMutation.isError && (
                <Alert variant="error" className="mt-4">
                  {getUserErrorMessage(deleteBlogMutation.error)}
                </Alert>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <SectionCard>
        {userBlogsQuery.isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="animate-pulse rounded-xl border border-gray-200 p-4">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="mt-3 h-4 w-2/3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : userBlogsQuery.isError ? (
          <Alert variant="error">
            Bloqları yükləmək mümkün olmadı. <button className="underline ml-1" onClick={() => userBlogsQuery.refetch()}>Yenidən cəhd et</button>
          </Alert>
        ) : blogs.length === 0 ? (
          <EmptyState
            title="You haven’t written any blogs yet"
            description="Start writing your first blog to begin managing your content."
            actionLabel={session?.user?.emailVerified ? "İlk bloqunu yaz" : undefined}
            onAction={session?.user?.emailVerified ? () => router.push(localePath("/submit/blog/step1")) : undefined}
          />
        ) : (
          <div className="space-y-4">
            {blogs.map((blog: any) => (
              <article key={blog._id} className="rounded-xl border border-gray-200 p-4 sm:p-5 bg-white transition-all duration-200 hover:shadow-sm hover:border-gray-300">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[blog.status] || STATUS_STYLES.pending}`}>
                        {STATUS_LABELS[blog.status] || blog.status}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Eye className="w-3.5 h-3.5" />
                        {blog.views || 0}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{blog.title}</h3>
                    <p className="text-sm text-gray-500">
                      {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ""}
                    </p>
                    {blog.adminComment ? (
                      <p className="text-sm rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                        <strong>Rejection reason:</strong> {blog.adminComment}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {blog.status !== "approved" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setNavigatingEditId(blog._id);
                          showInfo("Redaktə səhifəsinə yönləndirilir...");
                          router.push(localePath(`/edit/blog/${blog._id}/step1`));
                        }}
                        loading={navigatingEditId === blog._id}
                        disabled={navigatingEditId !== null}
                      >
                        <Edit3 className="w-4 h-4 mr-1.5" />
                        {navigatingEditId === blog._id ? "Yönləndirilir..." : "Edit"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm({ type: "blog", id: blog._id, title: blog.title })}
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
