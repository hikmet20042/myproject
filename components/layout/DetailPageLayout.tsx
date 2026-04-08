import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Breadcrumb } from '@/components/ui'
import type { BreadcrumbItem } from '@/components/ui/Breadcrumb'

type DetailPageLayoutProps = {
  backHref: string
  backLabel: string
  breadcrumbItems: BreadcrumbItem[]
  title: ReactNode
  metadata?: ReactNode
  mainContent: ReactNode
  actionSection?: ReactNode
  sidebar?: ReactNode
}

export default function DetailPageLayout({
  backHref,
  backLabel,
  breadcrumbItems,
  title,
  metadata,
  mainContent,
  actionSection,
  sidebar,
}: DetailPageLayoutProps) {
  const hasSidebar = Boolean(sidebar)

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <section className="relative overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/10 blur-3xl" />

        <div className="section-padding relative z-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6">
              <Breadcrumb items={breadcrumbItems} />
            </div>

            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{backLabel}</span>
            </Link>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm sm:p-8">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
                {title}
              </h1>
              {metadata && <div className="mt-5">{metadata}</div>}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl">
          {hasSidebar ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
              <div className="lg:col-span-2 space-y-8">
                {mainContent}
                {actionSection}
              </div>
              <div className="space-y-8">{sidebar}</div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-8">
              {mainContent}
              {actionSection}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
