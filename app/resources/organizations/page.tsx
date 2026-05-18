'use client';

import { useState, useEffect } from 'react';
import { Button, ButtonLink, SearchBar } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { EmptyState, ResourceFilterContainer } from '@/components/shared';
import { ORGANIZATION_TYPE_LABELS, ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes';
import { fetchOrganizations } from '@/lib/organizationQueries';
import { logError } from '@/lib/logger';
import { ListPageLayout } from '@/components/layout';
import { useSession } from '@/lib/auth/client';
import { OrganizationCard } from '@/components/shared/OrganizationCard';
import { FOCUS_AREA_LABELS_AZ } from '@/lib/organizationTypes';
import { generateSEOMetadata, azerbaijanKeywords } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Təşkilatlar — icma360 | Azərbaycan Gənclər Təşkilatları və QHT-lər',
  description: 'Azərbaycanda fəal gənclər təşkilatları və QHT-lər. Təşkilatları kəşf et, izlə və onlarla əlaqə qur.',
  keywords: [...azerbaijanKeywords, 'təşkilatlar', 'QHT', 'qeyri-hökumət təşkilatları', 'gənclər təşkilatları'],
  canonical: '/resources/organizations',
  ogImage: '/opengraph-image',
  ogType: 'website',
  locale: 'az_AZ',
});

export default function OrganizationsPage() { 
  const localePath = useLocalizedPath();
  const { data: session } = useSession();
  const isOrganizationUser = session?.user?.accountType === 'organization';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganizationType, setSelectedOrganizationType] = useState('all');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0)

  const focusLabel = (raw: string): string => {
    const key = raw as keyof typeof FOCUS_AREA_LABELS_AZ
    return FOCUS_AREA_LABELS_AZ[key] || raw
  }

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoading(true)
        const { items } = await fetchOrganizations({
          limit: 100,
          organizationType: selectedOrganizationType !== 'all' ? selectedOrganizationType : undefined,
        })
        setOrganizations(items)
      } catch (err) {
        logError('Organizations API error', err)
        setError('Məlumatları yükləyərkən problem baş verdi')
      } finally {
        setLoading(false)
      }
    }
    loadOrganizations()
  }, [selectedOrganizationType, retryKey])

  const organizationTypes = [
    { value: 'all', label: 'Bütün növlər' },
    ...ORGANIZATION_TYPE_VALUES.map((value) => ({ value, label: ORGANIZATION_TYPE_LABELS[value] }))
  ];

  const filteredOrganizations = organizations.filter(organization => {
    const name = organization.organizationName || '';
    const desc = organization.description || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const hasActiveFilters = searchTerm.trim() !== '' || selectedOrganizationType !== 'all';

  return (
    <ListPageLayout
      title="Təşkilatlar"
      description="İcmamızdakı ən fəal gənclər təşkilatlarını kəşf et, izlə və onlarla əlaqə qur."
      headerBadgeText="RESURSLAR"
      pageType="organization"
      icon={Sparkles}
      headerActions={
        isOrganizationUser ? (
          <>
            <ButtonLink href={localePath('/dashboard/profile')} variant="secondary" size="lg" className="rounded-full px-8">
              Təşkilat Paneli
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href={localePath('/auth/register?type=organization')} variant="secondary" size="lg" className="rounded-full px-8 shadow-xl shadow-blue-500/20">
              Təşkilat Qeydiyyatı
            </ButtonLink>
          </>
        )
      }
      isLoading={loading}
      isError={Boolean(error)}
      onRetry={() => setRetryKey((prev) => prev + 1)}
      isEmpty={!loading && !error && filteredOrganizations.length === 0 && !hasActiveFilters}
      filterSection={
        <ResourceFilterContainer
          searchInput={
            <SearchBar 
              onSearch={setSearchTerm} 
              placeholder="Təşkilat adı və ya fəaliyyət sahəsi axtar..." 
              value={searchTerm}
              variant="minimal"
            />
          }
          filterControls={
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Təşkilat növü</label>
              <Select
                value={selectedOrganizationType}
                onChange={(e) => setSelectedOrganizationType(e.target.value)}
                options={organizationTypes}
                className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
              />
            </div>
          }
          activeFilters={hasActiveFilters && (
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => { setSearchTerm(''); setSelectedOrganizationType('all'); }}
               className="rounded-full text-xs font-black bg-white"
             >
               Filtrləri təmizlə
             </Button>
          )}
        />
      }
      content={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
          {filteredOrganizations.length > 0 ? (
            filteredOrganizations.map((org) => (
              <OrganizationCard 
                key={org._id} 
                org={org} 
                localePath={localePath} 
                focusLabel={focusLabel} 
              />
            ))
          ) : (
            <div className="col-span-full py-20">
              <EmptyState
                title="Təşkilat tapılmadı"
                message="Axtarış meyarlarını dəyişərək yenidən yoxlayın."
                actionText="Filtrləri təmizlə"
                onAction={() => { setSearchTerm(''); setSelectedOrganizationType('all'); }}
              />
            </div>
          )}
        </div>
      }
      bottomCta={
        <div className="text-center py-10">
          <h3 className="text-3xl md:text-5xl font-black mb-6 text-white text-center">Təşkilat-sənmi?</h3>
          <p className="text-slate-400 font-medium text-lg mb-10 max-w-2xl mx-auto text-center">
            İcma daxilində görünürlüyünü artırmaq və gənclərlə daha yaxından işləmək üçün bizə qoşul.
          </p>
          <div className="flex justify-center">
            <ButtonLink
              href={localePath('/auth/register?type=organization')}
              variant="white-on-dark"
              size="lg"
              className="rounded-2xl px-10 py-4 font-black"
            >
              Təşkilatını qeydiyyatdan keçir
            </ButtonLink>
          </div>
        </div>
      }
    />
  );
}
