'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loading } from '@/components/ui/Loading'
import EventForm, { type EventFormSubmitPayload } from '@/features/events/components/EventForm'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useCreateEvent } from '@/lib/eventQueries'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { EVENT_TYPE_VALUES, type EventTypeValue } from '@/lib/events/eventConfig'

function CreateEventContent() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const searchParams = useSearchParams()
  const { showSuccess } = useGlobalFeedback()
  const createEventMutation = useCreateEvent()

  const typeParam = searchParams?.get('type')
  const defaultEventType: EventTypeValue =
    typeParam && EVENT_TYPE_VALUES.includes(typeParam as EventTypeValue)
      ? (typeParam as EventTypeValue)
      : 'training_workshop'

  const handleCreate = async (payload: EventFormSubmitPayload) => {
    await createEventMutation.mutateAsync(payload)
    showSuccess('Tədbir yaradıldı və moderasiya üçün göndərildi.')
    router.push(localePath('/dashboard/events'))
  }

  return (
    <EventForm
      isEditMode={false}
      defaultEventType={defaultEventType}
      onSubmit={handleCreate}
    />
  )
}

export default function CreateEventPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loading size="lg" variant="spinner" color="primary" />
        </div>
      }
    >
      <CreateEventContent />
    </Suspense>
  )
}
