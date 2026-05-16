'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { cn } from '@/lib/utils'
import type { GlobalSearchItem } from '@/features/search/types/search.types'
import { SEARCH_TYPE_LABELS } from '@/features/search/utils/searchPresentation'

type SearchSuggestionsProps = {
  items: GlobalSearchItem[]
  loading: boolean
  query: string
  onItemSelect?: () => void
  onViewAll: () => void
  className?: string
}

export function SearchSuggestions({
  items,
  loading,
  query,
  onItemSelect,
  onViewAll,
  className,
}: SearchSuggestionsProps) {
  const localePath = useLocalizedPath()

  if (!query.trim()) return null

  return (
    <div
      className={cn(
        'absolute top-full left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg z-50',
        className,
      )}
    >
      {loading ? (
        <div className="px-4 py-3 text-sm text-gray-600">Axtarılır...</div>
      ) : items.length === 0 ? (
        <div className="px-4 py-3 text-sm text-gray-600">Nəticə tapılmadı</div>
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto">
            {items.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={localePath(item.href)}
                className="block border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-blue-50"
                onClick={onItemSelect}
              >
                <p className="mb-0.5 text-xs font-bold uppercase tracking-wide text-blue-600">
                  {SEARCH_TYPE_LABELS[item.type]}
                </p>
                <p className="line-clamp-1 text-sm font-semibold text-gray-900">{item.title}</p>
                {item.snippet && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{item.snippet}</p>
                )}
              </Link>
            ))}
          </div>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-center gap-1.5 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
            onClick={onViewAll}
          >
            Bütün nəticələrə bax
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  )
}
