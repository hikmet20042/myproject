'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, RefreshCw, Calendar } from 'lucide-react';
import { Button, ButtonLink, SearchBar } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { EmptyState, ResourceFilterContainer } from '@/components/shared';
import { ListPageLayout } from '@/components/layout';
import { eventQueryKeys, fetchEvents } from '@/lib/eventQueries';
import { getUserErrorMessage } from '@/lib/errorMessages';
import { logError } from '@/lib/logger';
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback';
import { useSession } from '@/lib/auth/client';
import { AZERBAIJAN_CITIES, EVENT_TYPE_LABELS, EVENT_TYPE_VALUES, type EventTypeValue } from '@/lib/events/eventConfig';
import { ContentCard } from '@/components/shared/ContentCard';

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');
  
  const { data: session } = useSession();
  const isOrganizationUser = session?.user?.accountType === 'organization';
  const { showError } = useGlobalFeedback();
  const localePath = useLocalizedPath()

  const queryFilters = useMemo(() => ({
    status: 'approved',
    limit: 50,
    eventType: selectedEventType !== 'all' ? selectedEventType : undefined,
    city: selectedCity !== 'all' ? selectedCity : undefined,
    search: searchTerm.trim() ? searchTerm.trim() : undefined
  }), [searchTerm, selectedEventType, selectedCity])

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

  const cityOptions = ['all', ...AZERBAIJAN_CITIES];
  const eventTypes = ['all', ...EVENT_TYPE_VALUES];

  const getEventTypeLabel = (val: string) => {
    if (val === 'all') return 'Bütün növlər';
    return EVENT_TYPE_LABELS[val as EventTypeValue] || val;
  };

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

  const hasActiveFilters = searchTerm.trim() !== '' || selectedCity !== 'all' || selectedEventType !== 'all';

  return (
    <ListPageLayout
      title="Tədbirlər"
      description="Öyrən, şəbəkələş və inkişaf et. İcmamızdakı ən maraqlı tədbirləri kəşf et."
      headerBadgeText="RESURSLAR"
      pageType="event"
      icon={Sparkles}
      headerActions={
        isOrganizationUser ? (
          <>
            <ButtonLink href={localePath('/dashboard/events/create')} variant="secondary" size="lg" className="rounded-full px-8">
              Tədbir Paylaş
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href={localePath('/resources')} variant="white-on-dark" size="lg" className="rounded-full px-8">
              Digər İmkanlar
            </ButtonLink>
          </>
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
              onSearch={(val) => setSearchTerm(val)} 
              placeholder="Tədbir adı və ya təşkilatçı axtar..." 
              value={searchTerm}
              variant="minimal"
            />
          }
          filterControls={
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Məkan</label>
                <Select 
                  value={selectedCity} 
                  onChange={(e) => setSelectedCity(e.target.value)}
                  options={cityOptions.map(city => ({ value: city, label: city === 'all' ? 'Bütün şəhərlər' : city }))}
                  className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tədbir növü</label>
                <Select 
                  value={selectedEventType} 
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  options={eventTypes.map(type => ({ value: type, label: getEventTypeLabel(type) }))}
                  className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
                />
              </div>
            </div>
          }
          activeFilters={hasActiveFilters && (
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => { setSearchTerm(''); setSelectedCity('all'); setSelectedEventType('all'); }}
               className="rounded-full text-xs font-black bg-white"
             >
               Filtrləri təmizlə
             </Button>
          )}
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
                message="Axtarış meyarlarını dəyişərək yenidən yoxlayın."
                actionText="Filtrləri sıfırla"
                onAction={() => { setSearchTerm(''); setSelectedCity('all'); setSelectedEventType('all'); }}
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
  );
}
