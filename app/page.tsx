'use client'

import { useEffect, useMemo, useState } from 'react'
import { Hero } from '@/components/home/Hero'
import { StatsBar } from '@/components/home/StatsBar'
import { SectionHeader } from '@/components/shared'
import { ContentCard } from '@/components/shared/ContentCard'
import { OrganizationCard } from '@/components/shared/OrganizationCard'
import { Card } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Tabs } from '@/components/ui/Tabs'
import { LoadingState, EmptyState } from '@/components/shared'
import { fetchOrganizations } from '@/lib/organizationQueries'
import { FOCUS_AREA_LABELS_AZ } from '@/lib/organizationTypes'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { logError } from '@/lib/logger'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

type EventItem = {
  _id: string
  slug: string
  title: string
  eventType?: string
  eventDate?: string
  imageUrl?: string
  image_url?: string
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
  imageUrl?: string
  image_url?: string
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

type BlogItem = {
  _id: string
  slug: string
  title: string
  featuredImage?: string
  featured_image?: string
  authorName?: string
  author_name?: string
  createdAt?: string
  created_at?: string
  date?: string
}

type OrganizationItem = {
  _id: string
  slug: string
  organizationName: string
  focusAreas: string[]
  location?: {
    city?: string
  }
  profileImage?: string
}

type FeedCard = {
  id: string
  kind: 'event' | 'vacancy' | 'blog'
  title: string
  href: string
  badge: string
  coverImage?: string
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

const EVENT_TYPE_LABELS_AZ: Record<string, string> = {
  training_workshop: 'Vörkşop',
  webinar: 'Vebinar',
  training_course: 'Təlim kursu',
  bootcamp: 'Bootcamp',
  panel_discussion: 'Panel müzakirəsi',
  camp: 'Düşərgə',
  forum: 'Forum',
  conference: 'Konfrans',
  flashmob: 'Fləşmob',
  meetup: 'Meetup',
}

const VACANCY_TYPE_LABELS_AZ: Record<string, string> = {
  volunteer: 'Könüllülük',
  full_time: 'Tam ştat',
  part_time: 'Yarım ştat',
  intern: 'Təcrübəçi',
}

const localizeEventType = (value?: string): string => {
  if (!value) return 'Tədbir'
  return EVENT_TYPE_LABELS_AZ[value] || value
}

const localizeVacancyType = (value?: string): string => {
  if (!value) return 'Vakansiya'
  return VACANCY_TYPE_LABELS_AZ[value] || value
}

export default function HomePage() {
  const localePath = useLocalizedPath()
  const { data: session, status } = useSession()
  const { showError } = useGlobalFeedback()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [activeFocus, setActiveFocus] = useState<string>('all')

  const [events, setEvents] = useState<EventItem[]>([])
  const [vacancies, setVacancies] = useState<VacancyItem[]>([])
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([])
  const [blogs, setBlogs] = useState<BlogItem[]>([])

  const [stats, setStats] = useState({
    totalEvents: 0,
    totalVacancies: 0,
    totalOrganizations: 0,
    totalBlogs: 0,
  })

  const isOrganizationUser = session?.user?.accountType === 'organization'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true)

        const [eventsRes, vacanciesRes, organizationsRes, blogsRes] = await Promise.all([
          fetch('/api/events?page=1&limit=8&status=approved'),
          fetch('/api/vacancies?page=1&limit=8&status=approved'),
          fetchOrganizations({ page: 1, limit: 8, status: 'approved' }),
          fetch('/api/blogs?page=1&limit=8&status=approved')
        ])

        const nextEvents: EventItem[] = []
        const nextVacancies: VacancyItem[] = []
        const nextBlogs: BlogItem[] = []

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
              imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
              image_url: typeof item.image_url === 'string' ? item.image_url : undefined,
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
              imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
              image_url: typeof item.image_url === 'string' ? item.image_url : undefined,
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

          const profileImage = typeof item.profileImage === 'string' ? item.profileImage : (typeof item.profile_image === 'string' ? item.profile_image : undefined)

          acc.push({
            _id: id,
            slug,
            organizationName,
            focusAreas,
            location,
            profileImage,
          })

          return acc
        }, [])

        if (blogsRes.ok) {
          const rawBlogs: unknown = await blogsRes.json()
          const blogsPayload = unwrapPayload(rawBlogs)
          const list = Array.isArray(blogsPayload.items) ? blogsPayload.items : []
          list.forEach((item) => {
            if (!isRecord(item)) return
            const id = normalizeId(item._id) || normalizeId(item.id)
            const slug = typeof item.slug === 'string' ? item.slug : ''
            const title = typeof item.title === 'string' ? item.title : ''
            if (!id || !slug || !title) return

            nextBlogs.push({
              _id: id,
              slug,
              title,
              featuredImage: typeof item.featuredImage === 'string' ? item.featuredImage : undefined,
              featured_image: typeof item.featured_image === 'string' ? item.featured_image : undefined,
              authorName: typeof item.authorName === 'string' ? item.authorName : undefined,
              author_name: typeof item.author_name === 'string' ? item.author_name : undefined,
              createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
              created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
              date: typeof item.date === 'string' ? item.date : undefined,
            })
          })

          const pagination = isRecord(blogsPayload.pagination) ? blogsPayload.pagination : {}
          setStats((prev) => ({
            ...prev,
            totalBlogs: typeof pagination.total === 'number' ? pagination.total : nextBlogs.length,
          }))
        }

        setEvents(nextEvents)
        setVacancies(nextVacancies)
        setOrganizations(nextOrganizations)
        setBlogs(nextBlogs)

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
        badge: localizeEventType(event.eventType),
        coverImage: event.imageUrl || event.image_url,
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
        badge: localizeVacancyType(vacancy.type),
        coverImage: vacancy.imageUrl || vacancy.image_url,
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

  const blogFeed: FeedCard[] = useMemo(
    () =>
      blogs.map((blog) => ({
        id: blog._id,
        kind: 'blog',
        title: blog.title,
        href: localePath(`/blogs/${blog.slug}`),
        badge: 'İcma Bloqu',
        coverImage: blog.featuredImage || blog.featured_image,
        dateLabel: formatDate(blog.createdAt || blog.created_at || blog.date),
        locationLabel: '',
        ownerLabel: blog.authorName || blog.author_name || 'Anonim',
      })),
    [blogs, localePath],
  )

  const highlightFeed = useMemo(() => {
    const picks = [
      eventFeed[0],
      vacancyFeed[0],
      blogFeed[0],
      eventFeed[1],
      vacancyFeed[1],
      blogFeed[1],
    ].filter((item): item is FeedCard => Boolean(item))

    return picks.slice(0, 3)
  }, [eventFeed, vacancyFeed, blogFeed])

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
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden font-sans">
      {/* Dynamic Background Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-multiply">
        <div className="absolute top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-blue-100 opacity-50 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[500px] w-[500px] rounded-full bg-purple-100 opacity-50 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[700px] w-[700px] rounded-full bg-cyan-100 opacity-40 blur-[140px]" />
      </div>

      <Hero localePath={localePath} isOrganizationUser={isOrganizationUser} stats={stats} />
      
      <StatsBar stats={stats} />

      {/* Featured Opportunities */}
      <section className="relative z-10 py-24 container mx-auto px-4">
        <SectionHeader 
          title="Seçilmiş imkanlar" 
          description="Sənin üçün ən yeni və maraqlı elanlar bir yerdə."
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <LoadingState key={i} fullPage={false} />)
          ) : highlightFeed.length > 0 ? (
            highlightFeed.map((item) => <ContentCard key={`${item.kind}-${item.id}`} item={item} />)
          ) : (
            <EmptyState title="İmkan tapılmadı" message="Yaxın zamanda yeni imkanlar olacaq." fullPage={false} />
          )}
        </div>
      </section>

      {/* Vacancies Section */}
      <section className="relative z-10 py-24 bg-slate-50/50 backdrop-blur-sm border-y border-slate-100">
        <div className="container mx-auto px-4">
          <SectionHeader 
            title="Vakansiyalar" 
            description="Karyerana başlamaq üçün ən yaxşı fürsətlər."
            href={localePath('/resources/vacancies')}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <LoadingState key={i} fullPage={false} />)
            ) : vacancyFeed.length > 0 ? (
              vacancyFeed.slice(0, 4).map((item) => <ContentCard key={item.id} item={item} />)
            ) : (
              <EmptyState
                title="Vakansiya tapılmadı"
                message="Hazırda göstəriləcək vakansiya yoxdur. Bir az sonra yenidən yoxlayın."
                fullPage={false}
              />
            )}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <SectionHeader 
            title="Tədbirlər" 
            description="Öyrən, şəbəkələş və inkişaf et."
            href={localePath('/resources/events')}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <LoadingState key={i} fullPage={false} />)
            ) : eventFeed.length > 0 ? (
              eventFeed.slice(0, 4).map((item) => <ContentCard key={item.id} item={item} />)
            ) : (
              <EmptyState
                title="Tədbir tapılmadı"
                message="Hazırda göstəriləcək tədbir yoxdur. Yaxın zamanda yeni elanlar əlavə oluna bilər."
                fullPage={false}
              />
            )}
          </div>
        </div>
      </section>

      {/* Organizations Section */}
      <section className="relative z-10 py-24 bg-slate-50/50 backdrop-blur-sm border-y border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
            <div className="max-w-2xl text-center lg:text-left">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Təşkilatlar
              </h2>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                Aktiv gənclər təşkilatlarını kəşf et və izlə.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Horizontal Filter Bar */}
              <Card className="rounded-[2rem] border-slate-100 shadow-sm">
                <Tabs
                  tabs={[
                    { id: 'all', label: 'Hamısı' },
                    ...focusFilters.map(focus => ({ id: focus, label: focusLabel(focus) }))
                  ]}
                  activeTab={activeFocus}
                  onTabChange={(tabId) => setActiveFocus(tabId)}
                  variant="pills"
                  size="sm"
                />
              </Card>

              <ButtonLink
                href={localePath('/resources/organizations')}
                variant="outline"
                size="md"
                rounded="full"
                shadow="lg"
                className="border-2 border-slate-100 px-6 py-3 hover:border-blue-200 hover:text-blue-600"
                icon={ArrowRight}
                iconPosition="right"
              >
                Hamısına bax
              </ButtonLink>
            </div>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <LoadingState key={i} fullPage={false} />)
            ) : filteredOrganizations.length > 0 ? (
              filteredOrganizations.slice(0, 8).map((org) => (
                <OrganizationCard 
                  key={org._id} 
                  org={org} 
                  localePath={localePath} 
                  focusLabel={focusLabel} 
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                 <p className="text-slate-500 font-bold">Bu sahədə təşkilat tapılmadı.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blogs Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <SectionHeader 
            title="İcma Bloqu" 
            description="Gənclərin hekayələri və maraqlı yazılar."
            href={localePath('/blogs')}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <LoadingState key={i} fullPage={false} />)
            ) : blogFeed.length > 0 ? (
              blogFeed.slice(0, 3).map((item) => <ContentCard key={item.id} item={item} />)
            ) : (
              <EmptyState
                title="Bloq tapılmadı"
                message="Hazırda göstəriləcək bloq yazısı yoxdur. Daha sonra yenidən baxın."
                fullPage={false}
              />
            )}
          </div>
        </div>
      </section>

      {/* How It Works - Restored Abstract Design */}
      <section className="relative z-10 py-32 container mx-auto px-4">
        <div className="relative overflow-hidden rounded-[4rem] bg-slate-900 p-10 md:p-20 shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-overlay" />
          
          {/* Abstract glows inside dark container */}
          <div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-blue-600 opacity-20 blur-[120px]" />
          <div className="absolute -right-[10%] -bottom-[10%] h-[500px] w-[500px] rounded-full bg-purple-600 opacity-20 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-indigo-500 opacity-10 blur-[100px]" />
          
          <div className="relative z-10 max-w-3xl mx-auto text-center mb-20">
             <h2 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-8">Necə işləyir?</h2>
             <p className="text-xl text-blue-100/70 font-medium leading-relaxed">Platformaya qoşul, imkanları izlə və öz karyera yolunu qur.</p>
          </div>

          <div className="relative z-10 grid gap-10 md:grid-cols-3">
            {howItWorksCards.map((card) => (
              <div key={card.step} className="group relative rounded-[2.5rem] border border-white/5 bg-white/5 p-10 backdrop-blur-xl transition-all duration-500 hover:bg-white/10 hover:-translate-y-3 hover:shadow-2xl hover:border-white/10">
                <div className="absolute top-0 right-0 p-8 text-[140px] font-black text-white/[0.03] pointer-events-none leading-none transition-all duration-700 group-hover:text-white/[0.07] group-hover:scale-110">
                  {card.step}
                </div>
                <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-black text-white shadow-2xl border border-white/20 relative z-10">
                  {card.step}
                </div>
                <h3 className="text-2xl font-black text-white mb-4 relative z-10">{card.title}</h3>
                <p className="text-lg text-blue-100/60 font-medium relative z-10 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
