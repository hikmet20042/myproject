'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'

type FetchResult = {
  ok: boolean
  count: number
}

export default function Dashboard() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { showError } = useGlobalFeedback()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFirstAction, setShowFirstAction] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        setShowFirstAction(false)

        const [eventsResSettled, vacanciesResSettled] = await Promise.allSettled([
          fetch('/api/events?author=me&page=1&limit=1'),
          fetch('/api/vacancies?author=me&page=1&limit=1'),
        ])

        const readCount = async (settled: PromiseSettledResult<Response>): Promise<FetchResult> => {
          if (settled.status !== 'fulfilled' || !settled.value.ok) return { ok: false, count: 0 }
          const data = await settled.value.json()
          const count = Number(data?.data?.pagination?.total || data?.total || 0)
          return { ok: true, count: Number.isFinite(count) ? count : 0 }
        }

        const [eventsResult, vacanciesResult] = await Promise.all([
          readCount(eventsResSettled),
          readCount(vacanciesResSettled),
        ])

        const bothFailed = !eventsResult.ok && !vacanciesResult.ok
        if (bothFailed) throw new Error('Dashboard məlumatları yüklənmədi')

        const hasAnyContent = eventsResult.count > 0 || vacanciesResult.count > 0
        const bothSuccessful = eventsResult.ok && vacanciesResult.ok
        const isTrulyEmpty = bothSuccessful && !hasAnyContent

        // Empty must only be shown when both data sources succeeded and both are empty.
        // Any partial API failure should not collapse into empty state.
        if (isTrulyEmpty) {
          setShowFirstAction(true)
          return
        }

        router.replace(localePath('/dashboard/profile'))
      } catch (e: any) {
        setError(e?.message || 'Dashboard məlumatları yüklənmədi')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [router, localePath, retryKey])

  useEffect(() => {
    if (error) showError(error)
  }, [error, showError])

  if (loading) {
    return <LoadingState text="Dashboard yüklənir..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Dashboard yüklənmədi"
        message={error}
        retryText="Yenidən cəhd et"
        onRetry={() => {
          setRetryKey((prev) => prev + 1)
        }}
      />
    )
  }

  if (!showFirstAction) {
    return <LoadingState text="Yönləndirilir..." />
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <EmptyState
          title="İlk tədbirini yarat"
          message="Təşkilatını göstərmək üçün ilk addımı at."
          actionText="Tədbir yarat"
          onAction={() => router.push(localePath('/dashboard/events/create'))}
        />
      </div>
    </div>
  )
}
