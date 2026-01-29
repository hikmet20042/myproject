'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import BlogCard from '../../components/BlogCard'
import { Button, ButtonLink, SearchBar } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import { AnimatedBackground, LoadingState } from '@/components/shared'
import { BookOpen, Sparkles, Search, RefreshCw, MessageSquare, Heart, ArrowRight, Users } from 'lucide-react'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

interface CommunityBlog {
  id: number;
  title: string;
  authorName: string;
  date: string;
  excerpt: string;
  content: any; // Can be string or BlockNote array
  status: string;
  type: 'community-blog';
}

const generateExcerpt = (content: any): string => {
  let textContent = '';
  
  if (typeof content === 'string') {
    textContent = content;
  } else if (Array.isArray(content)) {
    // Handle BlockNote content array
    textContent = content
      .map((block: any) => {
        if (block.content && Array.isArray(block.content)) {
          return block.content
            .map((item: any) => item.text || '')
            .join('');
        }
        return '';
      })
      .join(' ')
      .trim();
  }
  
  const words = textContent.split(' ');
  if (words.length <= 30) {
    return textContent;
  }
  return words.slice(0, 30).join(' ') + '...';
}

export default function CommunityBlogs() {
  const { t } = useLanguage();
  const localePath = useLocalizedPath();
  const { data: session } = useSession()
  const [allBlogs, setAllBlogs] = useState<CommunityBlog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Load all blogs once
  const loadAllBlogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100'
      });
      
      const response = await fetch(`/api/blogs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // Map MongoDB blogs to CommunityBlog interface
        const publishedBlogs = (data.results || []).filter((blog: any) => blog.status === 'approved');
        setAllBlogs(publishedBlogs.map((blog: any) => ({
          id: blog._id || blog.id,
          title: blog.title,
          authorName: blog.authorName,
          date: blog.createdAt || blog.submittedAt || blog.date || new Date().toISOString(),
          excerpt: blog.excerpt || generateExcerpt(blog.content),
          content: blog.content,
          status: blog.status,
          type: 'community-blog'
        })));
      } else {
        setAllBlogs([]);
      }
    } catch (error) {
      console.error('Failed to load community blogs:', error);
      setAllBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all blogs on component mount
  useEffect(() => {
    loadAllBlogs();
  }, [loadAllBlogs]);

  // Client-side filtering based on search only
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const filteredBlogs = allBlogs.filter(blog => {
    const matchesSearch = !searchQuery || 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof blog.content === 'string' && blog.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <LoadingState 
        text={t('common.loading')}
        gradientFrom="from-indigo-50"
        gradientVia="via-purple-50"
        gradientTo="to-pink-50"
        spinnerColor="border-indigo-600"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Engaging Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 text-white py-16 sm:py-20 lg:py-24">
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
              {t('blogs.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto animate-fade-in px-4 font-light">
              {t('blogs.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section - Enhanced */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {/* Background Decoration */}
        <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-100 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="section-padding relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Info Banner */}
            {allBlogs.length > 0 && allBlogs.some(blog => blog.status === 'pending') && (
              <div className="mb-6 sm:mb-8 animate-fade-in">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 sm:p-6 rounded-r-xl shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-blue-900 mb-1">{t('blogs.showingYourBlogs')}</h3>
                      <p className="text-xs sm:text-sm text-blue-800">{t('blogs.showingYourBlogsText')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter & Search Section - Enhanced */}
            <div className="mb-8 sm:mb-12">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 mb-6">
                {/* Section Header */}
                <div className="space-y-1 sm:space-y-2">
                  
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                    {t('blogs.communityBlogs')}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">{t('messages.discover_inspiring_voices_from_our_community')}</p>
                </div>

                {/* Refresh Button */}
                <Button
                  onClick={() => loadAllBlogs()}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="group border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base whitespace-nowrap w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      {t('blogs.refreshing')}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                      {t('blogs.refreshBlogs')}
                    </>
                  )}
                </Button>
              </div>
              
              {/* Enhanced Search Bar */}
              <div className="relative animate-scale-in">
                <SearchBar
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                  placeholder={t('blogs.searchPlaceholder')}
                  value={searchQuery}
                  storageKey="blogs-search"
                />
                {searchQuery && (
                  <div className="mt-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <span className="text-gray-700">
                      {t('blogs.searchSummary', {
                        query: searchQuery,
                        count: filteredBlogs.length,
                        label: filteredBlogs.length === 1 ? t('blogs.resultSingular') : t('blogs.resultPlural')
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Blogs Grid - Enhanced */}
            {filteredBlogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredBlogs.map((blog, idx) => (
                  <div 
                    key={blog.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <BlogCard blog={blog} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 animate-fade-in">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    {searchQuery ? (
                      <Search className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
                    ) : (
                      <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
                    )}
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 sm:mb-3">{t('blogs.noBlogsFound')}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
                  {searchQuery
                    ? t('blogs.noBlogsFoundSearch', { query: searchQuery })
                    : t('blogs.noBlogsAvailable')
                  }
                </p>
                {searchQuery && (
                  <Button
                    onClick={handleClearSearch}
                    size="lg"
                    className="group font-bold hover:scale-105 transition-all duration-300"
                  >
                    <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                    {t('blogs.viewAllBlogs')}
                  </Button>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Call to Action - Enhanced & Engaging */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"></div>
        
        {/* Animated Blobs */}
        <AnimatedBackground
          colors={{
            blob1: 'bg-yellow-400',
            blob2: 'bg-pink-400',
            blob3: 'bg-transparent'
          }}
          opacity={30}
        />

        <div className="section-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Floating Icon */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-300 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 shadow-2xl animate-float">
                  <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 sm:mb-4 leading-tight px-4">
                {t('blogs.shareYourBlog')}
              </h3>
              <p className="text-base sm:text-lg lg:text-xl text-white/95 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto px-4 font-light">
                {t('blogs.shareYourBlogText')}
              </p>
              
              {/* Stats Pills */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 px-4">
                {[ 
                  { icon: Heart, text: t('blogs.ctaShareJourney') },
                  { icon: Users, text: t('blogs.ctaInspireOthers') },
                  { icon: Sparkles, text: t('blogs.ctaMakeImpact') }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full border border-white/20 hover:bg-white/25 transition-all duration-300 hover:scale-105 w-full sm:w-auto animate-scale-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <ButtonLink 
                  href={localePath("/submit/blog/step1")}
                  variant="white-on-dark"
                  size="lg"
                  icon={Sparkles}
                  iconPosition="left"
                  shadow="xl"
                  hoverEffect="scale"
                  className="w-full sm:w-auto"
                >
                  {t('blogs.submitYourBlog')}
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>

        
      </section>
    </div>
  )
}
