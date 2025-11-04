'use client'

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardContent } from '@/components/ui/Card';
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
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4 sm:mb-6 animate-fade-in">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">Our Mission</span>
            </div>

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
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-100 rounded-full mb-3 sm:mb-4">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <span className="text-xs sm:text-sm font-bold text-red-600 uppercase tracking-wide">The Challenge</span>
                </div>
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
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 rounded-full mb-3 sm:mb-4">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span className="text-xs sm:text-sm font-bold text-green-600 uppercase tracking-wide">Our Solution</span>
                </div>
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
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-100 rounded-full mb-3 sm:mb-4">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" />
                  <span className="text-xs sm:text-sm font-bold text-cyan-600 uppercase tracking-wide">Our Purpose</span>
                </div>
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
                    title: 'Transparent Statistics',
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

            {/* Limitations & Ethics */}
            <Card className="bg-amber-50 border-l-4 border-amber-500">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-amber-900 mb-4">
                    {t('about.limitationsEthics')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-amber-800">
                    <div>
                      <h4 className="font-semibold mb-2">{t('about.dataLimitations')}</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• {t('about.onlyPublicReports')}</li>
                        <li>• {t('about.mayNotReflectScale')}</li>
                        <li>• {t('about.aiMayContainBias')}</li>
                        <li>• {t('about.regionalCoverageVaries')}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{t('about.ethicalStandards')}</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• {t('about.noPersonalInfo')}</li>
                        <li>• {t('about.victimPrivacy')}</li>
                        <li>• {t('about.dataForAwareness')}</li>
                        <li>• {t('about.aiPrinciples')}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                    <p className="text-sm text-amber-900">
                      <strong>{t('about.disclaimerTitle')}</strong> {t('about.disclaimerText')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
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
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full mb-4 sm:mb-6">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-300" />
              <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">Join The Movement</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 px-4">
              {t('about.joinMovement')}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-8 sm:mb-10 max-w-3xl mx-auto px-4">
              {t('about.joinMovementText')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-12 px-4">
              <Link href={localePath("/submit")}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover:scale-105 sm:hover:scale-110 transition-all">
                  {t('about.shareYourBlog')}
                </Button>
              </Link>
              <Link href={localePath("/resources")}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-blue-600 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover:scale-105 sm:hover:scale-110 transition-all">
                  {t('about.accessResources')}
                </Button>
              </Link>
              <Link href={localePath("/stats")}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-blue-600 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover:scale-105 sm:hover:scale-110 transition-all">
                  {t('about.viewStatistics')}
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 px-4">
              {[
                { icon: Users, text: 'Growing Community' },
                { icon: Shield, text: 'Privacy Protected' },
                { icon: Sparkles, text: 'Always Improving' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md rounded-xl px-4 sm:px-6 py-3 sm:py-4">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                  <span className="text-xs sm:text-sm font-semibold text-white">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}