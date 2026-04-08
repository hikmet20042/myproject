import type { ReactNode } from 'react'
import Link from 'next/link'
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
              <h2 className={isPrimary ? 'text-4xl md:text-5xl font-black tracking-tight text-gray-900' : 'text-3xl md:text-4xl font-bold text-gray-900'}>
                {title}
              </h2>
              <p className={isPrimary ? 'mt-3 text-base md:text-lg text-gray-700' : 'mt-2 text-gray-600'}>{description}</p>
            </div>
            {isPrimary ? (
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors"
              >
                {ctaLabel} <ArrowRight size={16} />
              </Link>
            ) : (
              <Link href={ctaHref} className="inline-flex items-center gap-2 text-primary font-semibold hover:text-blue-700">
                {ctaLabel} <ArrowRight size={16} />
              </Link>
            )}
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}
