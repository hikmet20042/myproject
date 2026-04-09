'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Calendar,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  ExternalLink,
  Building,
  CheckCircle,
  FileText,
  Mail,
  Globe,
} from 'lucide-react'
import { ButtonLink } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import SaveButton from '../../../../components/SaveButton'
import ViewTracker from '@/components/ViewTracker'
import { LoadingState, ErrorState } from '@/components/shared'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { DetailPageLayout } from '@/components/layout'

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
  const localePath = useLocalizedPath()
  const params = useParams()
  const router = useRouter()
  const [vacancy, setVacancy] = useState<Vacancy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params?.id) {
      void fetchVacancy(params.id as string)
    }
  }, [params?.id])

  const fetchVacancy = async (id: string) => {
    try {
      const response = await fetch(`/api/vacancies/${id}`)
      if (!response.ok) throw new Error('Vakansiya tapılmadı')
      const data = await response.json()
      setVacancy(data.vacancy)
    } catch (err) {
      console.error('Vakansiya yükləmə xətası:', err)
      setError('Vakansiya detalları yüklənmədi')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tarix müəyyən deyil'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return 'Etibarsız tarix'
    return date.toLocaleDateString('az-AZ', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getTypeColor = (type: string) => {
    if (type === 'job') return 'bg-green-100 text-green-800'
    if (type === 'volunteer') return 'bg-blue-100 text-blue-800'
    if (type === 'internship') return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }
  const getWorkTypeColor = (workType: string) => {
    if (workType === 'remote') return 'bg-blue-100 text-blue-800'
    if (workType === 'onsite') return 'bg-blue-100 text-blue-800'
    if (workType === 'hybrid') return 'bg-teal-100 text-teal-800'
    return 'bg-gray-100 text-gray-800'
  }
  const getTypeLabel = (type: string) => {
    if (type === 'job') return 'İş'
    if (type === 'volunteer') return 'Könüllülük'
    if (type === 'internship') return 'Təcrübə'
    return type
  }
  const getWorkTypeLabel = (workType: string) => {
    if (workType === 'remote') return 'Uzaqdan'
    if (workType === 'onsite') return 'Ofisdə'
    if (workType === 'hybrid') return 'Hibrid'
    return workType
  }
  const getExperienceLabel = (experience: string) => {
    if (experience === 'entry') return 'Başlanğıc'
    if (experience === 'mid') return 'Orta'
    if (experience === 'senior') return 'Yüksək'
    if (experience === 'any') return 'Fərq etmir'
    return experience
  }
  const getDurationLabel = (duration: string) => {
    if (duration === 'permanent') return 'Daimi'
    if (duration === 'contract') return 'Müqaviləli'
    if (duration === 'temporary') return 'Müvəqqəti'
    return duration
  }
  const getDurationUnitLabel = (unit: string) => {
    if (unit === 'months') return 'ay'
    if (unit === 'years') return 'il'
    return unit
  }

  if (loading) {
    return <LoadingState text="Vakansiya detalları yüklənir..." />
  }

  if (error || !vacancy) {
    return (
      <ErrorState
        title={'Vakansiya tapılmadı'}
        message={error || 'Axtardığınız vakansiya mövcud deyil və ya silinib.'}
        onRetry={() => router.push(localePath('/resources/vacancies'))}
        retryText={'Vakansiyalara qayıt'}
      />
    )
  }

  const daysUntilDeadline = getDaysUntilDeadline(vacancy.applicationDeadline)
  const isDeadlinePassed = daysUntilDeadline < 0
  const isDeadlineNear = daysUntilDeadline > 0 && daysUntilDeadline <= 7

  return (
    <DetailPageLayout
      backHref={localePath('/resources/vacancies')}
      backLabel={'Vakansiyalara qayıt'}
      breadcrumbItems={[
        { label: 'Ana səhifə', href: localePath('/') },
        { label: 'Resurslar', href: localePath('/resources') },
        { label: 'İş imkanları', href: localePath('/resources/vacancies') },
        { label: vacancy.title, current: true },
      ]}
      title={vacancy.title}
      metadata={
        <>
          <div className="flex flex-wrap gap-2">
            <Badge className={getTypeColor(vacancy.type)}>{getTypeLabel(vacancy.type)}</Badge>
            <Badge className={getWorkTypeColor(vacancy.workType)}>{getWorkTypeLabel(vacancy.workType)}</Badge>
            {vacancy.isFeatured && <Badge className="border border-yellow-300 bg-yellow-100 text-yellow-800 font-bold">SEÇİLMİŞ</Badge>}
            {vacancy.isUrgent && <Badge className="border border-red-300 bg-red-100 text-red-800 font-bold">TƏCİLİ</Badge>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-700 sm:text-base">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
              <Building className="w-4 h-4 text-primary" />
              <span className="font-semibold">{vacancy.createdBy?.name || 'Naməlum'}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="font-medium">
                {vacancy.location.isRemote
                  ? 'Uzaqdan'
                  : `${vacancy.location.city || ''}${vacancy.location.city && vacancy.location.country ? ', ' : ''}${vacancy.location.country || ''}`}
              </span>
            </div>
            {vacancy.compensation.type === 'paid' && vacancy.compensation.amount && (
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-medium">
                  {vacancy.compensation.amount} {vacancy.compensation.currency}/{vacancy.compensation.period}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
            <ViewTracker itemId={vacancy._id} itemType="vacancy" initialViews={vacancy.views} />
          </div>
        </>
      }
      mainContent={
        <>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                İş təsviri
              </h2>
              <div className="prose max-w-none text-gray-700 leading-relaxed text-base">{vacancy.description}</div>
            </CardContent>
          </Card>

          {vacancy.responsibilities?.length > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <Briefcase className="w-6 h-6 text-accent" />
                  </div>
                  {'Məsuliyyətlər'}
                </h2>
                <ul className="space-y-3">
                  {vacancy.responsibilities.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                      <span className="text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {vacancy.requirements?.length > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  {'Tələblər'}
                </h2>
                <ul className="space-y-3">
                  {vacancy.requirements.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {vacancy.qualifications?.length > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  {'Üstünlük Verilən Keyfiyyətlər'}
                </h2>
                <ul className="space-y-3">
                  {vacancy.qualifications.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span className="text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      }
      actionSection={
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              {'Necə Müraciət Etmək'}
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed text-base">
              {vacancy.applicationProcess.instructions}
            </p>

            {vacancy.applicationProcess.requiredDocuments?.length > 0 && (
              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {'Tələb Olunan Sənədlər'}:
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
                <ButtonLink
                  href={vacancy.applicationProcess.applicationLink}
                  external
                  variant="secondary"
                  size="lg"
                  icon={ExternalLink}
                  iconPosition="left"
                  hoverEffect="scale"
                  className="flex-1"
                >
                  {'Müraciət et'}
                </ButtonLink>
              )}
              {vacancy.applicationProcess.email && (
                <ButtonLink
                  href={`mailto:${vacancy.applicationProcess.email}?subject=${encodeURIComponent(`Vakansiya haqqında sual: ${vacancy.title}`)}`}
                  variant="outline"
                  size="lg"
                  icon={Mail}
                  iconPosition="left"
                  hoverEffect="scale"
                  className="flex-1"
                >
                  {'Təşkilatçı ilə əlaqə'}
                </ButtonLink>
              )}
            </div>
          </CardContent>
        </Card>
      }
      sidebar={
        <>
          <Card className="sticky top-6 overflow-hidden border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 bg-white p-4">
              <h3 className="flex items-center gap-2 text-xl font-black text-gray-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                {'Sürətli Məlumat'}
              </h3>
            </div>
            <CardContent className="bg-white p-6">
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="font-bold">{'Müraciət Son Tarixi'}</span>
                  </div>
                  <p className={`font-black text-lg ${isDeadlinePassed ? 'text-red-600' : isDeadlineNear ? 'text-orange-600' : 'text-gray-900'}`}>
                    {formatDate(vacancy.applicationDeadline)}
                    {!isDeadlinePassed && (
                      <span className="text-sm font-normal text-gray-600 ml-2 block mt-1">
                        ({`${daysUntilDeadline} gün qalıb`})
                      </span>
                    )}
                    {isDeadlinePassed && <span className="text-sm font-normal ml-2 block mt-1">({'Bağlı'})</span>}
                  </p>
                </div>

                {vacancy.startDate && (
                  <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-bold">{'Başlama Tarixi'}</span>
                    </div>
                    <p className="font-black text-lg text-gray-900">{formatDate(vacancy.startDate)}</p>
                  </div>
                )}

                <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <span className="font-bold">{'Təcrübə'}</span>
                  </div>
                  <p className="font-black text-lg text-gray-900 capitalize">{getExperienceLabel(vacancy.experienceLevel)}</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Clock className="w-5 h-5 text-cyan-600" />
                    <span className="font-bold">{'Müddət'}</span>
                  </div>
                  <p className="font-black text-lg text-gray-900 capitalize">
                    {getDurationLabel(vacancy.duration.type)}
                    {vacancy.duration.contractLength && (
                      <span className="text-sm font-normal text-gray-600 ml-1 block mt-1">
                        ({vacancy.duration.contractLength.value} {getDurationUnitLabel(vacancy.duration.contractLength.unit)})
                      </span>
                    )}
                  </p>
                </div>

                {vacancy.skills?.length > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      {'Tələb Olunan Bacarıqlar'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vacancy.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="border border-emerald-200 bg-white text-xs font-bold">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(vacancy.languages) && vacancy.languages.length > 0 && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Dillər
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vacancy.languages.map((lang, index) => (
                        <Badge key={index} variant="secondary" className="border border-blue-200 bg-white text-xs font-bold">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <SaveButton itemId={vacancy._id} itemType="vacancy" itemTitle={vacancy.title} size="md" className="w-full rounded-xl py-3 font-bold" />
              </div>
            </CardContent>
          </Card>

          {Array.isArray(vacancy.compensation.benefits) && vacancy.compensation.benefits.length > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 bg-white p-4">
                <h3 className="flex items-center gap-2 text-xl font-black text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  İmtiyazlar
                </h3>
              </div>
              <CardContent className="bg-white p-6">
                <ul className="space-y-3">
                  {vacancy.compensation.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span className="text-gray-700 font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      }
    />
  )
}
