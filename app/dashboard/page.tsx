'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useSession } from '@/lib/auth/client'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Plus } from 'lucide-react'
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
      const [eventsRes, vacanciesRes, blogsRes, organizationRes] = await Promise.allSettled([
        fetch('/api/events?author=me&limit=1'),
        fetch('/api/vacancies?author=me&limit=1'),
        fetch('/api/blogs?author=me&limit=1'),
        fetch('/api/organizations/me'),
      ])

      let totalEvents = 0
      let totalVacancies = 0
      let totalViews = 0
      let totalOrganizationFollowers = 0

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

      if (organizationRes.status === 'fulfilled' && organizationRes.value.ok) {
        const data = await organizationRes.value.json()
        totalOrganizationFollowers = Number(
          data?.data?.organization?.follower_count ||
            data?.organization?.follower_count ||
            data?.data?.organization?.followerCount ||
            data?.organization?.followerCount ||
            0,
        )
      }

      setStats({
        totalEvents: totalEvents || 0,
        totalVacancies: totalVacancies || 0,
        totalOrganizationFollowers,
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
    return <LoadingState text="Rəhbər paneli yüklənir..." />
  }

  if (error && stats.totalEvents === 0 && stats.totalVacancies === 0) {
    return (
      <ErrorState
        title="Rəhbər paneli yüklənmədi"
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
        <Card className="p-4">
          <div className="text-sm text-slate-600">Tədbirlər</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.totalEvents}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Vakansiyalar</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.totalVacancies}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">İzləyicilər</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.totalOrganizationFollowers}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Baxışlar</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.totalViews}</div>
        </Card>
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
          title="İlk tədbirinizi yaratmağa başlayın"
          message="Təşkilatınızı göstərmək və icma ilə əlaqə qurmaq üçün ilk tədbirinizi paylaşın."
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
