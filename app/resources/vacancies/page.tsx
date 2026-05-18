"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, Briefcase } from 'lucide-react';
import { Button, ButtonLink, SearchBar } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback';
import { useSession } from '@/lib/auth/client';
import { EmptyState, ResourceFilterContainer } from '@/components/shared';
import { ListPageLayout } from '@/components/layout';
import { ApiError } from '@/lib/apiClient';
import { getUserErrorMessage } from '@/lib/errorMessages';
import { ContentCard } from '@/components/shared/ContentCard';

export default function VacanciesPage() {
  const localePath = useLocalizedPath();
  const { showError } = useGlobalFeedback();
  const { data: session } = useSession();
  const isOrganizationUser = session?.user?.accountType === 'organization';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [rawVacancies, setRawVacancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');

  const loadVacancies = useCallback(async () => {
    try {
      setLoading(true);
      setErrorKey('');
      const res = await fetch('/api/vacancies?status=approved&limit=50');
      if (!res.ok) {
        let payload: any = null;
        try { payload = await res.json(); } catch {}
        throw new ApiError(payload?.error?.message || 'Failed to fetch vacancies', payload?.error?.code);
      }
      const responseJson = await res.json();
      const payload = responseJson?.data || {};
      setRawVacancies(Array.isArray(payload.items) ? payload.items : (Array.isArray(payload.vacancies) ? payload.vacancies : []));
    } catch (e) {
      setErrorKey(getUserErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadVacancies(); }, [loadVacancies]);

  useEffect(() => { if (errorKey) showError(errorKey); }, [errorKey, showError]);

  const VACANCY_TYPE_LABELS_AZ: Record<string, string> = {
    volunteer: 'Könüllülük',
    full_time: 'Tam ştat',
    part_time: 'Yarım ştat',
    intern: 'Təcrübəçi',
  };

  const vacancies = useMemo(() => {
    return rawVacancies
      .filter((vacancy: any) => Boolean(vacancy?.slug))
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
  }, [rawVacancies, localePath]);

  const typesOptions = [
    { value: 'all', label: 'Bütün növlər' },
    { value: 'full_time', label: 'Tam ştat' },
    { value: 'part_time', label: 'Yarım ştat' },
    { value: 'volunteer', label: 'Könüllülük' },
    { value: 'intern', label: 'Təcrübəçi' },
  ];

  const filteredVacancies = vacancies.filter(vacancy => {
    const matchesSearch = !searchTerm || vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) || vacancy.ownerLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || vacancy.type === selectedType;
    return matchesSearch && matchesType;
  });

  const hasActiveFilters = searchTerm.trim() !== '' || selectedType !== 'all';

  return (
    <ListPageLayout
      title="Vakansiyalar"
      description="Karyerana başlamaq və ya yeni təcrübələr qazanmaq üçün ən yaxşı fürsətləri tap."
      headerBadgeText="RESURSLAR"
      pageType="vacancy"
      icon={Sparkles}
      headerActions={
        isOrganizationUser ? (
          <>
            <ButtonLink href={localePath('/dashboard/vacancies/create')} variant="secondary" size="lg" className="rounded-full px-8">
              Vakansiya Paylaş
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
      isLoading={loading}
      isError={Boolean(errorKey) && rawVacancies.length === 0}
      onRetry={loadVacancies}
      isEmpty={!loading && filteredVacancies.length === 0 && !hasActiveFilters}
      filterSection={
        <ResourceFilterContainer
          searchInput={
            <SearchBar 
              onSearch={setSearchTerm} 
              placeholder="Vakansiya adı və ya təşkilat axtar..." 
              value={searchTerm}
              variant="minimal"
            />
          }
          filterControls={
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">İş növü</label>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                options={typesOptions}
                className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
              />
            </div>
          }
          activeFilters={hasActiveFilters && (
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => { setSearchTerm(''); setSelectedType('all'); }}
               className="rounded-full text-xs font-black bg-white"
             >
               Filtrləri təmizlə
             </Button>
          )}
        />
      }
      content={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
          {filteredVacancies.length > 0 ? (
            filteredVacancies.map((vacancy) => (
              <ContentCard key={vacancy.id} item={vacancy} />
            ))
          ) : (
            <div className="col-span-full py-20">
              <EmptyState
                title="Vakansiya tapılmadı"
                message="Axtarış meyarlarını dəyişərək yenidən yoxlayın."
                actionText="Filtrləri sıfırla"
                onAction={() => { setSearchTerm(''); setSelectedType('all'); }}
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
  );
}
