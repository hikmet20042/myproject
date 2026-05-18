'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, ShieldCheck } from 'lucide-react'
import OrganizationFollowButtonContainer from '@/components/containers/OrganizationFollowButtonContainer'
import { Card } from '@/components/ui/Card'
import { Badge, ButtonLink } from '@/components/ui'

interface OrganizationCardProps {
  org: {
    _id: string
    slug: string
    organizationName: string
    focusAreas: string[]
    location?: {
      city?: string
    }
    profileImage?: string
  }
  localePath: (path: string) => string
  focusLabel: (raw: string) => string
}

export const OrganizationCard = ({ org, localePath, focusLabel }: OrganizationCardProps) => {
  return (
    <Card className="group relative flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover" shadow="sm">
      {/* Top Section: Logo and Follow */}
      <div className="mb-6 flex shrink-0 items-start justify-between">
        <div className="relative">
          <div className="h-20 w-20 overflow-hidden rounded-md border border-slate-100 bg-slate-50 shadow-sm transition-transform duration-500 group-hover:scale-105">
            {org.profileImage ? (
              <Image
                src={org.profileImage}
                alt={org.organizationName}
                fill
                sizes="80px"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-2xl font-black text-blue-600">
                {org.organizationName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <OrganizationFollowButtonContainer
            organizationId={org._id}
            organizationName={org.organizationName}
            size="sm"
            showFollowerCount={true}
          />
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1">
        <Link href={localePath(`/o/${org.slug}`)} className="group/link block">
          <h3 className="mb-2 flex items-center gap-1.5 text-xl font-black leading-tight text-slate-900 transition-colors group-hover/link:text-blue-600">
            <span className="line-clamp-1">{org.organizationName}</span>
            <ShieldCheck className="h-5 w-5 shrink-0 text-blue-500" />
          </h3>
        </Link>
        <p className="mb-5 flex items-center gap-1.5 text-sm font-bold text-slate-500">
          <MapPin className="h-4 w-4 text-blue-500" />
          {org.location?.city || 'Bakı, Azərbaycan'}
        </p>

        {/* Focus Areas (Tags) */}
        <div className="mb-6 flex flex-wrap gap-1.5">
          {org.focusAreas.slice(0, 2).map((focus) => (
            <Badge
              key={`${org._id}-${focus}`}
              variant="primary"
              size="sm"
              rounded={false}
              className="border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600"
            >
              {focusLabel(focus)}
            </Badge>
          ))}
          {org.focusAreas.length > 2 && (
            <Badge variant="primary" size="sm" rounded={false} className="border-slate-100 bg-slate-50 px-2 text-[10px] font-black text-slate-500">
              +{org.focusAreas.length - 2}
            </Badge>
          )}
        </div>
      </div>

      {/* Action Area */}
      <ButtonLink
        href={localePath(`/o/${org.slug}`)}
        variant="ghost"
        size="sm"
        fullWidth
        className="group/btn mt-auto flex w-full items-center justify-between border-t border-slate-100 px-0 pt-5 text-left shadow-none hover:bg-transparent"
      >
        <span className="text-sm font-black text-slate-900 transition-colors group-hover/btn:text-blue-600">Profilə keç</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 transition-all group-hover/btn:translate-x-1 group-hover/btn:bg-blue-600 group-hover/btn:text-white">
          <ArrowRight className="h-4 w-4" />
        </div>
      </ButtonLink>
    </Card>
  )
}
