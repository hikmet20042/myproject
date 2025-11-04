'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui'
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
  organization: string
  location: {
    city?: string
    country?: string
  }
  employmentType: string
  deadline: string
}

interface Blog {
  _id: string
  title: string
  authorName: string
  submittedAt: string
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
  const { t } = useLanguage()
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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

        <div className="relative section-padding py-20 w-full">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-md rounded-full border border-white/30 animate-fade-in shadow-lg">
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                  <span className="text-sm font-semibold tracking-wide">{t('titles.empowering_change_together')}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 lg:mb-6 leading-tight animate-slide-up">
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white drop-shadow-2xl">
                    {t('titles.your_gateway_to')}
                  </span>
                  <span className="block text-yellow-300 mt-2 animate-shimmer">
                    {t('titles.opportunities')}
                  </span>
                </h1>
                
                <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-blue-100 leading-relaxed animate-slide-up animation-delay-200 font-light">
                  {t('messages.discover_jobs_events_training_programs_and')}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-slide-up animation-delay-400">
                  <Link href={localePath("/resources")}>
                    <Button 
                      size="lg"
                      className="group bg-white text-blue-700 hover:bg-yellow-300 hover:text-blue-900 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-yellow-300/50 transition-all duration-300 hover:scale-105 sm:hover:scale-110 animate-pulse-glow"
                    >
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:rotate-12 transition-transform" />
                      {t('buttons.explore_now')}
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 group-hover:translate-x-2 transition-transform" />
                    </Button>
                  </Link>
                  <Link href={localePath("/submit/blog/step1")}>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="group border-2 border-white/50 text-blue-700 hover:bg-white/20 backdrop-blur-sm w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:scale-105 sm:hover:scale-110 transition-all duration-300"
                    >
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:rotate-12 transition-transform" />
                      {t('buttons.share_story')}
                    </Button>
                  </Link>
                </div>

                {/* Social Proof with Animation */}
                <div className="flex flex-wrap gap-3 sm:gap-6 pt-4 animate-fade-in animation-delay-600">
                  {[
                    { icon: Users, value: '1,000+', label: t('labels.members') },
                    { icon: TrendingUp, value: '98%', label: t('titles.success_rate') },
                    { icon: Heart, value: '500+', label: t('labels.stories_shared') }
                  ].map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 sm:hover:scale-110">
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 flex-shrink-0" />
                      <div>
                        <div className="text-sm sm:text-lg font-bold leading-tight">{stat.value}</div>
                        <div className="text-xs text-blue-200">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Live Stats Dashboard */}
              <div className="hidden lg:block animate-slide-in-right">
                <div className="relative">
                  {/* Glowing Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-3xl"></div>
                  
                  <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-yellow-300" />
                      {t('titles.live_platform_stats')}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: Briefcase, value: stats.totalVacancies, label: t('labels.active_jobs'), color: 'from-blue-400 to-blue-600', delay: '0s' },
                        { icon: Calendar, value: stats.totalEvents, label: t('titles.upcoming_events'), color: 'from-purple-400 to-purple-600', delay: '0.2s' },
                        { icon: BookOpen, value: stats.totalBlogs, label: t('titles.community_stories'), color: 'from-pink-400 to-pink-600', delay: '0.4s' },
                        { icon: Users, value: stats.totalNGOs, label: t('labels.partner_ngos'), color: 'from-indigo-400 to-indigo-600', delay: '0.6s' }
                      ].map((stat, idx) => (
                        <div 
                          key={idx}
                          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-xl group animate-scale-in"
                          style={{ animationDelay: stat.delay }}
                        >
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform shadow-lg`}>
                            <stat.icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="text-4xl font-black text-gray-900 mb-1">{stat.value}+</div>
                          <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Real-time Indicator */}
                    <div className="mt-6 flex items-center gap-2 text-sm text-green-300">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">{t('messages.updated_in_real_time')}</span>
                    </div>
                  </div>
                </div>
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
              <div className="space-y-2 sm:space-y-3">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 rounded-full">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-wide">{t('titles.opportunities')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 bg-clip-text">
                  {t('titles.launch_your')} <span className="text-blue-600">{t('titles.career')}</span>
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">{t('messages.discover_exciting_job_opportunities_waiting_for_you')}</p>
              </div>
              <Link href={localePath("/resources?tab=vacancies")}>
                <Button variant="outline" size="lg" className="group border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold rounded-lg sm:rounded-xl hover:scale-105 sm:hover:scale-110 transition-all duration-300 text-sm sm:text-base whitespace-nowrap">
                  {t('buttons.view_all_jobs')}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
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
                  <Link key={vacancy._id} href={`/resources/vacancies/${vacancy._id}`}>
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
                            {vacancy.employmentType}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                          {vacancy.title}
                        </h3>
                        
                        <p className="text-sm text-gray-700 mb-4 flex items-center gap-2 font-medium">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          {vacancy.organization}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            {vacancy.location.city || vacancy.location.country}
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                            <Clock className="w-4 h-4 text-blue-600" />
                            {formatDate(vacancy.deadline)}
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
              <div className="space-y-2 sm:space-y-3">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-100 rounded-full">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <span className="text-xs sm:text-sm font-bold text-purple-600 uppercase tracking-wide">{t('titles.events_training')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900">
                  {t('titles.upskill')} <span className="text-purple-600">{t('titles.network')}</span>
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">{t('messages.join_workshops_trainings_and_conferences')}</p>
              </div>
              <Link href={localePath("/resources?tab=events")}>
                <Button variant="outline" size="lg" className="group border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-bold rounded-lg sm:rounded-xl hover:scale-105 sm:hover:scale-110 transition-all duration-300 text-sm sm:text-base whitespace-nowrap">
                  {t('buttons.browse_events')}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
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
                  <Link key={event._id} href={`/resources/events/${event._id}`}>
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
                            {event.location.type === 'online' ? 'Online' : event.location.city || 'TBA'}
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
              <div className="space-y-2 sm:space-y-3">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-pink-100 rounded-full">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                  <span className="text-xs sm:text-sm font-bold text-pink-600 uppercase tracking-wide">{t('labels.community_voices')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900">
                  {t('labels.real')} <span className="text-pink-600">{t('titles.stories')}</span>, {t('labels.real_impact')}
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">{t('messages.be_inspired_by_experiences_from_our_community')}</p>
              </div>
              <Link href={localePath("/blogs")}>
                <Button variant="outline" size="lg" className="group border-2 border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white font-bold rounded-lg sm:rounded-xl hover:scale-105 sm:hover:scale-110 transition-all duration-300 text-sm sm:text-base whitespace-nowrap">
                  {t('buttons.read_stories')}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
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
                  <Link key={blog._id} href={`/blogs/${blog._id}`}>
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
                          <span className="text-xs">{formatDate(blog.submittedAt)}</span>
                        </div>
                        
                        {blog.tags && blog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {blog.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-xs px-2.5 py-1 bg-pink-100 text-pink-700 rounded-full font-medium">
                                {tag}
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
              <div className="space-y-2 sm:space-y-3">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-100 rounded-full">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  <span className="text-xs sm:text-sm font-bold text-indigo-600 uppercase tracking-wide">{t('labels.partner_network')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900">
                  {t('labels.trusted')} <span className="text-indigo-600">{t('titles.organizations')}</span>
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">{t('messages.ngos_working_for_positive_change')}</p>
              </div>
              <Link href={localePath("/resources?tab=ngos")}>
                <Button variant="outline" size="lg" className="group border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-bold rounded-lg sm:rounded-xl hover:scale-105 sm:hover:scale-110 transition-all duration-300 text-sm sm:text-base whitespace-nowrap">
                  {t('buttons.view_partners')}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
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
                  <Link key={ngo._id} href={`/resources/ngos/${ngo._id}`}>
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
                                {area}
                              </span>
                            ))}
                            {ngo.focusAreas.length > 3 && (
                              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                                +{ngo.focusAreas.length - 3} more
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

              {/* Stats Row - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 py-6 sm:py-8 px-4">
                {[
                  { icon: Users, value: '1,000+', label: t('labels.active_members'), color: 'from-blue-400 to-blue-600' },
                  { icon: Briefcase, value: stats.totalVacancies + '+', label: t('titles.opportunities'), color: 'from-purple-400 to-purple-600' },
                  { icon: Heart, value: stats.totalBlogs + '+', label: t('labels.stories_shared'), color: 'from-pink-400 to-pink-600' }
                ].map((stat, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 sm:gap-3 bg-white/15 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-white/30 hover:bg-white/25 transition-all duration-300 hover:scale-105 sm:hover:scale-110 animate-scale-in w-full sm:w-auto"
                    style={{ animationDelay: `${idx * 0.2}s` }}
                  >
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl sm:text-3xl font-black text-white">{stat.value}</div>
                      <div className="text-xs sm:text-sm text-white/80 font-medium">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-2 sm:pt-4 px-4">
                <Link href={localePath("/submit/blog/step1")} className="w-full sm:w-auto">
                  <Button 
                    size="lg"
                    className="group bg-white text-blue-700 hover:bg-yellow-300 hover:text-blue-900 px-6 sm:px-8 md:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg md:text-xl shadow-2xl hover:shadow-yellow-300/50 transition-all duration-300 hover:scale-105 sm:hover:scale-110 w-full sm:w-auto"
                  >
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 group-hover:rotate-12 transition-transform" />
                    {t('buttons.share_your_story')}
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 group-hover:rotate-12 transition-transform" />
                  </Button>
                </Link>
                <Link href={localePath("/resources")} className="w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="group border-2 sm:border-3 border-white/70 text-blue-700 hover:bg-white/20 backdrop-blur-md px-6 sm:px-8 md:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg md:text-xl hover:scale-105 sm:hover:scale-110 transition-all duration-300 shadow-xl w-full sm:w-auto"
                  >
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 group-hover:rotate-12 transition-transform" />
                    {t('buttons.explore_opportunities')}
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Trust Badges - Mobile Responsive */}
              <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-white/90 px-4">
                {[
                  { icon: CheckCircle, text: t('titles.verified_platform') },
                  { icon: TrendingUp, text: t('labels.growing_daily') },
                  { icon: GraduationCap, text: t('labels.free_resources') },
                  { icon: Heart, text: t('titles.community_driven') }
                ].map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <badge.icon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 flex-shrink-0" />
                    <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-gray-50 py-6 border-t border-gray-200">
        <div className="section-padding">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{t('common.note')}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('home.disclaimer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
