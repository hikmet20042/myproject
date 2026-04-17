"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check, KeyRound, Link, Loader2, Mail, Pencil, Save, Trash2, Upload, UserRound, XCircle } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { PageHeader, SectionCard } from "@/features/profile/components/ui";
import { NotificationsSettingsSection } from "@/features/profile/components/NotificationsSettingsSection";
import { getUserErrorMessage } from "@/lib/errorMessages";
import { signInWithOAuth, signOut } from "@/lib/auth/client";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { ImageCropper } from "@/components/shared";

type ProfileFormState = {
  name: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
  occupation: string;
  interests: string;
  avatar: string;
  urlHandle: string;
  socialMedia: {
    facebook: string;
    linkedin: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
};

type UrlHandleSectionProps = {
  currentHandle: string;
  onChange: (handle: string) => void;
  onSave: () => Promise<boolean>;
  previewUrl: string;
};

function UrlHandleSection({ currentHandle, onChange, onSave, previewUrl }: UrlHandleSectionProps) {
  const [editing, setEditing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [localHandle, setLocalHandle] = useState(currentHandle);

  useEffect(() => {
    setLocalHandle(currentHandle);
  }, [currentHandle]);

  const checkAvailability = async (handle: string) => {
    if (!handle || handle.length < 3) {
      setAvailable(null);
      setReason("");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`/api/handles/check?handle=${encodeURIComponent(handle)}`);
      const json = await res.json();
      setAvailable(json.data?.available ?? false);
      setReason(json.data?.reason || "");
    } catch {
      setAvailable(null);
      setReason("");
    } finally {
      setChecking(false);
    }
  };

  const handleChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setLocalHandle(normalized);
    onChange(normalized);
    setAvailable(null);
    setReason("");
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave();
    setSaving(false);
    if (ok) setEditing(false);
  };

  if (!editing) {
    return (
      <SectionCard
        title="Profil keçidi"
        description="İctimai profilinizə xüsusi URL seçin."
        actions={
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Redaktə et
          </Button>
        }
      >
        <div className="flex items-center gap-2 text-sm">
          <Link className="w-4 h-4 text-gray-500" />
          {currentHandle ? (
            <span className="text-gray-900">
              <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">/u/{currentHandle}</code>
            </span>
          ) : (
            <span className="text-gray-400">Keçid təyin edilməyib</span>
          )}
        </div>
      </SectionCard>
    );
  }

  const isValid = localHandle.length >= 3 && localHandle.length <= 50 && /^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$/.test(localHandle);
  const isDirty = localHandle !== currentHandle;

  return (
    <SectionCard
      title="Profil keçidi"
      description="İctimai profilinizə xüsusi URL seçin. Bu, digər istifadəçilərin sizi asanlıqla tapmasını təmin edir."
      actions={
        <>
          <Button variant="outline" onClick={() => { setLocalHandle(currentHandle); setEditing(false); setAvailable(null); setReason(""); }} disabled={saving}>
            Ləğv et
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving || !isDirty || !isValid || checking || available === false}>
            <Save className="w-4 h-4 mr-2" />
            Yadda saxla
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Keçid</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm flex-shrink-0">/u/</span>
            <input
              type="text"
              value={localHandle}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={() => localHandle.length >= 3 && checkAvailability(localHandle)}
              placeholder="istifadəçi-adı"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm"
              maxLength={50}
            />
            {checking && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            {!checking && available === true && <Check className="w-4 h-4 text-green-500" />}
            {!checking && available === false && <AlertCircle className="w-4 h-4 text-red-500" />}
          </div>
        </div>

        {reason && (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {reason}
          </p>
        )}

        {localHandle && isValid && previewUrl && (
          <p className="text-sm text-gray-500">
            Profilinizə keçid: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{previewUrl}</code>
          </p>
        )}

        {!localHandle && (
          <p className="text-sm text-gray-500">Boş buraxılsanız, standart profil URL-i istifadə olunacaq.</p>
        )}
      </div>
    </SectionCard>
  );
}

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const localePath = useLocalizedPath();
  const { showError, showSuccess, showInfo: pushInfo } = useGlobalFeedback();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [socialEditMode, setSocialEditMode] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailPolicyLoading, setEmailPolicyLoading] = useState(false);
  const [emailPolicy, setEmailPolicy] = useState({
    currentEmail: "",
    requiresCurrentPassword: true,
    requiresGoogleReauth: false,
    providers: [] as string[],
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePolicyLoading, setDeletePolicyLoading] = useState(false);
  const [deletePolicy, setDeletePolicy] = useState({
    requiresCurrentPassword: true,
    requiresGoogleReauth: false,
    recentlyReauthenticated: false,
    providers: [] as string[],
    deleteConfirmationText: "DELETE",
  });
  const [initialForm, setInitialForm] = useState<ProfileFormState | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deleteForm, setDeleteForm] = useState({
    confirmText: "",
    currentPassword: "",
  });
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | string | null>(null);
  const [form, setForm] = useState<ProfileFormState>({
    name: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
    occupation: "",
    interests: "",
    avatar: "",
    urlHandle: "",
    socialMedia: {
      facebook: "",
      linkedin: "",
      instagram: "",
      twitter: "",
      youtube: "",
    },
  });

  useEffect(() => {
    if (saveError) showError(saveError);
  }, [saveError, showError]);

  useEffect(() => {
    if (saveSuccess) showSuccess(saveSuccess);
  }, [saveSuccess, showSuccess]);

  useEffect(() => {
    if (passwordError) showError(passwordError);
  }, [passwordError, showError]);

  useEffect(() => {
    if (passwordSuccess) showSuccess(passwordSuccess);
  }, [passwordSuccess, showSuccess]);

  useEffect(() => {
    if (deleteError) showError(deleteError);
  }, [deleteError, showError]);

  useEffect(() => {
    if (deleteSuccess) pushInfo(deleteSuccess);
  }, [deleteSuccess, pushInfo]);

  useEffect(() => {
    if (searchParams?.get("emailChange") === "confirmed") {
      showSuccess("E-poçt dəyişikliyi təsdiqləndi.");
      router.replace(localePath("/profile/settings"));
    }
  }, [searchParams, showSuccess, router, localePath]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setSaveError("");
    try {
      const response = await fetch("/api/users/profile");
      if (!response.ok) throw new Error("Profil yüklənmədi");
      const responseJson = await response.json();
      const payload = responseJson?.data;
      const nextForm = {
        name: payload?.user?.name || "",
        bio: payload?.profile?.bio || "",
        location: payload?.profile?.location || "",
        website: payload?.profile?.website || "",
        phone: payload?.profile?.phone || "",
        occupation: payload?.profile?.occupation || "",
        interests: payload?.profile?.interests || "",
        avatar: payload?.profile?.avatar || payload?.profile?.avatarUrl || "",
        urlHandle: payload?.user?.urlHandle || "",
        socialMedia: {
          facebook: payload?.profile?.socialMedia?.facebook || "",
          linkedin: payload?.profile?.socialMedia?.linkedin || "",
          instagram: payload?.profile?.socialMedia?.instagram || "",
          twitter: payload?.profile?.socialMedia?.twitter || "",
          youtube: payload?.profile?.socialMedia?.youtube || "",
        },
      };
      setForm(nextForm);
      setInitialForm(nextForm);
      setProfileEditMode(false);
      setSocialEditMode(false);
    } catch (error) {
      setSaveError(getUserErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setSaveError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/profile/image", { method: "POST", body });
      const responseJson = await response.json();
      if (!response.ok) throw new Error(responseJson?.error?.message || "Şəkil yüklənmədi");
      const imageUrl = responseJson?.data?.url || responseJson?.data?.profileImage?.url;
      if (!imageUrl) throw new Error("Şəkil URL tapılmadı");
      setForm((prev) => ({ ...prev, avatar: imageUrl }));
      setSaveSuccess("Profil şəkli yeniləndi.");
    } catch (error) {
      setSaveError(getUserErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setPendingImage(file);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setCropModalOpen(false);
    setPendingImage(null);
    await handleUpload(croppedFile);
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setPendingImage(null);
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    setSaveError("");
    try {
      const response = await fetch("/api/profile/image", { method: "DELETE" });
      const responseJson = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseJson?.error?.message || "Şəkil silinmədi");
      setForm((prev) => ({ ...prev, avatar: "" }));
      setSaveSuccess("Profil şəkli silindi.");
    } catch (error) {
      setSaveError(getUserErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const invalidUrlMessage = useMemo(() => {
    const fields = [
      { label: "Vebsayt", value: form.website },
      { label: "Facebook", value: form.socialMedia.facebook },
      { label: "LinkedIn", value: form.socialMedia.linkedin },
      { label: "Instagram", value: form.socialMedia.instagram },
      { label: "Twitter/X", value: form.socialMedia.twitter },
      { label: "YouTube", value: form.socialMedia.youtube },
    ];

    for (const field of fields) {
      const value = field.value.trim();
      if (!value) continue;
      try {
        const url = new URL(value);
        if (!/^https?:$/.test(url.protocol)) {
          return `${field.label} üçün yalnız http/https linki istifadə et.`;
        }
      } catch {
        return `${field.label} üçün düzgün URL daxil et.`;
      }
    }
    return "";
  }, [form]);

  useEffect(() => {
    if (invalidUrlMessage) pushInfo(invalidUrlMessage);
  }, [invalidUrlMessage, pushInfo]);

  const isDirty = useMemo(() => {
    if (!initialForm) return false;
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setSaveError("Ad boş ola bilməz.");
      return false;
    }

    if (invalidUrlMessage) {
      setSaveError(invalidUrlMessage);
      return false;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          website: form.website.trim(),
          socialMedia: {
            facebook: form.socialMedia.facebook.trim(),
            linkedin: form.socialMedia.linkedin.trim(),
            instagram: form.socialMedia.instagram.trim(),
            twitter: form.socialMedia.twitter.trim(),
            youtube: form.socialMedia.youtube.trim(),
          },
        }),
      });
      const responseJson = await response.json();
      if (!response.ok) throw new Error(responseJson?.error?.message || "Yadda saxlama uğursuz oldu");
      setInitialForm(form);
      setSaveSuccess("Dəyişikliklər uğurla yadda saxlanıldı.");
      return true;
    } catch (error) {
      setSaveError(getUserErrorMessage(error));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfileSection = async () => {
    const ok = await handleSave();
    if (ok) setProfileEditMode(false);
  };

  const handleSaveSocialSection = async () => {
    const ok = await handleSave();
    if (ok) setSocialEditMode(false);
  };

  const handleResendVerification = async () => {
    setSaveError("");
    setSaveSuccess("");
    try {
      const response = await fetch("/api/auth/verify-request", { method: "POST" });
      const responseJson = await response.json();
      if (!response.ok) throw new Error(responseJson?.error?.message || "E-poçt göndərilmədi");
      setSaveSuccess(responseJson?.data?.message || "Təsdiq e-poçtu göndərildi.");
    } catch (error) {
      setSaveError(getUserErrorMessage(error));
    }
  };

  const openEmailModal = async () => {
    setEmailPolicyLoading(true);
    setEmailModalOpen(true);
    setEmailForm({ newEmail: "", currentPassword: "" });

    try {
      const response = await fetch("/api/auth/change-email", { method: "GET" });
      const responseJson = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseJson?.error?.message || "E-poçt siyasəti yüklənmədi");

      const data = responseJson?.data || {};
      setEmailPolicy({
        currentEmail: String(data?.currentEmail || session?.user?.email || ""),
        requiresCurrentPassword: data?.requiresCurrentPassword !== false,
        requiresGoogleReauth: Boolean(data?.requiresGoogleReauth),
        providers: Array.isArray(data?.providers) ? data.providers : [],
      });

      if (data?.requiresGoogleReauth) {
        pushInfo('E-poçtu dəyişmək üçün əvvəlcə Google ilə yenidən daxil ol.');
      }
    } catch (error) {
      showError(getUserErrorMessage(error));
    } finally {
      setEmailPolicyLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    const newEmail = emailForm.newEmail.trim().toLowerCase();
    if (!newEmail) {
      showError("Yeni e-poçt ünvanını daxil et.");
      return;
    }

    if (newEmail === String(session?.user?.email || "").toLowerCase()) {
      showError("Yeni e-poçt mövcud e-poçtla eyni ola bilməz.");
      return;
    }

    if (emailPolicy.requiresCurrentPassword && !emailForm.currentPassword.trim()) {
      showError("Mövcud parol mütləqdir.");
      return;
    }

    if (emailPolicy.requiresGoogleReauth) {
      showError("Əvvəlcə Google ilə yenidən daxil ol, sonra e-poçtu dəyiş.");
      return;
    }

    setChangingEmail(true);
    try {
      const response = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail,
          currentPassword: emailPolicy.requiresCurrentPassword ? emailForm.currentPassword : undefined,
        }),
      });

      const responseJson = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseJson?.error?.message || "E-poçt dəyişdirilə bilmədi");
      }

      showSuccess(responseJson?.data?.message || "Təsdiq linki yeni e-poçta göndərildi.");
      setEmailModalOpen(false);
    } catch (error) {
      showError(getUserErrorMessage(error));
    } finally {
      setChangingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Bütün parol sahələrini doldur.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Yeni parol ən azı 8 simvol olmalıdır.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Yeni parollar eyni deyil.");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("Yeni parol mövcud paroldan fərqli olmalıdır.");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const responseJson = await response.json();
      if (!response.ok) throw new Error(responseJson?.error?.message || "Parol dəyişdirilmədi");

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordSuccess("Parol uğurla yeniləndi.");
    } catch (error) {
      setPasswordError(getUserErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleteSuccess("");

    if (deleteForm.confirmText.trim().toUpperCase() !== deletePolicy.deleteConfirmationText) {
      setDeleteError(`Davam etmək üçün "${deletePolicy.deleteConfirmationText}" yaz.`);
      return;
    }

    if (deletePolicy.requiresCurrentPassword && !deleteForm.currentPassword.trim()) {
      setDeleteError("Mövcud parol mütləqdir.");
      return;
    }

    if (deletePolicy.requiresGoogleReauth) {
      setDeleteError('Hesabı silmək üçün əvvəlcə Google ilə yenidən daxil ol.');
      return;
    }

    setDeletingAccount(true);
    try {
      const response = await fetch("/api/users/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmText: deleteForm.confirmText,
          currentPassword: deletePolicy.requiresCurrentPassword ? deleteForm.currentPassword : "google-reauth",
        }),
      });
      const responseJson = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseJson?.error?.message || "Hesab silinmədi");

      setDeleteSuccess("Hesabın silindi. Çıxış edilir...");
      await signOut();
      router.replace(localePath("/"));
    } catch (error) {
      setDeleteError(getUserErrorMessage(error));
    } finally {
      setDeletingAccount(false);
    }
  };

  const openDeleteModal = async () => {
    setDeleteError("");
    setDeleteSuccess("");
    setDeletePolicyLoading(true);
    setDeleteModalOpen(true);

    try {
      const response = await fetch("/api/users/account", { method: "GET" });
      const responseJson = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseJson?.error?.message || "Silmə siyasəti yüklənmədi");

      const data = responseJson?.data || {};
      setDeletePolicy({
        requiresCurrentPassword: data?.requiresCurrentPassword !== false,
        requiresGoogleReauth: Boolean(data?.requiresGoogleReauth),
        recentlyReauthenticated: Boolean(data?.recentlyReauthenticated),
        providers: Array.isArray(data?.providers) ? data.providers : [],
        deleteConfirmationText: String(data?.deleteConfirmationText || "DELETE"),
      });
      if (data?.requiresGoogleReauth) {
        pushInfo('Google hesabı üçün təsdiq addımı lazımdır. "Google ilə yenidən daxil ol" düyməsini sıx və geri qayıdandan sonra silməni tamamla.');
      }
    } catch (error) {
      setDeleteError(getUserErrorMessage(error));
    } finally {
      setDeletePolicyLoading(false);
    }
  };

  const handleGoogleReauth = async () => {
    setDeleteError("");
    const redirectTo = `${window.location.origin}${localePath('/profile/settings')}`;
    try {
      await signInWithOAuth('google', redirectTo);
    } catch (error) {
      setDeleteError(getUserErrorMessage(error));
    }
  };

  const renderValue = (value?: string) => {
    const normalized = String(value || "").trim();
    if (!normalized) return <span className="text-gray-400">-</span>;
    return <span className="text-gray-900">{normalized}</span>;
  };

  if (loading && !initialForm) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Hesab tənzimləmələri"
          description="Məlumatlar yüklənir..."
        />

        {[0, 1, 2].map((idx) => (
          <SectionCard key={idx} title="Yüklənir..." description="Zəhmət olmasa gözlə.">
            <div className="space-y-3">
              <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-24 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          </SectionCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hesab tənzimləmələri"
        description="Məlumatları yalnız redaktə rejimində dəyiş. Bu səhifə baxış və idarəetmə üçün optimizə olunub."
        actions={
          <Button variant="outline" onClick={() => loadProfile()} disabled={loading || saving || uploading}>
            Yenilə
          </Button>
        }
      />

      <SectionCard
        title="Profil məlumatları"
        description="Əsas profil məlumatları. Redaktə etmək üçün düymədən istifadə et."
        actions={
          profileEditMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (initialForm) setForm(initialForm);
                  setProfileEditMode(false);
                }}
                disabled={saving}
              >
                Ləğv et
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveProfileSection}
                loading={saving}
                disabled={saving || loading || uploading || !isDirty || Boolean(invalidUrlMessage)}
              >
                <Save className="w-4 h-4 mr-2" />
                Yadda saxla
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setProfileEditMode(true)} disabled={loading}>
              <Pencil className="w-4 h-4 mr-2" />
              Redaktə et
            </Button>
          )
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50/40 p-4">
            <div className="h-14 w-14 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <label className={`inline-flex items-center gap-2 text-sm font-medium ${profileEditMode ? "text-primary cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}>
              <Upload className="w-4 h-4" />
              {uploading ? "Yüklənir..." : "Profil şəklini yenilə"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading || !profileEditMode}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </label>
            {form.avatar && profileEditMode && (
              <Button variant="outline" onClick={handleRemoveAvatar} disabled={uploading}>
                <XCircle className="w-4 h-4 mr-2" />
                Şəkli sil
              </Button>
            )}
          </div>

          {profileEditMode ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Ad" required value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                <Input label="Peşə" value={form.occupation} onChange={(e) => setForm((prev) => ({ ...prev, occupation: e.target.value }))} />
                <Input label="Məkan" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
                <Input label="Telefon" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                <Input label="Vebsayt" value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} />
                <Input label="Maraqlar" value={form.interests} onChange={(e) => setForm((prev) => ({ ...prev, interests: e.target.value }))} />
              </div>
              <TextArea label="Bio" rows={4} value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} />
            </>
          ) : (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-4 text-sm md:grid-cols-2">
              <p><span className="text-gray-500">Ad:</span> {renderValue(form.name)}</p>
              <p><span className="text-gray-500">Peşə:</span> {renderValue(form.occupation)}</p>
              <p><span className="text-gray-500">Məkan:</span> {renderValue(form.location)}</p>
              <p><span className="text-gray-500">Telefon:</span> {renderValue(form.phone)}</p>
              <p><span className="text-gray-500">Vebsayt:</span> {renderValue(form.website)}</p>
              <p><span className="text-gray-500">Maraqlar:</span> {renderValue(form.interests)}</p>
              <p className="md:col-span-2"><span className="text-gray-500">Bio:</span> {renderValue(form.bio)}</p>
            </div>
          )}
        </div>
      </SectionCard>

      <UrlHandleSection
        currentHandle={form.urlHandle}
        onChange={(handle) => setForm((prev) => ({ ...prev, urlHandle: handle }))}
        onSave={handleSave}
        previewUrl={form.urlHandle ? `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${form.urlHandle}` : ''}
      />

      <SectionCard
        title="Sosial keçidlər"
        description="Sosial media linklərini ayrıca idarə et."
        actions={
          socialEditMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (initialForm) setForm(initialForm);
                  setSocialEditMode(false);
                }}
                disabled={saving}
              >
                Ləğv et
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveSocialSection}
                loading={saving}
                disabled={saving || loading || uploading || !isDirty || Boolean(invalidUrlMessage)}
              >
                <Save className="w-4 h-4 mr-2" />
                Yadda saxla
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setSocialEditMode(true)} disabled={loading}>
              <Pencil className="w-4 h-4 mr-2" />
              Redaktə et
            </Button>
          )
        }
      >
        {socialEditMode ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Facebook" value={form.socialMedia.facebook} onChange={(e) => setForm((prev) => ({ ...prev, socialMedia: { ...prev.socialMedia, facebook: e.target.value } }))} />
            <Input label="LinkedIn" value={form.socialMedia.linkedin} onChange={(e) => setForm((prev) => ({ ...prev, socialMedia: { ...prev.socialMedia, linkedin: e.target.value } }))} />
            <Input label="Instagram" value={form.socialMedia.instagram} onChange={(e) => setForm((prev) => ({ ...prev, socialMedia: { ...prev.socialMedia, instagram: e.target.value } }))} />
            <Input label="Twitter/X" value={form.socialMedia.twitter} onChange={(e) => setForm((prev) => ({ ...prev, socialMedia: { ...prev.socialMedia, twitter: e.target.value } }))} />
            <Input label="YouTube" value={form.socialMedia.youtube} onChange={(e) => setForm((prev) => ({ ...prev, socialMedia: { ...prev.socialMedia, youtube: e.target.value } }))} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-4 text-sm md:grid-cols-2">
            <p><span className="text-gray-500">Facebook:</span> {renderValue(form.socialMedia.facebook)}</p>
            <p><span className="text-gray-500">LinkedIn:</span> {renderValue(form.socialMedia.linkedin)}</p>
            <p><span className="text-gray-500">Instagram:</span> {renderValue(form.socialMedia.instagram)}</p>
            <p><span className="text-gray-500">Twitter/X:</span> {renderValue(form.socialMedia.twitter)}</p>
            <p><span className="text-gray-500">YouTube:</span> {renderValue(form.socialMedia.youtube)}</p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Account" description="Hesab məlumatların və təhlükəsizlik ayarların.">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{session?.user?.email || "-"}</p>
              </div>
            </div>
            <Button variant="outline" onClick={openEmailModal}>
              E-poçtu dəyiş
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Parolu dəyiş</p>
                <p className="text-sm text-gray-500">Hesab təhlükəsizliyi üçün mütəmadi yenilə.</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setPasswordModalOpen(true)}>
              Aç
            </Button>
          </div>

          {!session?.user?.emailVerified && (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div>
                <p className="font-medium text-amber-900">E-poçt təsdiqi tamamlanmayıb</p>
                <p className="text-sm text-amber-700">Bloq və bəzi funksiyalar üçün təsdiq lazımdır.</p>
              </div>
              <Button variant="outline" onClick={handleResendVerification}>Yenidən göndər</Button>
            </div>
          )}
        </div>
      </SectionCard>

      <NotificationsSettingsSection />

      <SectionCard title="Risk zonası" description="Bu əməliyyatlar geri qaytarıla bilməz.">
        <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-red-900">Hesabı sil</p>
              <p className="text-sm text-red-700">Bu əməliyyat geri qaytarılmır. Davam etmək üçün "DELETE" yaz.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="danger" onClick={openDeleteModal}>
              Hesabı sil
            </Button>
          </div>
        </div>
      </SectionCard>

      <Modal
        isOpen={emailModalOpen}
        onClose={() => {
          if (changingEmail) return;
          setEmailModalOpen(false);
        }}
        title="E-poçtu dəyiş"
        size="md"
      >
        <div className="space-y-4">
          {emailPolicyLoading ? (
            <p className="text-sm text-gray-500">Yüklənir...</p>
          ) : (
            <>
              <p className="text-sm text-gray-700">
                Yeni e-poçtu daxil et. Dəyişiklik təsdiq linki ilə tamamlanacaq.
              </p>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Cari e-poçt: <strong>{emailPolicy.currentEmail || session?.user?.email || "-"}</strong>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Yeni e-poçt"
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))}
                />

                {emailPolicy.requiresCurrentPassword && (
                  <Input
                    label="Mövcud parol"
                    type="password"
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                )}
              </div>

              <div className="flex justify-between gap-2">
                {emailPolicy.requiresGoogleReauth ? (
                  <Button variant="outline" onClick={handleGoogleReauth}>
                    Google ilə yenidən daxil ol
                  </Button>
                ) : (
                  <span />
                )}

                <Button
                  variant="primary"
                  onClick={handleChangeEmail}
                  loading={changingEmail}
                  disabled={
                    changingEmail ||
                    emailPolicyLoading ||
                    !emailForm.newEmail.trim() ||
                    (emailPolicy.requiresCurrentPassword && !emailForm.currentPassword.trim()) ||
                    emailPolicy.requiresGoogleReauth
                  }
                >
                  Təsdiq linki göndər
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={passwordModalOpen}
        onClose={() => {
          if (changingPassword) return;
          setPasswordModalOpen(false);
          setPasswordError("");
        }}
        title="Parolu dəyiş"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Təhlükəsizlik üçün cari parolu təsdiqlə və yeni parol daxil et.</p>

          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Mövcud parol"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
            <Input
              label="Yeni parol"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Minimum 8 simvol"
            />
            <Input
              label="Yeni parol təkrarı"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)} disabled={changingPassword}>Bağla</Button>
            <Button variant="primary" onClick={handleChangePassword} loading={changingPassword} disabled={changingPassword}>Yadda saxla</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (deletingAccount) return;
          setDeleteModalOpen(false);
          setDeleteError("");
        }}
        title="Hesabı sil"
        size="md"
      >
        <div className="space-y-4">
          {deletePolicyLoading ? (
            <p className="text-sm text-gray-500">Yüklənir...</p>
          ) : (
            <>
              <p className="text-sm text-gray-700">
                Bu əməliyyat geri qaytarılmır. Davam etmək üçün təsdiq mətni və mövcud parolu daxil et.
              </p>

              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Təsdiq mətni"
                  placeholder={deletePolicy.deleteConfirmationText}
                  value={deleteForm.confirmText}
                  onChange={(e) => setDeleteForm((prev) => ({ ...prev, confirmText: e.target.value }))}
                />

                {deletePolicy.requiresCurrentPassword && (
                  <Input
                    label="Mövcud parol"
                    type="password"
                    value={deleteForm.currentPassword}
                    onChange={(e) => setDeleteForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                )}
              </div>

              <div className="flex justify-between gap-2">
                {deletePolicy.requiresGoogleReauth ? (
                  <Button variant="outline" onClick={handleGoogleReauth}>
                    Google ilə yenidən daxil ol
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => router.push(localePath('/auth/forgot-password'))}
                  >
                    Parol yarat/sıfırla
                  </Button>
                )}

                <Button
                  variant="danger"
                  onClick={handleDeleteAccount}
                  loading={deletingAccount}
                  disabled={
                    deletingAccount ||
                    deletePolicyLoading ||
                    (deletePolicy.requiresCurrentPassword && !deleteForm.currentPassword.trim()) ||
                    deleteForm.confirmText.trim().toUpperCase() !== deletePolicy.deleteConfirmationText ||
                    deletePolicy.requiresGoogleReauth
                  }
                >
                  Hesabı birdəfəlik sil
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {cropModalOpen && pendingImage && (
        <ImageCropper
          image={pendingImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          isLoading={uploading}
        />
      )}
    </div>
  );
}
