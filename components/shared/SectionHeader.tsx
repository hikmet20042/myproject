'use client'

import { ArrowRight, LucideIcon } from 'lucide-react'
import { ButtonLink } from '@/components/ui'

interface SectionHeaderProps {
  title: string
  description?: string
  href?: string
  linkText?: string
  icon?: LucideIcon
}

export default function SectionHeader({
  title,
  description,
  href,
  linkText = 'Hamısına bax',
  icon: Icon,
}: SectionHeaderProps) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row lg:items-end">
      <div className="max-w-2xl">
        <div className="mb-4 flex items-center gap-4">
          {Icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-600 shadow-sm">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
            {title}
          </h2>
        </div>
        {description && (
          <p className="text-lg font-medium leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>
      {href && (
        <ButtonLink
          href={href}
          variant="outline"
          size="md"
          className="group border-2 px-8 py-4 shadow-card hover:border-blue-200 hover:bg-slate-50 hover:text-blue-600 hover:shadow-elevated active:scale-95"
          iconPosition="right"
          icon={ArrowRight}
        >
          {linkText}
        </ButtonLink>
      )}
    </div>
  )
}
