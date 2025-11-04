'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button, Card, CardContent } from '@/components/ui'
import RecentCommunityContent from '@/components/RecentCommunityContent'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { 
  Briefcase, 
  Calendar, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Heart,
  MessageSquare,
  Award,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle
} from 'lucide-react'





interface Filters {
  search: string;
  tags: string[];
  source: string;
}

export default function HomePage() {
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    tags: [],
    source: ''
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const localePath = useLocalizedPath()
  const [searchDebounce, setSearchDebounce] = useState('');
  // Skip initial legacy fetch on first load to avoid double /api/news calls
  const [hasInitialLoaded, setHasInitialLoaded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const limit = 10;

  // Ensure component is mounted before making API calls
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => ({
    search: filters.search,
    tags: filters.tags,
    source: filters.source
  }), [filters.search, filters.tags, filters.source]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchDebounce }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchDebounce]);

  // ...removed useEffect that resets page on filters change...

  

  // Fetch available tags and sources for filtering
  const fetchFilterOptions = useCallback(() => {
    // For now, using hardcoded values. Can be replaced with API calls later
    setAvailableTags([
      'gender-equality', 'women-rights', 'workplace', 'education', 
      'policy', 'legislation', 'violence', 'discrimination', 
      'empowerment', 'leadership', 'healthcare', 'economy'
    ]);
    
    setAvailableSources(['apa.az', 'qafqazinfo.az', 'oxu.az']);
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Initial legacy fetch was removed; homepage no longer renders this list.

  // Subsequent fetches when filters or page change (only after initial load and mounting)
  useEffect(() => {
    if (!mounted || !hasInitialLoaded || (currentPage === 1 && !memoizedFilters.search && memoizedFilters.tags.length === 0 && !memoizedFilters.source)) {
      return;
    }
      
      
  }, [mounted, hasInitialLoaded, currentPage, memoizedFilters, limit]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchDebounce(value);
  };

  const handleTagToggle = (tag: string) => {
    setCurrentPage(1);
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSourceChange = (source: string) => {
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, source }));
  };

  const clearAllFilters = () => {
    setCurrentPage(1);
    setSearchDebounce('');
    setFilters({
      search: '',
      tags: [],
      source: ''
    });
  };

  const hasActiveFilters = filters.search || filters.tags.length > 0 || filters.source;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - Modern Gradient with Animation */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative section-padding py-24 lg:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium">Platform for Youth Empowerment</span>
              </div>

              {/* Main Heading with Gradient */}
              <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 leading-tight animate-slide-up">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
                  {t('home.heroTitle')}
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl mb-10 text-blue-100 leading-relaxed max-w-3xl mx-auto animate-slide-up animation-delay-200">
                {t('home.heroSubtitle')}
              </p>

              {/* CTA Buttons - Improved with Icons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animation-delay-400">
                <Link href={localePath("/resources")}>
                  <Button 
                    variant="secondary" 
                    size="lg"
                    className="group hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl bg-white text-blue-700 hover:bg-blue-50"
                  >
                    <Target className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    {t('home.discoverOpportunities')}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href={localePath("/blogs")}>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="group hover:scale-105 transition-all duration-300 border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    <BookOpen className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    {t('home.communityStories')}
                  </Button>
                </Link>
                <Link href={localePath("/submit/blog/step1")}>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="group hover:scale-105 transition-all duration-300 border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    <MessageSquare className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    {t('home.shareExperience')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Section - More Engaging */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in animation-delay-600">
              {[
                { icon: Users, label: 'Community Members', value: '1,000+', color: 'from-blue-400 to-blue-600' },
                { icon: Briefcase, label: 'Opportunities', value: '50+', color: 'from-purple-400 to-purple-600' },
                { icon: Calendar, label: 'Events', value: '30+', color: 'from-pink-400 to-pink-600' },
                { icon: BookOpen, label: 'Blogs', value: '100+', color: 'from-indigo-400 to-indigo-600' }
              ].map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-blue-100">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        
      </section>

      {/* Mission Statement - Redesigned */}
      <section className="py-24 bg-white">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 mb-4">
                <Heart className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Our Mission</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('home.ourMission')}
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t('home.missionText1')}
              </p>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mt-4">
                {t('home.missionText2')}
              </p>
            </div>

            {/* Feature Cards - Modern Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Briefcase,
                  title: t('home.transparentInfo'),
                  description: t('home.transparentInfoText'),
                  color: 'from-blue-500 to-blue-600',
                  bgColor: 'bg-blue-50',
                  borderColor: 'border-blue-200'
                },
                {
                  icon: TrendingUp,
                  title: t('home.learningDevelopment'),
                  description: t('home.learningDevelopmentText'),
                  color: 'from-purple-500 to-purple-600',
                  bgColor: 'bg-purple-50',
                  borderColor: 'border-purple-200'
                },
                {
                  icon: Users,
                  title: t('home.communitySharing'),
                  description: t('home.communitySharingText'),
                  color: 'from-pink-500 to-pink-600',
                  bgColor: 'bg-pink-50',
                  borderColor: 'border-pink-200'
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className={`group relative bg-white rounded-2xl p-8 border-2 ${feature.borderColor} hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden`}
                >
                  {/* Background Gradient on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Learn More Link */}
                    <div className="mt-6 flex items-center text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="mr-2">Learn more</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Key Benefits Section */}
            <div className="mt-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-10 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">What You Can Do on icma360</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: CheckCircle, text: 'Access verified opportunities from local and international NGOs' },
                  { icon: CheckCircle, text: 'Connect with a supportive community of changemakers' },
                  { icon: CheckCircle, text: 'Share your personal experiences and inspire others' },
                  { icon: CheckCircle, text: 'Learn through free training materials and courses' },
                  { icon: CheckCircle, text: 'Discover events, workshops, and networking opportunities' },
                  { icon: CheckCircle, text: 'Build your skills and advance your career in social justice' }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 group">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <benefit.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                      {benefit.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {mounted && <RecentCommunityContent />}

      {/* Call to Action - Enhanced Design */}
      <section className="relative py-24 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        
        <div className="relative section-padding">
          <div className="max-w-4xl mx-auto text-center">
            {/* Icon Badge */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6 animate-bounce-slow">
              <Award className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              {t('home.joinMakeDifference')}
            </h2>
            <p className="text-xl text-white/90 mb-4 leading-relaxed">
              {t('home.joinText1')}
            </p>
            <p className="text-xl text-white/90 mb-10 leading-relaxed">
              {t('home.joinText2')}
            </p>

            {/* CTA Buttons with Enhanced Styling */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={localePath("/resources")}>
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="group bg-white text-blue-700 hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-2xl"
                >
                  <Target className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  {t('home.discoverOpportunities')}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href={localePath("/submit/blog/step1")}>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="group border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm hover:scale-105 transition-all duration-300"
                >
                  <MessageSquare className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  {t('home.shareExperience')}
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white"></div>
                </div>
                <span>1,000+ Members</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Verified Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-300" />
                <span>Community Driven</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer - Refined */}
      <section className="bg-gray-50 py-8 border-t border-gray-200">
        <div className="section-padding">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{t('common.note')}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t('home.disclaimer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
