'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Bookmark, Eye } from 'lucide-react'
import { ErrorState } from '@/components/shared'
import { SectionLoading } from '@/features/ui-state'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useSession } from '@/lib/auth/client'
import { useDashboardVacancyData } from '@/components/containers/DashboardVacancyDataContainer'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import VacancyForm, {
  type VacancyFormInitialData,
  type VacancyFormSubmitPayload,
} from '@/features/vacancies/components/VacancyFormContainer'

type VacancyResponse = VacancyFormInitialData & {
  _id: string
  createdBy?: { _id?: string } | string
  createdByOrganization?: { _id?: string } | string
  views?: number
  uniqueViews?: number
  saves?: number
}

export default function EditVacancyPage() {
  const params = useParams()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session, status: sessionStatus } = useSession()
  const { markVacanciesDirty } = useDashboardVacancyData()
  const { showSuccess } = useGlobalFeedback()

  const vacancyId = String(params?.slug || '')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [vacancy, setVacancy] = useState<VacancyResponse | null>(null)

  const ownerOrAdmin = useMemo(() => {
    if (!session?.user?.id || !vacancy) return false
    if (session.user.role === 'admin') return true

    const createdById =
      typeof vacancy.createdBy === 'string'
        ? vacancy.createdBy
        : vacancy.createdBy?._id
    const createdByOrganizationId =
      typeof vacancy.createdByOrganization === 'string'
        ? vacancy.createdByOrganization
        : vacancy.createdByOrganization?._id

    return [createdById, createdByOrganizationId].includes(session.user.id)
  }, [session?.user?.id, session?.user?.role, vacancy])

  useEffect(() => {
    if (!vacancyId) {
      setFetchError('Vacancy not found.')
      setLoading(false)
      return
    }

    let active = true

    const fetchVacancy = async () => {
      try {
        setLoading(true)
        setFetchError(null)

        const response = await fetch(`/api/vacancies/${vacancyId}`)
        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          if (!active) return
          setFetchError(payload?.error?.message || payload?.error || 'Failed to load vacancy.')
          setLoading(false)
          return
        }

        if (!active) return
        setVacancy((payload?.data?.vacancy || null) as VacancyResponse | null)
      } catch {
        if (!active) return
        setFetchError('Failed to load vacancy.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchVacancy()
    return () => {
      active = false
    }
  }, [vacancyId])

  const handleUpdate = async (payload: VacancyFormSubmitPayload) => {
    const response = await fetch(`/api/vacancies/${vacancyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error?.message || error?.error || 'Failed to update vacancy.')
    }

    markVacanciesDirty()
    showSuccess('Your vacancy has been updated and sent for review')
    router.push(localePath('/dashboard/vacancies'))
  }

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <SectionLoading variant="list" rows={4} />
      </div>
    )
  }

  if (fetchError || !vacancy) {
    return (
      <ErrorState
        title="Vacancy not found"
        message={fetchError || 'Unable to load vacancy.'}
        retryText="Back to vacancies"
        onRetry={() => router.push(localePath('/dashboard/vacancies'))}
      />
    )
  }

  if (!ownerOrAdmin) {
    return (
      <ErrorState
        title="Access denied"
        message="You do not have permission to edit this vacancy."
        retryText="Back to vacancies"
        onRetry={() => router.push(localePath('/dashboard/vacancies'))}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {(vacancy.views || 0).toLocaleString()} baxış
            </span>
            <span className="text-xs text-blue-500">
              ({(vacancy.uniqueViews || 0).toLocaleString()} unikal)
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5">
            <Bookmark className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {(vacancy.saves || 0).toLocaleString()} saxlama
            </span>
          </div>
        </div>
      </div>

      <VacancyForm
        isEditMode
        initialData={vacancy}
        onSubmit={handleUpdate}
      />
    </div>
  )
}
