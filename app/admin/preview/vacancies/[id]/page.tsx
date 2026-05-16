'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, MapPin, Briefcase, Calendar, Building } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/Textarea'
import { LoadingState, ErrorState } from '@/components/shared'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import AdminListLayout from '@/components/admin/AdminListLayout'
import { Badge } from '@/components/ui/Badge'

interface Vacancy { _id: string
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  type?: string
  city?: string
  address?: string
  organizationName?: string
  createdBy?: { _id: string; name?: string; email?: string }
  createdByOrganization?: { _id: string; organizationName?: string; email?: string }
  applicationDeadline?: string
  isPaid?: boolean
  paymentMode?: 'fixed' | 'range'
  paymentAmount?: number
  paymentMin?: number
  paymentMax?: number
  benefits?: string[]
  requirements?: string[]
  responsibilities?: string[]
  rejectionReason?: string
  adminComment?: string
}

export default function AdminVacancyPreview() {
  const localePath = useLocalizedPath()
  const router = useRouter()
  const params = useParams()

  const [vacancy, setVacancy] = useState<Vacancy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [adminComment, setAdminComment] = useState('')
  const { showError } = useGlobalFeedback()

  const fetchVacancy = useCallback(async () => { if (!params?.id) return

    try { const response = await fetch(`/api/vacancies/${params.id}`)
      if (!response.ok) { throw new Error('Vakansiyanı yükləmək alınmadı') }
      const data = await response.json()
      const payload = data?.data || data
      setVacancy(payload.vacancy) } catch (err) { setError('Vakansiyanı yükləmək alınmadı') } finally { setLoading(false) } }, [params?.id])

  useEffect(() => { fetchVacancy() }, [fetchVacancy])

  useEffect(() => {
    if (error) showError(error)
  }, [error, showError])

  const handleApprove = async () => { if (!params?.id) return

    setActionLoading(true)
    try { const response = await fetch(`/api/vacancies/${params.id}`, { method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }) })

      if (response.ok) { router.push(localePath('/admin/vacancies')) } else { setError('Vakansiyanı təsdiqləmək alınmadı') } } catch (err) { setError('Vakansiyanı təsdiqləmək alınmadı') } finally { setActionLoading(false) } }

  const handleReject = async () => { if (!params?.id) return
    if (!adminComment.trim()) { setError('Rədd səbəbi tələb olunur')
      return }

    setActionLoading(true)
    try { const response = await fetch(`/api/vacancies/${params.id}`, { method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason: adminComment.trim() }) })

      if (response.ok) { router.push(localePath('/admin/vacancies')) } else { setError('Vakansiyanı rədd etmək alınmadı') } } catch (err) { setError('Vakansiyanı rədd etmək alınmadı') } finally { setActionLoading(false)
      setShowRejectModal(false) } }

  const getStatusBadge = (statusValue?: string) => { if (statusValue === 'approved') { return (
        <Badge variant="success" size="sm">
          <CheckCircle className="w-3 h-3 mr-1" />
          {'Təsdiqlənib'}
        </Badge>
      ) }
    if (statusValue === 'rejected') { return (
        <Badge variant="danger" size="sm">
          <XCircle className="w-3 h-3 mr-1" />
          {'Rədd edilib'}
        </Badge>
      ) }
    return (
      <Badge variant="warning" size="sm">
        <AlertCircle className="w-3 h-3 mr-1" />
        {'Gözləmədə'}
      </Badge>
    ) }

  if (loading) { return (
      <LoadingState
        text={'Vakansiya önizləməsi yüklənir...'}
      />
    ) }

  if (error || !vacancy) { return (
      <ErrorState
        title={'Vakansiya tapılmadı'}
        message={error || 'Axtardığınız vakansiya mövcud deyil.'}
        retryText={'Adminə Qayıt'}
        onRetry={() => router.push(localePath('/admin/vacancies'))}
      />
    ) }

  const organizationName =
    vacancy.organizationName || vacancy.createdByOrganization?.organizationName || vacancy.createdBy?.name || 'Naməlum'

  const paymentLabel = !vacancy.isPaid
    ? 'Ödənişsiz'
    : vacancy.paymentMode === 'fixed'
      ? `${vacancy.paymentAmount || 0} AZN`
      : `${vacancy.paymentMin || 0} - ${vacancy.paymentMax || 0} AZN`

  return (
    <AdminListLayout title="Vakansiya Önizləmə" description="Moderasiya üçün vakansiya önizləməsi." className="space-y-0">
    <div className="relative min-h-screen overflow-hidden bg-background py-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => router.push(localePath('/admin/vacancies'))}
          variant="ghost"
          size="sm"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {'Adminə Qayıt'}
        </Button>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{vacancy.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(vacancy.status)}
              <span className="text-slate-500">{organizationName}</span>
            </div>
          </div>

          {vacancy.status === 'pending' && (
            <div className="flex gap-3">
              <Button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                variant="outline"
                size="md"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                {'Rədd Et'}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                variant="primary"
                size="md"
              >
                {actionLoading ? 'Emal olunur...' : 'Təsdiq Et'}
              </Button>
            </div>
          )}
        </div>

        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span>{organizationName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{vacancy.type || 'Növ'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                {vacancy.applicationDeadline
                  ? new Date(vacancy.applicationDeadline).toLocaleDateString()
                  : 'Son Tarix'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>
                {vacancy.city
                  ? vacancy.address
                    ? `${vacancy.city}, ${vacancy.address}`
                    : vacancy.city
                  : 'Məkan dəqiqləşdiriləcək'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{paymentLabel}</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{'Təsvir'}</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{vacancy.description}</p>
          </div>

          {vacancy.requirements && vacancy.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{'Tələblər'}</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                {vacancy.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {vacancy.responsibilities && vacancy.responsibilities.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{'Məsuliyyətlər'}</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                {vacancy.responsibilities.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {(vacancy.rejectionReason || vacancy.adminComment) && vacancy.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              <strong>{'Rədd səbəbi'}:</strong> {vacancy.rejectionReason || vacancy.adminComment}
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={'Vakansiyanı Rədd Et'}
        size="sm"
      >
            <div className="space-y-4">
              <TextArea
                label={'İdarəçi şərhi'}
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                rows={4}
                placeholder={'Zəhmət olmasa bu vakansiyanı rədd etmək üçün ətraflı şərh daxil edin...'}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowRejectModal(false)}>
                  {'Ləğv Et'}
                </Button>
                <Button onClick={handleReject} disabled={actionLoading} variant="danger" size="sm">
                  {actionLoading ? 'Emal olunur...' : 'Rədd Et'}
                </Button>
              </div>
            </div>
      </Modal>
    </div>
    </AdminListLayout>
  )
}
