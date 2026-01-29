'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Users, ExternalLink, Clock, Tag, Search, X } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useLanguage } from '@/contexts/LanguageContext';
import SaveButton from '@/components/SaveButton';
import { useLocalizedPath } from '@/lib/useLocalizedPath';
import { LoadingState, ErrorState, ResourceFilterContainer, ActiveFilterBadges } from '@/components/shared';

interface Event {
  _id: string
  title: string
  description: string
  category: string
  eventType: 'event' | 'training' | 'workshop' | 'conference' | 'seminar'
  eventDate: string
  endDate?: string
  location: {
    type: 'online' | 'physical' | 'hybrid'
    address?: string
    city?: string
    country?: string
    onlineLink?: string
  }
  applicationLink?: string
  applicationDeadline?: string
  maxParticipants?: number
  currentParticipants: number
  tags: string[]
  imageUrl?: string
  createdBy: {
    _id: string
    name: string
  }
  organizationName?: string
  isApproved: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
  views?: number
  // Training-specific fields
  duration?: string
  schedule?: {
    startTime: string
    endTime: string
    timezone?: string
  }
  prerequisites?: string[]
  learningOutcomes?: string[]
  certification?: {
    provided: boolean
    type?: string
    accreditedBy?: string
  }
  cost?: {
    isFree: boolean
    amount?: number
    currency?: string
    scholarshipAvailable?: boolean
  }
  targetAudience?: string[]
  syllabus?: {
    modules: Array<{
      title: string
      description: string
      duration: string
    }>
  }
}

export default function EventsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const localePath = useLocalizedPath()
  const [error, setError] = useState('');

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const url = '/api/events?status=approved&limit=50';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        setError(t('events.errorFetching'));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(t('events.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const categories = [
    'all', 'Advocacy', 'Awareness', 'Capacity Building', 'Community Outreach',
    'Conference', 'Education', 'Emergency Response', 'Fundraising', 'Health',
    'Human Rights', 'Legal Aid', 'Networking', 'Policy', 'Research', 'Training',
    'Workshop', 'Youth Development', 'Other'
  ];
  const locations = ['all', 'Baku', 'Ganja', 'Sumgayit', 'Online', 'Other'];
  const months = [
    'all', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const eventTypes = ['all', 'event', 'training', 'workshop', 'conference', 'seminar'];

  const slugifyCategory = (s: string) =>
    s
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');

  const getCategoryLabel = (val: string) => {
    if (val === 'all') return t('filters.allCategories');
    const key = slugifyCategory(val);
    try {
      const translated = (t(`events.categories.${key}` as any) as string) || val;
      return translated;
    } catch {
      return val;
    }
  };

  const getLocationLabel = (val: string) => {
    if (val === 'all') return t('filters.allLocations');
    if (val === 'Online') return t('events.online');
    if (val.toLowerCase() === 'baku') return t('charts.regions.baku');
    if (val.toLowerCase() === 'ganja') return t('charts.regions.ganja');
    if (val.toLowerCase() === 'sumgayit') return t('charts.regions.sumqayit');
    if (val.toLowerCase() === 'other') return t('charts.regions.otherRegions');
    return val;
  };

  const getMonthLabel = (val: string) =>
    val === 'all' ? t('filters.allMonths') : (t(`events.months.${val}` as any) as string || val);

  const getEventTypeLabel = (val: string) => {
    if (val === 'all') return t('filters.allTypes');
    try {
      // use events.type.<key> if available
      return (t(`events.type.${val}` as any) as string) || (val.charAt(0).toUpperCase() + val.slice(1));
    } catch {
      return val.charAt(0).toUpperCase() + val.slice(1);
    }
  };

  // Filter events based on search and filters
  const filteredData = events.filter(event => {
  const organizationName = event.organizationName || event.createdBy?.name || t('common.unknown');
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    
  const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    
    // Event type filter
    const matchesEventType = selectedEventType === 'all' || event.eventType === selectedEventType;
    
    // Location filter - check location type and city
  const locationString = event.location.type === 'online' ? 'online' : 
              event.location.city || event.location.address || 'unknown';
    const matchesLocation = selectedLocation === 'all' || 
                           locationString.toLowerCase().includes(selectedLocation.toLowerCase());
    
    // Month filter
    const eventDate = new Date(event.eventDate);
    const eventMonth = isNaN(eventDate.getTime()) ? -1 : eventDate.getMonth();
    const matchesMonth = selectedMonth === 'all' || eventMonth === -1 ||
                        (selectedMonth === 'January' && eventMonth === 0) ||
                        (selectedMonth === 'February' && eventMonth === 1) ||
                        (selectedMonth === 'March' && eventMonth === 2) ||
                        (selectedMonth === 'April' && eventMonth === 3) ||
                        (selectedMonth === 'May' && eventMonth === 4) ||
                        (selectedMonth === 'June' && eventMonth === 5) ||
                        (selectedMonth === 'July' && eventMonth === 6) ||
                        (selectedMonth === 'August' && eventMonth === 7) ||
                        (selectedMonth === 'September' && eventMonth === 8) ||
                        (selectedMonth === 'October' && eventMonth === 9) ||
                        (selectedMonth === 'November' && eventMonth === 10) ||
                        (selectedMonth === 'December' && eventMonth === 11);
    
    return matchesSearch && matchesCategory && matchesEventType && matchesLocation && matchesMonth;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      'Celebration': 'bg-pink-100 text-pink-800',
      'Festival': 'bg-purple-100 text-purple-800',
      'Summit': 'bg-blue-100 text-blue-800',
      'Workshop': 'bg-green-100 text-green-800',
      'Conference': 'bg-indigo-100 text-indigo-800',
      'Digital Skills': 'bg-cyan-100 text-cyan-800',
      'Legal Training': 'bg-amber-100 text-amber-800',
      'Leadership': 'bg-red-100 text-red-800'
    };
    return (colors as Record<string, string>)[category] || 'bg-gray-100 text-gray-800';
  };

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const isDeadlinePassed = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('events.locationTBD');
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t('common.unknown');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    if (!end || start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate!)}`;
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedLocation !== 'all' ||
    selectedMonth !== 'all' ||
    selectedEventType !== 'all';

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

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 text-white py-16 sm:py-20 lg:py-24">
        {/* Animated Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

        <div className="section-padding relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight animate-slide-up px-4">
              {t('events.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto animate-fade-in px-4">
              {t('events.subtitle')}
            </p>
          </div>
        </div>

      </section>

      {/* Main Content */}
      <section className="section-padding py-16">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filters - Standardized Design */}
          <ResourceFilterContainer
            title={t('common.filterSearch')}
            subtitle={t('events.refineYourSearch')}
            iconGradient="from-blue-600 to-indigo-600"
            borderColor="border-blue-100"
            searchInput={
              <Input
                type="text"
                label={t('common.search')}
                placeholder={t('events.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                iconPosition="left"
                inputSize="md"
                aria-label={t('events.searchAria')}
              />
            }
            filterControls={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {/* Category Filter */}
                <div>
                  <Select 
                    label={t('filters.category')}
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    options={categories.map(category => ({
                      value: category,
                      label: getCategoryLabel(category)
                    }))}
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
                    options={locations.map(location => ({
                      value: location,
                      label: getLocationLabel(location)
                    }))}
                    placeholder={t('filters.allLocations')}
                    selectSize="md"
                  />
                </div>

                {/* Month Filter */}
                <div>
                  <Select 
                    label={t('filters.month')}
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    options={months.map(month => ({
                      value: month,
                      label: getMonthLabel(month)
                    }))}
                    placeholder={t('filters.allMonths')}
                    selectSize="md"
                  />
                </div>

                {/* Event Type Filter */}
                <div>
                  <Select 
                    label={t('filters.type')}
                    value={selectedEventType} 
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    options={eventTypes.map(type => ({
                      value: type,
                      label: getEventTypeLabel(type)
                    }))}
                    placeholder={t('filters.allTypes')}
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
                    ...(selectedMonth !== 'all' ? [{
                      id: 'month',
                      label: t('filters.month'),
                      value: getMonthLabel(selectedMonth),
                      onRemove: () => setSelectedMonth('all'),
                      colorScheme: 'purple' as const,
                    }] : []),
                    ...(selectedEventType !== 'all' ? [{
                      id: 'eventType',
                      label: t('filters.type'),
                      value: getEventTypeLabel(selectedEventType),
                      onRemove: () => setSelectedEventType('all'),
                      colorScheme: 'amber' as const,
                    }] : []),
                  ]}
                  onClearAll={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLocation('all');
                    setSelectedMonth('all');
                    setSelectedEventType('all');
                  }}
                />
              ) : undefined
            }
          />

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12 animate-fade-in">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600 font-medium">{t('common.loading')}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12 animate-shake">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 mb-4 font-semibold">{error}</p>
              <Button
                onClick={fetchEvents}
                variant="gradient-blue"
                shadow="lg"
                hoverEffect="scale"
              >
                {t('common.tryAgain')}
              </Button>
            </div>
          )}

          {/* Events Grid */}
          {!loading && !error && (
            <>
              {filteredData.length === 0 ? (
                <div className="text-center py-16 animate-fade-in mt-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg mb-2 font-semibold">{t('events.noEventsFound')}</p>
                  <p className="text-gray-500">{t('events.noEventsMessage')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                  {filteredData.map((event) => {
                    const organizationName = event.organizationName || event.createdBy?.name || t('common.unknown');
                    const hasDeadline = event.applicationDeadline;
                    const deadlinePassed = hasDeadline ? isDeadlinePassed(event.applicationDeadline!) : false;
                    const deadlineNear = hasDeadline ? isDeadlineNear(event.applicationDeadline!) : false;

                    return (
                      <article 
                        key={event._id} 
                        className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/50 rounded-2xl border-2 border-gray-200 hover:border-blue-500 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 flex flex-col"
                      >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-indigo-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>

                        <div className="relative z-10 flex flex-col h-full">
                          {/* Icon Section with Image */}
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                            {event.imageUrl ? (
                              <Image
                                src={event.imageUrl}
                                alt={event.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center">
                                <Calendar className="w-7 h-7 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Category & Type Badges */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                              {getCategoryLabel(event.category)}
                            </span>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg">
                              {event.eventType ? getEventTypeLabel(event.eventType) : getEventTypeLabel('event')}
                            </span>
                          </div>

                          {/* Save Button - Top Right */}
                          <div className="absolute top-6 right-6">
                            <SaveButton
                              itemId={event._id}
                              itemType="event"
                              itemTitle={event.title}
                              size="sm"
                              showText={false}
                            />
                          </div>
                          
                          {/* Title */}
                          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>

                          {/* Event Details */}
                          <div className="space-y-2 mb-4 flex-1">
                            {/* Date */}
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-gray-700 font-medium">{formatDateRange(event.eventDate, event.endDate)}</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-gray-700 font-medium truncate">
                                {event.location.type === 'online' ? t('events.online') : 
                                 event.location.city || event.location.address || t('events.locationTBD')}
                              </span>
                            </div>

                            {/* Organization */}
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-gray-700 font-medium truncate">{organizationName}</span>
                            </div>

                            {/* Deadline - if exists */}
                            {hasDeadline && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className={`w-4 h-4 flex-shrink-0 ${
                                  deadlinePassed ? 'text-red-600' :
                                  deadlineNear ? 'text-orange-600' :
                                  'text-green-600'
                                }`} />
                                <span className={`font-medium ${
                                  deadlinePassed ? 'text-red-600' :
                                  deadlineNear ? 'text-orange-600' :
                                  'text-green-600'
                                }`}>
                                  {formatDate(event.applicationDeadline!)}
                                  {deadlinePassed && ` (${t('events.passed')})`}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {event.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                                  #{tag}
                                </span>
                              ))}
                              {event.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg">
                                  +{event.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-4 border-t border-gray-200 mt-auto">
                            <ButtonLink 
                              href={localePath(`/resources/events/${event._id}`)}
                              variant="gradient-blue"
                              size="sm"
                              className="flex-1"
                              shadow="sm"
                              hoverEffect="scale"
                            >
                              {t('events.viewDetails')}
                            </ButtonLink>
                            {event.applicationLink && !deadlinePassed && (
                              <ButtonLink
                                href={event.applicationLink}
                                variant="outline"
                                size="sm"
                                icon={ExternalLink}
                                iconPosition="right"
                                hoverEffect="scale"
                                external
                              />
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Results Count */}
          {!loading && !error && filteredData.length > 0 && (
            <div className="text-center mt-8 text-gray-600 font-medium">
              {t('events.showingResults', { count: filteredData.length, total: events.length })}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-16">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="section-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-black mb-6">{t('events.hostEventCta')}</h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              {t('events.hostEventText')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ButtonLink 
                href={localePath("/dashboard/events/create")}
                variant="white-on-dark"
                size="lg"
                icon={Calendar}
                iconPosition="left"
                shadow="lg"
                hoverEffect="scale"
              >
                {t('events.createEvent')}
              </ButtonLink>
              <ButtonLink 
                href={localePath("/submit")}
                variant="outline"
                size="lg"
                icon={ExternalLink}
                iconPosition="left"
                shadow="lg"
                hoverEffect="scale"
              >
                {t('events.submitContent')}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
