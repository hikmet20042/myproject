"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/feedback";
import {
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPE_VALUES,
} from "@/lib/organizationTypes";

interface ProfileFormProps {
  organizationProfile: any;
  onSave: (profile: any) => void;
  onCancel: () => void;
}

export default function ProfileForm({
  organizationProfile,
  onSave,
  onCancel,
}: ProfileFormProps) {
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
  });
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const focusAreaOptions = [
    { key: "humanRights", label: "İnsan Hüquqları" },
    { key: "womenRights", label: "Qadın Hüquqları" },
    { key: "childrenRights", label: "Uşaq Hüquqları" },
    { key: "education", label: "Təhsil" },
    { key: "healthcare", label: "Səhiyyə" },
    { key: "environment", label: "Ətraf Mühit" },
    { key: "povertyAlleviation", label: "Yoxsulluğun Azaldılması" },
    { key: "legalAid", label: "Hüquqi Yardım" },
    { key: "communityDevelopment", label: "İcma İnkişafı" },
    { key: "youthDevelopment", label: "Gənclər İnkişafı" },
    { key: "elderlyCare", label: "Qocalar Qayğısı" },
    { key: "disabilityRights", label: "Əlillik Hüquqları" },
  ];

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
      const response = await fetch("/api/profile/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setSaveFeedback({
          variant: "success",
          message: "Profile updated successfully.",
        });
        onSave(updatedProfile.organizationProfile);
      } else {
        setSaveFeedback({
          variant: "error",
          message: "Could not update your profile. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveFeedback({
        variant: "error",
        message: "Something went wrong while updating your profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {saveFeedback && (
        <Alert
          variant={saveFeedback.variant}
          dismissible
          onDismiss={() => setSaveFeedback(null)}
        >
          {saveFeedback.message}
        </Alert>
      )}

      <section className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Basic Info</h3>
          <p className="mt-1 text-sm text-slate-600">
            Core details that identify your organization.
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
                    checked={formData.focusAreas.includes(area.label)}
                    onChange={(e) => handleFocusAreaChange(area.label, e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{area.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Contact</h3>
          <p className="mt-1 text-sm text-slate-600">
            Information people use to reach your organization.
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

      <section className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Social Links</h3>
          <p className="mt-1 text-sm text-slate-600">
            Add official channels so people can follow your work.
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

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-2">
        <Button onClick={onCancel} variant="outline" disabled={saving}>
          {"Ləğv et"}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !formData.organizationName || !formData.description}
          variant="primary"
        >
          {saving ? "Saxlanılır..." : "Dəyişiklikləri Saxla"}
        </Button>
      </div>
    </div>
  );
}
