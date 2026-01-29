'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button, ButtonLink } from '@/components/ui';
import { ExternalLink, BookOpen, Sparkles, Target, Search, FileText, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalizedPath } from '@/lib/useLocalizedPath';
import { LoadingState, ErrorState, ResourceFilterContainer } from '@/components/shared';
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
  const localePath = useLocalizedPath();
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
    return (
      <LoadingState 
        text={t('common.loading')}
        gradientFrom="from-indigo-50"
        gradientVia="via-purple-50"
        gradientTo="to-pink-50"
        spinnerColor="border-indigo-600"
      />
    );
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
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-700 to-pink-900 text-white py-16 sm:py-20 lg:py-24">
        {/* Animated Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

        <div className="section-padding relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight animate-slide-up px-4">
              {t('resources.categories.educationalMaterials.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto animate-fade-in px-4">
              {t('resources.categories.educationalMaterials.description')}
            </p>
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
            
            {/* Search and Filters - Standardized Design */}
            <ResourceFilterContainer
              title={t('common.filterSearch') || 'Filter & Search'}
              subtitle={t('resources.materials.filterDescription') || 'Find the perfect learning resource'}
              iconGradient="from-indigo-600 to-purple-600"
              borderColor="border-indigo-100"
              searchInput={
                <div className="space-y-4">
                  <Input
                    type="text"
                    label={t('common.search') || 'Search'}
                    placeholder={t('resources.materials.searchPlaceholder') || 'Search materials...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={Search}
                    iconPosition="left"
                  />
                  {/* Results Count */}
                  <div className="text-sm text-gray-600">
                    {t('resources.materials.showingResults', { count: filteredMaterials.length, total: materials.length}) || 
                      `Showing ${filteredMaterials.length} of ${materials.length} materials`}
                  </div>
                </div>
              }
              filterControls={
                <div className="mt-4">
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
              }
            />

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
                      <article 
                        key={material._id} 
                        className={`group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/50 rounded-2xl border-2 border-gray-200 hover:border-purple-500 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}
                      >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-transparent to-pink-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>

                        <div className="relative z-10">
                          {/* Icon Section */}
                          {material.imageUrl ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                              <Image 
                                src={material.imageUrl} 
                                alt={material.provider || material.title} 
                                width={56} 
                                height={56} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          ) : (
                            <div className={`w-14 h-14 bg-gradient-to-br ${getCategoryColor(category)} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                              <span className="text-2xl">{getCategoryIcon(category)}</span>
                            </div>
                          )}

                          {/* Type Badge */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg">
                              {material.type}
                            </span>
                            {material.provider && (
                              <span className="text-xs text-gray-500">{material.provider}</span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                            {material.title}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3">
                            {material.description}
                          </p>

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

                          {/* Meta Info */}
                          {(material.duration || material.views) && (
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-200">
                              {material.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{material.duration}</span>
                                </div>
                              )}
                              {material.views && (
                                <div className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  <span>{material.views}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* CTA Button */}
                          <div className="pt-4 border-t border-gray-200">
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
                        </div>
                      </article>
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
                    <article
                      key={material._id} 
                      className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/50 rounded-2xl border-2 border-gray-200 hover:border-purple-500 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
                    >
                      {/* Shine Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </div>

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-transparent to-pink-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                        
                      <div className="relative z-10">
                        {/* Icon Section */}
                        <div className={`w-14 h-14 bg-gradient-to-br ${getCategoryColor(material.category)} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getCategoryIcon(material.category)} />
                          </svg>
                        </div>

                        {/* Type Badge */}
                        <div className="mb-3">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg capitalize">
                            {material.type || material.category}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                          {material.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3">
                          {material.description}
                        </p>

                        {/* Meta Info */}
                        {(material.provider || material.duration) && (
                          <div className="space-y-1 mb-4 text-sm text-gray-500">
                            {material.provider && (
                              <p>Provider: {material.provider}</p>
                            )}
                            {material.duration && (
                              <p>Duration: {material.duration}</p>
                            )}
                          </div>
                        )}

                        {/* CTA Button */}
                        <div className="pt-4 border-t border-gray-200">
                          <ButtonLink
                            href={material.url}
                            variant="primary"
                            icon={ExternalLink}
                            iconPosition="left"
                            className="w-full"
                            hoverEffect="scale"
                            external
                          >
                            View Resource
                          </ButtonLink>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 relative overflow-hidden">
        {/* Animated Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center text-white">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6">
              {t('resources.materials.cta.title')}
            </h2>
            <p className="text-lg sm:text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
              {t('resources.materials.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ButtonLink
                href={localePath('/submit')}
                variant="white-on-dark"
                size="lg"
                icon={FileText}
                iconPosition="left"
                shadow="xl"
                hoverEffect="lift"
                className="px-8 py-6 text-lg"
              >
                {t('resources.materials.cta.submitResource')}
              </ButtonLink>
              <ButtonLink
                href={localePath('/resources')}
                variant="gradient-purple"
                size="lg"
                shadow="xl"
                hoverEffect="lift"
                className="px-8 py-6 text-lg"
              >
                {t('resources.materials.cta.exploreMore')}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
