'use client'

import { BookOpen, Users, Briefcase, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui'
import { ListPageLayout } from '@/components/layout'
import { ResourceCard } from '@/components/shared'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'

export default function ResourcesPage() {
  const localePath = useLocalizedPath()

  const resourceCategories = [
    {
      key: 'educationalMaterials',
      type: 'material' as const,
      title: 'Tədris Materialları',
      description: 'Gender bərabərliyi və icma rifahına fokuslanan təlimatlar, kurslar, videolar və endirilə bilən bələdçilərə daxil olun.',
      href: '/resources/materials',
      icon: BookOpen,
      tone: 'blue',
    },
    {
      key: 'organizationDirectory',
      type: 'organization' as const,
      title: 'Təşkilat Kataloqu',
      description: 'Gender bərabərliyi və sağ qalanlara dəstək üzərində çalışan təşkilatları kəşf edin və əlaqə saxlayın.',
      href: '/o',
      icon: Users,
      tone: 'green',
    },
    {
      key: 'jobOpportunities',
      type: 'vacancy' as const,
      title: 'Vakansiyalar',
      description: 'Gender bərabərliyi və icma qayğısını dəstəkləyən təşkilatlarda iş, könüllülük və təcrübə imkanlarını tapın.',
      href: '/resources/vacancies',
      icon: Briefcase,
      tone: 'blue',
    },
    {
      key: 'events',
      type: 'event' as const,
      title: 'Tədbirlər',
      description: 'Gender bərabərliyi üzrə bilik və bacarıqlarınızı gücləndirən yaxınlaşan tədbir, seminar və proqramları kəşf edin.',
      href: '/resources/events',
      icon: Calendar,
      tone: 'green',
    },
  ]

  const quickAccessItems = [
    { href: localePath('/resources/materials'), label: 'Materiallara Bax', icon: BookOpen, variant: 'primary' as const },
    { href: localePath('/o'), label: 'Təşkilatları Tap', icon: Users, variant: 'outline' as const },
    { href: localePath('/resources/vacancies'), label: 'Vakansiyaları Tap', icon: Briefcase, variant: 'primary' as const },
    { href: localePath('/resources/events'), label: 'Yaxınlaşan Tədbirlər', icon: Calendar, variant: 'outline' as const },
  ]

  return (
    <ListPageLayout
      title="İcma Dəstək Resursları"
      description="Gender bərabərliyini irəli aparmaq və sağ qalanlara dəstəyi gücləndirmək üçün seçilmiş alətlər, təşkilatlar və imkanlar."
      icon={Sparkles}
      headerActions={
        <>
          <ButtonLink href={localePath('/submit')} variant="secondary" size="lg" hoverEffect="scale">
            {'Bloq Paylaş'}
          </ButtonLink>
          <ButtonLink href={localePath('/resources')} variant="outline" size="lg" hoverEffect="scale">
            {'Fürsətləri Kəşf Et'}
          </ButtonLink>
        </>
      }
      content={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resourceCategories.map((category) => {
            const Icon = category.icon
            return (
              <ResourceCard
                key={category.key}
                type={category.type}
                title={category.title}
                description={category.description}
                href={category.href}
                icon={
                  <div className={`h-12 w-12 rounded-xl ${category.tone === 'green' ? 'bg-emerald-100' : 'bg-blue-100'} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${category.tone === 'green' ? 'text-emerald-700' : 'text-blue-700'}`} />
                  </div>
                }
                actionText="Kəşf et"
              />
            )
          })}
        </div>
      }
      bottomCta={
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 text-center shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{'Elə İndi Başla'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickAccessItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <ButtonLink key={idx} href={item.href} variant={item.variant} size="lg" hoverEffect="scale" className="w-full py-4 sm:py-5 rounded-xl font-semibold text-sm sm:text-base">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="line-clamp-1">{item.label}</span>
                </ButtonLink>
              )
            })}
          </div>
        </div>
      }
    />
  )
}
