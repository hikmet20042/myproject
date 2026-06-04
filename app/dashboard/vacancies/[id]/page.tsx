'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Calendar, MapPin, Tag, Edit, Trash2, CheckCircle, XCircle, AlertCircle, ExternalLink, Eye, Bookmark, Users, Briefcase, Clock, DollarSign } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { PageStateGuard } from '@/components/shared'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AppContainer } from '@/components/layout'
import type { VacancyItem } from '@/features/vacancies/types/items'

const typeLabels: Record<string, string> = {
  full_time: 'Tam ştat',
  part_time: 'Part-time',
  volunteer: 'Könüllü',
  intern: 'Təcrübə',
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  approved: { label: 'Təsdiqlənib', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rədd Edilib', icon: XCircle, className: 'bg-red-100 text-red-800' },
  pending: { label: 'Gözləmədə', icon: AlertCircle, className: 'bg-yellow-100 text-yellow-800' },
}

export default function VacancyDetail() {
  const localePath = useLocalizedPath()
  const router = useRouter()
  const params = useParams()
  const { showSuccess, showError } = useGlobalFeedback()
  const vacancyId = String(params?.id || '')

  const [vacancy, setVacancy] = useState<VacancyItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!vacancyId) {
      setError('Vakansiya tapılmadı.')
      setLoading(false)
      return
    }

    let active = true

    const fetchVacancy = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/vacancies/${vacancyId}`)
        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          if (!active) return
          setError(payload?.error?.message || payload?.error || 'Vakansiyanı yükləmək mümkün olmadı.')
          setLoading(false)
          return
        }

        if (!active) return
        setVacancy((payload?.data?.vacancy || null) as VacancyItem | null)
      } catch {
        if (!active) return
        setError('Vakansiyanı yükləmək mümkün olmadı.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchVacancy()
    return () => { active = false }
  }, [vacancyId])

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/vacancies/${vacancyId}`, { method: 'DELETE' })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error?.message || 'Vakansiyanı silmək mümkün olmadı')
      }
      showSuccess('Vakansiya uğurla silindi.')
      router.push(localePath('/dashboard/vacancies'))
    } catch (err: any) {
      showError(err?.message || 'Vakansiyanı silmək mümkün olmadı')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const opts: Intl.DateTimeFormatOptions = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }
    try { return new Date(dateString).toLocaleDateString('az-AZ', opts) } catch {
      return new Date(dateString).toLocaleDateString('az-AZ')
    }
  }

  const StatusBadge = () => {
    if (!vacancy) return null
    const config = statusConfig[vacancy.status] || statusConfig.pending
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.label}
      </span>
    )
  }

  return (
    <PageStateGuard
      isLoading={loading}
      isError={!!error}
      isEmpty={!loading && !error && !vacancy}
      loadingText="Vakansiya yüklənir..."
      errorTitle="Vakansiya tapılmadı"
      errorMessage={error || 'Axtardığınız vakansiyanı tapmaq mümkün olmadı.'}
      retryText="Yenidən yoxla"
      onRetry={() => window.location.reload()}
      emptyTitle="Vakansiya tapılmadı"
      emptyMessage="Axtardığınız vakansiyanı tapmaq mümkün olmadı."
    >
      <div className="relative min-h-screen overflow-hidden bg-background py-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
        <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

        <AppContainer className="relative z-10 max-w-4xl py-0">
          <Card className="mb-8 bg-white/90 backdrop-blur-sm p-6">
            <Button
              onClick={() => router.push(localePath('/dashboard/vacancies'))}
              variant="ghost"
              className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              ← Vakansiyalara qayıt
            </Button>

            <div className="mb-4 flex items-center gap-4">
              <h1 className="text-3xl font-black text-slate-900">{vacancy?.title}</h1>
              <StatusBadge />
            </div>

            {(vacancy?.views ?? 0) > 0 || (vacancy?.saves ?? 0) > 0 ? (
              <div className="mb-4 flex items-center gap-4">
                {vacancy?.views ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-100">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      {vacancy.views.toLocaleString()} baxış
                    </span>
                    <span className="text-xs text-blue-500">
                      ({vacancy.uniqueViews?.toLocaleString() || 0} unikal)
                    </span>
                  </div>
                ) : null}
                {vacancy?.saves ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-100">
                    <Bookmark className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      {vacancy.saves.toLocaleString()} saxlama
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {vacancy?.isUrgent && (
              <Badge variant="danger" className="mb-4">Təcili</Badge>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Vakansiya haqqında</h2>
                  <div className="prose max-w-none text-slate-700 whitespace-pre-line">
                    {vacancy?.description}
                  </div>
                </Card>

                {vacancy?.requirements && vacancy.requirements.length > 0 && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Tələblər</h2>
                    <ul className="space-y-2">
                      {vacancy.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {vacancy?.responsibilities && vacancy.responsibilities.length > 0 && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Vəzifə öhdəlikləri</h2>
                    <ul className="space-y-2">
                      {vacancy.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {vacancy?.benefits && vacancy.benefits.length > 0 && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Faydalar</h2>
                    <ul className="space-y-2">
                      {vacancy.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Əsas məlumatlar</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Briefcase className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">İş növü</p>
                        <p className="text-slate-600 text-sm">{vacancy ? typeLabels[vacancy.type] || vacancy.type : ''}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">Şəhər</p>
                        <p className="text-slate-600 text-sm">{vacancy?.city}</p>
                      </div>
                    </div>

                    {vacancy?.address && (
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">Ünvan</p>
                          <p className="text-slate-600 text-sm">{vacancy?.address}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start">
                      <Users className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">Yaş aralığı</p>
                        <p className="text-slate-600 text-sm">{vacancy?.ageMin} - {vacancy?.ageMax}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <DollarSign className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">Maaş</p>
                        <p className="text-slate-600 text-sm">
                          {vacancy?.isPaid
                            ? vacancy.paymentMode === 'range'
                              ? `${vacancy.paymentMin?.toLocaleString()} - ${vacancy.paymentMax?.toLocaleString()} AZN`
                              : vacancy.paymentAmount
                                ? `${vacancy.paymentAmount.toLocaleString()} AZN`
                                : 'Müzakirə yolu ilə'
                            : 'Ödənişsiz'}
                        </p>
                      </div>
                    </div>

                    {vacancy?.applicationDeadline && (
                      <div className="flex items-start">
                        <Clock className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">Son müraciət tarixi</p>
                          <p className="text-slate-600 text-sm">{formatDate(vacancy.applicationDeadline)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">Müddət</p>
                        <p className="text-slate-600 text-sm">
                          {vacancy?.periodFromMonth && vacancy?.periodFromYear
                            ? `${vacancy.periodFromMonth}/${vacancy.periodFromYear} - ${vacancy.periodToMonth ? `${vacancy.periodToMonth}/` : ''}${vacancy.periodToYear || 'davam edir'}`
                            : 'Qeyd edilməyib'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Müraciət</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Metod: </span>
                      <span className="text-slate-600">
                        {vacancy?.applicationMethod === 'link' ? 'Xarici link' :
                         vacancy?.applicationMethod === 'email' ? 'E-poçt' :
                         vacancy?.applicationMethod === 'phone' ? 'Telefon' : vacancy?.applicationMethod}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {vacancy?.applicationMethod === 'link' ? (
                        <a href={vacancy.applicationValue} target="_blank" rel="noopener noreferrer"
                           className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm">
                          Müraciət et <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600">{vacancy?.applicationValue}</span>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Status</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Moderasiya: </span>
                      <span className="ml-2">{statusConfig[vacancy?.status || 'pending']?.label}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Yaradılıb: </span>
                      <span className="ml-2">{vacancy?.createdAt ? new Date(vacancy.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Yenilənib: </span>
                      <span className="ml-2">{vacancy?.updatedAt ? new Date(vacancy.updatedAt).toLocaleDateString() : ''}</span>
                    </div>
                    {vacancy?.approvedAt && (
                      <div>
                        <span className="font-medium text-slate-700">Təsdiqləndi: </span>
                        <span className="ml-2">{new Date(vacancy.approvedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {vacancy?.adminComment && (
                      <div>
                        <span className="font-medium text-slate-700">Admin şərhi: </span>
                        <p className="mt-1 text-slate-600">{vacancy.adminComment}</p>
                      </div>
                    )}
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push(localePath(`/dashboard/vacancies/${vacancyId}/edit`))}
                    variant="secondary"
                    size="md"
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Redaktə et
                  </Button>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    variant="danger"
                    size="md"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Sil
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </AppContainer>

        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Vakansiyanı sil"
          size="sm"
          className="rounded-xl"
        >
          <p className="text-slate-600 mb-6">
            &quot;{vacancy?.title}&quot; vakansiyasını silmək istədiyinizə əminsiniz? Bu əməliyyatı geri qaytarmaq mümkün deyil.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" disabled={deleting} onClick={() => setShowDeleteModal(false)}>
              Ləğv et
            </Button>
            <Button onClick={handleDelete} variant="danger" disabled={deleting}>
              {deleting ? 'Silinir...' : 'Vakansiyanı sil'}
            </Button>
          </div>
        </Modal>
      </div>
    </PageStateGuard>
  )
}
