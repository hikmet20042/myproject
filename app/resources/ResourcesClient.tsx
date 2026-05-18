'use client'

import { BookOpen, Users, Briefcase, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui'
import { ListPageLayout } from '@/components/layout'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useSession } from '@/lib/auth/client'
import Link from 'next/link'

export default function ResourcesPage() {
  const localePath = useLocalizedPath()
  const { data: session } = useSession()
  const isOrganizationUser = session?.user?.accountType === 'organization'

  const resourceCategories = [
    {
      key: 'educationalMaterials',
      title: 'Tədris Materialları',
      description: 'Gənclərin inkişafına və bacarıqların artırılmasına yönəlmiş təlimatlar, kurslar və bələdçilər.',
      href: '/resources/materials',
      icon: BookOpen,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      key: 'organizationDirectory',
      title: 'Təşkilat Kataloqu',
      description: 'İcmamızdakı ən fəal gənclər təşkilatlarını kəşf edin və onlarla əlaqə saxlayın.',
      href: '/resources/organizations',
      icon: Users,
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      key: 'jobOpportunities',
      title: 'Vakansiyalar',
      description: 'Karyerana başlamaq üçün ən yaxşı iş, könüllülük və təcrübə imkanlarını tapın.',
      href: '/resources/vacancies',
      icon: Briefcase,
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      key: 'events',
      title: 'Tədbirlər',
      description: 'Öyrənmək, şəbəkələşmək və inkişaf etmək üçün yaxınlaşan tədbirləri kəşf edin.',
      href: '/resources/events',
      icon: Calendar,
      gradient: 'from-amber-500 to-orange-600',
    },
  ]

  return (
    <ListPageLayout
      title="Resurslar və İmkanlar"
      description="Gənclərin inkişafını dəstəkləmək üçün seçilmiş alətlər, təşkilatlar və karyera imkanları bir yerdə."
      headerBadgeText="KƏŞF ET"
      icon={Sparkles}
      headerActions={
        isOrganizationUser ? (
          <>
            <ButtonLink href={localePath('/dashboard/events/create')} variant="secondary" size="lg" className="rounded-full px-8">
              Tədbir Paylaş
            </ButtonLink>
            <ButtonLink href={localePath('/dashboard/vacancies/create')} variant="white-on-dark" size="lg" className="rounded-full px-8">
              Vakansiya Paylaş
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href={localePath('/submit/blog')} variant="secondary" size="lg" className="rounded-full px-8 shadow-xl shadow-blue-500/20">
              Hekayəni Paylaş
            </ButtonLink>
            <ButtonLink href={localePath('/')} variant="white-on-dark" size="lg" className="rounded-full px-8">
              Ana Səhifə
            </ButtonLink>
          </>
        )
      }
      content={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {resourceCategories.map((category) => {
            const Icon = category.icon
            return (
              <Link 
                key={category.key}
                href={localePath(category.href)}
                className="group relative flex flex-col transition-all duration-500 hover:-translate-y-2"
              >
                <Card className="rounded-[3rem] p-10">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${category.gradient} opacity-[0.03] group-hover:opacity-10 transition-opacity rounded-bl-[5rem]`} />
                
                <div className={`mb-8 h-16 w-16 rounded-3xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon className="h-8 w-8" />
                </div>
                
                <h3 className="text-3xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {category.title}
                </h3>
                
                <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8">
                  {category.description}
                </p>
                
                <div className="mt-auto flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest group/link">
                  Kəşf et
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-2" />
                </div>
                </Card>
              </Link>
            )
          })}
        </div>
      }
      bottomCta={
        <div className="text-center py-10">
          <h3 className="text-3xl md:text-5xl font-black mb-6 text-white text-center">Hər şey sizin üçün</h3>
          <p className="text-slate-400 font-medium text-lg mb-10 max-w-2xl mx-auto text-center">
            Platformamızdakı resurslardan tam yararlanmaq üçün qeydiyyatdan keçin və yeniliklərdən xəbərdar olun.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <ButtonLink
              href={localePath('/auth/register')}
              variant="white-on-dark"
              size="lg"
              className="rounded-2xl px-10 py-4 font-black"
            >
              Qeydiyyatdan keç
            </ButtonLink>
          </div>
        </div>
      }
    />
  )
}
