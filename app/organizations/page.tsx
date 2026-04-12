"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { fetchOrganizations } from "@/lib/organizationQueries";
import { EmptyState, ResourceCard } from "@/components/shared";
import { logError } from "@/lib/logger";
import { ListPageLayout } from "@/components/layout";

type Organization = {
  id: string;
  organizationName: string;
  profileImage?: string;
  description: string;
  focusAreas: string[];
  status: "pending" | "approved" | "rejected";
};

const truncateText = (value: string, maxLength: number) => {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
};

export default function OrganizationsPage() {
  const localePath = useLocalizedPath();
  const { showError } = useGlobalFeedback();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [focusArea, setFocusArea] = useState("all");

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError("");
      const { items } = await fetchOrganizations({ limit: 100 });
      setOrganizations(items);
    } catch (err) {
      logError("Organizations API error", err);
      setOrganizations([]);
      setError("Məlumatları yükləyərkən problem baş verdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadOrganizations();
      } catch {
        return;
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const focusAreaOptions = useMemo(() => {
    const set = new Set<string>();
    organizations.forEach((organization) => {
      organization.focusAreas?.forEach((item) => {
        if (item) {
          set.add(item);
        }
      });
    });
    return [
      { value: "all", label: "Bütün fəaliyyət sahələri" },
      ...Array.from(set).sort().map((item) => ({ value: item, label: item })),
    ];
  }, [organizations]);

  const filteredOrganizations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return organizations.filter((organization) => {
      const matchesSearch =
        !normalizedSearch ||
        organization.organizationName.toLowerCase().includes(normalizedSearch) ||
        organization.description.toLowerCase().includes(normalizedSearch);
      const matchesFocusArea =
        focusArea === "all" || organization.focusAreas?.includes(focusArea);
      return matchesSearch && matchesFocusArea;
    });
  }, [organizations, search, focusArea]);

  const hasActiveFilters = search.trim() !== "" || focusArea !== "all";

  return (
    <ListPageLayout
      title="Təşkilatlar"
      description="Təşkilatları, onların fəaliyyət sahələrini və aktiv imkanları kəşf edin."
      icon={Building2}
      isLoading={loading}
      isError={Boolean(error)}
      isEmpty={!loading && !error && filteredOrganizations.length === 0 && !hasActiveFilters}
      loadingTitle="Yüklənir"
      loadingText="Təşkilatlar yüklənir..."
      errorTitle="Məlumatları yükləyərkən problem baş verdi"
      errorMessage={error || "Təşkilat məlumatları hazırda əlçatan deyil."}
      onRetry={loadOrganizations}
      emptyTitle="Təşkilat tapılmadı"
      emptyMessage="Hazırda göstəriləcək təşkilat yoxdur."
      filterSection={
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
          <Input
            label="Axtar"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ad və ya təsvir üzrə axtar"
            icon={Search}
            iconPosition="left"
          />
          <Select
            label="Fəaliyyət Sahəsi"
            value={focusArea}
            onChange={(event) => setFocusArea(event.target.value)}
            options={focusAreaOptions}
            placeholder="Bütün fəaliyyət sahələri"
          />
        </div>
      }
      contentContainerClassName="max-w-7xl mx-auto"
      content={
        <>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              Yeni tədbir və vakansiya yeniləmələrini almaq üçün təşkilatları profil səhifələrindən izləyin.
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Axın: kəşf et → izlə → yenilik al → müraciət et və ya qoşul → yeni imkanlar üçün yenidən bax.
            </p>
          </div>
          {filteredOrganizations.length === 0 ? (
            <EmptyState
              title="Təşkilat tapılmadı"
              message="Axtarış və ya fəaliyyət sahəsi filtrini dəyişin."
              actionText="Filtrləri sıfırla"
              onAction={() => {
                setSearch("");
                setFocusArea("all");
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrganizations.map((organization) => (
                <ResourceCard
                  key={organization.id}
                  type="organization"
                  title={organization.organizationName}
                  description={truncateText(organization.description, 140)}
                  icon={
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                      {organization.profileImage ? (
                        <Image
                          src={organization.profileImage}
                          alt={organization.organizationName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-500">
                          <Building2 className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  }
                  badges={(organization.focusAreas || []).slice(0, 3).map((area) => ({
                    label: area,
                    variant: 'secondary' as const,
                  }))}
                  actions={
                    <div>
                      <ButtonLink href={localePath(`/organizations/${organization.id}`)} variant="outline" size="sm">
                        Profilə bax
                      </ButtonLink>
                    </div>
                  }
                  className="border-slate-200"
                />
              ))}
            </div>
          )}
        </>
      }
    />
  );
}
