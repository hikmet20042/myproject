'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import EventForm, { type EventFormSubmitPayload } from '@/features/events/components/EventForm'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useCreateEvent } from '@/lib/eventQueries'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'

type EventTypeValue = 'event' | 'training' | 'workshop' | 'seminar'

function CreateEventContent() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const searchParams = useSearchParams()
  const { showSuccess } = useGlobalFeedback()
  const createEventMutation = useCreateEvent()

  const typeParam = searchParams?.get('type')
  const defaultEventType: EventTypeValue =
    typeParam === 'training' || typeParam === 'workshop' || typeParam === 'seminar'
      ? typeParam
      : 'event'

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
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CreateEventContent />
    </Suspense>
  )
}
