"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ExternalLink,
  Tag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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
import {
  EVENT_TYPE_LABELS,
  type EventTypeValue,
} from "@/lib/events/eventConfig";

// Note: Dynamic metadata for client components requires a server component wrapper.
// For production, create a separate page.tsx (server component) that fetches data
// and exports generateMetadata, then renders this client component as a child.
// Example implementation in a server component:
// export async function generateMetadata({ params }): Promise<Metadata> {
//   const event = await fetchEventBySlug(params.slug)
//   return generateSEOMetadata({
//     title: `${event.title} — icma360`,
//     description: event.description.substring(0, 160),
//     keywords: [...azerbaijanKeywords, event.eventType, event.location?.city],
//     canonical: `/resources/events/${event.slug}`,
//     ogImage: event.imageUrl || '/opengraph-image',
//     ogType: 'article',
//     publishedTime: event.eventDate,
//   })
// }

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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Məlumat yoxdur";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Etibarsız tarix";
    return date.toLocaleDateString("az-AZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const slugifyCategory = (s: string) =>
    s
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");

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

  const getEventTypeLabel = (type: string) => {
    if (!type) return "Tədbir";
    return EVENT_TYPE_LABELS[type as EventTypeValue] || type;
  };

  const getCategoryVariant = (category: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' => {
    const variantMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
      seminar: 'primary',
      workshop: 'secondary',
      conference: 'info',
      webinar: 'warning',
      social: 'success',
      cultural: 'danger',
    };
    return variantMap[category] || 'primary';
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
        metadata={
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Kateqoriya
                </p>
                <p className="text-slate-900 font-black">
                  {getCategoryLabel(event.category)}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-100 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Tarix
                </p>
                <p className="text-slate-900 font-black">
                  {formatDate(event.eventDate)}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-100 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Məkan
                </p>
                <p className="text-slate-900 font-black">
                  {event.location?.city || "Bakı, Azərbaycan"}
                </p>
              </div>
            </div>
          </div>
        }
        mainContent={
          <div className="space-y-12">
            {event.imageUrl && (
              <div className="relative h-[400px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div
              id="event-content"
              className="prose prose-xl max-w-none
              prose-headings:font-black prose-headings:text-slate-900
              prose-p:text-slate-600 prose-p:leading-relaxed
            "
            >
              <h2 className="text-3xl font-black text-slate-900 mb-6">
                Tədbir haqqında
              </h2>
              {eventDescription.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-8 border-t border-slate-50">
                {event.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-500 uppercase tracking-wider"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        }
        actionSection={
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-md text-center md:text-left">
              <h3 className="text-2xl font-black mb-2 text-white">
                İştirak etmək istəyirsən?
              </h3>
              <p className="text-slate-400 font-medium">
                Bu fürsəti qaçırma, dərhal müraciət et və icmaya qoşul.
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-col items-center gap-3">
              {hasActiveApplicationLink ? (
                <ButtonLink
                  href={event.applicationLink!}
                  variant="white-on-dark"
                  size="lg"
                  className="w-full md:w-auto rounded-2xl px-12 py-4 font-black"
                  external
                >
                  Müraciət et
                </ButtonLink>
              ) : (
                <p className="text-sm font-bold text-rose-400">
                  Müraciət linki tapılmadı.
                </p>
              )}
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {event.views || 0} baxış
              </p>
            </div>
          </div>
        }
        sidebar={
          <div className="space-y-8">
            {/* Quick Info Card */}
            <Card className="p-8">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Clock className="h-5 w-5" />
                </div>
                Məlumatlar
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Başlama vaxtı
                    </p>
                    <p className="text-slate-900 font-black">
                      {formatDate(event.eventDate)}
                    </p>
                    <p className="text-sm font-bold text-slate-500">
                      {formatTime(event.eventDate)}
                    </p>
                  </div>
                </div>
                {event.endDate && (
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Bitmə vaxtı
                    </p>
                    <p className="text-slate-900 font-black">
                      {formatDate(event.endDate)}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Format
                  </p>
                  <p className="text-slate-900 font-black">
                    {getLocationTypeLabel(locationType)}
                  </p>
                </div>
                {event.maxParticipants > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Limit
                    </p>
                    <p className="text-slate-900 font-black">
                      {event.maxParticipants} iştirakçı
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Organizer Card */}
            <Card className="p-8">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                Təşkilatçı
              </h3>
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-lg font-black text-slate-900 leading-tight mb-1">
                    {event.organizationName || "Naməlum təşkilat"}
                  </p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
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
                    className="w-full rounded-xl font-black py-3 border-2"
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
