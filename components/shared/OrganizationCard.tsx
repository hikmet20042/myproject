'use client'

import Link from 'next/link'
import { MapPin, ArrowRight, ShieldCheck } from 'lucide-react'
import OrganizationFollowButtonContainer from '@/components/containers/OrganizationFollowButtonContainer'

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
    <article className="group relative bg-white rounded-[2rem] border border-slate-100 p-6 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 overflow-hidden h-full flex flex-col">
      {/* Top Section: Logo and Follow */}
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div className="relative">
          <div className="h-20 w-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 transition-transform duration-500 group-hover:scale-105">
            {org.profileImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={org.profileImage} 
                alt={org.organizationName} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 font-black text-2xl">
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
        <Link href={localePath(`/o/${org.slug}`)} className="block group/link">
          <h3 className="flex items-center gap-1.5 text-xl font-black text-slate-900 transition-colors group-hover/link:text-blue-600 leading-tight mb-2">
            <span className="line-clamp-1">{org.organizationName}</span>
            <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
          </h3>
        </Link>
        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-400 mb-5">
          <MapPin className="h-4 w-4 text-blue-500" />
          {org.location?.city || 'Bakı, Azərbaycan'}
        </p>

        {/* Focus Areas (Tags) */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {org.focusAreas.slice(0, 2).map((focus) => (
            <span
              key={`${org._id}-${focus}`}
              className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600"
            >
              {focusLabel(focus)}
            </span>
          ))}
          {org.focusAreas.length > 2 && (
            <span className="rounded-xl bg-slate-50 border border-slate-100 px-2 py-1.5 text-[10px] font-black text-slate-400">
              +{org.focusAreas.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Action Area */}
      <Link 
        href={localePath(`/o/${org.slug}`)} 
        className="flex items-center justify-between w-full pt-5 border-t border-slate-50 group/btn mt-auto"
      >
        <span className="text-sm font-black text-slate-900 transition-colors group-hover/btn:text-blue-600">Profilə keç</span>
        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center transition-all group-hover/btn:bg-blue-600 group-hover/btn:text-white group-hover/btn:translate-x-1">
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>
    </article>
  )
}
