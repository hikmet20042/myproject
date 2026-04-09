"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Bell, FileText, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { Alert } from "@/components/feedback";
import { LoadingState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { getUserErrorMessage } from "@/lib/errorMessages";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import {
  EmptyState,
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
  totalSaves: number;
  joinedDate: string;
};

const DEFAULT_STATS: ProfileStats = {
  totalBlogs: 0,
  totalViews: 0,
  totalLikes: 0,
  totalSaves: 0,
  joinedDate: new Date().toISOString(),
};

function ProfileOverviewContent() {
  const { status } = useSession();
  const { showSuccess, showError } = useGlobalFeedback();
  const router = useRouter();
  const localePath = useLocalizedPath();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats>(DEFAULT_STATS);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [statsLoadError, setStatsLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const [resendError, setResendError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    occupation: "",
    organization: "",
    interests: "",
    avatar: "",
    socialLinks: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      youtube: "",
      website: "",
    },
    registrationNumber: "",
    focusAreas: [] as string[],
    status: "",
    contactPerson: "",
  });

  const loadProfile = useCallback(async () => {
    setProfileLoadError("");
    const response = await fetch("/api/users/profile");
    if (!response.ok) throw new Error(getUserErrorMessage(null));

    const responseJson = await response.json();
    const payload = responseJson?.data;
    if (!payload?.user) throw new Error("Profile payload is empty");

    setProfile(payload);
    setLastUpdatedAt(payload.profile?.updatedAt || payload.user?.updatedAt || new Date().toISOString());
    setFormData({
      name: payload.user.name || "",
      bio: payload.profile?.bio || "",
      location: payload.profile?.location || "",
      website: payload.profile?.website || "",
      phone: payload.profile?.phone || "",
      dateOfBirth: payload.profile?.dateOfBirth || "",
      gender: payload.profile?.gender || "",
      occupation: payload.profile?.occupation || "",
      organization: payload.profile?.organization || "",
      interests: payload.profile?.interests || "",
      avatar: payload.profile?.avatarUrl || payload.profile?.avatar || "",
      socialMedia: {
        facebook: payload.profile?.socialMedia?.facebook || "",
        twitter: payload.profile?.socialMedia?.twitter || "",
        instagram: payload.profile?.socialMedia?.instagram || "",
        linkedin: payload.profile?.socialMedia?.linkedin || "",
        youtube: payload.profile?.socialMedia?.youtube || "",
        website: payload.profile?.socialMedia?.website || "",
      },
      socialLinks: payload.profile?.socialLinks || "",
      registrationNumber: payload.profile?.registrationNumber || "",
      focusAreas: payload.profile?.focusAreas || [],
      status: payload.profile?.status || "",
      contactPerson: payload.profile?.contactPerson || "",
    });
  }, []);

  const loadProfileStats = useCallback(async () => {
    setStatsLoadError("");
    const response = await fetch("/api/users/profile/stats");
    if (!response.ok) throw new Error(getUserErrorMessage(null));

    const responseJson = await response.json();
    const stats = responseJson?.data?.stats;
    if (!stats) throw new Error("Stats payload is empty");
    setProfileStats({
      totalBlogs: stats.totalBlogs || 0,
      totalViews: stats.totalViews || 0,
      totalLikes: stats.totalLikes || 0,
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
          setStatsLoadError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [status, loadProfile, loadProfileStats]);

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (!response.ok) {
        showError(`${"Profil yadda saxlanmadı"}: ${getUserErrorMessage(result?.error)}`);
        return;
      }

      setEditing(false);
      await loadProfile();
      showSuccess("Profil uğurla yeniləndi!");
    } catch (error) {
      showError(getUserErrorMessage(error));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess("");
    setResendError("");
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "E-poçt göndərilə bilmədi.");
      }
      setResendSuccess(payload?.data?.message || "Təsdiq e-poçtu göndərildi! Gələnlər qutunu yoxla.");
    } catch (e) {
      setResendError(getUserErrorMessage(e));
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
        title="Profilə ümumi baxış"
        description="Şəxsi məlumatlarını idarə et, aktivliyini izlə və əsas bölmələrə sürətli keçid et."
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
        onEdit={() => setEditing((prev) => !prev)}
      />

      {isUnverified && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800">E-poçt ünvanı təsdiqlənməyib</h3>
              <p className="mt-1 text-sm text-amber-700">
                Bəzi funksiyalardan istifadə üçün e-poçt ünvanınızı təsdiqləməlisiniz.
              </p>
              <div className="mt-3">
                <Button size="sm" onClick={handleResendVerification} disabled={resendLoading}>
                  {resendLoading ? "Göndərilir..." : "Təsdiq e-poçtunu yenidən göndər"}
                </Button>
              </div>
              {resendSuccess && <Alert variant="success" className="mt-3">{resendSuccess}</Alert>}
              {resendError && <Alert variant="error" className="mt-3">{resendError}</Alert>}
            </div>
          </div>
        </div>
      )}

      {statsLoadError && (
        <Alert variant="error">{statsLoadError}</Alert>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ProfileStatCard label="Bloqlar" value={profileStats.totalBlogs} />
        <ProfileStatCard label="Baxışlar" value={profileStats.totalViews} />
        <ProfileStatCard label="Qoşulma tarixi" value={joinedDateLabel} />
      </section>

      <SectionCard title="Sürətli əməliyyatlar" description="Ən çox istifadə olunan profil idarəetmə addımları.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <UserCog className="w-4 h-4 mr-2" />
            Profili redaktə et
          </Button>
          <Button variant="outline" onClick={() => router.push(localePath("/profile/blogs"))}>
            <FileText className="w-4 h-4 mr-2" />
            Bloqlara keç
          </Button>
          <Button variant="outline" onClick={() => router.push(localePath("/profile/notifications"))}>
            <Bell className="w-4 h-4 mr-2" />
            Bildirişlərə bax
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Profil məlumatları"
        description="Şəxsi məlumatların və sosial keçidlərin."
        actions={
          <Button
            variant={editing ? "outline" : "primary"}
            onClick={() => setEditing((prev) => !prev)}
            disabled={saveLoading}
          >
            {editing ? "Ləğv et" : "Redaktə et"}
          </Button>
        }
      >
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ad</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Occupation</label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, occupation: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Bio</label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" onClick={handleSaveProfile} loading={saveLoading} disabled={saveLoading}>
                {saveLoading ? "Yadda saxlanılır..." : "Yadda saxla"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={saveLoading}>
                Ləğv et
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-gray-500">Telefon</p>
              <p className="mt-1 font-medium text-gray-900">{formData.phone || "-"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-gray-500">Website</p>
              <p className="mt-1 font-medium text-gray-900">{formData.website || "-"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-gray-500">Occupation</p>
              <p className="mt-1 font-medium text-gray-900">{formData.occupation || "-"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-gray-500">Location</p>
              <p className="mt-1 font-medium text-gray-900">{formData.location || "-"}</p>
            </div>
          </div>
        )}
      </SectionCard>

      {!profile.profile?.bio && !editing && (
        <EmptyState
          title="Profilini tamamlamağa başla"
          description="Qısa bio və əsas məlumatlar əlavə etməklə profilini daha faydalı et."
          actionLabel="Profili redaktə et"
          onAction={() => setEditing(true)}
        />
      )}
    </div>
  );
}

export default function ProfileOverviewPage() {
  return <ProfileOverviewContent />;
}
