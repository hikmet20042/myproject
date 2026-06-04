"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Search, UserMinus } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { fetchFollowedOrganizations, toggleOrganizationFollow } from "@/lib/organizationQueries";
import { getUserErrorMessage } from "@/lib/errorMessages";
import { PageHeader, SectionCard } from "@/features/profile/components/ui";

const PAGE_SIZE = 12;

const listKey = (page: number, search: string) =>
  ["followed-organizations", page, search] as const;

export default function ProfileFollowedOrganizationsPage() {
  const localePath = useLocalizedPath();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useGlobalFeedback();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const followedQuery = useQuery({
    queryKey: listKey(page, search),
    queryFn: () =>
      fetchFollowedOrganizations({
        page,
        limit: PAGE_SIZE,
        search,
      }),
  });

  const items = followedQuery.data?.items || [];
  const meta = followedQuery.data?.meta || {};
  const totalPages = Number(meta.pages || 0);

  const unfollowMutation = useMutation({
    mutationFn: (organizationId: string) =>
      toggleOrganizationFollow(organizationId, "unfollow"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followed-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization-follow"] });
      queryClient.invalidateQueries({ queryKey: ["my-organization"] });
      showSuccess("Təşkilat izləmədən çıxarıldı");
    },
    onError: (error: any) => {
      showError(getUserErrorMessage(error));
    },
  });

  const hasFilters = search.trim().length > 0;

  const statusText = useMemo(() => {
    const total = Number(meta.total || 0);
    if (!total) return "";
    return `${total.toLocaleString("az-AZ")} təşkilat izləyirsən`;
  }, [meta.total]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="İzlədiyim təşkilatlar"
        description="İzlədiyin təşkilatları burada idarə et, axtar və istədiyin zaman izləmədən çıxar."
      />

      <SectionCard
        title="Axtarış"
        description="Təşkilat adını və ya təsvirini yazaraq siyahını filtrlə."
      >
        <Input
          id="followed-org-search"
          label="Axtar"
          placeholder="Təşkilat adı və ya təsvir üzrə axtar..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          icon={Search}
          iconPosition="left"
        />
      </SectionCard>

      <SectionCard
        title="Siyahı"
        description={statusText || "Hələ heç bir təşkilat izləmirsən."}
      >
        {followedQuery.isLoading ? (
          <LoadingState variant="list" rows={3} />
        ) : followedQuery.isError ? (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => followedQuery.refetch()}>
              Yenidən cəhd et
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={hasFilters ? "Nəticə tapılmadı" : "Hələ izlədiyin təşkilat yoxdur"}
            message={
              hasFilters
                ? "Axtarış sözünü dəyişdirərək yenidən yoxla."
                : "Resurslar bölməsindən təşkilatları izləməyə başlaya bilərsən."
            }
            actionText={hasFilters ? "Filtri təmizlə" : "Təşkilatları kəşf et"}
            onAction={
              hasFilters
                ? () => {
                    setSearch("");
                    setPage(1);
                  }
                : () => window.location.assign(localePath("/resources/organizations"))
            }
          />
        ) : (
          <div className="space-y-4">
            {items.map((organization: any) => (
              <Card key={organization._id} className="border border-slate-200 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {organization.organizationName}
                        </h3>
                      </div>
                      {organization.description ? (
                        <p className="text-sm text-slate-600 line-clamp-2">{organization.description}</p>
                      ) : null}
                      {organization.followedAt ? (
                        <p className="text-xs text-slate-500">
                          {`İzləmə tarixi: ${new Date(organization.followedAt).toLocaleDateString("az-AZ")}`}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <ButtonLink
                        href={localePath(`/o/${organization.slug}`)}
                        variant="outline"
                        size="sm"
                      >
                        Profili gör
                      </ButtonLink>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={UserMinus}
                        iconPosition="left"
                        loading={unfollowMutation.isPending}
                        onClick={() => unfollowMutation.mutate(String(organization._id))}
                      >
                        İzləmədən çıxar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Əvvəlki
                </Button>
                <span className="text-sm text-slate-500">
                  {`Səhifə ${page} / ${totalPages}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Növbəti
                </Button>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
