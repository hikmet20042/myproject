"use client";

import { User } from "lucide-react";
import { FOCUS_AREA_LABELS_AZ, ORGANIZATION_TYPE_LABELS } from "@/lib/organizationTypes";
import { Badge } from "@/components/ui/Badge";
import { SocialLink } from "@/components/ui";

interface ProfileViewProps {
  organizationProfile: any;
}

export default function ProfileView({ organizationProfile }: ProfileViewProps) {
  if (!organizationProfile) {
    return (
      <div className="py-8 text-center text-gray-500">
        <User className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <p>{"Profil məlumatı mövcud deyil"}</p>
      </div>
    );
  }

  const infoItems = [
    {
      label: "Təşkilatın Adı",
      value: organizationProfile.organizationName || "Göstərilməyib",
    },
    {
      label: "Təşkilat növü",
      value: organizationProfile.organizationType
        ? ORGANIZATION_TYPE_LABELS[
            organizationProfile.organizationType as keyof typeof ORGANIZATION_TYPE_LABELS
          ] || "Göstərilməyib"
        : "Göstərilməyib",
    },
    {
      label: "Əlaqə Telefonu",
      value: organizationProfile.contactPhone || "Göstərilməyib",
    },
    { label: "Veb-sayt", value: organizationProfile.website || "Göstərilməyib" },
    {
      label: "Qeydiyyat Nömrəsi",
      value: organizationProfile.registrationNumber || "Göstərilməyib",
    },
    { label: "Ünvan", value: organizationProfile.address || "Göstərilməyib" },
    {
      label: "Təsvir",
      value: organizationProfile.description || "Göstərilməyib",
      fullWidth: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {infoItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${item.fullWidth ? "md:col-span-2" : ""}`}
          >
            <h3 className="mb-1 text-sm font-semibold text-slate-900">{item.label}</h3>
            <p className="text-sm text-slate-600">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-2 font-medium text-gray-900">{"Fəaliyyət Sahələri"}</h3>
        <div className="flex flex-wrap gap-2">
          {organizationProfile.focusAreas?.length > 0 ? (
            organizationProfile.focusAreas.map((area: string, index: number) => (
              <Badge key={index} variant="primary" size="sm">{FOCUS_AREA_LABELS_AZ[area as keyof typeof FOCUS_AREA_LABELS_AZ] || area}</Badge>
            ))
          ) : (
            <span className="text-gray-600">{"Fəaliyyət sahələri göstərilməyib"}</span>
          )}
        </div>
      </div>

      {organizationProfile.socialMedia &&
        Object.values(organizationProfile.socialMedia).some((link: any) => link) && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-2 font-medium text-gray-900">{"Sosial Media"}</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'facebook', platform: 'facebook' as const, url: organizationProfile.socialMedia.facebook },
                { key: 'twitter', platform: 'twitter' as const, url: organizationProfile.socialMedia.twitter },
                { key: 'instagram', platform: 'instagram' as const, url: organizationProfile.socialMedia.instagram },
                { key: 'linkedin', platform: 'linkedin' as const, url: organizationProfile.socialMedia.linkedin },
                { key: 'youtube', platform: 'youtube' as const, url: organizationProfile.socialMedia.youtube },
              ].map(({ key, platform, url }) => url ? (
                <SocialLink key={key} platform={platform} href={url} variant="compact" />
              ) : null)}
            </div>
          </div>
        )}
    </div>
  );
}
