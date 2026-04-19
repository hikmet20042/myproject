'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Bookmark, Calendar, Briefcase, BookOpen } from 'lucide-react'
import { useSession } from '@/lib/auth/client'
import { EmptyState, LoadingState } from '@/components/shared'
import { Button } from '@/components/ui/Button'
import { AppContainer } from '@/components/layout'
import { ResourceCard } from '@/components/shared'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { PageHeader, SectionCard } from '@/features/profile/components/ui'

type SavedItem = {
  id: string
  itemId: string
  itemType: 'event' | 'vacancy' | 'blog'
  createdAt?: string
  title: string
  description?: string
  href: string
  metaOne?: string
  metaTwo?: string
  badge?: string
}

export default function SavedItemsPage() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { showError } = useGlobalFeedback()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.replace(localePath('/auth/signin'))
      return
    }

    if (session?.user?.accountType === 'organization') {
      router.replace(localePath('/dashboard/profile'))
    }
  }, [status, session?.user?.accountType, router, localePath])

  const shouldBlockRender =
    status === 'loading' ||
    status === 'unauthenticated' ||
    session?.user?.accountType === 'organization'

  const savedQuery = useQuery({
    queryKey: ['saved-list'],
    queryFn: async () => {
      const response = await fetch('/api/saved')
      if (!response.ok) throw new Error('Saved items alınmadı')
      const data = await response.json()
      return (data?.data?.items || []) as SavedItem[]
    },
    enabled: !shouldBlockRender,
  })

  const savedItems = (savedQuery.data || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())

  const isRecent = (createdAt?: string) => {
    if (!createdAt) return false
    const created = new Date(createdAt).getTime()
    if (Number.isNaN(created)) return false
    return Date.now() - created < 24 * 60 * 60 * 1000
  }

  const counts = {
    total: savedItems.length,
    events: savedItems.filter((item) => item.itemType === 'event').length,
    vacancies: savedItems.filter((item) => item.itemType === 'vacancy').length,
    blogs: savedItems.filter((item) => item.itemType === 'blog').length,
  }

  useEffect(() => {
    if (savedQuery.isError) {
      showError(savedQuery.error instanceof Error ? savedQuery.error.message : 'Saxlanılmışlar yüklənmədi.')
    }
  }, [savedQuery.isError, savedQuery.error, showError])

  if (shouldBlockRender) {
    return <LoadingState text={'Saxlanılanlar yüklənir...'} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-foreground">
      <AppContainer className="py-8 md:py-10">
        <div className="space-y-6">
          <PageHeader
            title="Saxlanılanlar"
            description="Sonra baxmaq istədiyin məzmunları buradan rahat idarə et."
            actions={
              <Button variant="outline" onClick={() => router.push(localePath('/resources'))}>
                <Bookmark className="w-4 h-4 mr-2" />
                Yeni məzmun kəşf et
              </Button>
            }
          />

          {savedQuery.isError && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => void savedQuery.refetch()}>
                Yenidən cəhd et
              </Button>
            </div>
          )}

          <SectionCard title="Saxlanılan məzmunlar" description="Saxladığın məzmunlar üzrə qısa xülasə və siyahı.">
            {savedQuery.isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="animate-pulse rounded-xl border border-gray-200 p-3">
                      <div className="h-3 w-1/2 rounded bg-gray-200" />
                      <div className="mt-2 h-5 w-1/4 rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="animate-pulse rounded-xl border border-gray-200 p-4">
                      <div className="h-4 w-2/3 rounded bg-gray-200" />
                      <div className="mt-3 h-3 w-full rounded bg-gray-100" />
                      <div className="mt-2 h-3 w-5/6 rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
              </div>
            ) : savedItems.length === 0 ? (
              <EmptyState
                title="Heç nə saxlamamısan"
                message="İmkanları saxla ki, daha sonra asanlıqla qayıda biləsən."
                illustrationKey="empty-saved"
                actionText="İmkanları kəşf et"
                onAction={() => router.push(localePath('/resources'))}
              />
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-3">
                    <p className="text-xs text-gray-500">Ümumi</p>
                    <p className="text-xl font-semibold text-gray-900">{counts.total}</p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs text-blue-700">Tədbirlər</p>
                    <p className="text-xl font-semibold text-blue-800">{counts.events}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700">Vakansiyalar</p>
                    <p className="text-xl font-semibold text-emerald-800">{counts.vacancies}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-700">Bloqlar</p>
                    <p className="text-xl font-semibold text-amber-800">{counts.blogs}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {savedItems.map((item) => {
                    const icon =
                      item.itemType === 'event' ? (
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                      ) : item.itemType === 'vacancy' ? (
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                      )

                    return (
                      <ResourceCard
                        key={item.id}
                        type={item.itemType}
                        title={item.title}
                        description={item.description}
                        href={item.href}
                        badges={[
                          ...(isRecent(item.createdAt) ? [{ label: 'Yeni', variant: 'success' as const }] : []),
                          ...(item.badge ? [{ label: item.badge, variant: 'info' as const }] : []),
                        ]}
                        icon={icon}
                        metadata={
                          <>
                            {item.metaOne && <p className="text-sm text-gray-600">{item.metaOne}</p>}
                            {item.metaTwo && <p className="text-sm text-gray-500">{item.metaTwo}</p>}
                          </>
                        }
                        actionText={item.itemType === 'vacancy' ? 'Müraciət et' : item.itemType === 'event' ? 'Qoşul' : 'Oxu'}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </AppContainer>
    </div>
  )
}