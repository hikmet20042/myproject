'use client'

import { useParams, useRouter } from 'next/navigation'
import { ErrorState, LoadingState } from '@/components/shared'
import EventForm, {
  type EventFormInitialData,
  type EventFormSubmitPayload,
} from '@/features/events/components/EventForm'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { useEvent, useUpdateEvent } from '@/lib/eventQueries'
import { useGlobalFeedback } from '@/lib/useGlobalFeedback'

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const localePath = useLocalizedPath()
  const { showSuccess } = useGlobalFeedback()
  const eventId = String(params?.id || '')

  const eventQuery = useEvent(eventId)
  const updateEventMutation = useUpdateEvent(eventId)
  const event = (eventQuery.data || null) as EventFormInitialData | null

  const handleUpdate = async (payload: EventFormSubmitPayload) => {
    await updateEventMutation.mutateAsync(payload)
    showSuccess('Tədbir uğurla yeniləndi.')
    router.push(localePath('/dashboard/events'))
  }

  if (eventQuery.isLoading) {
    return <LoadingState text={'Tədbir yüklənir...'} />
  }

  if (eventQuery.isError || !event) {
    return (
      <ErrorState
        title={'Tədbir tapılmadı'}
        message={
          eventQuery.error instanceof Error
            ? eventQuery.error.message
            : 'Axtardığınız tədbiri tapmaq mümkün olmadı.'
        }
        retryText={'Yenidən yoxla'}
        onRetry={() => {
          void eventQuery.refetch()
        }}
      />
    )
  }

  return (
    <EventForm
      isEditMode
      initialData={event}
      onSubmit={handleUpdate}
    />
  )
}
