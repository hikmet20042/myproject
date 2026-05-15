'use client'

import Link from 'next/link'
import { ArrowRight, LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  description?: string
  href?: string
  linkText?: string
  icon?: LucideIcon
  iconGradient?: string
}

export default function SectionHeader({ 
  title, 
  description, 
  href, 
  linkText = 'Hamısına bax',
  icon: Icon,
  iconGradient = 'from-blue-600 to-indigo-600'
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row lg:items-end justify-between gap-6 mb-12">
      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-4">
          {Icon && (
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-lg shadow-blue-500/20`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {title}
          </h2>
        </div>
        {description && (
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {href && (
        <Link 
          href={href} 
          className="group inline-flex items-center gap-2 rounded-full border-2 border-slate-100 bg-white px-8 py-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 hover:shadow-xl active:scale-95 whitespace-nowrap"
        >
          {linkText}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
