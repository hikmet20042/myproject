'use client'

import { useRouter } from 'next/navigation'
import VacancyForm, { type VacancyFormSubmitPayload } from '@/features/vacancies/components/VacancyFormContainer'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useDashboardVacancyData } from '@/components/containers/DashboardVacancyDataContainer'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'

export default function CreateVacancyPage() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { markVacanciesDirty } = useDashboardVacancyData()
  const { showSuccess } = useGlobalFeedback()

  const handleCreate = async (payload: VacancyFormSubmitPayload) => {
    const response = await fetch('/api/vacancies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error?.message || payload?.error || 'Vakansiya yaradılmadı')
    }

    markVacanciesDirty()
    showSuccess('Vakansiya yaradıldı və moderasiya üçün göndərildi.')
    router.push(localePath('/dashboard/vacancies'))
  }

  return <VacancyForm isEditMode={false} onSubmit={handleCreate} />
}
