'use client'

import { Button, ButtonLink } from '@/components/ui';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext'
import { AnimatedBackground } from '@/components/shared'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import {
  Shield,
  AlertTriangle,
  Lightbulb,
  Database,
  Cpu,
  BarChart3,
  Eye,
  BookOpen,
  Sparkles,
  Target,
  CheckCircle,
  XCircle,
  ArrowRight,
  Heart,
  Users
} from 'lucide-react'

export default function About() {
  const localePath = useLocalizedPath()
  const { t } = useLanguage()

  const dataLimitations = [
    t('about.onlyPublicReports'),
    t('about.mayNotReflectScale'),
    t('about.aiMayContainBias'),
    t('about.regionalCoverageVaries')
  ]

  const ethicalSafeguards = [
    t('about.noPersonalInfo'),
    t('about.victimPrivacy'),
    t('about.dataForAwareness'),
    t('about.aiPrinciples')
  ]

  const trustIndicators = [
    { icon: Users, title: t('about.communityGrowth'), description: t('about.communityGrowthText') },
    { icon: Shield, title: t('about.privacyCommitment'), description: t('about.privacyCommitmentText') },
    { icon: Sparkles, title: t('about.continuousImprovement'), description: t('about.continuousImprovementText') }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Engaging Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 text-white py-16 sm:py-20 lg:py-28">
        {/* Animated Blobs */}
        <AnimatedBackground
          colors={{
            blob1: 'bg-blue-400',
            blob2: 'bg-purple-400',
            blob3: 'bg-indigo-400'
          }}
        />

        {/* Floating Particles */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        <div className="section-padding relative z-10">
          <div className="max-w-5xl mx-auto text-center">


            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight animate-slide-up px-4">
              {t('about.ourMission')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto animate-fade-in px-4 font-light">
              {t('about.missionSubtitle')}
            </p>
          </div>
        </div>

      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="section-padding">
          <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20 lg:space-y-24">

            {/* The Problem - Enhanced */}
            <div>
              <div className="text-center mb-8 sm:mb-12 animate-fade-in">

                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-3 sm:mb-4 px-4">
                  {t('about.dataChallenge')}
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto px-4">
                  {t('about.dataChallengeSubtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="group relative bg-gradient-to-br from-white to-red-50/50 rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-red-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-600/0 group-hover:from-red-500/5 group-hover:to-red-600/5 transition-all duration-500 rounded-2xl"></div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {t('about.whyUnreliable')}
                      </h3>
                    </div>
                    <div className="space-y-4 text-gray-600">
                      {[
                        { title: t('about.culturalStigma'), text: t('about.culturalStigmaText') },
                        { title: t('about.institutionalGaps'), text: t('about.institutionalGapsText') },
                        { title: t('about.limitedTransparency'), text: t('about.limitedTransparencyText') },
                        { title: t('about.resourceConstraints'), text: t('about.resourceConstraintsText') }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start group/item">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0 group-hover/item:scale-150 transition-transform"></div>
                          <p className="text-sm sm:text-base leading-relaxed">
                            <strong className="text-gray-900">{item.title}:</strong> {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-br from-white to-orange-50/50 rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-orange-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in animation-delay-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/5 group-hover:to-orange-600/5 transition-all duration-500 rounded-2xl"></div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        <Lightbulb className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {t('about.theImpact')}
                      </h3>
                    </div>
                    <div className="space-y-4 text-gray-600">
                      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-xl">
                        <p className="text-sm sm:text-base leading-relaxed text-orange-800 font-medium">
                          {t('about.impactIntro')}
                        </p>
                      </div>
                      <ul className="space-y-3 text-sm sm:text-base">
                        {[
                          t('about.developStrategies'),
                          t('about.allocateResources'),
                          t('about.measureProgress'),
                          t('about.advocatePolicy')
                        ].map((item, idx) => (
                          <li key={idx} className="flex items-center group/item">
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-3 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Our Solution - Enhanced */}
            <div>
              <div className="text-center mb-8 sm:mb-12 animate-fade-in">

                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-3 sm:mb-4 px-4">
                  {t('about.technologyApproach')}
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto px-4">
                  {t('about.technologySubtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[
                  {
                    icon: Database,
                    title: t('about.newsScraping'),
                    desc: t('about.newsScrapingText'),
                    color: 'blue',
                    features: [t('about.multipleSourcesDaily'), t('about.realTimeMonitoring'), t('about.sourceVerification')]
                  },
                  {
                    icon: Cpu,
                    title: t('about.aiClassification'),
                    desc: t('about.aiClassificationText'),
                    color: 'green',
                    features: [t('about.nlp'), t('about.patternRecognition'), t('about.humanOversight')]
                  },
                  {
                    icon: BarChart3,
                    title: t('about.dataVisualization'),
                    desc: t('about.dataVisualizationText'),
                    color: 'purple',
                    features: [t('about.interactiveCharts'), t('about.regionalBreakdowns'), t('about.trendAnalysis')]
                  }
                ].map((solution, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br from-${solution.color}-500/0 to-${solution.color}-600/0 group-hover:from-${solution.color}-500/5 group-hover:to-${solution.color}-600/5 transition-all duration-500 rounded-2xl`}></div>

                    <div className="relative z-10">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${solution.color === 'blue' ? 'from-blue-500 to-blue-700' : solution.color === 'green' ? 'from-green-500 to-green-700' : 'from-purple-500 to-purple-700'} flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300`}>
                        <solution.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors">
                        {solution.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                        {solution.desc}
                      </p>
                      <div className={`bg-${solution.color === 'blue' ? 'blue' : solution.color === 'green' ? 'green' : 'purple'}-50 rounded-xl p-3 sm:p-4`}>
                        <div className="space-y-2 sm:space-y-3">
                          {solution.features.map((feature, fIdx) => (
                            <div key={fIdx} className="flex items-center group/item">
                              <div className={`w-1.5 h-1.5 ${solution.color === 'blue' ? 'bg-blue-500' : solution.color === 'green' ? 'bg-green-500' : 'bg-purple-500'} rounded-full mr-2 sm:mr-3 flex-shrink-0 group-hover/item:scale-150 transition-transform`}></div>
                              <span className={`text-xs sm:text-sm ${solution.color === 'blue' ? 'text-blue-800' : solution.color === 'green' ? 'text-green-800' : 'text-purple-800'}`}>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Purpose - Enhanced */}
            <div>
              <div className="text-center mb-8 sm:mb-12 animate-fade-in">

                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-3 sm:mb-4 px-4">
                  {t('about.platformPurpose')}
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto px-4">
                  {t('about.platformPurposeSubtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {[
                  {
                    icon: Eye,
                    title: t('about.transparentStatistics'),
                    color: 'cyan',
                    features: [
                      { text: t('about.openMethodology') },
                      { text: t('about.sourceAttribution') },
                      { text: t('about.regularUpdates') },
                      { text: t('about.limitationDisclosure') }
                    ]
                  },
                  {
                    icon: BookOpen,
                    title: t('about.educationResources'),
                    color: 'indigo',
                    features: [
                      { text: t('about.comprehensiveLibrary') },
                      { text: t('about.educationalMaterials') },
                      { text: t('about.communityBlog') },
                      { text: t('about.emergencyResources') }
                    ]
                  }
                ].map((purpose, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br from-${purpose.color}-500/0 to-${purpose.color}-600/0 group-hover:from-${purpose.color}-500/5 group-hover:to-${purpose.color}-600/5 transition-all duration-500 rounded-2xl`}></div>

                    <div className="relative z-10">
                      <div className="flex items-center mb-6">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${purpose.color === 'cyan' ? 'from-cyan-500 to-cyan-700' : 'from-indigo-500 to-indigo-700'} flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                          <purpose.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {purpose.title}
                        </h3>
                      </div>

                      <ul className="space-y-3 text-gray-600">
                        {purpose.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start group/item">
                            <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${purpose.color === 'cyan' ? 'text-cyan-500' : 'text-indigo-500'} mr-3 mt-0.5 flex-shrink-0 group-hover/item:scale-110 transition-transform`} />
                            <span className="text-sm sm:text-base">{feature.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Strength */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14 lg:px-16">
              <div className="pointer-events-none absolute inset-0 opacity-40">
                <div className="absolute -top-20 -left-10 h-56 w-56 rounded-full bg-blue-500/40 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-purple-500/40 blur-3xl"></div>
              </div>
              <div className="relative z-10">
                <div className="mx-auto max-w-3xl text-center">

                  <h3 className="mt-4 text-2xl font-black sm:text-3xl lg:text-4xl">
                    {t('about.limitationsEthics')}
                  </h3>
                  <p className="mt-4 text-sm text-blue-100 sm:text-base lg:text-lg">
                    {t('about.limitationsEthicsSubtitle')}
                  </p>
                </div>
                <div className="mt-10 grid gap-8 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur sm:p-8">
                    <h4 className="flex items-center text-lg font-semibold sm:text-xl">
                      <AlertTriangle className="mr-3 h-5 w-5 text-amber-200" />
                      {t('about.dataLimitations')}
                    </h4>
                    <ul className="mt-5 space-y-3 text-sm leading-relaxed text-blue-100 sm:text-base">
                      {dataLimitations.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-300"></div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur sm:p-8">
                    <h4 className="flex items-center text-lg font-semibold sm:text-xl">
                      <Sparkles className="mr-3 h-5 w-5 text-sky-200" />
                      {t('about.ethicalStandards')}
                    </h4>
                    <ul className="mt-5 space-y-3 text-sm leading-relaxed text-blue-100 sm:text-base">
                      {ethicalSafeguards.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-200" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-5 text-left text-sm text-blue-100 sm:p-6 sm:text-base">
                  <strong className="text-white">{t('about.disclaimerTitle')}</strong> {t('about.disclaimerText')}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 py-12 sm:py-16 lg:py-20">
        {/* Animated Background Elements */}
        <AnimatedBackground
          colors={{
            blob1: 'bg-pink-500',
            blob2: 'bg-blue-400',
            blob3: 'bg-purple-500'
          }}
        />

        <div className="relative z-10 section-padding">
          <div className="max-w-5xl mx-auto text-center">


            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 px-4">
              {t('about.joinMovement')}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-8 sm:mb-10 max-w-3xl mx-auto px-4">
              {t('about.joinMovementText')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-12 px-4">
              <ButtonLink
                href={localePath("/submit")}
                variant="secondary"
                size="lg"
                hoverEffect="scale"
              >
                {t('about.shareYourBlog')}
              </ButtonLink>
              <ButtonLink
                href={localePath("/resources")}
                variant="outline"
                size="lg"
                hoverEffect="scale"
              >
                {t('about.accessResources')}
              </ButtonLink>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:gap-6">
              {trustIndicators.map((item, idx) => (
                <div
                  key={idx}
                  className="flex h-full flex-col items-center rounded-2xl border border-white/20 bg-white/10 px-5 py-6 text-center text-white/90 backdrop-blur transition-transform hover:-translate-y-1 hover:bg-white/15"
                >
                  <item.icon className="mb-3 h-8 w-8 text-white" />
                  <span className="text-sm font-semibold text-white sm:text-base">{item.title}</span>
                  <p className="mt-2 text-xs text-blue-100 sm:text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}