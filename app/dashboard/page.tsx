'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useSession } from '@/lib/auth/client'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { Button } from '@/components/ui/Button'
import { Plus, FileText, Eye, Heart } from 'lucide-react'
import {
  PageHeader,
  SectionCard,
} from '@/features/profile/components/ui'

type DashboardStats = {
  totalEvents: number
  totalVacancies: number
  totalOrganizationFollowers: number
  totalViews: number
}

const DEFAULT_STATS: DashboardStats = {
  totalEvents: 0,
  totalVacancies: 0,
  totalOrganizationFollowers: 0,
  totalViews: 0,
}

function DashboardOverviewContent() {
  const { status } = useSession()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { showError } = useGlobalFeedback()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS)
  const [error, setError] = useState('')

  const loadDashboardStats = useCallback(async () => {
    try {
      setError('')

      // Fetch stats from API endpoints
      const [eventsRes, vacanciesRes, blogsRes] = await Promise.allSettled([
        fetch('/api/events?author=me&limit=1'),
        fetch('/api/vacancies?author=me&limit=1'),
        fetch('/api/blogs?author=me&limit=1'),
      ])

      let totalEvents = 0
      let totalVacancies = 0
      let totalViews = 0

      if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
        const data = await eventsRes.value.json()
        totalEvents = Number(data?.data?.pagination?.total || data?.total || 0)
        // Sum views from events
        const events = data?.data?.events || data?.events || []
        totalViews += events.reduce((sum: number, event: any) => sum + (event.views || 0), 0)
      }

      if (vacanciesRes.status === 'fulfilled' && vacanciesRes.value.ok) {
        const data = await vacanciesRes.value.json()
        totalVacancies = Number(data?.data?.pagination?.totalVacancies || data?.total || 0)
        // Sum views from vacancies
        const vacancies = data?.data?.vacancies || data?.vacancies || []
        totalViews += vacancies.reduce((sum: number, vacancy: any) => sum + (vacancy.views || 0), 0)
      }

      if (blogsRes.status === 'fulfilled' && blogsRes.value.ok) {
        const data = await blogsRes.value.json()
        // Sum views from blogs
        const blogs = data?.data?.blogs || data?.blogs || []
        totalViews += blogs.reduce((sum: number, blog: any) => sum + (blog.views || 0), 0)
      }

      setStats({
        totalEvents: totalEvents || 0,
        totalVacancies: totalVacancies || 0,
        totalOrganizationFollowers: 0,
        totalViews: totalViews || 0,
      })
    } catch (err) {
      const message = getUserErrorMessage(err)
      setError(message)
      showError(message)
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    if (status !== 'authenticated') return
    void loadDashboardStats()
  }, [status, loadDashboardStats])

  if (status === 'loading' || loading) {
    return <LoadingState text="Dashboard yüklənir..." />
  }

  if (error && stats.totalEvents === 0 && stats.totalVacancies === 0) {
    return (
      <ErrorState
        title="Dashboard yüklənmədi"
        message={error}
        retryText="Yenidən cəhd et"
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rəhbər paneli"
        description="Təşkilatınızın tədbirləri və vakansiyalarını idarə edin"
      />

      {/* Stats Cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Tədbirlər</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalEvents}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Vakansiyalar</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalVacancies}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">İzləyicilər</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalOrganizationFollowers}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Baxışlar</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalViews}</div>
        </div>
      </section>

      {/* Quick Actions */}
      <SectionCard
        title="Sürətli əməliyyatlar"
        description="Yeni tədbir və ya vakansiya yaratmağa başlayın"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            className="h-12 justify-start gap-3"
            onClick={() => router.push(localePath('/dashboard/events/create'))}
          >
            <Plus className="h-5 w-5" />
            Tədbir yaratın
          </Button>
          <Button
            variant="outline"
            className="h-12 justify-start gap-3"
            onClick={() => router.push(localePath('/dashboard/vacancies/create'))}
          >
            <Plus className="h-5 w-5" />
            Vakansiya yaratın
          </Button>
        </div>
      </SectionCard>

      {/* Recent Activity or Empty State */}
      {stats.totalEvents === 0 && stats.totalVacancies === 0 && (
        <EmptyState
          title="Başqa tədbir yaratmağa başlayın"
          message="Təşkilatınızı göstərmək üçün ilk tədbirini yarat və cəmiyyətə qoşul."
          actionText="Tədbir yaratın"
          onAction={() => router.push(localePath('/dashboard/events/create'))}
        />
      )}
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardOverviewContent />
}
