"use client";

import { User } from "lucide-react";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/organizationTypes";

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
              <span
                key={index}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
              >
                {area}
              </span>
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
              {organizationProfile.socialMedia.facebook && (
                <a
                  href={organizationProfile.socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
                >
                  {"Facebook"}
                </a>
              )}
              {organizationProfile.socialMedia.twitter && (
                <a
                  href={organizationProfile.socialMedia.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-50 hover:text-cyan-800"
                >
                  {"Twitter"}
                </a>
              )}
              {organizationProfile.socialMedia.instagram && (
                <a
                  href={organizationProfile.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 hover:text-indigo-800"
                >
                  {"Instagram"}
                </a>
              )}
              {organizationProfile.socialMedia.linkedin && (
                <a
                  href={organizationProfile.socialMedia.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
                >
                  {"LinkedIn"}
                </a>
              )}
              {organizationProfile.socialMedia.youtube && (
                <a
                  href={organizationProfile.socialMedia.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-rose-200 bg-white px-3 py-1 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 hover:text-rose-800"
                >
                  {"YouTube"}
                </a>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
