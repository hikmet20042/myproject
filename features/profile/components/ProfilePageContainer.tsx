"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, PencilLine, User } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageStateGuard } from "@/components/shared";
import ProfileView from "@/features/profile/components/ProfileView";
import ProfileFormContainer from "@/features/profile/components/ProfileFormContainer";
import { fetchMyOrganization } from "@/lib/organizationQueries";
import { logError } from "@/lib/logger";
import { AppContainer } from "@/components/layout";

type ProfilePageVariant = "dashboard" | "organization-full" | "user-full";

interface ProfilePageContainerProps {
  variant?: ProfilePageVariant;
}

export default function ProfilePageContainer({ variant = "dashboard" }: ProfilePageContainerProps) {
  const { data: session, status } = useSession();
  const sessionUserId = session?.user?.id ?? null;
  const [organizationProfile, setOrganizationProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => undefined;
    // Mount-only lifecycle — empty deps intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const organization = await fetchMyOrganization();
      setOrganizationProfile(organization || null);
    } catch (error) {
      logError("Organization profile API error", error);
      setError("Məlumatları yükləyərkən problem baş verdi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (status === "loading") {
      return;
    }

    if (!sessionUserId) {
      return;
    }

    fetchProfile();
  }, [fetchProfile, sessionUserId, status, mounted]);

  const isFullPageVariant = variant === "organization-full" || variant === "user-full";
  const rootClassName = isFullPageVariant ? "min-h-screen bg-slate-50" : "space-y-6";
  const innerClassName = isFullPageVariant ? "space-y-6" : "space-y-6";
  const title = variant === "organization-full" ? "Təşkilat Profili" : "Təşkilat Profili";
  const subtitle = showProfileEdit
    ? "Təşkilat məlumatlarını yenilə."
    : "Təşkilat profilini nəzərdən keçir və aktual saxla.";
  const editButtonText = showProfileEdit ? "Profilə qayıt" : "Profili redaktə et";
  const editHeaderTitle = "Təşkilat Məlumatlarını Redaktə Et";
  const editHeaderText = "Məlumatları yenilə və dəyişiklikləri yadda saxla.";
  const overviewTitle = "Profil Görünüşü";
  const overviewText = "Bu profil platformada bu şəkildə görünür.";

  return (
    <PageStateGuard
      isLoading={status === "loading" || loading}
      isError={Boolean(error)}
      isEmpty={false}
      loadingTitle="Yüklənir"
      loadingText="Profil yüklənir..."
      errorTitle="Məlumatları yükləyərkən problem baş verdi"
      errorMessage={error || "Təşkilat profilini yükləmək mümkün olmadı."}
      retryText="Yenidən cəhd et"
      onRetry={fetchProfile}
      fullPage={isFullPageVariant}
    >
      <div className={rootClassName}>
        {isFullPageVariant ? (
          <AppContainer className={innerClassName}>{renderContent()}</AppContainer>
        ) : (
          <div className={innerClassName}>{renderContent()}</div>
        )}
      </div>
    </PageStateGuard>
  );

  function renderContent() {
    return (
    <>
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-100 text-indigo-700">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowProfileEdit(!showProfileEdit)}
          variant="primary"
          size="sm"
          className="rounded-xl"
        >
          {showProfileEdit ? <ArrowLeft className="mr-1 h-4 w-4" /> : <PencilLine className="mr-1 h-4 w-4" />}
          {editButtonText}
        </Button>
      </Card>

      {showProfileEdit ? (
        <Card interactive className="overflow-hidden border border-slate-200 shadow-sm">
          <CardContent padding="md" className="bg-white">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">{editHeaderTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{editHeaderText}</p>
            </div>
            <ProfileFormContainer
              organizationProfile={organizationProfile}
              onSave={(updatedProfile) => {
                setOrganizationProfile(updatedProfile);
                setShowProfileEdit(false);
              }}
              onCancel={() => setShowProfileEdit(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card interactive className="overflow-hidden border border-slate-200 shadow-sm">
          <CardContent padding="md" className="bg-white">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">{overviewTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{overviewText}</p>
            </div>
            <ProfileView organizationProfile={organizationProfile} />
          </CardContent>
        </Card>
      )}
    </>
  );
  }
}
