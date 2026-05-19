"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import Script from 'next/script';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button, ButtonLink, SearchBar } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback';
import { useSession } from '@/lib/auth/client';
import { EmptyState, ResourceFilterContainer } from '@/components/shared';
import { ListPageLayout } from '@/components/layout';
import { getUserErrorMessage } from '@/lib/errorMessages';
import { logError } from '@/lib/logger';
import { ContentCard } from '@/components/shared/ContentCard';
import { generateItemListSchema } from '@/lib/seo';
import { vacancyQueryKeys, fetchVacancies } from '@/lib/vacancyQueries';
import { AZERBAIJAN_CITIES } from '@/lib/events/eventConfig';

const VACANCY_TYPE_LABELS_AZ: Record<string, string> = {
  volunteer: 'Könüllülük',
  full_time: 'Tam ştat',
  part_time: 'Yarım ştat',
  intern: 'Təcrübəçi',
};

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Ən yeni' },
  { value: 'updatedAt', label: 'Son yenilənən' },
  { value: 'applicationDeadline', label: 'Son müraciət tarixi' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Bütün növlər' },
  { value: 'full_time', label: 'Tam ştat' },
  { value: 'part_time', label: 'Yarım ştat' },
  { value: 'volunteer', label: 'Könüllülük' },
  { value: 'intern', label: 'Təcrübəçi' },
];

const CITY_OPTIONS = [
  { value: 'all', label: 'Bütün şəhərlər' },
  ...AZERBAIJAN_CITIES.map(city => ({ value: city, label: city })),
];

export default function VacanciesPage() {
  const localePath = useLocalizedPath();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useGlobalFeedback();
  const { data: session } = useSession();
  const isOrganizationUser = session?.user?.accountType === 'organization';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!searchParams) return;
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const city = searchParams.get('city') || 'all';
    const sort = searchParams.get('sort') || 'createdAt';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    setSearchQuery(q);
    setSelectedType(type);
    setSelectedCity(city);
    setSortBy(sort);
    setDateFrom(from);
    setDateTo(to);
  }, [searchParams]);

  const pushUrl = useCallback((updates: Record<string, string | null>) => {
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
    router.push(qs ? `/resources/vacancies?${qs}` : '/resources/vacancies', { scroll: false });
  }, [router, searchParams]);

  const queryFilters = useMemo(() => ({
    page: 1,
    limit: 50,
    status: 'approved',
    search: searchQuery.trim() || undefined,
    type: selectedType !== 'all' ? selectedType : undefined,
    city: selectedCity !== 'all' ? selectedCity : undefined,
    sortBy: sortBy as 'createdAt' | 'updatedAt' | 'applicationDeadline',
    sortOrder: 'desc' as const,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [searchQuery, selectedType, selectedCity, sortBy, dateFrom, dateTo])

  const vacanciesQuery = useQuery({
    queryKey: vacancyQueryKeys.list(queryFilters),
    queryFn: () => fetchVacancies(queryFilters)
  })

  useEffect(() => {
    if (vacanciesQuery.isError) {
      logError('Vacancies API error', vacanciesQuery.error)
      showError(getUserErrorMessage(vacanciesQuery.error))
    }
  }, [vacanciesQuery.isError, vacanciesQuery.error, showError])

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    pushUrl({ q: query || null });
  };
  const handleClearSearch = () => {
    setSearchQuery('');
    pushUrl({ q: null });
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    pushUrl({ type: type === 'all' ? null : type });
  };
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    pushUrl({ city: city === 'all' ? null : city });
  };
  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    pushUrl({ sort });
  };
  const handleDateFromChange = (date: string) => {
    setDateFrom(date);
    pushUrl({ from: date || null });
  };
  const handleDateToChange = (date: string) => {
    setDateTo(date);
    pushUrl({ to: date || null });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCity('all');
    setSortBy('createdAt');
    setDateFrom('');
    setDateTo('');
    router.push('/resources/vacancies', { scroll: false });
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedType !== 'all' || selectedCity !== 'all' || sortBy !== 'createdAt' || dateFrom !== '' || dateTo !== '';

  const vacancies = (vacanciesQuery.data?.items || [])
    .filter((v: any) => Boolean(v?.slug))
    .map((vacancy: any) => ({
      id: vacancy._id || vacancy.id,
      kind: 'vacancy' as const,
      title: vacancy.title,
      href: localePath(`/resources/vacancies/${vacancy.slug}`),
      badge: VACANCY_TYPE_LABELS_AZ[vacancy.type] || vacancy.type || 'Vakansiya',
      coverImage: vacancy.imageUrl || vacancy.image_url,
      dateLabel: vacancy.applicationDeadline ? new Date(vacancy.applicationDeadline).toLocaleDateString('az-AZ') : 'Tarix qeyd olunmayıb',
      locationLabel: vacancy.city || 'Bakı',
      ownerLabel: vacancy.createdByOrganization?.organizationName || vacancy.createdBy?.name || 'Təşkilat',
      type: vacancy.type
    }));

  const itemListJsonLd = useMemo(() => {
    if (vacanciesQuery.isLoading || vacancies.length === 0) return '';
    return JSON.stringify(generateItemListSchema({
      name: 'Vakansiyalar - icma360',
      description: 'Azərbaycanda ən son iş elanları, könüllülük, təcrübə və tam/yarım ştat vakansiyalar.',
      items: vacancies.slice(0, 20).map((v) => ({
        name: v.title,
        url: v.href,
        description: `${v.badge} - ${v.locationLabel}`,
      })),
    }));
  }, [vacancies, vacanciesQuery.isLoading]);

  return (
    <>
      {itemListJsonLd && (
        <Script id="vacancies-itemlist-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListJsonLd }} />
      )}
      <ListPageLayout
        title="Vakansiyalar"
        description="Karyerana başlamaq və ya yeni təcrübələr qazanmaq üçün ən yaxşı fürsətləri tap."
        headerBadgeText="RESURSLAR"
        pageType="vacancy"
        icon={Sparkles}
        headerActions={
          isOrganizationUser ? (
            <ButtonLink href={localePath('/dashboard/vacancies/create')} variant="secondary" size="lg" className="rounded-full px-8">
              Vakansiya Paylaş
            </ButtonLink>
          ) : (
            <ButtonLink href={localePath('/resources')} variant="white-on-dark" size="lg" className="rounded-full px-8">
              Digər İmkanlar
            </ButtonLink>
          )
        }
        isLoading={vacanciesQuery.isLoading}
        isError={vacanciesQuery.isError}
        isEmpty={!vacanciesQuery.isLoading && !vacanciesQuery.isError && vacancies.length === 0 && !hasActiveFilters}
        onRetry={() => vacanciesQuery.refetch()}
        filterSection={
          <ResourceFilterContainer
            searchInput={
              <SearchBar
                onSearch={handleSearch}
                onClear={handleClearSearch}
                placeholder="Vakansiya adı və ya təşkilat axtar..."
                value={searchQuery}
                variant="minimal"
              />
            }
            filterControls={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">İş növü</label>
                  <Select
                    value={selectedType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    options={TYPE_OPTIONS}
                    className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Şəhər</label>
                  <Select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    options={CITY_OPTIONS}
                    className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sıralama</label>
                  <Select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    options={SORT_OPTIONS}
                    className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Son müraciət</label>
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
            activeFilters={hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="rounded-full text-xs font-black bg-white"
              >
                Filtrləri təmizlə
              </Button>
            )}
          />
        }
        content={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {vacancies.length > 0 ? (
              vacancies.map((vacancy) => (
                <ContentCard key={vacancy.id} item={vacancy} />
              ))
            ) : (
              <div className="col-span-full py-20">
                <EmptyState
                  title="Vakansiya tapılmadı"
                  message={hasActiveFilters ? 'Axtarış meyarlarını dəyişərək yenidən yoxlayın.' : 'Hələlik vakansiya yoxdur.'}
                  actionText="Filtrləri sıfırla"
                  onAction={clearAllFilters}
                />
              </div>
            )}
          </div>
        }
        bottomCta={
          <div className="text-center py-10">
            <h3 className="text-3xl md:text-5xl font-black mb-6 text-white">İşçi axtarırsınız?</h3>
            <p className="text-slate-400 font-medium text-lg mb-10 max-w-2xl mx-auto">
              Təşkilatınız üçün ən istedadlı gəncləri bizim platformada tapa bilərsiniz.
            </p>
            <div className="flex justify-center">
              <ButtonLink
                href={localePath('/dashboard/vacancies/create')}
                variant="white-on-dark"
                size="lg"
                className="rounded-2xl px-10 py-4 font-black"
              >
                Vakansiya yerləşdir
              </ButtonLink>
            </div>
          </div>
        }
      />
    </>
  );
}
