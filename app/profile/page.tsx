"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, FileText, Settings, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { EmptyState, LoadingState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { getUserErrorMessage } from "@/lib/errorMessages";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import {
  PageHeader,
  ProfileHeaderCard,
  ProfileStatCard,
  SectionCard,
} from "@/features/profile/components/ui";

type UserProfile = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: string;
    emailVerified?: boolean;
    createdAt?: string;
  };
  profile: Record<string, any> | null;
};

type ProfileStats = {
  totalBlogs: number;
  totalViews: number;
  totalLikes: number;
  totalDislikes: number;
  totalSaves: number;
  joinedDate: string;
};

const DEFAULT_STATS: ProfileStats = {
  totalBlogs: 0,
  totalViews: 0,
  totalLikes: 0,
  totalDislikes: 0,
  totalSaves: 0,
  joinedDate: new Date().toISOString(),
};

function ProfileOverviewContent() {
  const { status } = useSession();
  const router = useRouter();
  const localePath = useLocalizedPath();
  const { showError, showSuccess } = useGlobalFeedback();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats>(DEFAULT_STATS);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");

  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(profile?.profile?.bio),
      Boolean(profile?.profile?.location),
      Boolean(profile?.profile?.website),
      Boolean(profile?.profile?.occupation),
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [
    profile?.profile?.bio,
    profile?.profile?.location,
    profile?.profile?.website,
    profile?.profile?.occupation,
  ]);

  const loadProfile = useCallback(async () => {
    setProfileLoadError("");
    const response = await fetch("/api/users/profile");
    if (!response.ok) throw new Error(getUserErrorMessage(null));

    const responseJson = await response.json();
    const payload = responseJson?.data;
    if (!payload?.user) throw new Error("Profile payload is empty");

    setProfile(payload);
    setLastUpdatedAt(payload.profile?.updatedAt || payload.user?.updatedAt || new Date().toISOString());
  }, []);

  const loadProfileStats = useCallback(async () => {
    const response = await fetch("/api/users/profile/stats");
    if (!response.ok) throw new Error(getUserErrorMessage(null));

    const responseJson = await response.json();
    const stats = responseJson?.data?.stats;
    if (!stats) throw new Error("Stats payload is empty");
    setProfileStats({
      totalBlogs: stats.totalBlogs || 0,
      totalViews: stats.totalViews || 0,
      totalLikes: stats.totalLikes || 0,
      totalDislikes: stats.totalDislikes || 0,
      totalSaves: stats.totalSaves || 0,
      joinedDate: stats.joinedDate || DEFAULT_STATS.joinedDate,
    });
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([loadProfile(), loadProfileStats()]);
      } catch (error) {
        if (!cancelled) {
          const message = getUserErrorMessage(error);
          setProfileLoadError(message);
          showError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [status, loadProfile, loadProfileStats, showError]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const response = await fetch("/api/auth/verify-request", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "E-poçt göndərilə bilmədi.");
      }
      showSuccess(payload?.data?.message || "Təsdiq e-poçtu göndərildi! Gələnlər qutunu yoxla.");
    } catch (e) {
      showError(getUserErrorMessage(e));
    } finally {
      setResendLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <LoadingState text={"Profil yüklənir..."} />;
  }

  if (!profile) {
    return (
      <ErrorState
        title={"Profil yüklənmədi"}
        message={profileLoadError || "Profil məlumatlarını yükləmək mümkün olmadı."}
        onRetry={() => window.location.reload()}
        retryText={"Yenidən cəhd et"}
      />
    );
  }

  const isUnverified = Boolean(profile?.user) && !profile?.user?.emailVerified;
  const joinedDateLabel = new Date(profileStats.joinedDate || Date.now()).toLocaleDateString();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil mərkəzi"
        description="Hesab məlumatların və aktivliyin bir yerdə."
        actions={
          <span className="text-xs text-gray-500">
            Son yenilənmə: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : "-"}
          </span>
        }
      />

      <ProfileHeaderCard
        name={profile.user.name}
        email={profile.user.email}
        bio={profile.profile?.bio || ""}
        avatarUrl={profile.profile?.avatarUrl || profile.profile?.avatar || profile.user.image}
        onEdit={() => router.push(localePath("/profile/settings"))}
      />

      {isUnverified && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800">E-poçt təsdiqlənməyib</h3>
              <p className="mt-1 text-sm text-amber-700">Bəzi funksiyalar üçün e-poçt təsdiqi tələb olunur.</p>
              <div className="mt-3">
                <Button size="sm" onClick={handleResendVerification} disabled={resendLoading}>
                  {resendLoading ? "Göndərilir..." : "Təsdiq e-poçtunu göndər"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <ProfileStatCard label="Bloqlar" value={profileStats.totalBlogs} />
        <ProfileStatCard label="Baxışlar" value={profileStats.totalViews} />
        <ProfileStatCard label="Bəyənmələr" value={profileStats.totalLikes} />
        <ProfileStatCard label="Bəyənməmələr" value={profileStats.totalDislikes} />
        <ProfileStatCard label="Saxlanılanlar" value={profileStats.totalSaves} />
      </section>

      <SectionCard
        title="Qısa məlumat"
        description="Profil vəziyyəti və əsas məlumatların."
        actions={
          <Button variant="outline" onClick={() => router.push(localePath("/profile/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            Tənzimlə
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/40 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500">Profil doluluğu</span>
              <span className="font-semibold text-gray-900">{profileCompletion}%</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500">Qoşulma tarixi</span>
              <span className="font-medium text-gray-900">{joinedDateLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500">Məkan</span>
              <span className="font-medium text-gray-900">{profile.profile?.location || "-"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500">Peşə</span>
              <span className="font-medium text-gray-900">{profile.profile?.occupation || "-"}</span>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/40 p-4 text-sm">
            <p className="text-gray-500">Sürətli əməliyyatlar</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => router.push(localePath("/profile/settings"))}>
                <UserCog className="mr-2 h-4 w-4" />
                Profili redaktə et
              </Button>
              <Button variant="outline" onClick={() => router.push(localePath("/profile/blogs"))}>
                <FileText className="mr-2 h-4 w-4" />
                Bloqlar
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {!profile.profile?.bio && (
        <EmptyState
          title="Profilini tamamlamağa başla"
          message="Qısa bio əlavə edərək profilini daha faydalı et."
          actionText="Tənzimləmələrə keç"
          onAction={() => router.push(localePath("/profile/settings"))}
        />
      )}
    </div>
  );
}

export default function ProfileOverviewPage() {
  return <ProfileOverviewContent />;
}
