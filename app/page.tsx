'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button, ButtonLink } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Briefcase,
  Calendar,
  Users,
  BookOpen,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  Heart,
  Building2,
  GraduationCap,
  Sparkles,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  Target,
  Award
} from 'lucide-react'
import RecentCommunityContent from '@/components/RecentCommunityContent'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import Script from 'next/script'
import { generateWebSiteSchema } from '@/lib/seo'





interface Event {
  _id: string
  title: string
  eventType: string
  eventDate: string
  location: {
    type: string
    city?: string
  }
  organizationName?: string
}

interface Vacancy {
  _id: string
  title: string
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  location: {
    city?: string
    country?: string
  }
  type: string
  applicationDeadline: string
}

interface Blog {
  _id: string
  title: string
  authorName: string
  createdAt: string
  tags: string[]
  content: any
}

interface NGO {
  _id: string
  organizationName: string
  focusAreas: string[]
  location?: {
    city?: string
  }
}

export default function HomePage() {
  const { t, language } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  // Content states
  const [events, setEvents] = useState<Event[]>([])
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [ngos, setNGOs] = useState<NGO[]>([])

  // Stats
  const localePath = useLocalizedPath()
  const [stats, setStats] = useState({
    totalBlogs: 0,
    totalEvents: 0,
    totalVacancies: 0,
    totalNGOs: 0
  })

  useEffect(() => {
    setMounted(true)
    loadAllContent()
  }, [])

  const loadAllContent = async () => {
    try {
      setLoading(true)

      // Fetch all content in parallel
      const [eventsRes, vacanciesRes, blogsRes, ngosRes] = await Promise.all([
        fetch('/api/events?page=1&limit=6&status=approved'),
        fetch('/api/vacancies?page=1&limit=6&status=approved'),
        fetch('/api/blogs?page=1&limit=6'),
        fetch('/api/ngos?page=1&limit=6&status=approved')
      ])

      if (eventsRes.ok) {
        const data = await eventsRes.json()
        setEvents(data.events || [])
        setStats(prev => ({ ...prev, totalEvents: data.total || 0 }))
      }

      if (vacanciesRes.ok) {
        const data = await vacanciesRes.json()
        setVacancies(data.vacancies || [])
        setStats(prev => ({ ...prev, totalVacancies: data.total || 0 }))
      }

      if (blogsRes.ok) {
        const data = await blogsRes.json()
        const approvedBlogs = (data.blogs || data.results || []).filter((blog: any) => blog.status === 'approved')
        setBlogs(approvedBlogs)
        setStats(prev => ({ ...prev, totalBlogs: data.total || approvedBlogs.length }))
      }

      if (ngosRes.ok) {
        const data = await ngosRes.json()
        setNGOs(data.ngos || [])
        setStats(prev => ({ ...prev, totalNGOs: data.total || 0 }))
      }

    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return t('common.unknown') || 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return t('common.unknown') || 'Invalid Date'

    const day = date.getDate()
    const year = date.getFullYear()

    if (language === 'az') {
      // Azerbaijani month names
      const months = [
        'Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn',
        'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'
      ]
      const month = months[date.getMonth()]
      return `${day} ${month} ${year}`
    } else {
      // English format
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  // Format tag from slug to readable format (e.g., "legal-aid" -> "Legal Aid")
  const formatTag = (tag: string) => {
    if (!tag) return ''
    return tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Translate focus area from English to current language
  const translateFocusArea = (area: string) => {
    if (!area) return area

    // Convert "Women's Rights" -> "womensRights", "Legal Aid" -> "legalAid"
    const normalized = area
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, char: string) => char.toUpperCase())

    const translationKey = `auth.focusAreas_${normalized}`
    const translated = t(translationKey)

    // If translation not found, return original
    return translated === translationKey ? area : translated
  }

  const extractExcerpt = (content: any, maxWords = 20) => {
    let text = ''
    if (Array.isArray(content)) {
      text = content
        .map((block: any) => {
          if (block.content && Array.isArray(block.content)) {
            return block.content.map((item: any) => item.text || '').join('')
          }
          return ''
        })
        .join(' ')
        .trim()
    } else if (typeof content === 'string') {
      text = content
    }

    const words = text.split(' ').slice(0, maxWords)
    return words.join(' ') + (words.length >= maxWords ? '...' : '')
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* SEO-optimized structured data for homepage */}
      <Script
        id="homepage-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "icma360-da hansı imkanları tapa bilərəm?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "icma360 Azərbaycanda gənclər üçün geniş imkan çeşidi təklif edir: tam zamanlı və part-time işlər, təcrübə proqramları, könüllülük imkanları, təlim tədbirləri, vorkşoplar, konfranslar, təqaüdlər və qrantlar. Biz gəncləri bütün sektorlarda QHT və təşkilatlarla əlaqələndiririk."
                }
              },
              {
                "@type": "Question",
                "name": "Azərbaycanda iş necə tapa bilərəm?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "İmkanlar bölməsində Azərbaycan üzrə QHT və təşkilatlardan 500+ təsdiqlənmiş iş elanı tapa bilərsiniz. Yerə görə (Bakı, Sumqayıt, Gəncə), iş növünə, son tarixə və fəaliyyət sahəsinə görə filtr edin. Hesab yaradın, işləri saxlayın və fərdi bildirişlər alın."
                }
              },
              {
                "@type": "Question",
                "name": "İmkanlara müraciət etmək pulsuzdurmu?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Bəli! icma360 iş axtaranlar və gənclər üçün tamamilə pulsuzdur. Bütün sadalanan imkanlar təsdiqlənmiş və müraciəti pulsuzdur. Biz heç vaxt istifadəçilərdən imkanlara daxil olmaq və ya vəzifələrə müraciət etmək üçün ödəniş tələb etmirik."
                }
              },
              {
                "@type": "Question",
                "name": "Bakıda təcrübə proqramı tapa bilərəmmi?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Əlbəttə! Bakı və Azərbaycanın digər şəhərlərində çoxsaylı təcrübə imkanları təqdim edirik. Yer və imkan növünə görə filtr edərək maraq sahənizdə təcrübə proqramları tapın - IT, marketinq, QHT və inkişaf sektorlarında."
                }
              },
              {
                "@type": "Question",
                "name": "Necə QHT ilə əlaqə qura bilərəm?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "QHT bölməsində 100+ təsdiqlənmiş təşkilatın məlumatlarını tapa bilərsiniz. Hər bir QHT profilində əlaqə məlumatları, fəaliyyət sahələri və cari imkanlar göstərilir. Birbaşa əlaqə saxlaya və ya platformamız vasitəsilə müraciət edə bilərsiniz."
                }
              }
            ]
          })
        }}
      />

      {/* Hero Section - Ultra Modern with Parallax Effect */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 text-white min-h-[90vh] flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        <div className="relative section-padding py-24 sm:py-32 w-full">
          <div className="max-w-7xl mx-auto">
            {/* Centered Hero Content */}
            <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-5xl mx-auto">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-slide-up">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium text-white">{t('labels.welcome_to_platform')}</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight animate-slide-up animation-delay-100">
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white drop-shadow-2xl">
                  {t('titles.your_gateway_to')}
                </span>
                <span className="block text-yellow-300 mt-2 sm:mt-4 animate-shimmer">
                  {t('titles.opportunities')}
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-blue-100 leading-relaxed animate-slide-up animation-delay-200 font-light max-w-4xl px-4">
                {t('messages.discover_jobs_events_training_programs_and')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 justify-center animate-slide-up animation-delay-300 pt-4">
                <ButtonLink
                  href={localePath("/resources")}
                  variant="white-on-dark"
                  size="lg"
                  icon={Target}
                  iconPosition="left"
                  shadow="xl"
                  hoverEffect="scale"
                  className="w-full sm:w-auto px-8 py-4 text-lg"
                >
                  {t('buttons.explore_now')}
                  <ArrowRight className="w-6 h-6 ml-2" />
                </ButtonLink>
                <ButtonLink
                  href={localePath("/submit/blog/step1")}
                  variant="outline"
                  size="lg"
                  icon={MessageSquare}
                  iconPosition="left"
                  hoverEffect="scale"
                  className="w-full sm:w-auto px-8 py-4 text-lg border-2 border-white/30 hover:bg-white/20"
                >
                  {t('buttons.share_story')}
                </ButtonLink>
              </div>



            </div>
          </div>
        </div>


      </section>

      {/* Latest Opportunities (Vacancies) - Ultra Engaging */}
      <section className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-white relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20 -translate-y-1/2"></div>

        <div className="section-padding relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 lg:mb-12 gap-4">
              <div className="space-y-2 sm:space-y-3 flex-1">

                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 bg-clip-text">
                  {t('titles.launch_your')} <span className="text-blue-600">{t('titles.career')}</span>
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">{t('messages.discover_exciting_job_opportunities_waiting_for_you')}</p>
              </div>
              <ButtonLink
                href={localePath("/resources?tab=vacancies")}
                variant="outline"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                hoverEffect="scale"
                className="flex-shrink-0 whitespace-nowrap"
              >
                {t('buttons.view_all_jobs')}
              </ButtonLink>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : vacancies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vacancies.map((vacancy, idx) => (
                  <Link key={vacancy._id} href={localePath(`/resources/vacancies/${vacancy._id}`)}>
                    <div
                      className="group relative bg-gradient-to-br from-white to-blue-50/50 rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full overflow-hidden animate-fade-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/5 group-hover:to-blue-600/5 transition-all duration-500 rounded-2xl"></div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                            <Briefcase className="w-7 h-7 text-white" />
                          </div>
                          <span className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-full font-bold shadow-sm group-hover:bg-yellow-400 group-hover:text-blue-900 transition-colors duration-300">
                            {vacancy.type}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                          {vacancy.title}
                        </h3>

                        <p className="text-sm text-gray-700 mb-4 flex items-center gap-2 font-medium">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          {vacancy.createdBy?.name || t('common.unknown')}
                        </p>

                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            {vacancy.location.city || vacancy.location.country}
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <Clock className="w-4 h-4 text-blue-600" />
                            {formatDate(vacancy.applicationDeadline)}
                          </span>
                        </div>

                        {/* Hover Action */}
                        <div className="mt-4 flex items-center text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <span>{t('buttons.view_details')}</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl border-2 border-dashed border-gray-300">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-gray-600 text-lg font-medium">{t('messages.no_vacancies_available_at_the_moment')}</p>
                <p className="text-gray-500 text-sm mt-2">{t('messages.check_back_soon_for_new_opportunities')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events - Vibrant & Engaging */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-20 translate-y-1/2"></div>

        <div className="section-padding relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 lg:mb-12 gap-4">
              <div className="space-y-2 sm:space-y-3 flex-1">

                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900">
                  {t('titles.upskill')} <span className="text-purple-600">{t('titles.network')}</span>
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">{t('messages.join_workshops_trainings_and_conferences')}</p>
              </div>
              <ButtonLink
                href={localePath("/resources?tab=events")}
                variant="outline"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                hoverEffect="scale"
                className="flex-shrink-0 whitespace-nowrap"
              >
                {t('buttons.browse_events')}
              </ButtonLink>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, idx) => (
                  <Link key={event._id} href={localePath(`/resources/events/${event._id}`)}>
                    <div
                      className="group relative bg-gradient-to-br from-white to-purple-50/50 rounded-2xl p-6 border-2 border-gray-200 hover:border-purple-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full overflow-hidden animate-fade-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                            <Calendar className="w-7 h-7 text-white" />
                          </div>
                          <span className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-full font-bold shadow-sm group-hover:bg-yellow-400 group-hover:text-purple-900 transition-colors duration-300 capitalize">
                            {event.eventType}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2 leading-tight">
                          {event.title}
                        </h3>

                        {event.organizationName && (
                          <p className="text-sm text-gray-700 mb-4 flex items-center gap-2 font-medium">
                            <Building2 className="w-4 h-4 text-purple-600" />
                            {event.organizationName}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <MapPin className="w-4 h-4 text-purple-600" />
                            {event.location.type === 'online' ? (t('events.online') || 'Online') : event.location.city || (t('events.notSpecified') || 'TBA')}
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <Clock className="w-4 h-4 text-purple-600" />
                            {formatDate(event.eventDate)}
                          </span>
                        </div>

                        {/* Hover Action */}
                        <div className="mt-4 flex items-center text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <span>{t('titles.learn_more')}</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-purple-50 rounded-3xl border-2 border-dashed border-gray-300">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-purple-600" />
                </div>
                <p className="text-gray-600 text-lg font-medium">{t('content.no_upcoming_events_at_the_moment')}</p>
                <p className="text-gray-500 text-sm mt-2">{t('content.new_events_are_added_regularly')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Community Stories (Blogs) - Inspiring & Personal */}
      <section className="py-20 bg-gradient-to-br from-white via-pink-50/30 to-white relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-100 rounded-full filter blur-3xl opacity-20 -translate-y-1/2"></div>

        <div className="section-padding relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 lg:mb-12 gap-4">
              <div className="space-y-2 sm:space-y-3 flex-1">

                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900">
                  {t('labels.real')} <span className="text-pink-600">{t('titles.stories')}</span> {t('labels.real_impact')}
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">{t('messages.be_inspired_by_experiences_from_our_community')}</p>
              </div>
              <ButtonLink
                href={localePath("/blogs")}
                variant="outline"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                hoverEffect="scale"
                className="flex-shrink-0 whitespace-nowrap"
              >
                {t('buttons.read_stories')}
              </ButtonLink>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog, idx) => (
                  <Link key={blog._id} href={localePath(`/blogs/${blog._id}`)}>
                    <div
                      className="group relative bg-gradient-to-br from-white to-pink-50/50 rounded-2xl p-6 border-2 border-gray-200 hover:border-pink-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full overflow-hidden animate-fade-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-pink-600/0 group-hover:from-pink-500/5 group-hover:to-pink-600/5 transition-all duration-500 rounded-2xl"></div>

                      <div className="relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                          <BookOpen className="w-7 h-7 text-white" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors line-clamp-2 leading-tight">
                          {blog.title}
                        </h3>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                          {extractExcerpt(blog.content)}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span className="font-semibold text-pink-600">{blog.authorName}</span>
                          <span className="text-xs">{formatDate(blog.createdAt)}</span>
                        </div>

                        {blog.tags && blog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {blog.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-xs px-2.5 py-1 bg-pink-100 text-pink-700 rounded-full font-medium">
                                {formatTag(tag)}
                              </span>
                            ))}
                            {blog.tags.length > 2 && (
                              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                                +{blog.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Hover Action */}
                        <div className="mt-4 flex items-center text-pink-600 font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <span>{t('buttons.read_story')}</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-pink-50 rounded-3xl border-2 border-dashed border-gray-300">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-pink-600" />
                </div>
                <p className="text-gray-600 text-lg font-medium">{t('content.no_stories_shared_yet')}</p>
                <p className="text-gray-500 text-sm mt-2">{t('messages.be_the_first_to_share_your_experience')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Partner NGOs */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-20 translate-x-1/2"></div>

        <div className="section-padding relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 lg:mb-12 gap-4">
              <div className="space-y-2 sm:space-y-3 flex-1">

                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900">
                  {t('labels.trusted')} <span className="text-indigo-600">{t('titles.organizations')}</span>
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">{t('messages.ngos_working_for_positive_change')}</p>
              </div>
              <ButtonLink
                href={localePath("/resources?tab=ngos")}
                variant="outline"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                hoverEffect="scale"
                className="flex-shrink-0 whitespace-nowrap"
              >
                {t('buttons.view_partners')}
              </ButtonLink>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : ngos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ngos.map((ngo, idx) => (
                  <Link key={ngo._id} href={localePath(`/resources/ngos/${ngo._id}`)}>
                    <div
                      className="group relative bg-gradient-to-br from-white to-indigo-50/50 rounded-2xl p-6 border-2 border-gray-200 hover:border-indigo-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full overflow-hidden animate-fade-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-600/0 group-hover:from-indigo-500/5 group-hover:to-indigo-600/5 transition-all duration-500 rounded-2xl"></div>

                      <div className="relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                          <Users className="w-7 h-7 text-white" />
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {ngo.organizationName}
                        </h3>

                        {ngo.location?.city && (
                          <p className="text-sm text-gray-600 mb-3 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="line-clamp-1">{ngo.location.city}</span>
                          </p>
                        )}

                        {ngo.focusAreas && ngo.focusAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {ngo.focusAreas.slice(0, 3).map((area, idx) => (
                              <span key={idx} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full group-hover:bg-yellow-100 group-hover:text-yellow-700 transition-colors font-medium">
                                {translateFocusArea(area)}
                              </span>
                            ))}
                            {ngo.focusAreas.length > 3 && (
                              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                                +{ngo.focusAreas.length - 3} {t('common.more') || 'more'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* View Details Indicator */}
                        <div className="mt-4 pt-4 border-t border-gray-200 group-hover:border-indigo-200 transition-colors">
                          <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-2">
                            {t('buttons.view_details')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium">{t('messages.no_partner_organizations_yet')}</p>
                <p className="text-gray-500 text-sm mt-2">{t('messages.check_back_soon_for_trusted_ngo_partners')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action - Spectacular & Immersive */}
      <section className="relative py-24 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>

        {/* Animated Blobs */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-20 right-10 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="relative section-padding z-10">
          <div className="max-w-5xl mx-auto">
            {/* Icon Badge with Animation */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-300 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 shadow-2xl animate-float">
                  <Award className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-4 sm:space-y-6 animate-fade-in">
              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight px-4">
                <span className="block">{t('titles.join_our')}</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300 drop-shadow-2xl">
                  {t('titles.growing_community')}
                </span>
              </h2>

              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 mb-3 sm:mb-4 leading-relaxed max-w-3xl mx-auto font-light px-4">
                {t('messages.be_part_of_something_bigger_share_your_journey')}
              </p>

              {/* CTA Buttons - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-8 sm:pt-10 px-4">
                <ButtonLink
                  href={localePath("/submit/blog/step1")}
                  variant="white-on-dark"
                  size="xl"
                  icon={BookOpen}
                  iconPosition="left"
                  shadow="xl"
                  hoverEffect="scale"
                  className="w-full sm:w-auto"
                >
                  {t('buttons.share_your_story')}
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
                </ButtonLink>
                <ButtonLink
                  href={localePath("/resources")}
                  variant="outline"
                  size="xl"
                  icon={Target}
                  iconPosition="left"
                  shadow="xl"
                  hoverEffect="scale"
                  className="w-full sm:w-auto"
                >
                  {t('buttons.explore_opportunities')}
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
                </ButtonLink>
              </div>


            </div>
          </div>
        </div>
      </section>


    </div>
  )
}
