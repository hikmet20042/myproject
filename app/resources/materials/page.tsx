'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardContent } from '@/components/ui/Card';
import { ExternalLink, BookOpen, Sparkles, Target, Filter, Search, FileText } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatedBackground, LoadingState, ErrorState } from '@/components/shared';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Material {
  _id: string;
  title: string;
  description: string;
  category: 'toolkit' | 'course' | 'video' | 'guide' | 'document' | 'emergency' | 'other';
  type: string;
  url: string;
  imageUrl?: string;
  provider?: string;
  duration?: string;
  language?: string[];
  tags?: string[];
  featured?: boolean;
  views?: number;
}

export default function Resources() {
  const { t } = useLanguage();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/materials?limit=100');
      const data = await response.json();
      
      if (response.ok) {
        setMaterials(data.materials || []);
      } else {
        setError(data.error || 'Failed to load materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      setError('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.provider?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Group materials by category
  const groupedMaterials = {
    toolkit: filteredMaterials.filter(m => m.category === 'toolkit'),
    course: filteredMaterials.filter(m => m.category === 'course'),
    video: filteredMaterials.filter(m => m.category === 'video'),
    guide: filteredMaterials.filter(m => m.category === 'guide'),
    emergency: filteredMaterials.filter(m => m.category === 'emergency'),
    other: filteredMaterials.filter(m => m.category === 'other')
  };

  const categories = [
    { value: 'all', label: t('common.all') || 'All' },
    { value: 'toolkit', label: t('resources.materials.categories.toolkit') || 'Toolkits' },
    { value: 'course', label: t('resources.materials.categories.course') || 'Courses' },
    { value: 'video', label: t('resources.materials.categories.video') || 'Videos' },
    { value: 'guide', label: t('resources.materials.categories.guide') || 'Guides' },
    { value: 'emergency', label: t('resources.materials.categories.emergency') || 'Emergency Resources' },
    { value: 'other', label: t('resources.materials.categories.other') || 'Other' }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'toolkit': return '🛠️';
      case 'course': return '🎓';
      case 'video': return '🎥';
      case 'guide': return '📖';
      case 'emergency': return '🚨';
      default: return '📚';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'toolkit': return 'from-blue-500 to-blue-700';
      case 'course': return 'from-green-500 to-green-700';
      case 'video': return 'from-red-500 to-red-700';
      case 'guide': return 'from-purple-500 to-purple-700';
      case 'emergency': return 'from-orange-500 to-orange-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getBorderColor = (category: string) => {
    switch (category) {
      case 'toolkit': return 'hover:border-blue-300';
      case 'course': return 'hover:border-green-300';
      case 'video': return 'hover:border-red-300';
      case 'guide': return 'hover:border-purple-300';
      case 'emergency': return 'hover:border-orange-300';
      default: return 'hover:border-gray-300';
    }
  };

  if (loading) {
    return <LoadingState text={t('common.loading') || 'Loading materials...'} gradientFrom="from-blue-500" gradientVia="via-indigo-500" gradientTo="to-purple-500" />;
  }

  if (error) {
    return (
      <ErrorState 
        title={t('resources.materials.errorTitle') || 'Error Loading Materials'}
        message={error}
        retryText={t('common.tryAgain') || 'Try Again'}
        onRetry={fetchMaterials}
      />
    );
  }

  return (
  <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Header */}
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
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4 sm:mb-6 animate-fade-in">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">{t('resources.categories.educationalMaterials.badge') || 'Educational Resources'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight animate-slide-up px-4">
              {t('resources.categories.educationalMaterials.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto mb-6 sm:mb-8 animate-fade-in px-4">
              {t('resources.categories.educationalMaterials.description')}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 animate-scale-in px-4">
              {[
                { icon: BookOpen, label: t('resources.materials.stats.guides') || 'Guides', value: '50+' },
                { icon: Sparkles, label: t('resources.materials.stats.courses') || 'Courses', value: '25+' },
                { icon: Target, label: t('resources.materials.stats.videos') || 'Videos', value: '100+' }
              ].map((stat, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 sm:hover:scale-110 w-full sm:w-auto"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-lg sm:text-xl font-black">{stat.value}</div>
                    <div className="text-xs text-white/80">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* Main Resources */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-100 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>

        <div className="section-padding relative z-10">
          <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
            
            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 p-6 sm:p-8 backdrop-blur-sm animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('common.filterSearch') || 'Filter & Search'}</h2>
                  <p className="text-sm text-gray-600">{t('resources.materials.filterDescription') || 'Find the perfect learning resource'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div>
                  <Input
                    type="text"
                    label={t('common.search') || 'Search'}
                    placeholder={t('resources.materials.searchPlaceholder') || 'Search materials...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={Search}
                    iconPosition="left"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <Select
                    label={t('filters.category') || 'Category'}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    options={categories}
                  />
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-4 text-sm text-gray-600">
                {t('resources.materials.showingResults', { count: filteredMaterials.length, total: materials.length }) || 
                  `Showing ${filteredMaterials.length} of ${materials.length} materials`}
              </div>
            </div>

            {/* Materials by Category */}
            {Object.entries(groupedMaterials).map(([category, categoryMaterials]) => {
              if (categoryMaterials.length === 0) return null;
              
              const categoryTitle = categories.find(c => c.value === category)?.label || category;
              
              return (
                <div key={category} className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${getCategoryColor(category)} flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl">{getCategoryIcon(category)}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">
                        {categoryTitle}
                      </h2>
                      <p className="text-sm text-gray-600">{categoryMaterials.length} {t('resources.materials.items') || 'items'}</p>
                    </div>
                  </div>
                  
                  <div className={`grid grid-cols-1 ${categoryMaterials.length > 1 ? 'md:grid-cols-2' : ''} ${categoryMaterials.length > 2 ? 'lg:grid-cols-3' : ''} gap-6`}>
                    {categoryMaterials.map((material, index) => (
                      <Card key={material._id} className={`group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 ${getBorderColor(category)}`}>
                        <CardContent className="relative overflow-hidden">
                          {/* Shine Effect */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          </div>
                          
                          <div className="relative z-10">
                            {/* Header with Icon/Image */}
                            <div className="flex items-start mb-4">
                              {material.imageUrl ? (
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden mr-4 flex-shrink-0 shadow-md">
                                  <Image 
                                    src={material.imageUrl} 
                                    alt={material.provider || material.title} 
                                    width={56} 
                                    height={56} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${getCategoryColor(category)} rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                                </div>
                              )}
                              <div className="flex-1">
                                <Badge variant="primary" className="mb-2 shadow-sm">
                                  {material.type}
                                </Badge>
                                {material.provider && (
                                  <p className="text-xs text-gray-600">{material.provider}</p>
                                )}
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {material.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed line-clamp-3">
                              {material.description}
                            </p>

                            {/* Meta Info */}
                            {(material.duration || material.views) && (
                              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-4">
                                {material.duration && <span>{material.duration}</span>}
                                {material.views && <span>{material.views} {t('common.views') || 'views'}</span>}
                              </div>
                            )}

                            {/* Tags */}
                            {material.tags && material.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {material.tags.slice(0, 3).map((tag, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* CTA Button */}
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full block"
                            >
                              <Button 
                                variant="primary" 
                                icon={ExternalLink} 
                                className="w-full justify-center group-hover:scale-105 transition-transform duration-300"
                              >
                                {t('resources.materials.viewResource') || 'View Resource'}
                              </Button>
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* No Results */}
            {filteredMaterials.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('resources.materials.noMaterialsFound') || 'No materials found'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('resources.materials.tryDifferentFilters') || 'Try adjusting your search or filters'}
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  variant="primary"
                >
                  {t('common.clearFilters') || 'Clear Filters'}
                </Button>
              </div>
            )}

            {/* Dynamic Material Categories */}
            {Object.entries(groupedMaterials).map(([category, materials]) => (
              <div key={category} className="animate-fade-in animation-delay-200 mb-12">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getCategoryIcon(category)} />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 capitalize">
                    {category}s
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                  {materials.map((material) => (
                    <Card 
                      key={material._id} 
                      className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 hover:border-blue-300"
                    >
                      <CardContent className="relative overflow-hidden">
                        {/* Shine Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>
                        
                        <div className="relative z-10">
                          <div className="flex items-start mb-4">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${getCategoryColor(material.category)} rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getCategoryIcon(material.category)} />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {material.title}
                              </h3>
                              <Badge variant="primary" className="mb-3 shadow-sm capitalize">
                                {material.type || material.category}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed line-clamp-3">
                            {material.description}
                          </p>
                          {material.provider && (
                            <p className="text-xs sm:text-sm text-gray-500 mb-2">
                              Provider: {material.provider}
                            </p>
                          )}
                          {material.duration && (
                            <p className="text-xs sm:text-sm text-gray-500 mb-4">
                              Duration: {material.duration}
                            </p>
                          )}
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="primary" icon={ExternalLink} className="group-hover:scale-105 transition-transform duration-300 w-full">
                              View Resource
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 relative overflow-hidden">
        <AnimatedBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center text-white">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6">
              {t('resources.materials.cta.title')}
            </h2>
            <p className="text-lg sm:text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
              {t('resources.materials.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="/submit">
                <Button 
                  variant="primary" 
                  icon={FileText}
                  className="bg-white text-purple-600 hover:bg-purple-50 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-lg"
                >
                  {t('resources.materials.cta.submitResource')}
                </Button>
              </a>
              <a href="/resources">
                <Button 
                  variant="secondary"
                  className="bg-purple-500 hover:bg-purple-400 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-lg"
                >
                  {t('resources.materials.cta.exploreMore')}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
