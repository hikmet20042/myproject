'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock, 
  ExternalLink,
  Building,
  Users,
  CheckCircle,
  FileText,
  Mail,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumb, Loading } from '@/components/ui'
import SaveButton from '@/components/SaveButton'
import ViewTracker from '@/components/ViewTracker'
import { LoadingState, ErrorState, AnimatedBackground } from '@/components/shared'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

interface Vacancy {
  _id: string
  title: string
  description: string
  type: 'job' | 'volunteer' | 'internship'
  category: string
  workType: 'remote' | 'onsite' | 'hybrid'
  location: {
    city?: string
    country?: string
    address?: string
    isRemote: boolean
  }
  requirements: string[]
  responsibilities: string[]
  qualifications: string[]
  experienceLevel: 'entry' | 'mid' | 'senior' | 'any'
  duration: {
    type: 'permanent' | 'contract' | 'temporary'
    contractLength?: {
      value: number
      unit: 'months' | 'years'
    }
  }
  compensation: {
    type: 'paid' | 'unpaid' | 'stipend'
    amount?: number
    currency?: string
    period?: 'hourly' | 'monthly' | 'yearly'
    benefits?: string[]
  }
  applicationProcess: {
    applicationLink?: string
    email?: string
    instructions: string
    requiredDocuments: string[]
  }
  applicationDeadline: string
  startDate?: string
  skills: string[]
  languages?: string[]
  tags: string[]
  createdBy: {
    _id: string
    name: string
  }
  status: string
  isPublished: boolean
  isFeatured: boolean
  isUrgent: boolean
  views: number
  createdAt: string
}

export default function VacancyDetailPage() {
  const { t } = useLanguage()
  const localePath = useLocalizedPath()
  const params = useParams()
  const router = useRouter()
  const [vacancy, setVacancy] = useState<Vacancy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params?.id) {
      fetchVacancy(params.id as string)
    }
  }, [params?.id])

  const fetchVacancy = async (id: string) => {
    try {
      const response = await fetch(`/api/vacancies/${id}`)
      if (!response.ok) {
        throw new Error('Vacancy not found')
      }
      const data = await response.json()
      setVacancy(data.vacancy)
    } catch (error) {
      console.error('Error fetching vacancy:', error)
      setError('Failed to load vacancy details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return t('events.dateTBD') || 'Date TBD'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return t('events.invalidDate') || 'Invalid Date'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job': return 'bg-green-100 text-green-800'
      case 'volunteer': return 'bg-purple-100 text-purple-800'
      case 'internship': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case 'remote': return 'bg-blue-100 text-blue-800'
      case 'onsite': return 'bg-indigo-100 text-indigo-800'
      case 'hybrid': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <LoadingState
        text="Loading vacancy details..."
        gradientFrom="from-green-50"
        gradientVia="via-blue-50"
        gradientTo="to-indigo-50"
        spinnerColor="border-green-600"
      />
    )
  }

  if (error || !vacancy) {
    return (
      <ErrorState
        title={t('vacancies.notFound') || 'Vacancy Not Found'}
        message={error || (t('vacancies.notFoundText') || 'The vacancy you are looking for does not exist or has been removed.')}
        onRetry={() => router.push(localePath('/resources/vacancies'))}
        retryText={t('vacancies.backToVacancies') || 'Back to Vacancies'}
      />
    )
  }

  const daysUntilDeadline = getDaysUntilDeadline(vacancy.applicationDeadline)
  const isDeadlinePassed = daysUntilDeadline < 0
  const isDeadlineNear = daysUntilDeadline > 0 && daysUntilDeadline <= 7

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Modern & Engaging */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-blue-600 to-indigo-900 text-white py-12 sm:py-16">
        {/* Animated Blobs */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="section-padding relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <Button
              onClick={() => router.push(localePath('/resources/vacancies'))}
              variant="ghost"
              className="mb-6 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.backTo', { page: t('vacancies.title') }) || 'Back to Vacancies'}
            </Button>

            {/* View Tracker */}
            <div className="mb-6">
              <ViewTracker 
                itemId={vacancy._id} 
                itemType="vacancy" 
                initialViews={vacancy.views}
                className="text-white/90"
              />
            </div>

            {/* Header */}
            <div className="animate-fade-in">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={getTypeColor(vacancy.type)}>
                  {vacancy.type.toUpperCase()}
                </Badge>
                <Badge className={getWorkTypeColor(vacancy.workType)}>
                  {vacancy.workType.toUpperCase()}
                </Badge>
                {vacancy.isFeatured && (
                  <Badge className="bg-yellow-100 text-yellow-800 font-bold">
                    ⭐ FEATURED
                  </Badge>
                )}
                {vacancy.isUrgent && (
                  <Badge className="bg-red-100 text-red-800 font-bold animate-pulse">
                    🔥 URGENT
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
                {vacancy.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-white/90">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  <span className="font-semibold">{vacancy.createdBy?.name || (t('common.unknown') || 'Unknown')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">
                    {vacancy.location.isRemote 
                      ? t('vacancies.remote') 
                      : `${vacancy.location.city || ''}${vacancy.location.city && vacancy.location.country ? ', ' : ''}${vacancy.location.country || ''}`
                    }
                  </span>
                </div>
                {vacancy.compensation.type === 'paid' && vacancy.compensation.amount && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">
                      {vacancy.compensation.amount} {vacancy.compensation.currency}/{vacancy.compensation.period}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Main Content - Enhanced Design */}
      <div className="section-padding py-10 sm:py-14 relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-green-100 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Description */}
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    Job Description
                  </h2>
                  <div className="prose max-w-none text-gray-700 leading-relaxed text-base">
                    {vacancy.description}
                  </div>
                </CardContent>
              </Card>

              {/* Responsibilities */}
              {vacancy.responsibilities && vacancy.responsibilities.length > 0 && (
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                  <CardContent className="p-6 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-white" />
                      </div>
                      {t('vacancies.responsibilities')}
                    </h2>
                    <ul className="space-y-3">
                      {vacancy.responsibilities.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                          <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {vacancy.requirements && vacancy.requirements.length > 0 && (
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                  <CardContent className="p-6 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      {t('vacancies.requirements')}
                    </h2>
                    <ul className="space-y-3">
                      {vacancy.requirements.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Qualifications */}
              {vacancy.qualifications && vacancy.qualifications.length > 0 && (
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                  <CardContent className="p-6 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      {t('vacancies.preferredQualifications')}
                    </h2>
                    <ul className="space-y-3">
                      {vacancy.qualifications.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
                          <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Application Instructions - Enhanced */}
              <Card className="shadow-2xl bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 border-2 border-green-200">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center animate-pulse">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    {t('vacancies.howToApply')}
                  </h2>
                  <p className="text-gray-700 mb-6 leading-relaxed text-base">
                    {vacancy.applicationProcess.instructions}
                  </p>

                  {vacancy.applicationProcess.requiredDocuments && vacancy.applicationProcess.requiredDocuments.length > 0 && (
                    <div className="mb-6 p-4 bg-white rounded-xl border border-blue-200">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        {t('vacancies.requiredDocuments')}:
                      </h3>
                      <ul className="space-y-2">
                        {vacancy.applicationProcess.requiredDocuments.map((doc, index) => (
                          <li key={index} className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    {vacancy.applicationProcess.applicationLink && (
                      <Button
                        onClick={() => window.open(vacancy.applicationProcess.applicationLink, '_blank')}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        {t('vacancies.applyNow')}
                      </Button>
                    )}
                    {vacancy.applicationProcess.email && (
                      <Button
                        onClick={() => window.location.href = `mailto:${vacancy.applicationProcess.email}`}
                        variant="outline"
                        className="flex-1 font-bold py-4 rounded-xl border-2 hover:scale-105 transition-all duration-300"
                      >
                        <Mail className="w-5 h-5 mr-2" />
                        {t('common.emailApplication')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Enhanced */}
            <div className="space-y-6">
              {/* Quick Info */}
              <Card className="shadow-xl sticky top-6 border-2 border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-br from-green-600 to-blue-600 p-4">
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('vacancies.quickInfo')}
                  </h3>
                </div>
                <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
                  
                  <div className="space-y-5">
                    {/* Deadline */}
                    <div className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-green-300 transition-colors">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <span className="font-bold">{t('vacancies.applicationDeadline')}</span>
                      </div>
                      <p className={`font-black text-lg ${isDeadlinePassed ? 'text-red-600' : isDeadlineNear ? 'text-orange-600' : 'text-gray-900'}`}>
                        {formatDate(vacancy.applicationDeadline)}
                        {!isDeadlinePassed && (
                          <span className="text-sm font-normal text-gray-600 ml-2 block mt-1">
                            ({t(daysUntilDeadline === 1 ? 'vacancies.dayLeft' : 'vacancies.daysLeft', { count: daysUntilDeadline })})
                          </span>
                        )}
                        {isDeadlinePassed && (
                          <span className="text-sm font-normal ml-2 block mt-1">({t('vacancies.closed')})</span>
                        )}
                      </p>
                    </div>

                    {/* Start Date */}
                    {vacancy.startDate && (
                      <div className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <span className="font-bold">{t('vacancies.startDate')}</span>
                        </div>
                        <p className="font-black text-lg text-gray-900">{formatDate(vacancy.startDate)}</p>
                      </div>
                    )}

                    {/* Experience Level */}
                    <div className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-colors">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                        <span className="font-bold">{t('filters.experience')}</span>
                      </div>
                      <p className="font-black text-lg text-gray-900 capitalize">{vacancy.experienceLevel}</p>
                    </div>

                    {/* Duration */}
                    <div className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <span className="font-bold">{t('vacancies.duration')}</span>
                      </div>
                      <p className="font-black text-lg text-gray-900 capitalize">
                        {vacancy.duration.type}
                        {vacancy.duration.contractLength && (
                          <span className="text-sm font-normal text-gray-600 ml-1 block mt-1">
                            ({vacancy.duration.contractLength.value} {vacancy.duration.contractLength.unit})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Skills */}
                    {vacancy.skills && vacancy.skills.length > 0 && (
                      <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                        <div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          {t('vacancies.requiredSkills')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {vacancy.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs font-bold bg-white border-2 border-green-200 hover:bg-green-100 transition-colors">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {vacancy.languages && vacancy.languages.length > 0 && (
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                        <div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Globe className="w-5 h-5 text-blue-600" />
                          Languages
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {vacancy.languages.map((lang, index) => (
                            <Badge key={index} variant="secondary" className="text-xs font-bold bg-white border-2 border-blue-200 hover:bg-blue-100 transition-colors">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t-2 border-gray-200">
                    <SaveButton
                      itemId={vacancy._id}
                      itemType="vacancy"
                      itemTitle={vacancy.title}
                      size="md"
                      className="w-full font-bold py-3 rounded-xl hover:scale-105 transition-all duration-300"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              {vacancy.compensation.benefits && vacancy.compensation.benefits.length > 0 && (
                <Card className="shadow-lg border-2 border-gray-200">
                  <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      Benefits
                    </h3>
                  </div>
                  <CardContent className="p-6 bg-gradient-to-br from-white to-purple-50">
                    <ul className="space-y-3">
                      {vacancy.compensation.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200">
                          <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 font-medium">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
