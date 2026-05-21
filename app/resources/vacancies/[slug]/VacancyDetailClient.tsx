"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Briefcase,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
} from "lucide-react";
import { ButtonLink } from "@/components/ui";
import Script from "next/script";
import { Card } from "@/components/ui/Card";
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

  const fetchVacancy = async (slugOrId: string) => {
    try {
      const resolveResponse = await fetch(`/api/vacancies/resolve/${slugOrId}`);
      if (!resolveResponse.ok) throw new Error("Vakansiya tapılmadı");
      const resolvedPayload = await resolveResponse.json();
      const vacancyId = String(resolvedPayload?.data?.id || resolvedPayload?.id || "");
      if (!vacancyId) throw new Error("Vakansiya tapılmadı");

      const response = await fetch(`/api/vacancies/${vacancyId}`);
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

  const getTypeLabel = (type: string) => {
    if (type === "full_time") return "Tam ştat";
    if (type === "part_time") return "Yarım ştat";
    if (type === "volunteer") return "Könüllülük";
    if (type === "intern") return "Təcrübəçi";
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
  const vacancyDescription = vacancy.description || "";

  const vacancyUrl = localePath(`/resources/vacancies/${vacancy.slug}`);
  const employmentType =
    vacancy.type === "part_time" ? "PART_TIME"
    : vacancy.type === "intern" ? "INTERN"
    : vacancy.type === "volunteer" ? "VOLUNTEER"
    : "FULL_TIME";

  const salaryRange = vacancy.isPaid && vacancy.paymentMode === "range"
    ? `${vacancy.paymentMin ?? 0}-${vacancy.paymentMax ?? 0}`
    : vacancy.isPaid && vacancy.paymentMode === "fixed"
      ? String(vacancy.paymentAmount ?? 0)
      : undefined;

  const jobPostingJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: vacancy.title,
    description: vacancy.description,
    datePosted: vacancy.createdAt,
    validThrough: vacancy.applicationDeadline,
    employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: vacancy.createdBy?.name || "Naməlum",
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: vacancy.address ?? undefined,
        addressLocality: vacancy.city,
        addressCountry: 'AZ',
      },
    },
    baseSalary: salaryRange ? {
      '@type': 'MonetaryAmount',
      currency: 'AZN',
      value: { '@type': 'QuantitativeValue', value: salaryRange, unitText: 'MONTH' },
    } : undefined,
    url: vacancyUrl.startsWith('http') ? vacancyUrl : `${process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'}${vacancyUrl}`,
  });

  return (
    <>
      {vacancy.status === "approved" && (
        <ViewTracker
          itemType="vacancy"
          itemId={vacancy.id}
          minTimeMs={10000}
          selector="#vacancy-content"
        />
      )}
      {/* JSON-LD JobPosting */}
      <Script id="vacancy-jobposting-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: jobPostingJsonLd }} />

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
        coverImage={vacancy.imageUrl || undefined}
        metadata={
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                {vacancy.createdBy?.name?.charAt(0).toUpperCase() || "V"}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Təşkilatçı
                </p>
                <p className="text-slate-900 font-semibold">
                  {vacancy.createdBy?.name || "Naməlum"}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Məkan
                </p>
                <p className="text-slate-900 font-semibold">
                  {vacancy.city}
                  {vacancy.address ? `, ${vacancy.address}` : ""}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  İş növü
                </p>
                <p className="text-slate-900 font-semibold">
                  {getTypeLabel(vacancy.type)}
                </p>
              </div>
            </div>

            {vacancy.isPaid && (
              <>
                <div className="h-8 w-px bg-slate-200 hidden md:block" />
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Maaş
                    </p>
                    <p className="text-slate-900 font-semibold">
                      {vacancy.paymentMode === "fixed"
                        ? `${vacancy.paymentAmount} AZN`
                        : `${vacancy.paymentMin} - ${vacancy.paymentMax} AZN`}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="h-8 w-px bg-slate-200 hidden md:block" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Yayım tarixi
                </p>
                <p className="text-slate-900 font-semibold">
                  {formatDate(vacancy.createdAt)}
                </p>
              </div>
            </div>
          </div>
        }
        mainContent={
          <div className="space-y-10">
            <div className="rounded-xl border border-slate-200 p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText className="h-4 w-4" />
                </div>
                İş təsviri
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-3">
                {vacancyDescription.split("\n").map((paragraph, index) => (
                  paragraph.trim() && <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {vacancy.requirements?.length > 0 && (
              <div className="rounded-xl border border-slate-200 p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  Tələblər
                </h3>
                <ul className="space-y-3">
                  {vacancy.requirements.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {vacancy.responsibilities?.length > 0 && (
              <div className="rounded-xl border border-slate-200 p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  Məsuliyyətlər
                </h3>
                <ul className="space-y-3">
                  {vacancy.responsibilities.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        }
        actionSection={
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md text-center md:text-left">
              <h3 className="text-xl font-bold mb-1 text-slate-900">
                Müraciət etməyə hazırsan?
              </h3>
              <p className="text-slate-600">
                Bu komandanın bir hissəsi olmaq fürsətini qaçırma.
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-col items-center gap-3">
              {method === "link" && methodValue && (
                <ButtonLink
                  href={methodValue}
                  external
                  variant="white-on-dark"
                  size="lg"
                  className="w-full md:w-auto rounded-xl px-10 py-3.5 font-bold"
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
                  variant="white-on-dark"
                  size="lg"
                  className="w-full md:w-auto rounded-xl px-10 py-3.5 font-bold"
                >
                  {method === "email"
                    ? "E-poçt ilə müraciət"
                    : "Zəng ilə müraciət"}
                </ButtonLink>
              )}
              <p className="text-xs font-medium text-slate-500">
                {vacancy.views || 0} baxış
              </p>
            </div>
          </div>
        }
        sidebar={
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Clock className="h-4 w-4" />
                </div>
                Məlumatlar
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Son müraciət tarixi
                  </p>
                  <p
                    className={`text-lg font-bold ${isDeadlinePassed ? "text-rose-600" : "text-slate-900"}`}
                  >
                    {formatDate(vacancy.applicationDeadline)}
                  </p>
                  {!isDeadlinePassed && (
                    <p
                      className={`text-sm font-medium ${isDeadlineNear ? "text-orange-500" : "text-slate-500"}`}
                    >
                      {daysUntilDeadline} gün qalıb
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Yaş aralığı
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {vacancy.ageMin} - {vacancy.ageMax}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <SaveItemButtonContainer
                    itemId={vacancy.id}
                    itemType="vacancy"
                    itemTitle={vacancy.title}
                    size="md"
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          </div>
        }
      />
    </>
  );
}
