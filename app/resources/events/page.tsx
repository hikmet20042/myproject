'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Calendar, MapPin, Users, ExternalLink, Clock, Search, Sparkles, ArrowRight } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import SaveButton from '@/components/SaveButton';
import { useLocalizedPath } from '@/lib/useLocalizedPath';
import { EmptyState, ResourceFilterContainer, ActiveFilterBadges, ResourceCard } from '@/components/shared';
import { ListPageLayout } from '@/components/layout';
import { eventQueryKeys, fetchEvents } from '@/lib/eventQueries';
import { ApiError } from '@/lib/apiClient';
import { getUserErrorMessage } from '@/lib/errorMessages';
import { logError } from '@/lib/logger';

interface Event { _id: string
  title: string
  description: string
  category: string
  eventType: 'event' | 'training' | 'workshop' | 'conference' | 'seminar'
  eventDate: string
  endDate?: string
  location: { type: 'online' | 'physical' | 'hybrid'
    address?: string
    city?: string
    country?: string
    onlineLink?: string }
  applicationLink?: string
  applicationDeadline?: string
  maxParticipants?: number
  currentParticipants: number
  tags: string[]
  imageUrl?: string
  createdBy: { _id: string
    name: string }
  createdByOrganization?: { _id?: string
    id?: string
    organizationName?: string }
  organizationName?: string
  isApproved: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
  views?: number
  // Training-specific fields
  duration?: string
  schedule?: { startTime: string
    endTime: string
    timezone?: string }
  prerequisites?: string[]
  learningOutcomes?: string[]
  certification?: { provided: boolean
    type?: string
    accreditedBy?: string }
  cost?: { isFree: boolean
    amount?: number
    currency?: string
    scholarshipAvailable?: boolean }
  targetAudience?: string[]
  syllabus?: { modules: Array<{ title: string
      description: string
      duration: string }> } }

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const localePath = useLocalizedPath()
  const months = [
    { value: 'all', label: 'Bütün Aylar' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  const queryFilters = useMemo(() => ({
    status: 'approved',
    limit: 50,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    eventType: selectedEventType !== 'all' ? selectedEventType : undefined,
    location: selectedLocation !== 'all' ? selectedLocation : undefined,
    month: selectedMonth !== 'all' ? selectedMonth : undefined,
    search: searchTerm.trim() ? searchTerm.trim() : undefined
  }), [searchTerm, selectedCategory, selectedEventType, selectedLocation, selectedMonth])

  const eventsQuery = useQuery({
    queryKey: eventQueryKeys.list(queryFilters),
    queryFn: () => fetchEvents(queryFilters)
  })

  const categories = [
    'all', 'Advocacy', 'Awareness', 'Capacity Building', 'Community Outreach',
    'Conference', 'Education', 'Emergency Response', 'Fundraising', 'Health',
    'Human Rights', 'Legal Aid', 'Networking', 'Policy', 'Research', 'Training',
    'Workshop', 'Youth Development', 'Other'
  ];
  const locations = ['all', 'Baku', 'Ganja', 'Sumgayit', 'Online', 'Other'];
  const eventTypes = ['all', 'event', 'training', 'workshop', 'conference', 'seminar'];

  const slugifyCategory = (s: string) =>
    s
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');

  const getCategoryLabel = (val: string) => { if (val === 'all') return 'Bütün Kateqoriyalar';
    return val; };

  const getLocationLabel = (val: string) => { if (val === 'all') return 'Bütün Yerlər';
    if (val === 'Online') return 'Onlayn';
    if (val.toLowerCase() === 'baku') return 'Bakı';
    if (val.toLowerCase() === 'ganja') return 'Gəncə';
    if (val.toLowerCase() === 'sumgayit') return 'Sumqayıt';
    if (val.toLowerCase() === 'other') return 'Digər Regionlar';
    return val; };

  const getMonthLabel = (val: string) =>
    months.find((month) => month.value === val)?.label || val;

  const getEventTypeLabel = (val: string) => { if (val === 'all') return 'Bütün növlər';
    return val.charAt(0).toUpperCase() + val.slice(1); };

  const isDeadlineNear = (deadline: string) => { const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0; };

  const isDeadlinePassed = (deadline: string) => { const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today; };

  const formatDate = (dateString: string) => { if (!dateString) return 'Yer dəqiqləşdiriləcək';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Naməlum';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`; };

  const formatDateRange = (startDate: string, endDate?: string) => { const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    if (!end || start.toDateString() === end.toDateString()) { return formatDate(startDate); }
    
    return `${formatDate(startDate)} - ${formatDate(endDate!)}`; };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedLocation !== 'all' ||
    selectedMonth !== 'all' ||
    selectedEventType !== 'all';

  if (eventsQuery.isError) {
    const apiError = eventsQuery.error instanceof ApiError ? eventsQuery.error : null;
    if (apiError?.code) {
      logError('Events API error', apiError);
    }
  }

  const events: Event[] = eventsQuery.data?.items ?? []
  const filteredData = events;

  return (
    <ListPageLayout
      title="Tədbirlər"
      description="Gender bərabərliyini və sağ qalanlara dəstəyi gücləndirən icma tədbirlərini, təlimləri və proqramları kəşf et."
      icon={Sparkles}
      headerActions={
        <>
          <ButtonLink href={localePath('/submit')} variant="secondary" size="lg" hoverEffect="scale">
            {'Bloq Paylaş'}
          </ButtonLink>
          <ButtonLink href={localePath('/resources')} variant="outline" size="lg" hoverEffect="scale">
            {'Fürsətləri Kəşf Et'}
          </ButtonLink>
        </>
      }
      isLoading={eventsQuery.isLoading}
      isError={eventsQuery.isError}
      isEmpty={!eventsQuery.isLoading && !eventsQuery.isError && filteredData.length === 0 && !hasActiveFilters}
      loadingText="Yüklənir"
      errorTitle="Tədbirlər yüklənmədi"
      errorMessage={eventsQuery.isError ? getUserErrorMessage(eventsQuery.error) : undefined}
      onRetry={() => eventsQuery.refetch()}
      emptyTitle="Hələ tədbir yoxdur"
      emptyMessage="Hazırda göstəriləcək tədbir yoxdur."
      filterSection={
        <ResourceFilterContainer
            title={'Filtrlə və Axtar'}
            subtitle={'Filtrləri dəqiqləşdir və hədəfinə uyğun tədbirlər tap.'}
            iconGradient="from-blue-600 to-emerald-600"
            borderColor="border-blue-100"
            searchInput={ <Input
                type="text"
                label={'Axtar'}
                placeholder={'Başlıq, təşkilatçı və ya təsvir üzrə axtar...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                iconPosition="left"
                inputSize="md"
                aria-label={'Tədbirləri axtar'}
              /> }
            filterControls={ <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {/* Category Filter */}
                <div>
                  <Select 
                    label={'Kateqoriya'}
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    options={categories.map(category => ({ value: category,
                      label: getCategoryLabel(category) }))}
                    placeholder={'Bütün Kateqoriyalar'}
                    selectSize="md"
                  />
                </div>

                {/* Location Filter */}
                <div>
                  <Select 
                    label={'Yer'}
                    value={selectedLocation} 
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    options={locations.map(location => ({ value: location,
                      label: getLocationLabel(location) }))}
                    placeholder={'Bütün Yerlər'}
                    selectSize="md"
                  />
                </div>

                {/* Month Filter */}
                <div>
                  <Select 
                    label={'Ay'}
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    options={months.map(month => ({ value: month.value,
                      label: getMonthLabel(month.value) }))}
                    placeholder={'Bütün Aylar'}
                    selectSize="md"
                  />
                </div>

                {/* Event Type Filter */}
                <div>
                  <Select 
                    label={'Növ'}
                    value={selectedEventType} 
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    options={eventTypes.map(type => ({ value: type,
                      label: getEventTypeLabel(type) }))}
                    placeholder={'Bütün növlər'}
                    selectSize="md"
                  />
                </div>
              </div> }
            activeFilters={ hasActiveFilters ? (
                <ActiveFilterBadges
                  badges={[
                    ...(selectedCategory !== 'all' ? [{ id: 'category',
                      label: 'Kateqoriya',
                      value: getCategoryLabel(selectedCategory),
                      onRemove: () => setSelectedCategory('all'),
                      colorScheme: 'teal' as const, }] : []),
                    ...(selectedLocation !== 'all' ? [{ id: 'location',
                      label: 'Yer',
                      value: getLocationLabel(selectedLocation),
                      onRemove: () => setSelectedLocation('all'),
                      colorScheme: 'blue' as const, }] : []),
                    ...(selectedMonth !== 'all' ? [{ id: 'month',
                      label: 'Ay',
                      value: getMonthLabel(selectedMonth),
                      onRemove: () => setSelectedMonth('all'),
                      colorScheme: 'indigo' as const, }] : []),
                    ...(selectedEventType !== 'all' ? [{ id: 'eventType',
                      label: 'Növ',
                      value: getEventTypeLabel(selectedEventType),
                      onRemove: () => setSelectedEventType('all'),
                      colorScheme: 'blue' as const, }] : []),
                  ]}
                  onClearAll={() => { setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLocation('all');
                    setSelectedMonth('all');
                    setSelectedEventType('all'); }}
                />
              ) : undefined }
          />
      }
      content={
        <>
          {filteredData.length === 0 ? (
            <div>
              <EmptyState
                title="Tədbir tapılmadı"
                message="Axtarış və ya filtrləri dəyişməyi sına."
                actionText="Filtrləri sıfırla"
                onAction={hasActiveFilters ? () => { setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLocation('all');
                  setSelectedMonth('all');
                  setSelectedEventType('all'); } : undefined}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredData.map((event) => { const organizationName = event.organizationName || event.createdByOrganization?.organizationName || event.createdBy?.name || 'Naməlum';
                    const organizationId = event.createdByOrganization?.id || event.createdByOrganization?._id;
                    const hasDeadline = event.applicationDeadline;
                    const deadlinePassed = hasDeadline ? isDeadlinePassed(event.applicationDeadline!) : false;
                    const deadlineNear = hasDeadline ? isDeadlineNear(event.applicationDeadline!) : false;

                    return (
                      <ResourceCard
                        key={event._id}
                        type="event"
                        title={event.title}
                        description={event.description}
                        imageUrl={event.imageUrl}
                        icon={
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                            <Calendar className="w-7 h-7 text-white" />
                          </div>
                        }
                        badges={[
                          { label: getCategoryLabel(event.category), variant: 'info' },
                          { label: event.eventType ? getEventTypeLabel(event.eventType) : getEventTypeLabel('event'), variant: 'success' },
                        ]}
                        metadata={
                          <>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-gray-700 font-medium">{formatDateRange(event.eventDate, event.endDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-gray-700 font-medium truncate">
                                {event.location.type === 'online' ? 'Onlayn' : event.location.city || event.location.address || 'Yer dəqiqləşdiriləcək'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              {organizationId ? (
                                <Link href={localePath(`/organizations/${organizationId}`)} className="text-gray-700 font-medium truncate hover:text-primary">
                                  {organizationName}
                                </Link>
                              ) : (
                                <span className="text-gray-700 font-medium truncate">{organizationName}</span>
                              )}
                            </div>
                            {hasDeadline && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className={`w-4 h-4 flex-shrink-0 ${deadlinePassed ? 'text-red-600' : deadlineNear ? 'text-orange-600' : 'text-green-600'}`} />
                                <span className={`font-medium ${deadlinePassed ? 'text-red-600' : deadlineNear ? 'text-orange-600' : 'text-green-600'}`}>
                                  {formatDate(event.applicationDeadline!)}
                                  {deadlinePassed && ` (${'Keçib'})`}
                                </span>
                              </div>
                            )}
                            {event.tags && event.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {event.tags.slice(0, 3).map((tag, index) => (
                                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                                    #{tag}
                                  </span>
                                ))}
                                {event.tags.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg">+{event.tags.length - 3}</span>
                                )}
                              </div>
                            )}
                            {(event.maxParticipants && event.currentParticipants / event.maxParticipants >= 0.7) && (
                              <p className="text-xs font-semibold text-amber-700">Yerlər sürətlə dolur</p>
                            )}
                          </>
                        }
                        actions={
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <SaveButton itemId={event._id} itemType="event" itemTitle={event.title} size="sm" showText={true} />
                              {event.applicationLink && !deadlinePassed && (
                                <ButtonLink href={event.applicationLink} variant="outline" size="sm" icon={ExternalLink} iconPosition="right" hoverEffect="scale" external>
                                  Müraciət et
                                </ButtonLink>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <ButtonLink href={localePath(`/resources/events/${event._id}`)} variant="secondary" size="sm" className="flex-1" shadow="sm" hoverEffect="scale">
                                {'Ətraflı bax'}
                              </ButtonLink>
                            </div>
                          </div>
                        }
                      />
                    ); })}
            </div>
          )}

          {/* Results Count */}
          {filteredData.length > 0 && (
            <div className="text-center mt-8 text-gray-600 font-medium">
              {`${events.length} tədbirdən ${filteredData.length} göstərilir`}
            </div>
          )}
        </>
      }
      bottomCta={
          <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-12 text-center shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Calendar className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">{'Tədbir Təşkil Etmək İstəyirsən?'}</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
              {'Tədbiri icma ilə paylaş və gender bərabərliyini dəstəkləyən şəbəkələri gücləndir.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ButtonLink
                href={localePath('/dashboard/events/create')}
                variant="secondary"
                size="lg"
                icon={Calendar}
                iconPosition="left"
                hoverEffect="scale"
              >
                {'Tədbir Yarat'}
              </ButtonLink>
              <ButtonLink
                href={localePath('/submit')}
                variant="outline"
                size="lg"
                icon={ExternalLink}
                iconPosition="left"
                hoverEffect="scale"
              >
                {'Məzmun Göndər'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </ButtonLink>
            </div>
          </div>
      }
    />
  ); }
