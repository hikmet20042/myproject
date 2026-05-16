'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { MapPin, Clock3, Building2, Users, ArrowUpRight } from 'lucide-react'
import SaveItemButtonContainer from '@/components/containers/SaveItemButtonContainer'
import { Badge, ButtonLink } from '@/components/ui'

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
    <Card className="group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover" interactive>
      {/* Image Section */}
      <div className="relative h-56 w-full shrink-0 overflow-hidden bg-slate-50">
        {item.coverImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.coverImage}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${
            isEvent ? 'from-blue-100 to-cyan-50' :
            isVacancy ? 'from-blue-100 to-indigo-50' :
            'from-emerald-100 to-teal-50'
          }`}>
            <span className={`text-6xl font-black opacity-20 ${
              isEvent ? 'text-blue-600' :
              isVacancy ? 'text-indigo-600' :
              'text-emerald-600'
            }`}>
              {item.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Overlay Badge */}
        <div className="absolute left-4 top-4 z-10">
          <Badge variant="primary" size="sm" className="bg-blue-600/90 text-white backdrop-blur-md uppercase tracking-wider">{item.badge}</Badge>
        </div>

        {/* Save Button */}
        <div className="absolute right-4 top-4 z-10 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
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
          <Link href={item.href} className="group/link mb-3 block">
            <h3 className="line-clamp-2 text-xl font-black leading-tight text-slate-800 transition-colors group-hover/link:text-blue-600">
              {item.title}
            </h3>
          </Link>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              {isBlog ? (
                <Users className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Building2 className="h-4 w-4 shrink-0 text-blue-500" />
              )}
              <span className="truncate">{item.ownerLabel}</span>
            </div>

            {item.locationLabel && (
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{item.locationLabel}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
              <span>{item.dateLabel}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
          <ButtonLink
            href={item.href}
            variant="ghost"
            size="sm"
            icon={ArrowUpRight}
            iconPosition="right"
            shadow="none"
            className="group/btn gap-1 px-0 text-sm font-black text-slate-900 hover:bg-transparent"
          >
            Ətraflı bax
          </ButtonLink>
        </div>
      </div>
    </Card>
  )
}
