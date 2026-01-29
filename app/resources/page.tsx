"use client"

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { BookOpen, Users, Briefcase, Calendar, ArrowRight, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui';
import { AnimatedBackground } from '@/components/shared';

export default function ResourcesPage() {
  const { t } = useLanguage()
  const localePath = useLocalizedPath()

  const resourceCategories = [
    {
      key: 'educationalMaterials',
      title: t('resources.categories.educationalMaterials.title'),
      description: t('resources.categories.educationalMaterials.description'),
      href: localePath('/resources/materials'),
      icon: BookOpen,
      gradient: 'from-blue-500 to-blue-700',
      hoverGradient: 'from-blue-600 to-blue-800',
      bgLight: 'bg-blue-50'
    },
    {
      key: 'ngoDirectory',
      title: t('resources.categories.ngoDirectory.title'),
      description: t('resources.categories.ngoDirectory.description'),
      href: localePath('/resources/ngos'),
      icon: Users,
      gradient: 'from-indigo-500 to-indigo-700',
      hoverGradient: 'from-indigo-600 to-indigo-800',
      bgLight: 'bg-indigo-50'
    },
    {
      key: 'jobOpportunities',
      title: t('resources.categories.jobOpportunities.title'),
      description: t('resources.categories.jobOpportunities.description'),
      href: localePath('/resources/vacancies'),
      icon: Briefcase,
      gradient: 'from-purple-500 to-purple-700',
      hoverGradient: 'from-purple-600 to-purple-800',
      bgLight: 'bg-purple-50'
    },
    {
      key: 'events',
      title: t('resources.categories.events.title'),
      description: t('resources.categories.events.description'),
      href: localePath('/resources/events'),
      icon: Calendar,
      gradient: 'from-pink-500 to-pink-700',
      hoverGradient: 'from-pink-600 to-pink-800',
      bgLight: 'bg-pink-50'
    }
  ]

  const quickAccessItems = [
    { href: localePath('/resources/materials'), label: t('resources.quickAccess.browseMaterials'), icon: BookOpen, variant: 'primary' as const },
    { href: localePath('/resources/ngos'), label: t('resources.quickAccess.findNgos'), icon: Users, variant: 'outline' as const },
    { href: localePath('/resources/vacancies'), label: t('resources.quickAccess.findVacancies'), icon: Briefcase, variant: 'primary' as const },
    { href: localePath('/resources/events'), label: t('resources.quickAccess.upcomingEvents'), icon: Calendar, variant: 'outline' as const }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Engaging Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 text-white py-16 sm:py-20 lg:py-24">
        {/* Animated Blobs */}
        <AnimatedBackground
          colors={{
            blob1: 'bg-blue-400',
            blob2: 'bg-purple-400',
            blob3: 'bg-pink-400'
          }}
        />

        <div className="section-padding relative z-10">
          <div className="max-w-5xl mx-auto text-center">
           

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight animate-slide-up px-4">
              {t('resources.hero.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto animate-fade-in px-4">
              {t('resources.hero.subtitle')}
            </p>
          </div>
        </div>

      </section>

      {/* Resource Categories - Enhanced Grid */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-100 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="section-padding relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-12 animate-fade-in">
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2 sm:mb-3 px-4">
                {t('resources.categoriesSection.titleLeading')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {t('resources.categoriesSection.titleHighlight')}
                </span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                {t('resources.categoriesSection.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {resourceCategories.map((category, index) => {
                const Icon = category.icon
                return (
                  <Link
                    key={index}
                    href={category.href}
                    className="group block animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}></div>
                      
                      {/* Shine Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-start gap-4 sm:gap-6">
                          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0`}>
                            <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                              {category.title}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4 sm:mb-6">
                              {category.description}
                            </p>
                            
                            {/* CTA */}
                            <div className="flex items-center gap-2 text-blue-600 font-bold group-hover:gap-4 transition-all duration-300">
                              <span className="text-sm sm:text-base">{t('resources.explore')}</span>
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Corner Decoration */}
                      <div className={`absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 ${category.bgLight} rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity duration-500`}></div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Section - Enhanced */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-white via-blue-50/30 to-white relative">
        <div className="section-padding">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-6 sm:mb-8 animate-fade-in">
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 px-4">
                {t('resources.quickAccess.heading')}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4">
              {quickAccessItems.map((item, idx) => {
                const Icon = item.icon
                return (
                  <Link 
                    key={idx} 
                    href={item.href}
                    className="w-full animate-scale-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <Button 
                      variant={item.variant} 
                      size="lg"
                      className="w-full group py-4 sm:py-5 rounded-xl font-bold hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-12 transition-transform" />
                      <span className="line-clamp-1">{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}
