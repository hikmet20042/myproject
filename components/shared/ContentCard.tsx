'use client'

import Link from 'next/link'
import { MapPin, Clock3, Building2, Users, ArrowUpRight } from 'lucide-react'
import SaveItemButtonContainer from '@/components/containers/SaveItemButtonContainer'

interface ContentCardProps {
  item: {
    id: string
    kind: 'event' | 'vacancy' | 'blog'
    title: string
    href: string
    badge: string
    coverImage?: string
    dateLabel: string
    locationLabel?: string
    ownerLabel: string
  }
}

export const ContentCard = ({ item }: ContentCardProps) => {
  const isEvent = item.kind === 'event'
  const isVacancy = item.kind === 'vacancy'
  const isBlog = item.kind === 'blog'

  return (
    <article className="group relative flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 overflow-hidden h-full">
      {/* Image Section */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-50 shrink-0">
        {item.coverImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.coverImage}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${
            isEvent ? 'from-purple-100 to-fuchsia-50' :
            isVacancy ? 'from-blue-100 to-cyan-50' :
            'from-amber-100 to-orange-50'
          }`}>
            <span className={`text-6xl font-black opacity-20 ${
              isEvent ? 'text-purple-600' :
              isVacancy ? 'text-blue-600' :
              'text-amber-600'
            }`}>
              {item.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Overlay Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className={`inline-flex rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md border shadow-sm ${
            isEvent ? 'bg-purple-500/90 text-white border-purple-400' :
            isVacancy ? 'bg-blue-500/90 text-white border-blue-400' :
            'bg-amber-500/90 text-white border-amber-400'
          }`}>
            {item.badge}
          </span>
        </div>

        {/* Save Button */}
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <SaveItemButtonContainer 
            itemId={item.id} 
            itemType={item.kind} 
            itemTitle={item.title} 
            size="sm" 
            showText={false} 
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex-1">
          <Link href={item.href} className="group/link block mb-3">
            <h3 className="line-clamp-2 text-xl font-black text-slate-800 transition-colors group-hover/link:text-blue-600 leading-tight">
              {item.title}
            </h3>
          </Link>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              {isBlog ? (
                <Users className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
              )}
              <span className="truncate">{item.ownerLabel}</span>
            </div>

            {item.locationLabel && (
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <MapPin className="h-4 w-4 text-purple-500 shrink-0" />
                <span className="truncate">{item.locationLabel}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Clock3 className="h-4 w-4 text-cyan-500 shrink-0" />
              <span>{item.dateLabel}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
          <Link href={item.href} className="text-sm font-black text-slate-900 flex items-center gap-1 group/btn">
            Ətraflı bax
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
