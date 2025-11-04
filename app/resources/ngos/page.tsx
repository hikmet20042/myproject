'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Search, X, Filter, Users, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath';
import { LoadingState, ErrorState } from '@/components/shared';

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
    { value: 'Mingachevir', label: 'Mingachevir' },
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
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4 sm:mb-6 animate-fade-in">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">{t('ngos.badge') || 'Verified Organizations'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight animate-slide-up px-4">
              {t('ngos.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto mb-6 sm:mb-8 animate-fade-in px-4">
              {t('ngos.subtitle')}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 animate-scale-in px-4">
              {[
                { icon: Users, label: t('ngos.stats.registered') || 'Registered', value: `${ngos.length}+` },
                { icon: Target, label: t('ngos.stats.verified') || 'Verified', value: `${ngos.filter(n => n.status === 'approved').length}+` }
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

      {/* Search and Filters */}
      <section className="py-8 relative">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="section-padding relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('common.filterSearch')}</h2>
                  <p className="text-sm text-gray-600">{t('ngos.refineYourSearch') || 'Find the perfect NGO for you'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
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
                </div>

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

              {/* Active filters row */}
              {hasActiveFilters && (
                <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-indigo-600" />
                      {t('common.activeFilters')}:
                    </span>
                    {selectedCategory !== 'all' && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-indigo-200 text-indigo-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                        {t('filters.category')}: {getCategoryLabel(selectedCategory)}
                        <button aria-label="Clear category filter" onClick={() => setSelectedCategory('all')} className="p-1 hover:bg-indigo-100 rounded-full transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    )}
                    {selectedLocation !== 'all' && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-teal-200 text-teal-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                        {t('filters.location')}: {getLocationLabel(selectedLocation)}
                        <button aria-label="Clear location filter" onClick={() => setSelectedLocation('all')} className="p-1 hover:bg-teal-100 rounded-full transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    )}

                    {/* Clear all */}
                    <div className="ml-auto">
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory('all');
                          setSelectedLocation('all');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-indigo-300 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                        {t('common.clearAll')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                <Card key={ngo._id} className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 hover:border-indigo-300 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardContent className="p-6 relative overflow-hidden">
                    {/* Shine Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start flex-1">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600">
                              {ngo.organizationName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                              {ngo.organizationName}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              {ngo.focusAreas && ngo.focusAreas.length > 0 && (
                                <Badge variant="secondary" className="shadow-sm">
                                  {ngo.focusAreas[0]}
                                </Badge>
                              )}
                              {ngo.address && (
                                <Badge variant="secondary" className="shadow-sm">
                                  {ngo.address.split(',')[0]}
                                </Badge>
                              )}
                              {ngo.status === 'approved' && (
                                <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200 shadow-sm">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {t('ngos.verified')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed line-clamp-3">
                        {ngo.description}
                      </p>

                      <div className="space-y-2 mb-4 sm:mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        {ngo.website && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                              </svg>
                            </div>
                            <a
                              href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 hover:underline font-medium truncate"
                            >
                              {ngo.website}
                            </a>
                          </div>
                        )}
                        {ngo.contactPerson?.email && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <a href={`mailto:${ngo.contactPerson.email}`} className="text-blue-600 hover:text-blue-700 hover:underline font-medium truncate">
                              {ngo.contactPerson.email}
                            </a>
                          </div>
                        )}
                        {ngo.contactPhone && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <a href={`tel:${ngo.contactPhone}`} className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                              {ngo.contactPhone}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        {ngo.contactPerson?.email && (
                          <a href={`mailto:${ngo.contactPerson.email}`} className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
                              {t('ngos.contactNgo')}
                            </Button>
                          </a>
                        )}
                        <Link href={`/resources/ngos/${ngo._id}`}>
                          <Button variant="secondary" className="font-bold hover:scale-105 transition-all duration-300 border-2 border-indigo-300 hover:border-indigo-500">
                            {t('ngos.viewProfile')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
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
            <Link href={localePath("/auth/register?type=ngo")}>
              <Button className="inline-flex items-center bg-white text-indigo-700 hover:bg-yellow-300 hover:text-indigo-900 font-bold shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                {t('ngos.registerButton')}
                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}