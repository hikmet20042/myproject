'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Clock3,
  Compass,
  Filter,
  MapPin,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingState, EmptyState } from '@/components/shared'
import OrganizationFollowButtonContainer from '@/components/containers/OrganizationFollowButtonContainer'
import SaveItemButtonContainer from '@/components/containers/SaveItemButtonContainer'
import { fetchOrganizations } from '@/lib/organizationQueries'
import { FOCUS_AREA_LABELS_AZ } from '@/lib/organizationTypes'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { logError } from '@/lib/logger'

type TabKey = 'all' | 'events' | 'vacancies'

type EventItem = {
  _id: string
  slug: string
  title: string
  eventType?: string
  eventDate?: string
  location?: {
    type?: string
    city?: string
  }
  organizationName?: string
  createdByOrganization?: {
    organizationName?: string
  }
}

type VacancyItem = {
  _id: string
  slug: string
  title: string
  type?: string
  applicationDeadline?: string
  city?: string
  address?: string
  createdBy?: {
    _id?: string
    name?: string
    email?: string
  }
  createdByOrganization?: {
    _id?: string
    organizationName?: string
  }
}

type OrganizationItem = {
  _id: string
  slug: string
  organizationName: string
  focusAreas: string[]
  location?: {
    city?: string
  }
}

type FeedCard = {
  id: string
  kind: 'event' | 'vacancy'
  title: string
  href: string
  badge: string
  dateLabel: string
  locationLabel: string
  ownerLabel: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const unwrapPayload = (value: unknown): Record<string, unknown> => {
  if (isRecord(value) && isRecord(value.data)) {
    return value.data
  }
  if (isRecord(value)) {
    return value
  }
  return {}
}

const normalizeId = (value: unknown): string => {
  if (typeof value === 'string') return value
  return ''
}

const formatDate = (dateValue?: string): string => {
  if (!dateValue) return 'Tarix qeyd olunmayıb'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Tarix qeyd olunmayıb'
  return date.toLocaleDateString('az-AZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const focusLabel = (raw: string): string => {
  const key = raw as keyof typeof FOCUS_AREA_LABELS_AZ
  return FOCUS_AREA_LABELS_AZ[key] || raw
}

export default function HomePage() {
  const localePath = useLocalizedPath()
  const { data: session, status } = useSession()
  const { showError } = useGlobalFeedback()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [activeFocus, setActiveFocus] = useState<string>('all')

  const [events, setEvents] = useState<EventItem[]>([])
  const [vacancies, setVacancies] = useState<VacancyItem[]>([])
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([])

  const [stats, setStats] = useState({
    totalEvents: 0,
    totalVacancies: 0,
    totalOrganizations: 0,
  })

  const isOrganizationUser = session?.user?.accountType === 'organization'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true)

        const [eventsRes, vacanciesRes, organizationsRes] = await Promise.all([
          fetch('/api/events?page=1&limit=8&status=approved'),
          fetch('/api/vacancies?page=1&limit=8&status=approved'),
          fetchOrganizations({ page: 1, limit: 8, status: 'approved' }),
        ])

        const nextEvents: EventItem[] = []
        const nextVacancies: VacancyItem[] = []

        if (eventsRes.ok) {
          const rawEvents: unknown = await eventsRes.json()
          const eventsPayload = unwrapPayload(rawEvents)
          const list = Array.isArray(eventsPayload.events) ? eventsPayload.events : []
          list.forEach((item) => {
            if (!isRecord(item)) return
            const id = normalizeId(item._id) || normalizeId(item.id)
            const slug = typeof item.slug === 'string' ? item.slug : ''
            const title = typeof item.title === 'string' ? item.title : ''
            if (!id || !slug || !title) return

            const location = isRecord(item.location)
              ? {
                  type: typeof item.location.type === 'string' ? item.location.type : undefined,
                  city: typeof item.location.city === 'string' ? item.location.city : undefined,
                }
              : undefined

            const createdByOrganization = isRecord(item.createdByOrganization)
              ? {
                  organizationName:
                    typeof item.createdByOrganization.organizationName === 'string'
                      ? item.createdByOrganization.organizationName
                      : undefined,
                }
              : undefined

            nextEvents.push({
              _id: id,
              slug,
              title,
              eventType: typeof item.eventType === 'string' ? item.eventType : undefined,
              eventDate: typeof item.eventDate === 'string' ? item.eventDate : undefined,
              organizationName:
                typeof item.organizationName === 'string' ? item.organizationName : undefined,
              location,
              createdByOrganization,
            })
          })

          const pagination = isRecord(eventsPayload.pagination) ? eventsPayload.pagination : {}
          setStats((prev) => ({
            ...prev,
            totalEvents:
              typeof pagination.total === 'number' ? pagination.total : nextEvents.length,
          }))
        }

        if (vacanciesRes.ok) {
          const rawVacancies: unknown = await vacanciesRes.json()
          const vacanciesPayload = unwrapPayload(rawVacancies)
          const list = Array.isArray(vacanciesPayload.vacancies) ? vacanciesPayload.vacancies : []
          list.forEach((item) => {
            if (!isRecord(item)) return
            const id = normalizeId(item._id) || normalizeId(item.id)
            const slug = typeof item.slug === 'string' ? item.slug : ''
            const title = typeof item.title === 'string' ? item.title : ''
            if (!id || !slug || !title) return

            const city = typeof item.city === 'string' ? item.city : undefined
            const address = typeof item.address === 'string' ? item.address : undefined

            const createdBy = isRecord(item.createdBy)
              ? {
                  _id: typeof item.createdBy._id === 'string' ? item.createdBy._id : undefined,
                  name: typeof item.createdBy.name === 'string' ? item.createdBy.name : undefined,
                  email: typeof item.createdBy.email === 'string' ? item.createdBy.email : undefined,
                }
              : undefined

            const createdByOrganization = isRecord(item.createdByOrganization)
              ? {
                  _id:
                    typeof item.createdByOrganization._id === 'string'
                      ? item.createdByOrganization._id
                      : undefined,
                  organizationName:
                    typeof item.createdByOrganization.organizationName === 'string'
                      ? item.createdByOrganization.organizationName
                      : undefined,
                }
              : undefined

            nextVacancies.push({
              _id: id,
              slug,
              title,
              type: typeof item.type === 'string' ? item.type : undefined,
              applicationDeadline:
                typeof item.applicationDeadline === 'string'
                  ? item.applicationDeadline
                  : undefined,
              city,
              address,
              createdBy,
              createdByOrganization,
            })
          })

          const pagination = isRecord(vacanciesPayload.pagination) ? vacanciesPayload.pagination : {}
          const totalVacancies =
            typeof pagination.totalVacancies === 'number'
              ? pagination.totalVacancies
              : typeof pagination.total === 'number'
                ? pagination.total
                : nextVacancies.length

          setStats((prev) => ({
            ...prev,
            totalVacancies,
          }))
        }

        const rawOrganizations = Array.isArray(organizationsRes.items) ? organizationsRes.items : []
        const nextOrganizations = rawOrganizations.reduce<OrganizationItem[]>((acc, item: unknown) => {
          if (!isRecord(item)) return acc

          const id = normalizeId(item._id) || normalizeId(item.id)
          const slug = typeof item.slug === 'string' ? item.slug : ''
          const organizationName =
            typeof item.organizationName === 'string' ? item.organizationName : ''
          if (!id || !slug || !organizationName) return acc

          const location = isRecord(item.location)
            ? {
                city: typeof item.location.city === 'string' ? item.location.city : undefined,
              }
            : undefined

          const focusAreas = Array.isArray(item.focusAreas)
            ? item.focusAreas.filter((area): area is string => typeof area === 'string')
            : []

          acc.push({
            _id: id,
            slug,
            organizationName,
            focusAreas,
            location,
          })

          return acc
        }, [])

        setEvents(nextEvents)
        setVacancies(nextVacancies)
        setOrganizations(nextOrganizations)

        const totalOrganizations =
          typeof organizationsRes.meta?.total === 'number'
            ? organizationsRes.meta.total
            : nextOrganizations.length

        setStats((prev) => ({
          ...prev,
          totalOrganizations,
        }))
      } catch (error) {
        logError('Homepage data fetch error', error)
        showError('Məlumatları yükləyərkən xəta baş verdi.')
      } finally {
        setLoading(false)
      }
    }

    void loadContent()
  }, [showError])

  const focusFilters = useMemo(() => {
    const merged = organizations.flatMap((org) => org.focusAreas || [])
    return Array.from(new Set(merged)).slice(0, 8)
  }, [organizations])

  const filteredOrganizations = useMemo(() => {
    if (activeFocus === 'all') return organizations
    return organizations.filter((org) => org.focusAreas.includes(activeFocus))
  }, [activeFocus, organizations])

  const eventFeed: FeedCard[] = useMemo(
    () =>
      events.map((event) => ({
        id: event._id,
        kind: 'event',
        title: event.title,
        href: localePath(`/resources/events/${event.slug}`),
        badge: event.eventType || 'Tədbir',
        dateLabel: formatDate(event.eventDate),
        locationLabel:
          event.location?.type === 'online' ? 'Onlayn' : event.location?.city || 'Məkan qeyd olunmayıb',
        ownerLabel: event.organizationName || event.createdByOrganization?.organizationName || 'Təşkilat',
      })),
    [events, localePath],
  )

  const vacancyFeed: FeedCard[] = useMemo(
    () =>
      vacancies.map((vacancy) => ({
        id: vacancy._id,
        kind: 'vacancy',
        title: vacancy.title,
        href: localePath(`/resources/vacancies/${vacancy.slug}`),
        badge: vacancy.type || 'Vakansiya',
        dateLabel: formatDate(vacancy.applicationDeadline),
        locationLabel: vacancy.city
          ? vacancy.address
            ? `${vacancy.city}, ${vacancy.address}`
            : vacancy.city
          : 'Məkan qeyd olunmayıb',
        ownerLabel:
          vacancy.createdByOrganization?.organizationName ||
          vacancy.createdBy?.name ||
          'Təşkilat',
      })),
    [vacancies, localePath],
  )

  const feedItems = useMemo(() => {
    if (activeTab === 'events') return eventFeed
    if (activeTab === 'vacancies') return vacancyFeed
    return [...eventFeed, ...vacancyFeed].slice(0, 12)
  }, [activeTab, eventFeed, vacancyFeed])

  const howItWorksCards = [
    {
      step: '1',
      title: 'Kəşf et',
      description: 'Vakansiya və tədbirləri filtr et, fokus sahənə uyğun imkanları seç.',
    },
    {
      step: '2',
      title: 'Yadda saxla və izlə',
      description: 'Maraqlı elanları yadda saxla, faydalı təşkilatları izləyərək yenilikləri qaçırma.',
    },
    {
      step: '3',
      title: 'Hərəkətə keç',
      description: 'Elanın detalına keç, müraciət et və təşkilatlarla birbaşa əlaqə qur.',
    },
  ]

  if (!mounted || (loading && status === 'loading')) {
    return <LoadingState text="Ana səhifə yüklənir..." />
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_45%),radial-gradient(circle_at_bottom_right,#cffafe,transparent_45%)]" />
        <div className="section-padding relative py-14 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  İcma dashboard
                </div>
                <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                  Fürsətləri tap, təşkilatlarla əlaqə qur, təsirini böyüt.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Vakansiyalar, tədbirlər və aktiv təşkilatlar bir səhifədə. Filtrlə, yadda saxla və bir kliklə hərəkətə keç.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href={localePath('/resources')}>
                    <Button variant="primary" size="md" icon={Compass} iconPosition="left">
                      İmkanları kəşf et
                    </Button>
                  </Link>
                  {isOrganizationUser ? (
                    <Link href={localePath('/dashboard')}>
                      <Button variant="outline" size="md" icon={Building2} iconPosition="left">
                        Təşkilat paneli
                      </Button>
                    </Link>
                  ) : (
                    <Link href={localePath('/submit/blog')}>
                      <Button variant="outline" size="md" icon={Target} iconPosition="left">
                        Hekayəni paylaş
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <p className="text-xl font-extrabold text-slate-900">{stats.totalVacancies}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Vakansiya</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <p className="text-xl font-extrabold text-slate-900">{stats.totalEvents}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Tədbir</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <p className="text-xl font-extrabold text-slate-900">{stats.totalOrganizations}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Təşkilat</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <Filter className="ml-1 h-4 w-4 text-slate-400" />
          {(['all', 'events', 'vacancies'] as TabKey[]).map((tab) => {
            const selected = activeTab === tab
            const label = tab === 'all' ? 'Hamısı' : tab === 'events' ? 'Tədbirlər' : 'Vakansiyalar'
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  'rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                  selected
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="section-padding pb-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Seçilmiş imkanlar</h2>
              <p className="mt-1 text-sm text-slate-600">Sənin üçün ən aktual elanlar</p>
            </div>

            {loading ? (
              <LoadingState fullPage={false} text="İmkanlar yüklənir..." />
            ) : feedItems.length === 0 ? (
              <EmptyState
                title="Hazırda uyğun elan tapılmadı"
                message="Filtrləri dəyişib yenidən yoxla."
                fullPage={false}
              />
            ) : (
              <div className="space-y-3">
                {feedItems.map((item) => (
                  <article
                    key={`${item.kind}-${item.id}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {item.badge}
                        </span>
                        <Link href={item.href} className="mt-2 block">
                          <h3 className="line-clamp-2 text-base font-bold text-slate-900 hover:text-blue-700">
                            {item.title}
                          </h3>
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {item.ownerLabel}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.locationLabel}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {item.dateLabel}
                          </span>
                        </div>
                      </div>
                      <Link href={item.href} className="hidden text-slate-400 hover:text-slate-600 sm:block">
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Link href={item.href}>
                        <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
                          Ətraflı bax
                        </Button>
                      </Link>
                      {item.kind === 'event' ? (
                        <SaveItemButtonContainer
                          itemId={item.id}
                          itemType="event"
                          itemTitle={item.title}
                          size="sm"
                          showText={true}
                        />
                      ) : (
                        <SaveItemButtonContainer
                          itemId={item.id}
                          itemType="vacancy"
                          itemTitle={item.title}
                          size="sm"
                          showText={true}
                        />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Sürətli keçidlər</h3>
              <div className="mt-3 space-y-2">
                <Link href={localePath('/resources/events')} className="block">
                  <Button variant="secondary" size="sm" fullWidth icon={Calendar} iconPosition="left">
                    Tədbirlər
                  </Button>
                </Link>
                <Link href={localePath('/resources/vacancies')} className="block">
                  <Button variant="secondary" size="sm" fullWidth icon={Briefcase} iconPosition="left">
                    Vakansiyalar
                  </Button>
                </Link>
                <Link href={localePath('/resources/organizations')} className="block">
                  <Button variant="secondary" size="sm" fullWidth icon={Users} iconPosition="left">
                    Təşkilatlar
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Fokus sahələri</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFocus('all')}
                  className={[
                    'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                    activeFocus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  ].join(' ')}
                >
                  Hamısı
                </button>
                {focusFilters.map((focus) => (
                  <button
                    key={focus}
                    type="button"
                    onClick={() => setActiveFocus(focus)}
                    className={[
                      'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                      activeFocus === focus
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    ].join(' ')}
                  >
                    {focusLabel(focus)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Aktiv təşkilatlar</h3>
              <div className="mt-3 space-y-3">
                {filteredOrganizations.slice(0, 3).map((org) => (
                  <div key={org._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <Link href={localePath(`/o/${org.slug}`)}>
                      <p className="line-clamp-1 text-sm font-semibold text-slate-800 hover:text-blue-700">
                        {org.organizationName}
                      </p>
                    </Link>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {org.location?.city || 'Məkan göstərilməyib'}
                    </p>
                    <div className="mt-2">
                      <OrganizationFollowButtonContainer
                        organizationId={org._id}
                        organizationName={org.organizationName}
                        size="xs"
                        showFollowerCount={false}
                      />
                    </div>
                  </div>
                ))}
                {!loading && filteredOrganizations.length === 0 && (
                  <p className="text-xs text-slate-500">Bu fokus üzrə təşkilat tapılmadı.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section-padding py-10">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900">Təşkilatlar zolağı</h2>
            <Link href={localePath('/resources/organizations')} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              Hamısını gör
            </Link>
          </div>

          {loading ? (
            <LoadingState fullPage={false} text="Təşkilatlar yüklənir..." />
          ) : filteredOrganizations.length === 0 ? (
            <EmptyState
              title="Təşkilat tapılmadı"
              message="Fokus filtrini dəyişərək yenidən bax."
              fullPage={false}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {filteredOrganizations.slice(0, 8).map((org) => (
                <article
                  key={org._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <Link href={localePath(`/o/${org.slug}`)}>
                    <h3 className="line-clamp-2 text-sm font-bold text-slate-800 hover:text-blue-700">
                      {org.organizationName}
                    </h3>
                  </Link>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                    {org.location?.city || 'Məkan göstərilməyib'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {org.focusAreas.slice(0, 2).map((focus) => (
                      <span
                        key={`${org._id}-${focus}`}
                        className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                      >
                        {focusLabel(focus)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3">
                    <OrganizationFollowButtonContainer
                      organizationId={org._id}
                      organizationName={org.organizationName}
                      size="xs"
                      showFollowerCount={false}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-padding pb-14">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-black text-slate-900">Necə işləyir?</h2>
          <p className="mt-2 text-sm text-slate-600">3 addımda platformadan maksimum fayda götür.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {howItWorksCards.map((card) => (
              <div key={card.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {card.step}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
