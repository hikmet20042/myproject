'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Users, ExternalLink, Clock, Tag, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/contexts/LanguageContext';
import SaveButton from '@/components/SaveButton';
import ViewTracker from '@/components/ViewTracker'
import { useLocalizedPath } from '@/lib/useLocalizedPath';
import { LoadingState, ErrorState } from '@/components/shared';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-20">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="section-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-lg mb-6">
              <Calendar className="w-5 h-5 text-white" />
              <span className="text-sm font-semibold text-white">{t('events.discoverEvents')}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black mb-6">
              {t('events.title')}
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              {t('events.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding py-16">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-100 p-6 sm:p-8 mb-8 animate-fade-in backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('common.filterSearch')}</h2>
                <p className="text-sm text-gray-600">{t('events.refineYourSearch')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <Input
                  type="text"
                  label={t('common.search')}
                  placeholder={t('events.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                  iconPosition="left"
                  inputSize="md"
                  aria-label="Search events"
                />
              </div>

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

            {/* Active filters row */}
            {hasActiveFilters && (
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
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
                  {selectedMonth !== 'all' && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-purple-200 text-purple-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                      {t('filters.month')}: {getMonthLabel(selectedMonth)}
                      <button aria-label="Clear month filter" onClick={() => setSelectedMonth('all')} className="p-1 hover:bg-purple-100 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {selectedEventType !== 'all' && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-amber-200 text-amber-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                      {t('filters.type')}: {getEventTypeLabel(selectedEventType)}
                      <button aria-label="Clear event type filter" onClick={() => setSelectedEventType('all')} className="p-1 hover:bg-amber-100 rounded-full transition-colors">
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
                        setSelectedMonth('all');
                        setSelectedEventType('all');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-blue-300 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                      {t('common.clearAll')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

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
              <button
                onClick={fetchEvents}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
              >
                {t('common.tryAgain')}
              </button>
            </div>
          )}

          {/* Events Grid */}
          {!loading && !error && (
            <>
              {filteredData.length === 0 ? (
                <div className="text-center py-12 animate-fade-in">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg mb-2 font-semibold">{t('events.noEventsFound')}</p>
                  <p className="text-gray-500">{t('events.noEventsMessage')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredData.map((event) => {
                    const organizationName = event.organizationName || event.createdBy?.name || 'Unknown Organization';
                    const hasDeadline = event.applicationDeadline;
                    const deadlinePassed = hasDeadline ? isDeadlinePassed(event.applicationDeadline!) : false;
                    const deadlineNear = hasDeadline ? isDeadlineNear(event.applicationDeadline!) : false;

                    return (
                      <div key={event._id} className="group bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-2xl hover:-translate-y-2 hover:border-blue-300 transition-all duration-300 animate-fade-in flex flex-col h-full">
                        {/* Event Image */}
                        {event.imageUrl && (
                          <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden relative">
                            <Image
                              src={event.imageUrl}
                              alt={event.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* Badge Overlay on Image */}
                            <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getCategoryColor(event.category)} shadow-lg backdrop-blur-sm`}>
                                {event.category}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Card Content */}
                        <div className="p-6 flex flex-col flex-1">
                          {/* Header Section */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <span className="inline-block text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg mb-3">
                                {event.eventType ? getEventTypeLabel(event.eventType) : getEventTypeLabel('event')}
                              </span>
                              
                              {/* Title */}
                              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                                {event.title}
                              </h3>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 ml-3">
                              <ViewTracker
                                itemId={event._id}
                                itemType="event"
                                initialViews={event.views || 0}
                                showCount={true}
                              />
                              <SaveButton
                                itemId={event._id}
                                itemType="event"
                                itemTitle={event.title}
                                size="sm"
                                showText={false}
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                            {event.description}
                          </p>

                          {/* Event Details - Consistent Grid Layout */}
                          <div className="space-y-3 mb-4 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200 flex-1">
                            {/* Date */}
                            <div className="flex items-center text-sm">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                                <Calendar className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium">{t('events.date')}</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">{formatDateRange(event.eventDate, event.endDate)}</p>
                              </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-center text-sm">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                                <MapPin className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium">{t('events.location')}</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {event.location.type === 'online' ? t('events.online') : 
                                   event.location.city ? `${event.location.city}, ${event.location.country || 'Azerbaijan'}` :
                                   event.location.address || t('events.locationTBD')}
                                </p>
                              </div>
                            </div>

                            {/* Organization */}
                            <div className="flex items-center text-sm">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium">{t('events.organizer')}</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">{organizationName}</p>
                              </div>
                            </div>

                            {/* Participants - Only show if exists */}
                            {event.maxParticipants && (
                              <div className="flex items-center text-sm">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                                  <Tag className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 font-medium">{t('events.capacity')}</p>
                                  <p className="text-sm font-semibold text-gray-900">{event.currentParticipants}/{event.maxParticipants} {t('events.participants')}</p>
                                </div>
                              </div>
                            )}

                            {/* Application Deadline - Only show if exists */}
                            {hasDeadline && (
                              <div className="flex items-center text-sm">
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${
                                  deadlinePassed ? 'from-red-500 to-red-600' :
                                  deadlineNear ? 'from-orange-500 to-orange-600' :
                                  'from-green-500 to-green-600'
                                } flex items-center justify-center mr-3 flex-shrink-0 shadow-sm`}>
                                  <Clock className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 font-medium">{t('events.deadline')}</p>
                                  <p className={`text-sm font-semibold truncate ${
                                    deadlinePassed ? 'text-red-600' :
                                    deadlineNear ? 'text-orange-600' :
                                    'text-green-600'
                                  }`}>
                                    {formatDate(event.applicationDeadline!)}
                                    {deadlinePassed && ` (${t('events.passed')})`}
                                    {deadlineNear && !deadlinePassed && ` (${t('events.soon')})`}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {event.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200">
                                  #{tag}
                                </span>
                              ))}
                              {event.tags.length > 3 && (
                                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg border border-gray-300">
                                  +{event.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action Buttons - Fixed at Bottom */}
                          <div className="flex gap-3 mt-auto pt-4 border-t border-gray-200">
                            <Link href={`/resources/events/${event._id}`} className="flex-1">
                              <Button variant="primary" size="sm" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
                                {t('events.viewDetails')}
                              </Button>
                            </Link>
                            {event.applicationLink && !deadlinePassed && (
                              <Link
                                href={event.applicationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 px-4">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
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
              <Link href={localePath("/dashboard/events/create")}>
                <Button variant="secondary" size="lg" className="bg-white text-blue-700 hover:bg-yellow-300 hover:text-blue-900 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <Calendar className="w-5 h-5" />
                  {t('events.createEvent')}
                </Button>
              </Link>
              <Link href={localePath("/submit")}>
                <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-700 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <ExternalLink className="w-5 h-5" />
                  {t('events.submitContent')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}