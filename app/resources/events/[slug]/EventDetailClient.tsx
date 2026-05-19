"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Tag,
} from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import Script from "next/script";
import SaveItemButtonContainer from "@/components/containers/SaveItemButtonContainer";
import ViewTracker from "@/components/ViewTracker";
import { LoadingState, ErrorState } from "@/components/shared";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import {
  eventQueryKeys,
  fetchEventById,
  resolveEventIdentifier,
} from "@/lib/eventQueries";
import { DetailPageLayout } from "@/components/layout";

interface Event {
  _id: string;
  id: string;
  slug: string;
  status: string;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  endDate?: string;
  location: {
    type: "online" | "physical" | "hybrid";
    address?: string;
    city?: string;
    country?: string;
    onlineLink?: string;
  };
  applicationLink?: string;
  applicationDeadline?: string;
  eventType: string;
  maxParticipants: number;
  sessions?: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
  audienceAgeMin?: number;
  audienceAgeMax?: number;
  requirements?: string[];
  participantBenefits?: string[];
  certification?: {
    provided?: boolean;
  };
  tags: string[];
  imageUrl?: string;
  createdBy: {
    _id: string;
    slug: string;
    urlHandle?: string | null;
    name: string;
    email?: string;
  };
  createdByOrganization?: {
    _id?: string;
    id?: string;
    slug?: string;
    urlHandle?: string | null;
    organizationName?: string;
    email?: string;
  };
  organizationName?: string;
  isApproved: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  views?: number;
}

export default function EventDetailPage() {
  const localePath = useLocalizedPath();
  const { showError } = useGlobalFeedback();

  const params = useParams();
  const eventSlug = String(params?.slug || "");
  const resolveQuery = useQuery({
    queryKey: ["event-resolve", eventSlug],
    queryFn: () => resolveEventIdentifier(eventSlug),
    enabled: !!eventSlug,
    retry: false,
  });
  const eventId = resolveQuery.data?.id || "";
  const eventQuery = useQuery({
    queryKey: eventQueryKeys.detail(eventId),
    queryFn: () => fetchEventById(eventId),
    enabled: !!eventId,
    retry: false,
  });
  const event = eventQuery.data as Event | undefined;

  useEffect(() => {
    if (resolveQuery.isError || eventQuery.isError) {
      showError(
        (resolveQuery.error instanceof Error && resolveQuery.error.message) ||
          (eventQuery.error instanceof Error && eventQuery.error.message) ||
          "Tədbir yüklənmədi",
      );
    }
  }, [resolveQuery.isError, resolveQuery.error, eventQuery.isError, eventQuery.error, showError]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Tarix müəyyən deyil";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Etibarsız tarix";
    return date.toLocaleDateString("az-AZ", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "Vaxt müəyyən deyil";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Vaxt müəyyən deyil";
    return date.toLocaleTimeString("az-AZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryLabel = (val: string) => {
    const labels: Record<string, string> = {
      "Human Rights": "İnsan hüquqları",
      "Women Rights": "Qadın hüquqları",
      "Children Rights": "Uşaq hüquqları",
      Education: "Təhsil",
      Healthcare: "Səhiyyə",
      Environment: "Ətraf mühit",
      "Poverty Alleviation": "Yoxsulluğun azaldılması",
      "Legal Aid": "Hüquqi yardım",
      "Community Development": "İcmanın inkişafı",
      "Youth Development": "Gənclərin inkişafı",
      "Elderly Care": "Yaşlılara qayğı",
      "Disability Rights": "Əlillik hüquqları",
      "LGBTQ+ Rights": "LGBTQ+ hüquqları",
      "Mental Health": "Psixi sağlamlıq",
    };
    return labels[val] || val;
  };

  const getLocationTypeLabel = (type: string) => {
    if (type === "online") return "Onlayn";
    if (type === "physical") return "Fiziki";
    if (type === "hybrid") return "Hibrid";
    return type;
  };

  const isDeadlinePassed = (deadline: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };
  const hasActiveApplicationLink = !!event?.applicationLink;
  const eventDescription = event?.description || "";
  const locationType = event?.location?.type || "physical";

  const getEventJsonLd = (evt: any) => {
    const eventUrl = localePath(`/resources/events/${evt.slug}`);
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: evt.title,
      description: evt.description,
      startDate: evt.eventDate,
      endDate: evt.endDate || evt.eventDate,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: evt.location?.type === "online"
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : evt.location?.type === "hybrid"
          ? 'https://schema.org/MixedEventAttendanceMode'
          : 'https://schema.org/OfflineEventAttendanceMode',
      location: evt.location?.type === "online" ? {
        '@type': 'VirtualLocation',
        url: evt.onlineLink,
      } : {
        '@type': 'Place',
        name: evt.location?.city,
        address: {
          '@type': 'PostalAddress',
          addressLocality: evt.location?.city || "Bakı",
          addressCountry: 'AZ',
        },
      },
      organizer: {
        '@type': 'Organization',
        name: evt.organizationName || evt.createdBy?.name || "Naməlum",
      },
      image: evt.imageUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'}/opengraph-image`,
      url: localePath(`/resources/events/${evt.slug}`),
    });
  };

  if (resolveQuery.isLoading || eventQuery.isLoading) {
    return <LoadingState text={"Tədbir təfərrüatları yüklənir..."} />;
  }

  if (resolveQuery.isError || eventQuery.isError || !eventId || !event) {
    return (
      <ErrorState
        title={"Tədbir tapılmadı"}
        message={
          (resolveQuery.error instanceof Error && resolveQuery.error.message) ||
          (eventQuery.error instanceof Error
            ? eventQuery.error.message
            : "Axtardığın tədbir mövcud deyil."
          )
        }
        onRetry={() => {
          void resolveQuery.refetch();
          void eventQuery.refetch();
        }}
        retryText={"Yenidən cəhd et"}
        gradientFrom="from-red-50"
        gradientVia="via-orange-50"
        gradientTo="to-yellow-50"
      />
    );
  }

  return (
    <>
      {event.status === "approved" && (
        <ViewTracker
          itemType="event"
          itemId={event.id}
          minTimeMs={10000}
          selector="#event-content"
        />
      )}
      {/* JSON-LD Event Schema */}
      <Script id="event-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: getEventJsonLd(event) }} />

      <DetailPageLayout
        backHref={localePath("/resources/events")}
        backLabel="Bütün Tədbirlər"
        breadcrumbItems={[
          { label: "Ana Səhifə", href: localePath("/") },
          { label: "Tədbirlər", href: localePath("/resources/events") },
          { label: event.title, current: true },
        ]}
        pageType="event"
        title={event.title}
        coverImage={event.imageUrl}
        metadata={
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Kateqoriya
                </p>
                <p className="text-slate-900 font-semibold">
                  {getCategoryLabel(event.category)}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tarix
                </p>
                <p className="text-slate-900 font-semibold">
                  {formatDate(event.eventDate)}
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
                  {event.location?.city || "Bakı, Azərbaycan"}
                </p>
              </div>
            </div>
          </div>
        }
        mainContent={
          <div className="space-y-10">
            <div
              id="event-content"
              className="prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-slate-900
              prose-p:text-slate-600 prose-p:leading-relaxed
            "
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Tədbir haqqında
              </h2>
              {eventDescription.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="pt-8 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Tag className="h-4 w-4" />
                  </div>
                  Teqlər
                </h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 text-sm font-medium text-slate-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        }
        actionSection={
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md text-center md:text-left">
              <h3 className="text-xl font-bold mb-1 text-slate-900">
                İştirak etmək istəyirsən?
              </h3>
              <p className="text-slate-600">
                Bu fürsəti qaçırma, dərhal müraciət et və icmaya qoşul.
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-col items-center gap-3">
              {hasActiveApplicationLink ? (
                <ButtonLink
                  href={event.applicationLink!}
                  variant="white-on-dark"
                  size="lg"
                  className="w-full md:w-auto rounded-xl px-10 py-3.5 font-bold"
                  external
                >
                  Müraciət et
                </ButtonLink>
              ) : (
                <p className="text-sm font-medium text-rose-600">
                  Müraciət linki tapılmadı.
                </p>
              )}
              <p className="text-xs font-medium text-slate-500">
                {event.views || 0} baxış
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
                    Başlama vaxtı
                  </p>
                  <p className="text-slate-900 font-semibold">
                    {formatDate(event.eventDate)}
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    {formatTime(event.eventDate)}
                  </p>
                </div>
                {event.endDate && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Bitmə vaxtı
                    </p>
                    <p className="text-slate-900 font-semibold">
                      {formatDate(event.endDate)}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Format
                  </p>
                  <p className="text-slate-900 font-semibold">
                    {getLocationTypeLabel(locationType)}
                  </p>
                </div>
                {event.maxParticipants > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Limit
                    </p>
                    <p className="text-slate-900 font-semibold">
                      {event.maxParticipants} iştirakçı
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <SaveItemButtonContainer
                    itemId={event.id}
                    itemType="event"
                    itemTitle={event.title}
                    size="md"
                    className="w-full"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
                Təşkilatçı
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900 leading-tight mb-1">
                    {event.organizationName || "Naməlum təşkilat"}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {event.createdBy?.name}
                  </p>
                </div>
                {(event.createdByOrganization?.urlHandle ||
                  event.createdByOrganization?.slug) && (
                  <ButtonLink
                    href={localePath(
                      `/o/${event.createdByOrganization?.urlHandle || event.createdByOrganization?.slug}`,
                    )}
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg font-semibold py-2.5"
                  >
                    Profilə bax
                  </ButtonLink>
                )}
              </div>
            </Card>
          </div>
        }
      />
    </>
  );
}
