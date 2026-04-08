'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Briefcase,
  Calendar,
  Users,
  BookOpen,
  MapPin,
  Clock,
  ArrowRight,
  Building2,
  Sparkles,
  MessageSquare,
  Target,
  Award } from 'lucide-react'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { useSession } from '@/lib/auth/client'
import { blogQueryKeys, fetchBlogs } from '@/lib/blogQueries'
import { fetchOrganizations } from '@/lib/organizationQueries'
import { LoadingState, ErrorState, EmptyState, ResourceCard } from '@/components/shared'
import { HomeSectionLayout } from '@/components/layout'
import { logError } from '@/lib/logger'





interface Event { _id: string
  title: string
  eventType: string
  eventDate: string
  location: { type: string
    city?: string }
  organizationName?: string }

interface Vacancy { _id: string
  title: string
  createdBy?: { _id: string
    name: string
    email: string }
  location: { city?: string
    country?: string }
  type: string
  applicationDeadline: string }

interface Blog { _id: string
  title: string
  authorName: string
  createdAt: string
  tags: string[]
  content: any }

interface Organization { _id: string
  organizationName: string
  focusAreas: string[]
  location?: { city?: string } }

type RecommendedItem = {
  id: string
  type: 'vacancy' | 'event'
  title: string
  href: string
  metaOne: string
  metaTwo: string
  badge: string
}

export default function HomePage() {
  const localePath = useLocalizedPath()
  const { data: session, status } = useSession()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [organizationsError, setOrganizationsError] = useState('')
  const [userInterests, setUserInterests] = useState<string[]>([])
  const [interestsLoading, setInterestsLoading] = useState(false)
  const [stats, setStats] = useState({ totalBlogs: 0,
    totalEvents: 0,
    totalVacancies: 0,
    totalOrganizations: 0 })

  const homepageBlogsQuery = useQuery({
    queryKey: blogQueryKeys.list({ page: 1, limit: 6 }),
    queryFn: () => fetchBlogs({ page: 1, limit: 6 })
  })

  const blogs: Blog[] = (homepageBlogsQuery.data?.items as any[] || [])
    .filter((blog: any) => blog.status === 'approved')
    .map((blog: any) => ({
      _id: blog._id || blog.id,
      title: blog.title,
      authorName: blog.authorName || blog.author_name || 'Anonim',
      createdAt: blog.createdAt || blog.created_at || new Date().toISOString(),
      tags: blog.tags || [],
      content: blog.content
    }))

  useEffect(() => { setMounted(true)
    loadAllContent() }, [])

  useEffect(() => {
    const loadInterests = async () => {
      if (status !== 'authenticated' || session?.user?.accountType !== 'user') return
      try {
        setInterestsLoading(true)
        const response = await fetch('/api/users/profile')
        if (!response.ok) return
        const payload = await response.json()
        const interests = Array.isArray(payload?.data?.profile?.interests) ? payload.data.profile.interests : []
        setUserInterests(interests)
      } catch {
        return
      } finally {
        setInterestsLoading(false)
      }
    }
    void loadInterests()
  }, [session?.user?.accountType, status])

  const loadAllContent = async () => { try { setLoading(true)
      const [eventsRes, vacanciesRes, organizationsResult] = await Promise.all([
        fetch('/api/events?page=1&limit=6&status=approved'),
        fetch('/api/vacancies?page=1&limit=6&status=approved'),
        fetchOrganizations({ page: 1, limit: 6, status: 'approved' })
      ])

      if (eventsRes.ok) { const data = await eventsRes.json()
        const payload = data?.data || data
        setEvents(payload.events || [])
        setStats((prev) => ({ ...prev, totalEvents: payload.pagination?.total || 0 })) }

      if (vacanciesRes.ok) { const data = await vacanciesRes.json()
        setVacancies(data.vacancies || [])
        setStats((prev) => ({ ...prev, totalVacancies: data.total || 0 })) }

      setOrganizations(organizationsResult.items || [])
      setStats((prev) => ({ ...prev, totalOrganizations: organizationsResult.meta?.total || 0 }))
      setOrganizationsError('')
    } catch (error) {
      logError('Home organizations API error', error)
      setOrganizationsError('Məlumatları yükləyərkən problem baş verdi')
    } finally { setLoading(false) } }

  const formatDate = (dateString: string | undefined | null) => { if (!dateString) return 'Naməlum'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Naməlum'

    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}` }

  const extractExcerpt = (content: any, maxWords = 20) => { let text = ''
    if (Array.isArray(content)) { text = content
        .map((block: any) => { if (block.content && Array.isArray(block.content)) { return block.content.map((item: any) => item.text || '').join('') }
          return '' })
        .join(' ')
        .trim() } else if (typeof content === 'string') { text = content }
    const words = text.split(' ').slice(0, maxWords)
    return words.join(' ') + (words.length >= maxWords ? '...' : '') }

  const translateFocusArea = (area: string) => { if (!area) return area
    return area }

  const toRecommendedSource = (): RecommendedItem[] => {
    const vacancyItems: RecommendedItem[] = vacancies.map((item) => ({
      id: item._id,
      type: 'vacancy',
      title: item.title,
      href: `/resources/vacancies/${item._id}`,
      metaOne: item.createdBy?.name || 'Naməlum',
      metaTwo: item.location?.city || item.location?.country || 'Naməlum',
      badge: item.type || 'vakansiya',
    }))
    const eventItems: RecommendedItem[] = events.map((item) => ({
      id: item._id,
      type: 'event',
      title: item.title,
      href: `/resources/events/${item._id}`,
      metaOne: item.organizationName || 'Naməlum',
      metaTwo: item.location?.type === 'online' ? 'Onlayn' : item.location?.city || 'Məlumat yoxdur',
      badge: item.eventType || 'tədbir',
    }))
    return [...vacancyItems, ...eventItems]
  }

  const scoreItem = (item: RecommendedItem, interests: string[]) => {
    const haystack = `${item.title} ${item.metaOne} ${item.metaTwo} ${item.badge}`.toLowerCase()
    const normalizedInterests = interests.map((i) => i.toLowerCase())
    let score = 0
    if (normalizedInterests.some((i) => i.includes('it')) && /(it|texnolog|software|developer|data)/.test(haystack)) score += 3
    if (normalizedInterests.some((i) => i.includes('təhsil')) && /(təhsil|education|training|seminar|workshop)/.test(haystack)) score += 3
    if (normalizedInterests.some((i) => i.includes('könüllü')) && /(könüllü|volunteer|community)/.test(haystack)) score += 3
    if (normalizedInterests.some((i) => i.includes('sosial')) && /(social|icma|community|human|rights)/.test(haystack)) score += 2
    if (normalizedInterests.some((i) => i.includes('digər'))) score += 1
    return score
  }

  const recommendedItems = (() => {
    const source = toRecommendedSource()
    if (source.length === 0) return []

    if (userInterests.length > 0) {
      const personalized = source
        .map((item) => ({ item, score: scoreItem(item, userInterests) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map((entry) => entry.item)
      if (personalized.length > 0) return personalized
    }

    // Fallback: latest mixed opportunities when interests are not available.
    return source.slice(0, 2)
  })()

  if (!mounted) return <LoadingState text="Yüklənir..." />

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero (community-connect-main style) */}
      <section className="brand-hero-surface relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[520px] w-[860px] rounded-full bg-primary/10 blur-3xl" />

        <div className="section-padding relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 mb-8">
              <Sparkles size={14} className="text-accent" />
              {'Platformaya Xoş Gəldin'}
            </div>

            <h1 className="mx-auto max-w-5xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 leading-tight">
              {'Fürsətlərə'} <span className="text-primary">{'Açılan Qapın'}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-gray-600 leading-relaxed">
              {'İş imkanları, tədbirlər və təlim proqramları kəşf et. Real dəyişiklik yaradan təşkilatlarla əlaqə qur.'}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href={localePath('/resources')}
                className="brand-primary-btn inline-flex items-center justify-center gap-2 rounded-xl border border-transparent px-6 py-3 text-white font-semibold transition-all duration-200"
              >
                <Target size={18} />
                {'İndi Kəşf Et'}
                <ArrowRight size={16} />
              </Link>
              <Link
                href={localePath('/submit/blog/step1')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-gray-800 font-semibold hover:bg-gray-50 transition-colors"
              >
                <MessageSquare size={18} />
                {'Bloq Paylaş'}
              </Link>
            </div>

            <div className="mt-14 flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalVacancies}+</p>
                <p>{'Vakansiyalar'}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}+</p>
                <p>{'Tədbirlər'}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}+</p>
                <p>{'Tərəfdaşlar'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guidance */}
      {!loading && !interestsLoading && recommendedItems.length > 0 && (
        <section className="py-8 md:py-10">
          <div className="section-padding">
            <div className="max-w-7xl mx-auto rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sənin üçün seçilmiş imkanlar</h2>
              <p className="mt-1 text-sm sm:text-base text-gray-700">
                {userInterests.length > 0
                  ? 'Bu imkanları yadda saxla və ya müraciət et'
                  : 'Sənin üçün seçilmiş imkanlar (ən son əlavə olunanlar)'}
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedItems.map((item) => (
                  <ResourceCard
                    key={`${item.type}-${item.id}`}
                    type={item.type}
                    title={item.title}
                    href={item.href}
                    badges={[{ label: item.badge, variant: 'info' }]}
                    metadata={
                      <>
                        <p className="text-sm text-gray-600">{item.metaOne}</p>
                        <p className="text-sm text-gray-500">{item.metaTwo}</p>
                      </>
                    }
                    actionText="Ətraflı bax"
                    className="ring-1 ring-blue-200 bg-white/90"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Vacancies */}
      <HomeSectionLayout
        title={<>{'Karyera'} <span className="text-primary">{'Fürsətləri'}</span></>}
        description={'Hal-hazırda aktiv olan iş imkanlarına müraciət et.'}
        ctaLabel={'Vakansiyalar'}
        ctaHref={localePath('/resources/vacancies')}
        sectionClassName="py-20 md:py-24"
        emphasis="neutral"
      >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!loading && vacancies.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    title={'Hazırda heç bir vakansiya yoxdur'}
                    message={'Daha sonra yenidən yoxla'}
                    actionText={'Daha sonra yenidən yoxla'}
                    onAction={() => loadAllContent()}
                  />
                </div>
              ) : (
              (loading ? Array.from({ length: 6 }) : vacancies).map((item: any, idx) => (
                <ResourceCard
                  key={loading ? idx : item._id}
                  type="vacancy"
                  href={loading ? undefined : `/resources/vacancies/${item._id}`}
                  title={loading ? 'Yüklənir...' : item.title}
                  badges={loading ? [] : [{ label: item.type, variant: 'info' }]}
                  icon={
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                  }
                  metadata={
                    loading ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-4 w-2/3 bg-gray-200 rounded" />
                        <div className="h-4 w-1/2 bg-gray-200 rounded" />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 flex items-center gap-1.5"><Building2 className="w-4 h-4" />{item.createdBy?.name || 'Naməlum'}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="w-4 h-4" />{item.location?.city || item.location?.country || 'Naməlum'}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDate(item.applicationDeadline)}</p>
                      </>
                    )
                  }
                  actionText={loading ? undefined : 'Ətraflı bax'}
                />
              )))}
            </div>
      </HomeSectionLayout>

      {/* Events */}
      <HomeSectionLayout
        title={<>{'Təlim və'} <span className="text-primary">{'Tədbirlər'}</span></>}
        description={'Seminar, təlim və konfranslarda iştirak et, şəbəkəni qur.'}
        ctaLabel={'Tədbirlər'}
        ctaHref={localePath('/resources/events')}
        sectionClassName="py-16 md:py-20 bg-slate-50/60"
        emphasis="neutral"
      >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!loading && events.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    title={'Hazırda heç bir tədbir yoxdur'}
                    message={'Daha sonra yenidən yoxla'}
                    actionText={'Daha sonra yenidən yoxla'}
                    onAction={() => loadAllContent()}
                  />
                </div>
              ) : (
              (loading ? Array.from({ length: 6 }) : events).map((item: any, idx) => (
                <ResourceCard
                  key={loading ? idx : item._id}
                  type="event"
                  href={loading ? undefined : `/resources/events/${item._id}`}
                  title={loading ? 'Yüklənir...' : item.title}
                  badges={loading ? [] : [{ label: item.eventType, variant: 'success' }]}
                  icon={
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                  }
                  metadata={
                    loading ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-4 w-2/3 bg-gray-200 rounded" />
                        <div className="h-4 w-1/2 bg-gray-200 rounded" />
                      </div>
                    ) : (
                      <>
                        {item.organizationName && <p className="text-sm text-gray-600">{item.organizationName}</p>}
                        <p className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="w-4 h-4" />{item.location?.type === 'online' ? 'Onlayn' : item.location?.city || 'Məlumat yoxdur'}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDate(item.eventDate)}</p>
                      </>
                    )
                  }
                  actionText={loading ? undefined : 'Ətraflı bax'}
                />
              )))}
            </div>
      </HomeSectionLayout>

      {/* Blogs */}
      <HomeSectionLayout
        title={<>{'Üzvlərimizdən'} <span className="text-primary">{'Bloqlar'}</span> {''}</>}
        description={'İcma üzvlərimizin təcrübələrini oxu və ilhamlan.'}
        ctaLabel={'Bloqlar'}
        ctaHref={localePath('/blogs')}
        sectionClassName="py-16 md:py-20"
        emphasis="neutral"
      >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homepageBlogsQuery.isError ? (
                <div className="col-span-full">
                  <ErrorState
                    fullPage={false}
                    title={'Bloqlar yüklənmədi'}
                    message={'Ana səhifə üçün bloqlar yüklənərkən problem baş verdi.'}
                    onRetry={() => homepageBlogsQuery.refetch()}
                  />
                </div>
              ) : !homepageBlogsQuery.isLoading && blogs.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    title={'Hazırda heç bir bloq yoxdur'}
                    message={'Daha sonra yenidən yoxla'}
                    actionText={'Daha sonra yenidən yoxla'}
                    onAction={() => homepageBlogsQuery.refetch()}
                  />
                </div>
              ) : (
                (homepageBlogsQuery.isLoading ? Array.from({ length: 6 }) : blogs).map((item: any, idx) => (
                  <ResourceCard
                    key={homepageBlogsQuery.isLoading ? idx : item._id}
                    type="blog"
                    href={homepageBlogsQuery.isLoading ? undefined : `/blogs/${item._id}`}
                    title={homepageBlogsQuery.isLoading ? 'Yüklənir...' : item.title}
                    description={homepageBlogsQuery.isLoading ? undefined : extractExcerpt(item.content)}
                    badges={homepageBlogsQuery.isLoading ? [] : (item.tags || []).slice(0, 2).map((tag: string) => ({ label: `#${tag}`, variant: 'secondary' as const }))}
                    icon={
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                    }
                    metadata={
                      homepageBlogsQuery.isLoading ? (
                        <div className="space-y-2 animate-pulse">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                          <div className="h-4 w-1/2 bg-gray-200 rounded" />
                        </div>
                      ) : (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span className="font-medium">{item.authorName}</span>
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      )
                    }
                    actionText={homepageBlogsQuery.isLoading ? undefined : 'Bloqu oxu'}
                  />
                ))
              )}
            </div>
      </HomeSectionLayout>

      {/* Organizations */}
      <HomeSectionLayout
        title={<>{'Tərəfdaş'} <span className="text-primary">{'Təşkilatlar'}</span></>}
        description={'icma360 qeydiyyatında olan təşkilatlarla tanış ol.'}
        ctaLabel={'Tərəfdaşlar'}
        ctaHref={localePath('/resources/organizations')}
        sectionClassName="py-16 md:py-20 bg-slate-50/60"
        emphasis="neutral"
      >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizationsError ? (
                <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                  <p className="font-semibold text-red-700">{organizationsError}</p>
                </div>
              ) : !loading && organizations.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    title={'Hazırda heç bir təşkilat yoxdur'}
                    message={'Daha sonra yenidən yoxla'}
                    actionText={'Daha sonra yenidən yoxla'}
                    onAction={() => loadAllContent()}
                  />
                </div>
              ) : (loading ? Array.from({ length: 6 }) : organizations).map((item: any, idx) => (
                <ResourceCard
                  key={loading ? idx : item._id}
                  type="organization"
                  href={loading ? undefined : `/resources/organizations/${item._id}`}
                  title={loading ? 'Yüklənir...' : item.organizationName}
                  badges={loading ? [] : (item.focusAreas || []).slice(0, 3).map((area: string) => ({ label: translateFocusArea(area), variant: 'secondary' as const }))}
                  icon={
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                  }
                  metadata={
                    loading ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-4 w-2/3 bg-gray-200 rounded" />
                      </div>
                    ) : (
                      <>
                        {item.location?.city && <p className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="w-4 h-4" />{item.location.city}</p>}
                      </>
                    )
                  }
                  actionText={loading ? undefined : 'Profili gör'}
                />
              ))}
            </div>
      </HomeSectionLayout>

      {/* CTA */}
      <section id="community" className="py-20 md:py-28">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 md:p-12 text-center shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Award className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              {'Böyüyən'} {'İcmamıza Qoşul'}
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              {'Böyük bir şəbəkənin parçası ol! Öz hekayəni paylaş, aktiv fürsətləri ilk sən tap və təşkilatlarla tanış ol.'}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href={localePath('/submit/blog/step1')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors">
                <BookOpen size={18} /> {'Bloqunu Paylaşın'}
              </Link>
              <Link href={localePath('/resources')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-gray-800 font-semibold hover:bg-gray-50 transition-colors">
                {'Fürsətləri Kəşf Et'} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  ) }
