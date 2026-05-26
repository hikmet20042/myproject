'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Script from 'next/script';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button, ButtonLink, SearchBar } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { EmptyState, ResourceFilterContainer, ActiveFilterBadges } from '@/components/shared';
import type { FilterBadge } from '@/components/shared/ActiveFilterBadges';
import { ListPageLayout } from '@/components/layout';
import { eventQueryKeys, fetchEvents } from '@/lib/eventQueries';
import { getUserErrorMessage } from '@/lib/errorMessages';
import { logError } from '@/lib/logger';
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback';
import { useSession } from '@/lib/auth/client';
import { AZERBAIJAN_CITIES, EVENT_TYPE_LABELS, EVENT_TYPE_VALUES, type EventTypeValue } from '@/lib/events/eventConfig';
import { ContentCard } from '@/components/shared/ContentCard';
import { generateItemListSchema } from '@/lib/seo';

const SORT_OPTIONS = [
  { value: 'eventDate', label: 'Tədbir tarixinə görə' },
  { value: 'createdAt', label: 'Ən yeni' },
  { value: 'updatedAt', label: 'Son yenilənən' },
];

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isOrganizationUser = session?.user?.accountType === 'organization';
  const { showError } = useGlobalFeedback();
  const localePath = useLocalizedPath()

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [sortBy, setSortBy] = useState('eventDate');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const isUserAction = useRef(false);

  useEffect(() => {
    if (isUserAction.current) {
      isUserAction.current = false;
      return;
    }
    if (!searchParams) return;
    const q = searchParams.get('q') || '';
    const city = searchParams.get('city') || 'all';
    const type = searchParams.get('type') || 'all';
    const sort = searchParams.get('sort') || 'eventDate';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    setSearchQuery(q);
    setSelectedCity(city);
    setSelectedEventType(type);
    setSortBy(sort);
    setDateFrom(from);
    setDateTo(to);
  }, [searchParams]);

  const replaceUrl = useCallback((updates: Record<string, string | null>) => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const qs = params.toString();
    router.replace(qs ? `/resources/events?${qs}` : '/resources/events', { scroll: false });
  }, [router, searchParams]);

  const getEventTypeLabel = (val: string) => {
    if (val === 'all') return 'Bütün növlər';
    return EVENT_TYPE_LABELS[val as EventTypeValue] || val;
  };

  const cityOptions = [{ value: 'all', label: 'Bütün şəhərlər' }, ...AZERBAIJAN_CITIES.map(city => ({ value: city, label: city }))];
  const eventTypes = [{ value: 'all', label: 'Bütün növlər' }, ...EVENT_TYPE_VALUES.map(type => ({ value: type, label: getEventTypeLabel(type) }))];
  const sortOptions = SORT_OPTIONS;

  const queryFilters = useMemo(() => ({
    status: 'approved',
    limit: 50,
    search: searchQuery.trim() || undefined,
    eventType: selectedEventType !== 'all' ? selectedEventType : undefined,
    city: selectedCity !== 'all' ? selectedCity : undefined,
    sortBy: sortBy as 'eventDate' | 'createdAt' | 'updatedAt',
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [searchQuery, selectedEventType, selectedCity, sortBy, dateFrom, dateTo])

  const eventsQuery = useQuery({
    queryKey: eventQueryKeys.list(queryFilters),
    queryFn: () => fetchEvents(queryFilters)
  })

  useEffect(() => {
    if (eventsQuery.isError) {
      logError('Events API error', eventsQuery.error)
      showError(getUserErrorMessage(eventsQuery.error))
    }
  }, [eventsQuery.isError, eventsQuery.error, showError])

  const handleSearch = (query: string) => {
    isUserAction.current = true;
    setSearchQuery(query);
    replaceUrl({ q: query || null });
  };
  const handleClearSearch = () => {
    isUserAction.current = true;
    setSearchQuery('');
    replaceUrl({ q: null });
  };

  const handleCityChange = (city: string) => {
    isUserAction.current = true;
    setSelectedCity(city);
    replaceUrl({ city: city === 'all' ? null : city });
  };
  const handleEventTypeChange = (type: string) => {
    isUserAction.current = true;
    setSelectedEventType(type);
    replaceUrl({ type: type === 'all' ? null : type });
  };
  const handleSortChange = (sort: string) => {
    isUserAction.current = true;
    setSortBy(sort);
    replaceUrl({ sort });
  };
  const handleDateFromChange = (date: string) => {
    isUserAction.current = true;
    setDateFrom(date);
    replaceUrl({ from: date || null });
  };
  const handleDateToChange = (date: string) => {
    isUserAction.current = true;
    setDateTo(date);
    replaceUrl({ to: date || null });
  };

  const clearAllFilters = () => {
    isUserAction.current = true;
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedEventType('all');
    setSortBy('eventDate');
    setDateFrom('');
    setDateTo('');
    router.replace('/resources/events', { scroll: false });
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCity !== 'all' || selectedEventType !== 'all' || sortBy !== 'eventDate' || dateFrom !== '' || dateTo !== '';

  const filterBadges: FilterBadge[] = useMemo(() => {
    const badges: FilterBadge[] = []
    if (searchQuery.trim()) {
      badges.push({
        id: 'search', label: 'Axtarış', value: searchQuery,
        onRemove: () => { isUserAction.current = true; setSearchQuery(''); replaceUrl({ q: null }); },
        colorScheme: 'blue',
      })
    }
    if (selectedCity !== 'all') {
      badges.push({
        id: 'city', label: 'Məkan', value: selectedCity,
        onRemove: () => { isUserAction.current = true; setSelectedCity('all'); replaceUrl({ city: null }); },
        colorScheme: 'teal',
      })
    }
    if (selectedEventType !== 'all') {
      badges.push({
        id: 'eventType', label: 'Növ', value: getEventTypeLabel(selectedEventType),
        onRemove: () => { isUserAction.current = true; setSelectedEventType('all'); replaceUrl({ type: null }); },
        colorScheme: 'purple',
      })
    }
    if (sortBy !== 'eventDate') {
      const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || sortBy
      badges.push({
        id: 'sort', label: 'Sıralama', value: sortLabel,
        onRemove: () => { isUserAction.current = true; setSortBy('eventDate'); replaceUrl({ sort: null }); },
        colorScheme: 'indigo',
      })
    }
    if (dateFrom) {
      badges.push({
        id: 'dateFrom', label: 'Tarixdən', value: dateFrom,
        onRemove: () => { isUserAction.current = true; setDateFrom(''); replaceUrl({ from: null }); },
        colorScheme: 'amber',
      })
    }
    if (dateTo) {
      badges.push({
        id: 'dateTo', label: 'Tarixə', value: dateTo,
        onRemove: () => { isUserAction.current = true; setDateTo(''); replaceUrl({ to: null }); },
        colorScheme: 'amber',
      })
    }
    return badges
  }, [searchQuery, selectedCity, selectedEventType, sortBy, dateFrom, dateTo, replaceUrl])

  const formatDate = (dateValue?: string): string => {
    if (!dateValue) return 'Tarix qeyd olunmayıb'
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return 'Tarix qeyd olunmayıb'
    return date.toLocaleDateString('az-AZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const allEvents = (eventsQuery.data?.items || [])
    .filter((event: any) => Boolean(event?.slug))
    .map((event: any) => ({
      id: event._id || event.id,
      kind: 'event' as const,
      title: event.title,
      href: localePath(`/resources/events/${event.slug}`),
      badge: getEventTypeLabel(event.eventType || 'training_workshop'),
      coverImage: event.imageUrl || event.image_url,
      dateLabel: formatDate(event.eventDate),
      locationLabel: event.location?.type === 'online' ? 'Onlayn' : event.location?.city || 'Bakı',
      ownerLabel: event.organizationName || event.createdByOrganization?.organizationName || 'Təşkilat',
    }))

  const itemListJsonLd = useMemo(() => {
    if (eventsQuery.isLoading || allEvents.length === 0) return '';
    return JSON.stringify(generateItemListSchema({
      name: 'Tədbirlər - icma360',
      description: 'Azərbaycanda gənclər üçün tədbirlər, təlimlər, konfranslar, vörkşoplar və networking imkanları.',
      items: allEvents.slice(0, 20).map((e) => ({
        name: e.title,
        url: e.href,
        description: `${e.badge} - ${e.locationLabel}`,
      })),
    }));
  }, [allEvents, eventsQuery.isLoading]);

  return (
    <>
      {itemListJsonLd && (
        <Script id="events-itemlist-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListJsonLd }} />
      )}
      <ListPageLayout
        title="Tədbirlər"
        description="Öyrən, şəbəkələş və inkişaf et. İcmamızdakı ən maraqlı tədbirləri kəşf et."
        headerBadgeText="RESURSLAR"
        pageType="event"
        icon={Sparkles}
        headerActions={
          isOrganizationUser ? (
            <ButtonLink href={localePath('/dashboard/events/create')} variant="secondary" size="lg" className="rounded-full px-8">
              Tədbir Paylaş
            </ButtonLink>
          ) : (
            <ButtonLink href={localePath('/resources')} variant="white-on-dark" size="lg" className="rounded-full px-8">
              Digər İmkanlar
            </ButtonLink>
          )
        }
        isLoading={eventsQuery.isLoading}
        isError={eventsQuery.isError}
        isEmpty={!eventsQuery.isLoading && !eventsQuery.isError && allEvents.length === 0 && !hasActiveFilters}
        onRetry={() => eventsQuery.refetch()}
        filterSection={
          <ResourceFilterContainer
            searchInput={
              <SearchBar
                onSearch={handleSearch}
                onClear={handleClearSearch}
                placeholder="Tədbir adı və ya təşkilatçı axtar..."
                value={searchQuery}
                variant="minimal"
              />
            }
            filterControls={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Məkan</label>
                  <Select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    options={cityOptions}
                    className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tədbir növü</label>
                  <Select
                    value={selectedEventType}
                    onChange={(e) => handleEventTypeChange(e.target.value)}
                    options={eventTypes}
                    className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sıralama</label>
                  <Select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    options={sortOptions}
                    className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tarix</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => handleDateFromChange(e.target.value)}
                      placeholder="Tarixdən"
                      className="w-full bg-slate-50 border-none rounded-xl h-14 px-3 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => handleDateToChange(e.target.value)}
                      placeholder="Tarixə"
                      className="w-full bg-slate-50 border-none rounded-xl h-14 px-3 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            }
            activeFilters={hasActiveFilters ? (
              <ActiveFilterBadges
                badges={filterBadges}
                onClearAll={clearAllFilters}
                showClearAll={filterBadges.length > 1}
              />
            ) : undefined}
          />
        }
        content={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {allEvents.length > 0 ? (
              allEvents.map((event) => (
                <ContentCard key={event.id} item={event} />
              ))
            ) : (
              <div className="col-span-full py-20">
                <EmptyState
                  title="Tədbir tapılmadı"
                  message={hasActiveFilters ? 'Axtarış meyarlarını dəyişərək yenidən yoxlayın.' : 'Hələlik tədbir yoxdur.'}
                  actionText="Filtrləri sıfırla"
                  onAction={clearAllFilters}
                />
              </div>
            )}
          </div>
        }
        bottomCta={
          <div className="text-center py-10">
            <h3 className="text-3xl md:text-5xl font-black mb-6 text-white">Tədbiriniz var?</h3>
            <p className="text-slate-400 font-medium text-lg mb-10 max-w-2xl mx-auto">
              İcma üçün faydalı olacaq tədbirlərinizi bizimlə bölüşün və daha çox gəncə çatın.
            </p>
            <div className="flex justify-center">
              <ButtonLink
                href={localePath('/dashboard/events/create')}
                variant="white-on-dark"
                size="lg"
                className="rounded-2xl px-10 py-4 font-black"
              >
                Tədbir əlavə et
              </ButtonLink>
            </div>
          </div>
        }
      />
    </>
  );
}
