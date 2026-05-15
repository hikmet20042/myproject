"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  DollarSign,
  ExternalLink,
  Building,
  CheckCircle,
  FileText,
  Mail,
  Eye,
  MapPin,
  Briefcase,
  Clock,
} from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import SaveItemButtonContainer from "@/components/containers/SaveItemButtonContainer";
import ViewTracker from "@/components/ViewTracker";
import { LoadingState, ErrorState } from "@/components/shared";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { DetailPageLayout } from "@/components/layout";

interface Vacancy {
  _id: string;
  id: string;
  slug: string;
  title: string;
  description: string;
  type: "full_time" | "part_time" | "volunteer" | "intern";
  city: string;
  address?: string | null;
  requirements: string[];
  responsibilities: string[];
  ageMin: number;
  ageMax: number;
  isPaid: boolean;
  paymentMode?: "fixed" | "range" | null;
  paymentAmount?: number | null;
  paymentMin?: number | null;
  paymentMax?: number | null;
  benefits: string[];
  applicationMethod: "link" | "email" | "phone";
  applicationValue: string;
  periodFromMonth?: number | null;
  periodFromYear?: number | null;
  periodToMonth?: number | null;
  periodToYear?: number | null;
  imageUrl?: string;
  applicationDeadline: string;
  createdBy: {
    _id: string;
    name: string;
  };
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  views: number;
  createdAt: string;
}

export default function VacancyDetailPage() {
  const localePath = useLocalizedPath();
  const params = useParams();
  const router = useRouter();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showError } = useGlobalFeedback();

  useEffect(() => {
    if (params?.slug) {
      void fetchVacancy(params.slug as string);
    }
  }, [params?.slug]);

  useEffect(() => {
    if (error) showError(error);
  }, [error, showError]);

  const fetchVacancy = async (id: string) => {
    try {
      const response = await fetch(`/api/vacancies/${id}`);
      if (!response.ok) throw new Error("Vakansiya tapılmadı");
      const data = await response.json();
      setVacancy(
        (data?.data?.vacancy || data?.vacancy || null) as Vacancy | null,
      );
    } catch (err) {
      console.error("Vakansiya yükləmə xətası:", err);
      setError("Vakansiya detalları yüklənmədi");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Tarix müəyyən deyil";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Etibarsız tarix";
    return date.toLocaleDateString("az-AZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTypeColor = (type: string) => {
    if (type === "full_time") return "bg-green-100 text-green-800";
    if (type === "part_time") return "bg-emerald-100 text-emerald-800";
    if (type === "volunteer") return "bg-blue-100 text-blue-800";
    if (type === "intern") return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };
  const getTypeLabel = (type: string) => {
    if (type === "full_time") return "Full-time";
    if (type === "part_time") return "Part-time";
    if (type === "volunteer") return "Könüllülük";
    if (type === "intern") return "Intern";
    return type;
  };

  if (loading) {
    return <LoadingState text="Vakansiya detalları yüklənir..." />;
  }

  if (error || !vacancy) {
    return (
      <ErrorState
        title={"Vakansiya tapılmadı"}
        message={error || "Axtardığınız vakansiya mövcud deyil və ya silinib."}
        onRetry={() => router.push(localePath("/resources/vacancies"))}
        retryText={"Vakansiyalara qayıt"}
      />
    );
  }

  const daysUntilDeadline = getDaysUntilDeadline(vacancy.applicationDeadline);
  const isDeadlinePassed = daysUntilDeadline < 0;
  const isDeadlineNear = daysUntilDeadline > 0 && daysUntilDeadline <= 7;
  const method = vacancy.applicationMethod;
  const methodValue = vacancy.applicationValue;

  return (
    <>
      {vacancy.status === "approved" && (
        <ViewTracker
          itemType="vacancy"
          itemId={vacancy.slug}
          minTimeMs={10000}
          selector="#vacancy-content"
        />
      )}
      <DetailPageLayout
        backHref={localePath("/resources/vacancies")}
        backLabel="Bütün Vakansiyalar"
        breadcrumbItems={[
          { label: "Ana səhifə", href: localePath("/") },
          { label: "Resurslar", href: localePath("/resources") },
          { label: "Vakansiyalar", href: localePath("/resources/vacancies") },
          { label: vacancy.title, current: true },
        ]}
        pageType="vacancy"
        title={vacancy.title}
        metadata={
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                {vacancy.createdBy?.name?.charAt(0).toUpperCase() || "V"}
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Təşkilatçı
                </p>
                <p className="text-slate-900 font-black">
                  {vacancy.createdBy?.name || "Naməlum"}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-100 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Məkan
                </p>
                <p className="text-slate-900 font-black">
                  {vacancy.city}
                  {vacancy.address ? `, ${vacancy.address}` : ""}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-100 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  İş növü
                </p>
                <p className="text-slate-900 font-black">
                  {getTypeLabel(vacancy.type)}
                </p>
              </div>
            </div>

            {vacancy.isPaid && (
              <>
                <div className="h-8 w-px bg-slate-100 hidden md:block" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Maaş
                    </p>
                    <p className="text-slate-900 font-black">
                      {vacancy.paymentMode === "fixed"
                        ? `${vacancy.paymentAmount} AZN`
                        : `${vacancy.paymentMin} - ${vacancy.paymentMax} AZN`}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        }
        mainContent={
          <div className="space-y-12">
            <div
              id="vacancy-content"
              className="prose prose-xl max-w-none
              prose-headings:font-black prose-headings:text-slate-900
              prose-p:text-slate-600 prose-p:leading-relaxed
            "
            >
              <h2 className="text-3xl font-black text-slate-900 mb-6">
                İş təsviri
              </h2>
              {vacancy.description.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {vacancy.requirements?.length > 0 && (
              <div className="pt-10 border-t border-slate-50">
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  Tələblər
                </h3>
                <ul className="grid gap-4">
                  {vacancy.requirements.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-slate-700"
                    >
                      <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {vacancy.responsibilities?.length > 0 && (
              <div className="pt-10 border-t border-slate-50">
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  Məsuliyyətlər
                </h3>
                <ul className="grid gap-4">
                  {vacancy.responsibilities.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-slate-700"
                    >
                      <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0 mt-2.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        }
        actionSection={
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-md text-center md:text-left">
              <h3 className="text-2xl font-black mb-2 text-white">
                Müraciət etməyə hazırsan?
              </h3>
              <p className="text-slate-400 font-medium text-lg">
                Bu komandanın bir hissəsi olmaq fürsətini qaçırma.
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-col items-center gap-4">
              {method === "link" && methodValue && (
                <ButtonLink
                  href={methodValue}
                  external
                  variant="secondary"
                  size="lg"
                  className="w-full md:w-auto rounded-2xl px-12 py-4 font-black bg-white text-slate-900 border-none hover:bg-slate-100"
                >
                  Dərhal müraciət et
                </ButtonLink>
              )}
              {(method === "email" || method === "phone") && (
                <ButtonLink
                  href={
                    method === "email"
                      ? `mailto:${methodValue}`
                      : `tel:${methodValue}`
                  }
                  variant="secondary"
                  size="lg"
                  className="w-full md:w-auto rounded-2xl px-12 py-4 font-black bg-white text-slate-900 border-none hover:bg-slate-100"
                >
                  {method === "email"
                    ? "E-poçt ilə müraciət"
                    : "Zəng ilə müraciət"}
                </ButtonLink>
              )}
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {vacancy.views || 0} baxış
              </p>
            </div>
          </div>
        }
        sidebar={
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>
                Məlumatlar
              </h3>
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Son müraciət tarixi
                  </p>
                  <p
                    className={`text-xl font-black ${isDeadlinePassed ? "text-rose-600" : "text-slate-900"}`}
                  >
                    {formatDate(vacancy.applicationDeadline)}
                  </p>
                  {!isDeadlinePassed && (
                    <p
                      className={`text-sm font-bold ${isDeadlineNear ? "text-orange-500" : "text-slate-500"}`}
                    >
                      {daysUntilDeadline} gün qalıb
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Yaş aralığı
                  </p>
                  <p className="text-xl font-black text-slate-900">
                    {vacancy.ageMin} - {vacancy.ageMax}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <SaveItemButtonContainer
                    itemId={vacancy.id}
                    itemType="vacancy"
                    itemTitle={vacancy.title}
                    size="md"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        }
      />
    </>
  );
}
