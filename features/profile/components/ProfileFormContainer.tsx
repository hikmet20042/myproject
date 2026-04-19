"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/feedback";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import {
  FOCUS_AREA_LABELS_AZ,
  FOCUS_AREA_VALUES,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPE_VALUES,
} from "@/lib/organizationTypes";
import { updateMyOrganization } from "@/lib/organizationQueries";
import { logError } from "@/lib/logger";
import { ImageCropper } from "@/components/shared";

interface ProfileFormContainerProps {
  organizationProfile: any;
  onSave: (profile: any) => void;
  onCancel: () => void;
}

export default function ProfileFormContainer({
  organizationProfile,
  onSave,
  onCancel,
}: ProfileFormContainerProps) {
  const [formData, setFormData] = useState({
    organizationName: organizationProfile?.organizationName || "",
    organizationType: organizationProfile?.organizationType || "",
    description: organizationProfile?.description || "",
    website: organizationProfile?.website || "",
    contactPhone: organizationProfile?.contactPhone || "",
    address: organizationProfile?.address || "",
    registrationNumber: organizationProfile?.registrationNumber || "",
    focusAreas: organizationProfile?.focusAreas || [],
    socialMedia: organizationProfile?.socialMedia || {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      youtube: "",
      website: "",
    },
    profileImage: organizationProfile?.profileImage || "",
    urlHandle: organizationProfile?.urlHandle || "",
  });
  const { showError, showSuccess } = useGlobalFeedback();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const focusAreaOptions = FOCUS_AREA_VALUES.map((value) => ({
    key: value,
    label: FOCUS_AREA_LABELS_AZ[value],
  }));

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        focusAreas: [...prev.focusAreas, area],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        focusAreas: prev.focusAreas.filter((a: string) => a !== area),
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveFeedback(null);
      try {
        const updatedProfile = await updateMyOrganization(formData);
        setSaveFeedback({
          variant: "success",
          message: "Profil uğurla yeniləndi.",
        });
        onSave(updatedProfile.organization);
      } catch (error: any) {
        logError("Organization profile update API error", error);
        setSaveFeedback({
          variant: "error",
          message: error?.message || "Məlumatları yükləyərkən problem baş verdi",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveFeedback({
        variant: "error",
        message: "Profil yenilənərkən gözlənilməz problem baş verdi.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageUpload = async (file: File) => {
    const uploadData = new FormData();
    uploadData.append("file", file);
    try {
      setUploadingImage(true);
      const response = await fetch("/api/profile/image", {
        method: "POST",
        body: uploadData,
      });
      const result = await response.json();
      if (!response.ok || !result?.data?.url) {
        showError(result?.error?.message || "Şəkil yüklənmədi");
        return;
      }

      const imageUrl = result.data.url as string;
      setFormData((prev) => ({ ...prev, profileImage: imageUrl }));
      showSuccess("Profil şəkli yeniləndi.");
    } catch (error) {
      logError("Profile image upload error", error);
      showError("Şəkil yüklənmədi. Zəhmət olmasa yenidən cəhd edin.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setPendingImage(file);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setCropModalOpen(false);
    setPendingImage(null);
    await handleProfileImageUpload(croppedFile);
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setPendingImage(null);
  };

  return (
    <div className="space-y-10">
      {saveFeedback && (
        <Alert
          variant={saveFeedback.variant}
          dismissible
          onDismiss={() => setSaveFeedback(null)}
        >
          {saveFeedback.message}
        </Alert>
      )}

      <section className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 md:p-8">
        <div>
          <h3 className="ui-h3 text-slate-900">Profil şəkli</h3>
          <p className="mt-1 text-sm text-slate-600">
            Təşkilatınızı tanıdan profil şəklini yükləyin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-white">
            {formData.profileImage ? (
              <Image
                src={formData.profileImage}
                alt="Təşkilat profil şəkli"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-500">
                {(formData.organizationName || "T").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              disabled={uploadingImage}
            />
            <p className="text-xs text-slate-500">
              Şəkil kvadrat (1:1) kəsilir və yüngülləşdirilir.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 md:p-8">
        <div>
          <h3 className="ui-h3 text-slate-900">Əsas məlumatlar</h3>
          <p className="mt-1 text-sm text-slate-600">
            Təşkilatını tanıdan ən vacib məlumatları daxil et.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Input
              label={`${"Təşkilatın Adı"} ${"*"}`}
              type="text"
              value={formData.organizationName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  organizationName: (e.target as HTMLInputElement).value,
                }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{"Profil keçidi"}</label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-gray-500 text-sm">/o/</span>
              <input
                type="text"
                value={formData.urlHandle}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    urlHandle: (e.target as HTMLInputElement).value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                  }))
                }
                placeholder="təşkilat-adı"
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                maxLength={50}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Kiçik hərflər, rəqəmlər, defis və alt xətt. Boş buraxılsa, ad avtomatik istifadə olunacaq.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{"Təşkilat növü"}</label>
            <select
              value={formData.organizationType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  organizationType: (e.target as HTMLSelectElement).value,
                }))
              }
              className="mt-1 block w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-10 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
              required
            >
              <option value="">{"Təşkilat növünü seçin"}</option>
              {ORGANIZATION_TYPE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {ORGANIZATION_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <TextArea
              label={`${"Təsvir"} ${"*"}`}
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: (e.target as HTMLTextAreaElement).value,
                }))
              }
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {"Fəaliyyət Sahələri"}
            </label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {focusAreaOptions.map((area) => (
                <label
                  key={area.key}
                  className="flex items-center rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.focusAreas.includes(area.key)}
                    onChange={(e) => handleFocusAreaChange(area.key, e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{area.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 md:p-8">
        <div>
          <h3 className="ui-h3 text-slate-900">Əlaqə</h3>
          <p className="mt-1 text-sm text-slate-600">
            İnsanların səninlə rahat əlaqə qurması üçün məlumatları əlavə et.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Input
              label={"Əlaqə Telefonu"}
              type="tel"
              value={formData.contactPhone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contactPhone: (e.target as HTMLInputElement).value,
                }))
              }
            />
          </div>
          <div>
            <Input
              label={"Veb-sayt"}
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  website: (e.target as HTMLInputElement).value,
                }))
              }
              placeholder={"https://təşkilatın.org"}
            />
          </div>
          <div>
            <Input
              label={"Qeydiyyat Nömrəsi"}
              type="text"
              value={formData.registrationNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  registrationNumber: (e.target as HTMLInputElement).value,
                }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <TextArea
              label={"Ünvan"}
              rows={3}
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  address: (e.target as HTMLTextAreaElement).value,
                }))
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 md:p-8">
        <div>
          <h3 className="ui-h3 text-slate-900">Sosial keçidlər</h3>
          <p className="mt-1 text-sm text-slate-600">
            Rəsmi səhifələri əlavə et ki, insanlar işini izləyə bilsin.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Input
              label={"Facebook"}
              type="url"
              value={formData.socialMedia?.facebook || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  socialMedia: {
                    ...prev.socialMedia,
                    facebook: (e.target as HTMLInputElement).value,
                  },
                }))
              }
              placeholder={"https://facebook.com/səhifəniz"}
            />
          </div>
          <div>
            <Input
              label={"Twitter"}
              type="url"
              value={formData.socialMedia?.twitter || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  socialMedia: {
                    ...prev.socialMedia,
                    twitter: (e.target as HTMLInputElement).value,
                  },
                }))
              }
              placeholder={"https://twitter.com/istifadəçiadınız"}
            />
          </div>
          <div>
            <Input
              label={"Instagram"}
              type="url"
              value={formData.socialMedia?.instagram || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  socialMedia: {
                    ...prev.socialMedia,
                    instagram: (e.target as HTMLInputElement).value,
                  },
                }))
              }
              placeholder={"https://instagram.com/profiliniz"}
            />
          </div>
          <div>
            <Input
              label={"LinkedIn"}
              type="url"
              value={formData.socialMedia?.linkedin || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  socialMedia: {
                    ...prev.socialMedia,
                    linkedin: (e.target as HTMLInputElement).value,
                  },
                }))
              }
              placeholder={"https://linkedin.com/company/şirkətiniz"}
            />
          </div>
          <div>
            <Input
              label={"YouTube"}
              type="url"
              value={formData.socialMedia?.youtube || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  socialMedia: {
                    ...prev.socialMedia,
                    youtube: (e.target as HTMLInputElement).value,
                  },
                }))
              }
              placeholder={"https://youtube.com/channel/kanalınız"}
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <Button onClick={onCancel} variant="outline" disabled={saving}>
          {"Ləğv et"}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || uploadingImage || !formData.organizationName || !formData.description}
          variant="primary"
          size="lg"
          className="min-w-[220px]"
        >
          {saving ? "Saxlanılır..." : uploadingImage ? "Şəkil yüklənir..." : "Dəyişiklikləri Saxla"}
        </Button>
      </div>

      {cropModalOpen && pendingImage && (
        <ImageCropper
          image={pendingImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          isLoading={uploadingImage}
        />
      )}
    </div>
  );
}
