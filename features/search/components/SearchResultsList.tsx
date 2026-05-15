'use client'

import Link from 'next/link'
import { Building2, Clock3, MapPin } from 'lucide-react'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { cn } from '@/lib/utils'
import type { GlobalSearchItem } from '@/features/search/types/search.types'
import {
  formatSearchResultDate,
  getSearchTypeIcon,
  SEARCH_TYPE_LABELS,
} from '@/features/search/utils/searchPresentation'

type SearchResultsListProps = {
  items: GlobalSearchItem[]
  className?: string
}

export function SearchResultsList({ items, className }: SearchResultsListProps) {
  const localePath = useLocalizedPath()

  return (
    <div className={cn('grid gap-4', className)}>
      {items.map((item) => {
        const Icon = getSearchTypeIcon(item.type)

        return (
          <article
            key={`${item.type}-${item.id}`}
            className="group rounded-2xl border border-white/60 bg-white/70 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgb(0,0,0,0.06)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-blue-200 bg-blue-100/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                    {SEARCH_TYPE_LABELS[item.type]}
                  </span>
                </div>

                <Link href={localePath(item.href)} className="block">
                  <h3 className="line-clamp-2 text-lg font-black text-slate-800 transition-colors group-hover:text-blue-600 md:text-xl">
                    {item.title}
                  </h3>
                </Link>

                {item.snippet && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.snippet}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-500">
                  {item.ownerLabel && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {item.ownerLabel}
                    </span>
                  )}
                  {item.locationLabel && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {item.locationLabel}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatSearchResultDate(item.date)}
                  </span>
                </div>
              </div>

              <Link
                href={localePath(item.href)}
                className="hidden text-sm font-bold text-slate-600 transition-colors hover:text-blue-600 sm:inline-flex"
              >
                Bax
              </Link>
            </div>
          </article>
        )
      })}
    </div>
  )
}
