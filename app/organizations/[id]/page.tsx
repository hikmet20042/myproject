"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Building2, Globe, Briefcase, CalendarDays, BadgeCheck, Users, Heart } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { trackOrganizationFollow } from "@/lib/analytics";
import { fetchOrganizationById } from "@/lib/organizationQueries";
import { PageStateGuard } from "@/components/shared";
import { logError } from "@/lib/logger";
import { AppContainer } from "@/components/layout";

type Organization = {
  id: string;
  organizationName: string;
  profileImage?: string;
  organizationType?: string;
  organizationTypeLabel?: string;
  description: string;
  website?: string;
  socialMedia?: Record<string, string>;
  focusAreas: string[];
  isVerified?: boolean;
  followerCount?: number;
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  eventDate?: string; 
  createdAt?: string;
  applicationLink?: string;
};

type VacancyItem = {
  id: string;
  title: string;
  description: string;
  applicationDeadline?: string;
  createdAt?: string;
  applicationProcess?: {
    applicationLink?: string;
  };
};

const formatDate = (value?: string) => {
  if (!value) return "Tarix dəqiqləşdiriləcək";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tarix dəqiqləşdiriləcək";
  return date.toLocaleDateString("az-AZ");
};

export default function OrganizationDetailPage() {
  const params = useParams();
  const localePath = useLocalizedPath();
  const organizationId = typeof params?.id === "string" ? params.id : "";
  const [activeTab, setActiveTab] = useState<"events" | "vacancies">("events");
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [featuredEvent, setFeaturedEvent] = useState<EventItem | null>(null);
  const [featuredVacancy, setFeaturedVacancy] = useState<VacancyItem | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      setError("");
      const [organizationResponse, eventsResponse, vacanciesResponse, followResponse] = await Promise.all([
        fetchOrganizationById(organizationId),
        fetch(`/api/events?organizationId=${organizationId}&limit=20`),
        fetch(`/api/vacancies?organizationId=${organizationId}&limit=20`),
        fetch(`/api/organizations/${organizationId}/follow`),
      ]);

      setOrganization(organizationResponse.organization || null);
      setFeaturedEvent(organizationResponse.featuredEvent || null);
      setFeaturedVacancy(organizationResponse.featuredVacancy || null);

      if (eventsResponse.ok) {
        const eventsPayload = await eventsResponse.json();
        const eventList = eventsPayload?.data?.items || [];
        setEvents(Array.isArray(eventList) ? eventList : []);
      } else {
        setEvents([]);
      }

      if (vacanciesResponse.ok) {
        const vacanciesPayload = await vacanciesResponse.json();
        const vacancyList = vacanciesPayload?.data?.items || [];
        setVacancies(Array.isArray(vacancyList) ? vacancyList : []);
      } else {
        setVacancies([]);
      }

      if (followResponse.ok) {
        const followPayload = await followResponse.json();
        setFollowerCount(followPayload.followerCount || 0);
        setIsFollowing(Boolean(followPayload.isFollowing));
      } else {
        setFollowerCount(0);
        setIsFollowing(false);
      }
    } catch (err) {
      logError("Organization detail API error", err);
      setError("Məlumatları yükləyərkən problem baş verdi");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) return;
    void loadData();
  }, [organizationId, loadData]);

  const socialLinks = useMemo(() => {
    if (!organization?.socialMedia) return [];
    return Object.entries(organization.socialMedia).filter(([, value]) => Boolean(value));
  }, [organization?.socialMedia]);

  const recentActivity = useMemo(() => {
    const eventItems = events.map((event) => ({
      kind: "event" as const,
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.createdAt || event.eventDate,
    }));
    const vacancyItems = vacancies.map((vacancy) => ({
      kind: "vacancy" as const,
      id: vacancy.id,
      title: vacancy.title,
      description: vacancy.description,
      date: vacancy.createdAt || vacancy.applicationDeadline,
    }));
    return [...eventItems, ...vacancyItems]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 8);
  }, [events, vacancies]);

  const handleFollowToggle = async () => {
    try {
      setFollowBusy(true);
      const response = await fetch(`/api/organizations/${organizationId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isFollowing ? "unfollow" : "follow" }),
      });
      if (!response.ok) return;
      const payload = await response.json();
      trackOrganizationFollow(
        organization?.organizationName || "Organization",
        isFollowing ? "unfollow" : "follow"
      );
      setIsFollowing(Boolean(payload.isFollowing));
      setFollowerCount(payload.followerCount || 0);
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <PageStateGuard
      isLoading={loading}
      isError={Boolean(error)}
      isEmpty={!loading && !error && !organization}
      loadingTitle="Yüklənir"
      loadingText="Təşkilat profili yüklənir..."
      errorTitle="Məlumatları yükləyərkən problem baş verdi"
      errorMessage={error || "Təşkilat profili hazırda əlçatan deyil."}
      onRetry={() => { void loadData(); }}
      emptyTitle="Təşkilat tapılmadı"
      emptyMessage="Bu təşkilat mövcud deyil və ya artıq əlçatan deyil."
      emptyActionText="Təşkilatlara qayıt"
      onEmptyAction={() => window.location.assign(localePath("/organizations"))}
      fullPage={true}
    >
      <div className="min-h-screen bg-slate-50">
        <AppContainer className="space-y-6">
          {organization && (<>
          <article className="sticky top-20 z-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
                {organization.profileImage ? (
                  <Image
                    src={organization.profileImage}
                    alt={organization.organizationName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-500">
                    <Building2 className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold text-slate-900">{organization.organizationName}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  {organization.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Təsdiqlənmiş
                    </span>
                  )}
                  {organization.organizationTypeLabel && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {organization.organizationTypeLabel}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    <Users className="h-3.5 w-3.5" />
                    {followerCount} izləyici
                  </span>
                </div>
                <p className="mt-3 text-slate-600">{organization.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    disabled={followBusy}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${isFollowing ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                  >
                    <Heart className="h-4 w-4" />
                    {isFollowing ? "İzlənilir" : "İzlə"}
                  </button>
                  {organization.website && (
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Globe className="h-4 w-4" />
                      Veb-sayt
                    </a>
                  )}
                  {socialLinks.map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {platform}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">Fəaliyyət Sahələri</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {organization.focusAreas?.length ? (
                organization.focusAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                  >
                    {area}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-600">Fəaliyyət sahəsi əlavə edilməyib.</p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">Seçilmiş Kontent</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Seçilmiş Tədbir</p>
                {featuredEvent ? (
                  <div className="mt-2 space-y-2">
                    <h3 className="text-base font-semibold text-slate-900">{featuredEvent.title}</h3>
                    <p className="text-sm text-slate-600">Tarix: {formatDate(featuredEvent.eventDate)}</p>
                    <div className="flex gap-2">
                      <ButtonLink href={localePath(`/resources/events/${featuredEvent.id}`)} variant="outline" size="sm">
                        Tədbirə bax
                      </ButtonLink>
                      {featuredEvent.applicationLink && (
                        <a
                          href={featuredEvent.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          Müraciət et
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">Hələ seçilmiş tədbir yoxdur.</p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Seçilmiş Vakansiya</p>
                {featuredVacancy ? (
                  <div className="mt-2 space-y-2">
                    <h3 className="text-base font-semibold text-slate-900">{featuredVacancy.title}</h3>
                    <p className="text-sm text-slate-600">Son tarix: {formatDate(featuredVacancy.applicationDeadline)}</p>
                    <div className="flex gap-2">
                      <ButtonLink href={localePath(`/resources/vacancies/${featuredVacancy.id}`)} variant="outline" size="sm">
                        Vakansiyaya bax
                      </ButtonLink>
                      {featuredVacancy.applicationProcess?.applicationLink && (
                        <a
                          href={featuredVacancy.applicationProcess.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          Müraciət et
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">Hələ seçilmiş vakansiya yoxdur.</p>
                )}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">Son Aktivlik</h2>
            {recentActivity.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                Hələ aktivlik yoxdur.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {recentActivity.map((item) => (
                  <div key={`${item.kind}-${item.id}`} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      {item.kind === "event" ? "Tədbir" : "Vakansiya"} · {formatDate(item.date)}
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    <div className="mt-2">
                      <Link
                        href={localePath(item.kind === "event" ? `/resources/events/${item.id}` : `/resources/vacancies/${item.id}`)}
                        className="text-sm font-medium text-primary"
                      >
                        {item.kind === "event" ? "Tədbirə bax" : "Vakansiyaya bax"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("events")}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${activeTab === "events" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                Tədbirlər
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vacancies")}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${activeTab === "vacancies" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                Vakansiyalar
              </button>
            </div>

            {activeTab === "events" ? (
              events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                  Bu təşkilatın hələ tədbiri yoxdur.
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(event.eventDate)}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{event.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                      <div className="mt-3 flex gap-2">
                        <ButtonLink href={localePath(`/resources/events/${event.id}`)} variant="outline" size="sm">
                          Tədbirə bax
                        </ButtonLink>
                        {event.applicationLink && (
                          <a
                            href={event.applicationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            Müraciət et
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : vacancies.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                Bu təşkilatın hələ vakansiyası yoxdur.
              </div>
            ) : (
              <div className="space-y-3">
                {vacancies.map((vacancy) => (
                  <div key={vacancy.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <Briefcase className="h-4 w-4" />
                      Son tarix: {formatDate(vacancy.applicationDeadline)}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{vacancy.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{vacancy.description}</p>
                    <div className="mt-3 flex gap-2">
                      <ButtonLink href={localePath(`/resources/vacancies/${vacancy.id}`)} variant="outline" size="sm">
                        Vakansiyaya bax
                      </ButtonLink>
                      {vacancy.applicationProcess?.applicationLink && (
                        <a
                          href={vacancy.applicationProcess.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          Müraciət et
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article></>
          )}
        </AppContainer>
      </div>
    </PageStateGuard>
  );
}
