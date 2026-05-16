import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { ProgressIndicator } from '@/components/shared'

type FormLayoutProps = {
  title: string
  subtitle?: string
  currentStep?: number
  totalSteps?: number
  rightAction?: ReactNode
  infoBanner?: ReactNode
  children: ReactNode
}

export default function FormLayout({
  title,
  subtitle,
  currentStep,
  totalSteps,
  rightAction,
  infoBanner,
  children,
}: FormLayoutProps) {
  const hasProgress = typeof currentStep === 'number' && typeof totalSteps === 'number'
  const percentage = hasProgress && totalSteps! > 0 ? Math.round((currentStep! / totalSteps!) * 100) : 0

  return (
    <div className="relative min-h-screen bg-background py-8 sm:py-12 text-foreground transition-colors duration-200">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[440px] w-[760px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {hasProgress && (
          <div className="mb-4">
            <ProgressIndicator currentStep={currentStep!} totalSteps={totalSteps!} percentage={percentage} />
          </div>
        )}

        <Card className="mb-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{title}</h1>
              {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
            </div>
            {rightAction}
          </div>
        </Card>

        {infoBanner}
        {children}
      </div>
    </div>
  )
}
