'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
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

export default function HomePage() {
  const localePath = useLocalizedPath()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [stats, setStats] = useState({ totalBlogs: 0,
    totalEvents: 0,
    totalVacancies: 0,
    totalOrganizations: 0 })

  useEffect(() => { setMounted(true)
    loadAllContent() }, [])

  const loadAllContent = async () => { try { setLoading(true)
      const [eventsRes, vacanciesRes, blogsRes, organizationsRes] = await Promise.all([
        fetch('/api/events?page=1&limit=6&status=approved'),
        fetch('/api/vacancies?page=1&limit=6&status=approved'),
        fetch('/api/blogs?page=1&limit=6'),
        fetch('/api/organizations?page=1&limit=6&status=approved')
      ])

      if (eventsRes.ok) { const data = await eventsRes.json()
        setEvents(data.events || [])
        setStats((prev) => ({ ...prev, totalEvents: data.total || 0 })) }

      if (vacanciesRes.ok) { const data = await vacanciesRes.json()
        setVacancies(data.vacancies || [])
        setStats((prev) => ({ ...prev, totalVacancies: data.total || 0 })) }

      if (blogsRes.ok) { const data = await blogsRes.json()
        const approvedBlogs = (data.blogs || data.results || []).filter((blog: any) => blog.status === 'approved')
        setBlogs(approvedBlogs)
        setStats((prev) => ({ ...prev, totalBlogs: data.total || approvedBlogs.length })) }

      if (organizationsRes.ok) { const data = await organizationsRes.json()
        setOrganizations(data.organizations || [])
        setStats((prev) => ({ ...prev, totalOrganizations: data.total || 0 })) } } catch (error) { console.error('Error loading content:', error) } finally { setLoading(false) } }

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

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero (community-connect-main style) */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors"
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

      {/* Vacancies */}
      <section className="py-16 md:py-20">
        <div className="section-padding">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {'Karyera'} <span className="text-primary">{'Fürsətləri'}</span>
                </h2>
                <p className="mt-2 text-gray-600">{'Hal-hazırda aktiv olan iş imkanlarına müraciət et.'}</p>
              </div>
              <Link href={localePath('/resources/vacancies')} className="inline-flex items-center gap-2 text-primary font-semibold hover:text-blue-700">
                {'Vakansiyalar'} <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(loading ? Array.from({ length: 6 }) : vacancies).map((item: any, idx) => (
                <div key={loading ? idx : item._id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
                  {loading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                      <div className="h-6 w-full bg-gray-200 rounded" />
                      <div className="h-4 w-2/3 bg-gray-200 rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs rounded-full bg-primary/10 text-primary px-2.5 py-1 font-semibold">{item.type}</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-2"><Building2 className="w-4 h-4" />{item.createdBy?.name || 'Naməlum'}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="w-4 h-4" />{item.location?.city || item.location?.country || 'Naməlum'}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1"><Clock className="w-4 h-4" />{formatDate(item.applicationDeadline)}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="py-16 md:py-20 bg-slate-50/60">
        <div className="section-padding">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {'Təlim və'} <span className="text-primary">{'Tədbirlər'}</span>
                </h2>
                <p className="mt-2 text-gray-600">{'Seminar, təlim və konfranslarda iştirak et, şəbəkəni qur.'}</p>
              </div>
              <Link href={localePath('/resources/events')} className="inline-flex items-center gap-2 text-primary font-semibold hover:text-blue-700">
                {'Tədbirlər'} <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(loading ? Array.from({ length: 6 }) : events).map((item: any, idx) => (
                <div key={loading ? idx : item._id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
                  {loading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                      <div className="h-6 w-full bg-gray-200 rounded" />
                      <div className="h-4 w-2/3 bg-gray-200 rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs rounded-full bg-accent/15 text-green-700 px-2.5 py-1 font-semibold capitalize">{item.eventType}</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2">{item.title}</h3>
                      {item.organizationName && <p className="text-sm text-gray-600 mb-2">{item.organizationName}</p>}
                      <p className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="w-4 h-4" />{item.location?.type === 'online' ? 'Onlayn' : item.location?.city || 'Məlumat yoxdur'}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1"><Clock className="w-4 h-4" />{formatDate(item.eventDate)}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blogs */}
      <section className="py-16 md:py-20">
        <div className="section-padding">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {'Üzvlərimizdən'} <span className="text-primary">{'Bloqlar'}</span> {''}
                </h2>
                <p className="mt-2 text-gray-600">{'İcma üzvlərimizin təcrübələrini oxu və ilhamlan.'}</p>
              </div>
              <Link href={localePath('/blogs')} className="inline-flex items-center gap-2 text-primary font-semibold hover:text-blue-700">
                {'Bloqlar'} <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(loading ? Array.from({ length: 6 }) : blogs).map((item: any, idx) => (
                <div key={loading ? idx : item._id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
                  {loading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                      <div className="h-6 w-full bg-gray-200 rounded" />
                      <div className="h-16 w-full bg-gray-200 rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">{extractExcerpt(item.content)}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span className="font-medium">{item.authorName}</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Organizations */}
      <section className="py-16 md:py-20 bg-slate-50/60">
        <div className="section-padding">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {'Tərəfdaş'} <span className="text-primary">{'Təşkilatlar'}</span>
                </h2>
                <p className="mt-2 text-gray-600">{'icma360 qeydiyyatında olan təşkilatlarla tanış ol.'}</p>
              </div>
              <Link href={localePath('/resources/organizations')} className="inline-flex items-center gap-2 text-primary font-semibold hover:text-blue-700">
                {'Tərəfdaşlar'} <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(loading ? Array.from({ length: 6 }) : organizations).map((item: any, idx) => (
                <div key={loading ? idx : item._id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
                  {loading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                      <div className="h-6 w-full bg-gray-200 rounded" />
                      <div className="h-4 w-2/3 bg-gray-200 rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2">{item.organizationName}</h3>
                      {item.location?.city && <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3"><MapPin className="w-4 h-4" />{item.location.city}</p>}
                      <div className="flex flex-wrap gap-1.5">
                        {(item.focusAreas || []).slice(0, 3).map((area: string, i: number) => (
                          <span key={i} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{translateFocusArea(area)}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
