'use client'

import Link from 'next/link'
import { ArrowRight, Calendar, Briefcase, Building2, BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { cn } from '@/lib/utils'
import type { GlobalSearchItem, GlobalSearchType } from '@/features/search/types/search.types'
import { SEARCH_TYPE_LABELS } from '@/features/search/utils/searchPresentation'

type SearchSuggestionsProps = {
  items: GlobalSearchItem[]
  loading: boolean
  query: string
  highlightedIndex?: number
  onItemSelect?: () => void
  onViewAll: () => void
  className?: string
}

const TYPE_ICON_MAP: Record<GlobalSearchType, typeof Calendar> = {
  event: Calendar,
  vacancy: Briefcase,
  blog: BookOpen,
  organization: Building2,
}

const TYPE_COLOR_MAP: Record<GlobalSearchType, { bg: string; text: string; icon: string }> = {
  event: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-500' },
  vacancy: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
  blog: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
  organization: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
}

const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-inherit rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function SearchSuggestions({
  items,
  loading,
  query,
  highlightedIndex = -1,
  onItemSelect,
  onViewAll,
  className,
}: SearchSuggestionsProps) {
  const localePath = useLocalizedPath()

  if (!query.trim()) return null

  return (
    <div
      className={cn(
        'absolute top-full left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/40 z-50',
        className,
      )}
    >
      {loading ? (
        <div className="flex items-center gap-3 px-5 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm font-medium text-slate-500">Axtarılır...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm font-semibold text-slate-600">Nəticə tapılmadı</p>
          <p className="mt-1 text-xs text-slate-400">Başqa açar söz ilə yoxlayın</p>
        </div>
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto">
            {items.map((item, index) => {
              const Icon = TYPE_ICON_MAP[item.type]
              const colors = TYPE_COLOR_MAP[item.type]
              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={localePath(item.href)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors',
                    index !== items.length - 1 && 'border-b border-slate-100/80',
                    index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-slate-50',
                  )}
                  onClick={onItemSelect}
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', colors.bg)}>
                    <Icon className={cn('h-4 w-4', colors.icon)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-black uppercase tracking-wider', colors.text)}>
                        {SEARCH_TYPE_LABELS[item.type]}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm font-semibold text-slate-800">
                      {highlightMatch(item.title, query)}
                    </p>
                    {item.snippet && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                        {highlightMatch(item.snippet, query)}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-center gap-1.5 bg-blue-50/60 px-4 py-2.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 border-t border-slate-100/80 rounded-none"
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
