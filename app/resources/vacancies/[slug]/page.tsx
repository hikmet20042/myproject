'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Calendar,
  DollarSign,
  ExternalLink,
  Building,
  CheckCircle,
  FileText,
  Mail,
  Eye,
  MapPin,
  Briefcase,
} from 'lucide-react'
import { ButtonLink } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import SaveItemButtonContainer from '@/components/containers/SaveItemButtonContainer'
import ViewTracker from '@/components/ViewTracker'
import { LoadingState, ErrorState } from '@/components/shared'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { DetailPageLayout } from '@/components/layout'

interface Vacancy {
  _id: string
  id: string
  slug: string
  title: string
  description: string
  type: 'full_time' | 'part_time' | 'volunteer' | 'intern'
  city: string
  address?: string | null
  requirements: string[]
  responsibilities: string[]
  ageMin: number
  ageMax: number
  isPaid: boolean
  paymentMode?: 'fixed' | 'range' | null
  paymentAmount?: number | null
  paymentMin?: number | null
  paymentMax?: number | null
  benefits: string[]
  applicationMethod: 'link' | 'email' | 'phone'
  applicationValue: string
  periodFromMonth?: number | null
  periodFromYear?: number | null
  periodToMonth?: number | null
  periodToYear?: number | null
  imageUrl?: string
  applicationDeadline: string
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
  const { showError } = useGlobalFeedback()

  useEffect(() => {
    if (params?.slug) {
      void fetchVacancy(params.slug as string)
    }
  }, [params?.slug])

  useEffect(() => {
    if (error) showError(error)
  }, [error, showError])

  const fetchVacancy = async (id: string) => {
    try {
      const response = await fetch(`/api/vacancies/${id}`)
      if (!response.ok) throw new Error('Vakansiya tapılmadı')
      const data = await response.json()
      setVacancy((data?.data?.vacancy || data?.vacancy || null) as Vacancy | null)
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
    if (type === 'full_time') return 'bg-green-100 text-green-800'
    if (type === 'part_time') return 'bg-emerald-100 text-emerald-800'
    if (type === 'volunteer') return 'bg-blue-100 text-blue-800'
    if (type === 'intern') return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }
  const getTypeLabel = (type: string) => {
    if (type === 'full_time') return 'Full-time'
    if (type === 'part_time') return 'Part-time'
    if (type === 'volunteer') return 'Könüllülük'
    if (type === 'intern') return 'Intern'
    return type
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
  const method = vacancy.applicationMethod
  const methodValue = vacancy.applicationValue

  return (
    <>
      {vacancy.status === 'approved' && (
        <ViewTracker itemType="vacancy" itemId={vacancy.slug} minTimeMs={10000} selector="#vacancy-content" />
      )}
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
            {vacancy.isFeatured && <Badge className="border border-yellow-300 bg-yellow-100 text-yellow-800 font-bold">SEÇİLMİŞ</Badge>}
            {vacancy.isUrgent && <Badge className="border border-red-300 bg-red-100 text-red-800 font-bold">TƏCİLİ</Badge>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-700 sm:text-base">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
              <Building className="w-4 h-4 text-primary" />
              <span className="font-semibold">{vacancy.createdBy?.name || 'Naməlum'}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium">{vacancy.city}{vacancy.address ? `, ${vacancy.address}` : ''}</span>
            </div>
            {vacancy.isPaid && (
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-medium">
                  {vacancy.paymentMode === 'fixed'
                    ? `${vacancy.paymentAmount || 0} AZN`
                    : `${vacancy.paymentMin || 0} - ${vacancy.paymentMax || 0} AZN`}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
            <Eye className="w-4 h-4 mr-2" />
            <span className="font-bold">{vacancy.views || 0} baxış</span>
          </div>
        </>
      }
      mainContent={
        <>
          <Card id="vacancy-content" className="border border-gray-200 shadow-sm">
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

          {vacancy.responsibilities?.length > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  {'Məsuliyyətlər'}
                </h2>
                <ul className="space-y-3">
                  {vacancy.responsibilities.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {vacancy.benefits?.length > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  {'Benefits'}
                </h2>
                <ul className="space-y-3">
                  {vacancy.benefits.map((item, index) => (
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
              Müraciət üçün aşağıdakı üsuldan istifadə edin.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {method === 'link' && methodValue && (
                <ButtonLink
                  href={methodValue}
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
              {method === 'email' && methodValue && (
                <ButtonLink
                  href={`mailto:${methodValue}?subject=${encodeURIComponent(`Vakansiya haqqında sual: ${vacancy.title}`)}`}
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
              {method === 'phone' && methodValue && (
                <ButtonLink
                  href={`tel:${methodValue.replace(/\s+/g, '')}`}
                  variant="outline"
                  size="lg"
                  icon={Mail}
                  iconPosition="left"
                  hoverEffect="scale"
                  className="flex-1"
                >
                  {'Zəng et'}
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

                <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-bold">Yaş aralığı</span>
                  </div>
                  <p className="font-black text-lg text-gray-900">{vacancy.ageMin} - {vacancy.ageMax}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <SaveItemButtonContainer itemId={vacancy.id} itemType="vacancy" itemTitle={vacancy.title} size="md" className="w-full rounded-xl py-3 font-bold" />
              </div>
            </CardContent>
          </Card>

        </>
      }
    />
    </>
  )
}
