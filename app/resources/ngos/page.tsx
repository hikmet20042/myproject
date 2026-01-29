'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, ButtonLink } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Search, X, Users, Target, MapPin, ExternalLink, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath';
import { LoadingState, ErrorState, ResourceFilterContainer, ActiveFilterBadges } from '@/components/shared';

interface NGO {
  _id: string
  organizationName: string
  description: string
  focusAreas: string[]
  address?: string
  website?: string
  contactPhone?: string
  registrationNumber?: string
  status: 'pending' | 'approved' | 'rejected'
  contactPerson: {
    name: string
    email: string
    phone?: string
    position?: string
  }
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
    website?: string
  }
  approvedBy?: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export default function NGOsPage() {
  const { t } = useLanguage();
  const localePath = useLocalizedPath();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getFocusAreaLabel = (value: string) => {
    if (!value) {
      return value;
    }

    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, char: string) => char.toUpperCase());
    const translationKey = `auth.focusAreas_${normalized}`;
    const translated = t(translationKey);

    return translated === translationKey ? value : translated;
  };

  // Fetch NGOs from API
  useEffect(() => {
    const fetchNGOs = async () => {
      try {
        setLoading(true)
        // Request a larger page size to show more NGOs on the directory
        const response = await fetch('/api/ngos?limit=100')
        if (!response.ok) {
          throw new Error('Failed to fetch NGOs')
        }
        const data = await response.json()
        setNgos(data.ngos || [])
      } catch (err) {
        console.error('Error fetching NGOs:', err)
        setError(t('ngos.errorLoading'))
      } finally {
        setLoading(false)
      }
    }

    fetchNGOs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categories = [
    { value: 'all', label: t('filters.allCategories') },
    { value: 'Human Rights', label: t('auth.focusAreas_humanRights') },
    { value: 'Women Rights', label: t('auth.focusAreas_womenRights') },
    { value: 'Youth Development', label: t('auth.focusAreas_youthDevelopment') },
    { value: 'Education', label: t('auth.focusAreas_education') },
    { value: 'Environment', label: t('auth.focusAreas_environment') },
    { value: 'Healthcare', label: t('auth.focusAreas_healthcare') }
  ];

  const locations = [
    { value: 'all', label: t('filters.allLocations') },
    { value: 'Baku', label: t('charts.regions.baku') },
    { value: 'Ganja', label: t('charts.regions.ganja') },
    { value: 'Sumgayit', label: t('charts.regions.sumqayit') },
    { value: 'Mingachevir', label: t('charts.regions.mingachevir') },
    { value: 'Other', label: t('charts.regions.otherRegions') }
  ];

  const getCategoryLabel = (val: string) => categories.find(c => c.value === val)?.label || val;
  const getLocationLabel = (val: string) => locations.find(l => l.value === val)?.label || val;

  const filteredNGOs = ngos.filter(ngo => {
    const matchesSearch = ngo.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ngo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           (ngo.focusAreas && ngo.focusAreas.some(area => area === selectedCategory));
    const matchesLocation = selectedLocation === 'all' || 
                           (ngo.address && ngo.address.toLowerCase().includes(selectedLocation.toLowerCase()));
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Determine if any filters are active (used to control empty-state actions)
  const hasActiveFilters =
    searchTerm.trim() !== '' || selectedCategory !== 'all' || selectedLocation !== 'all';

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

  if (error) {
    return (
      <ErrorState 
        title={t('ngos.errorLoading') || 'Error Loading NGOs'}
        message={error}
        retryText={t('common.tryAgain')}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-900 text-white py-16 sm:py-20 lg:py-24">
        {/* Animated Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

        <div className="section-padding relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight animate-slide-up px-4">
              {t('ngos.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto animate-fade-in px-4">
              {t('ngos.subtitle')}
            </p>
          </div>
        </div>

      </section>

      {/* Search and Filters - Standardized Design */}
      <section className="py-8 relative">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="section-padding relative z-10">
          <div className="max-w-6xl mx-auto">
            <ResourceFilterContainer
              title={t('common.filterSearch')}
              subtitle={t('ngos.refineYourSearch')}
              iconGradient="from-indigo-600 to-purple-600"
              borderColor="border-indigo-100"
              searchInput={
                <Input
                  type="text"
                  id="search"
                  label={t('common.search')}
                  placeholder={t('ngos.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                  iconPosition="left"
                  inputSize="md"
                />
              }
              filterControls={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Category Filter */}
                  <div>
                    <Select
                      label={t('filters.category')}
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      options={categories}
                      placeholder={t('filters.allCategories')}
                      selectSize="md"
                    />
                  </div>

                  {/* Location Filter */}
                  <div>
                    <Select
                      label={t('filters.location')}
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      options={locations}
                      placeholder={t('filters.allLocations')}
                      selectSize="md"
                    />
                  </div>
                </div>
              }
              activeFilters={
                hasActiveFilters ? (
                  <ActiveFilterBadges
                    badges={[
                      ...(selectedCategory !== 'all' ? [{
                        id: 'category',
                        label: t('filters.category'),
                        value: getCategoryLabel(selectedCategory),
                        onRemove: () => setSelectedCategory('all'),
                        colorScheme: 'indigo' as const,
                      }] : []),
                      ...(selectedLocation !== 'all' ? [{
                        id: 'location',
                        label: t('filters.location'),
                        value: getLocationLabel(selectedLocation),
                        onRemove: () => setSelectedLocation('all'),
                        colorScheme: 'teal' as const,
                      }] : []),
                    ]}
                    onClearAll={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedLocation('all');
                    }}
                  />
                ) : undefined
              }
            />
          </div>
        </div>
      </section>

      {/* NGO Listings */}
      <section className="py-12 sm:py-16 relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-100 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        
        <div className="section-padding relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Results Count */}
            <div className="mb-6 sm:mb-8 flex items-center justify-between px-4 sm:px-0">
              <p className="text-gray-600 font-medium">
                {t('ngos.showingResults', { count: filteredNGOs.length, total: ngos.length })}
              </p>
            </div>

            {/* NGO Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {filteredNGOs.map((ngo, index) => (
                <article key={ngo._id} className="group relative bg-gradient-to-br from-white to-indigo-50/50 rounded-2xl p-6 border-2 border-gray-200 hover:border-indigo-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in overflow-hidden" style={{ animationDelay: `${index * 0.05}s` }}>
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-600/0 group-hover:from-indigo-500/5 group-hover:to-purple-600/5 transition-all duration-500 rounded-2xl"></div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                  
                  <div className="relative z-10">
                    {/* Icon & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                        <span className="text-2xl font-black text-white">
                          {ngo.organizationName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {ngo.status === 'approved' && (
                        <span className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded-full font-bold shadow-sm whitespace-nowrap flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t('ngos.verified')}
                        </span>
                      )}
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                      {ngo.organizationName}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                      {ngo.description}
                    </p>
                    
                    {/* Tags/Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      {ngo.focusAreas && ngo.focusAreas.length > 0 && (
                        <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-semibold">
                          {getFocusAreaLabel(ngo.focusAreas[0]) || ngo.focusAreas[0]}
                        </span>
                      )}
                      {ngo.address && (
                        <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ngo.address.split(',')[0]}
                        </span>
                      )}
                    </div>

                    {/* Meta Information */}
                    <div className="flex flex-col gap-2 mb-4 text-sm">
                      {ngo.website && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <ExternalLink className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          <a
                            href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline font-medium truncate text-xs"
                          >
                            {ngo.website}
                          </a>
                        </div>
                      )}
                      {ngo.contactPerson?.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          <a href={`mailto:${ngo.contactPerson.email}`} className="text-indigo-600 hover:underline font-medium truncate text-xs">
                            {ngo.contactPerson.email}
                          </a>
                        </div>
                      )}
                      {ngo.contactPhone && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs">{ngo.contactPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-200 group-hover:border-indigo-200 transition-colors">
                      <div className="flex gap-2">
                        <ButtonLink 
                          href={localePath(`/resources/ngos/${ngo._id}`)}
                          variant="outline"
                          size="sm"
                          hoverEffect="scale"
                          className="flex-1 text-center justify-center"
                        >
                          {t('ngos.viewProfile')}
                        </ButtonLink>
                        {ngo.contactPerson?.email && (
                          <ButtonLink 
                            href={`mailto:${ngo.contactPerson.email}`}
                            variant="gradient-indigo"
                            size="sm"
                            className="flex-1 text-center justify-center"
                            hoverEffect="scale"
                          >
                            {t('ngos.contactNgo')}
                          </ButtonLink>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredNGOs.length === 0 && (
              <div className="text-center py-12 sm:py-16 animate-fade-in">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('ngos.noNgosFound')}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {t('ngos.noNgosMessage')}
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedLocation('all');
                    }}
                    variant="gradient-indigo"
                    shadow="lg"
                    hoverEffect="scale"
                  >
                    {t('common.clearFilters')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Register as NGO Section */}
      <section className="py-12 sm:py-16 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700">
        {/* Animated Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="section-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 sm:mb-6">
              {t('ngos.registerCta')}
            </h2>
            <p className="text-base sm:text-xl text-white/95 mb-6 sm:mb-8 leading-relaxed px-4">
              {t('ngos.registerText')}
            </p>
            <ButtonLink 
              href={localePath("/auth/register?type=ngo")}
              variant="white-on-dark"
              size="lg"
              shadow="xl"
              hoverEffect="scale"
            >
              {t('ngos.registerButton')}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
