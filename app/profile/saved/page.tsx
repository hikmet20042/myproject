'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Bookmark, Calendar, Briefcase, BookOpen } from 'lucide-react'
import { ListPageLayout } from '@/components/layout'
import { ResourceCard } from '@/components/shared'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

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
  const savedQuery = useQuery({
    queryKey: ['saved-list'],
    queryFn: async () => {
      const response = await fetch('/api/saved')
      if (!response.ok) throw new Error('Saved items alınmadı')
      const data = await response.json()
      return (data?.data?.items || []) as SavedItem[]
    },
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

  return (
    <ListPageLayout
      title="Yadda saxladıqların"
      description="Bunlara daha sonra baxmaq və ya müraciət etmək üçün saxlamısan."
      icon={Bookmark}
      isLoading={savedQuery.isLoading}
      isError={savedQuery.isError}
      errorTitle="Saxlanılmışlar yüklənmədi"
      errorMessage={savedQuery.error instanceof Error ? savedQuery.error.message : 'Xəta baş verdi'}
      onRetry={() => {
        void savedQuery.refetch()
      }}
      isEmpty={!savedQuery.isLoading && !savedQuery.isError && savedItems.length === 0}
      emptyTitle="Heç nə yadda saxlamamısan"
      emptyMessage="İmkanları yadda saxla ki, daha sonra asanlıqla qayıda biləsən."
      emptyActionText="İmkanları kəşf et"
      onEmptyAction={() => {
        router.push(localePath('/'))
      }}
      contentContainerClassName="max-w-7xl"
      content={
        <div className="space-y-5">
          {savedItems.length > 3 && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 font-medium">
              Artıq bir neçə imkanı yadda saxlamısan — indi onları dəyərləndirmə vaxtıdır.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map((item, index) => {
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
                className={index < 2 ? 'ring-2 ring-blue-200 shadow-md' : ''}
              />
            )
          })}
          </div>
        </div>
      }
    />
  )
}
