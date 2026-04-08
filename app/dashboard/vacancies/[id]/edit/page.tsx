'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ErrorState } from '@/components/shared'
import { SectionLoading } from '@/features/ui-state'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { useSession } from '@/lib/auth/client'
import { useDashboardData } from '@/components/dashboard/DashboardDataProvider'
import { useGlobalFeedback } from '@/lib/useGlobalFeedback'
import VacancyForm, {
  type VacancyFormInitialData,
  type VacancyFormSubmitPayload,
} from '@/features/vacancies/components/VacancyForm'

type VacancyResponse = VacancyFormInitialData & {
  _id: string
  createdBy?: { _id?: string } | string
  createdByOrganization?: { _id?: string } | string
}

export default function EditVacancyPage() {
  const params = useParams()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session, status: sessionStatus } = useSession()
  const { markVacanciesDirty } = useDashboardData()
  const { showSuccess } = useGlobalFeedback()

  const vacancyId = String(params?.id || '')
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
    const updatePayload = {
      title: payload.title,
      description: payload.description,
      type: payload.type,
      location: payload.location,
      requirements: payload.requirements,
      responsibilities: payload.responsibilities,
      benefits: payload.compensation.benefits,
      deadline: payload.applicationDeadline.toISOString(),
      contactEmail: payload.applicationProcess.email,
      applicationInstructions: payload.applicationProcess.instructions,
      tags: payload.tags,
    }

    const response = await fetch(`/api/vacancies/${vacancyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
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
    <VacancyForm
      isEditMode
      initialData={vacancy}
      onSubmit={handleUpdate}
    />
  )
}
