import type { ReactNode } from 'react'
import { ButtonLink } from '@/components/ui'
import { ArrowRight } from 'lucide-react'

type HomeSectionLayoutProps = {
  title: ReactNode
  description: ReactNode
  ctaLabel: string
  ctaHref: string
  children: ReactNode
  sectionClassName?: string
  emphasis?: 'primary' | 'neutral'
}

export default function HomeSectionLayout({
  title,
  description,
  ctaLabel,
  ctaHref,
  children,
  sectionClassName = 'py-16 md:py-20',
  emphasis = 'neutral',
}: HomeSectionLayoutProps) {
  const isPrimary = emphasis === 'primary'

  return (
    <section className={sectionClassName}>
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className={`flex flex-col md:flex-row md:items-end md:justify-between gap-4 ${isPrimary ? 'mb-10 md:mb-12' : 'mb-8'}`}>
            <div>
              <h2 className={isPrimary ? 'text-4xl md:text-5xl font-black tracking-tight text-slate-900' : 'text-3xl md:text-4xl font-bold text-slate-900'}>
                {title}
              </h2>
              <p className={isPrimary ? 'mt-3 text-base md:text-lg text-slate-700' : 'mt-2 text-slate-600'}>{description}</p>
            </div>
            {isPrimary ? (
              <ButtonLink
                href={ctaHref}
                variant="primary"
                size="md"
                shadow="sm"
                icon={ArrowRight}
                iconPosition="right"
              >
                {ctaLabel}
              </ButtonLink>
            ) : (
              <ButtonLink href={ctaHref} variant="ghost" size="md" icon={ArrowRight} iconPosition="right" shadow="none">
                {ctaLabel}
              </ButtonLink>
            )}
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}
