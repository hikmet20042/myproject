"use client"

import Link from 'next/link';
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { BookOpen, Users, Briefcase, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui';

export default function ResourcesPage() { const localePath = useLocalizedPath()

  const resourceCategories = [
    { key: 'educationalMaterials',
      title: 'Tədris Materialları',
      description: 'Gender bərabərliyi və icma rifahına fokuslanan təlimatlar, kurslar, videolar və endirilə bilən bələdçilərə daxil olun.',
      href: localePath('/resources/materials'),
      icon: BookOpen,
      tone: 'blue' },
    { key: 'organizationDirectory',
      title: 'Təşkilat Kataloqu',
      description: 'Gender bərabərliyi və sağ qalanlara dəstək üzərində çalışan təşkilatları kəşf edin və əlaqə saxlayın.',
      href: localePath('/resources/organizations'),
      icon: Users,
      tone: 'green' },
    { key: 'jobOpportunities',
      title: 'İş İmkanları',
      description: 'Gender bərabərliyi və icma qayğısını dəstəkləyən təşkilatlarda iş, könüllülük və təcrübə imkanlarını tapın.',
      href: localePath('/resources/vacancies'),
      icon: Briefcase,
      tone: 'blue' },
    { key: 'events',
      title: 'Tədbirlər',
      description: 'Gender bərabərliyi üzrə bilik və bacarıqlarınızı gücləndirən yaxınlaşan tədbir, seminar və proqramları kəşf edin.',
      href: localePath('/resources/events'),
      icon: Calendar,
      tone: 'green' }
  ]

  const quickAccessItems = [
    { href: localePath('/resources/materials'), label: 'Materiallara Bax', icon: BookOpen, variant: 'primary' as const },
    { href: localePath('/resources/organizations'), label: 'Təşkilatları tap', icon: Users, variant: 'outline' as const },
    { href: localePath('/resources/vacancies'), label: 'Vakansiyaları Tap', icon: Briefcase, variant: 'primary' as const },
    { href: localePath('/resources/events'), label: 'Yaxınlaşan Tədbirlər', icon: Calendar, variant: 'outline' as const }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/10 blur-3xl" />

        <div className="section-padding relative z-10">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 mb-8">
              <Sparkles size={14} className="text-accent" />
              {'İcma Dəstək Resursları'}
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
              {'İcma Dəstək Resursları'}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-gray-600 leading-relaxed">
              {'Gender bərabərliyini irəli aparmaq və sağ qalanlara dəstəyi gücləndirmək üçün seçilmiş alətlər, təşkilatlar və imkanlar.'}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <ButtonLink href={localePath('/submit')} variant="secondary" size="lg" hoverEffect="scale">
                {'Bloq Paylaş'}
              </ButtonLink>
              <ButtonLink href={localePath('/resources')} variant="outline" size="lg" hoverEffect="scale">
                {'Fürsətləri Kəşf Et'}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="section-padding relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 md:mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 px-4">
                {'Sənin üçün'}{' '}
                <span className="text-primary">
                  {'Düzgün Dəstək'}
                </span>
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
                {'Təlim materiallarından təcili yardıma qədər ehtiyaclarına uyğunlaşdırılmış resurslara çıxış əldə et.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {resourceCategories.map((category) => { const Icon = category.icon
                return (
                  <Link
                    key={category.key}
                    href={category.href}
                    className="group block"
                  >
                    <div className="relative h-full rounded-2xl border border-gray-200 bg-white p-6 md:p-7 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                      <div className="relative z-10">
                        <div className="flex items-start gap-4">
                          <div className={`h-12 w-12 rounded-xl ${category.tone === 'green' ? 'bg-emerald-100' : 'bg-blue-100'} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-6 w-6 ${category.tone === 'green' ? 'text-emerald-700' : 'text-blue-700'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {category.title}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
                              {category.description}
                            </p>

                            <div className="flex items-center gap-2 text-primary font-semibold group-hover:text-blue-700 transition-colors">
                              <span className="text-sm sm:text-base">{'Kəşf et'}</span>
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 bg-slate-50/60">
        <div className="section-padding">
          <div className="max-w-5xl mx-auto rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 text-center shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 px-4">
                {'Elə İndi Başla'}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {quickAccessItems.map((item, idx) => { const Icon = item.icon
                return (
                  <Link 
                    key={idx} 
                    href={item.href}
                    className="w-full"
                  >
                    <Button 
                      variant={item.variant} 
                      size="lg"
                      className="w-full group py-4 sm:py-5 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base"
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-12 transition-transform" />
                      <span className="line-clamp-1">{item.label}</span>
                    </Button>
                  </Link>
                ) })}
            </div>
          </div>
        </div>
      </section>
    </div>
  ); }
