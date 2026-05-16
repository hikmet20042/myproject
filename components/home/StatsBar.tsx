'use client'

import { Card } from '@/components/ui/Card'

interface StatsBarProps {
  stats: {
    totalEvents: number
    totalVacancies: number
    totalOrganizations: number
    totalBlogs: number
  }
}

export const StatsBar = ({ stats }: StatsBarProps) => {
  const items = [
    { label: 'Aktiv Vakansiya', value: stats.totalVacancies, color: 'text-blue-600' },
    { label: 'Aktiv Tədbir', value: stats.totalEvents, color: 'text-purple-600' },
    { label: 'İcma Bloqu', value: stats.totalBlogs, color: 'text-amber-600' },
    { label: 'Tərəfdaş Təşkilat', value: stats.totalOrganizations, color: 'text-teal-600' },
  ]

  return (
    <div className="container mx-auto px-4 -mt-12 relative z-20">
      <Card className="bg-white/80 backdrop-blur-xl border-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-slate-100">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center px-4 group">
              <span className={`text-3xl md:text-4xl lg:text-5xl font-black mb-2 transition-transform duration-300 group-hover:scale-110 ${item.color}`}>
                {item.value}+
              </span>
              <span className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
