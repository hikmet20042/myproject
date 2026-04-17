'use client';

import { useState, useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Search, Users, MapPin, ExternalLink, Mail, Sparkles, ArrowRight } from 'lucide-react';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { ResourceFilterContainer, ActiveFilterBadges, ResourceCard, EmptyState } from '@/components/shared';
import { ORGANIZATION_TYPE_LABELS, ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes';
import { fetchOrganizations } from '@/lib/organizationQueries';
import { logError } from '@/lib/logger';
import { ListPageLayout } from '@/components/layout';
import { useSession } from '@/lib/auth/client';

interface Organization { _id: string
  slug: string
  organizationName: string
  organizationType?: string
  description: string
  focusAreas: string[]
  address?: string
  website?: string
  contactPhone?: string
  registrationNumber?: string
  status: 'pending' | 'approved' | 'rejected'
  contactPerson: { name: string
    email: string
    phone?: string
    position?: string }
  socialMedia?: { facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
    website?: string }
  approvedBy?: { _id: string
    name: string
    email: string }
  createdAt: string
  updatedAt: string
}

export default function OrganizationsPage() { const localePath = useLocalizedPath();
  const { data: session } = useSession();
  const isOrganizationUser = session?.user?.accountType === 'organization';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedOrganizationType, setSelectedOrganizationType] = useState('all');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0)

  const getFocusAreaLabel = (value: string) => { if (!value) { return value; }
    return value; };

  // Fetch organizations from API
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoading(true)
        // Request a larger page size to show more organizations on the directory
        const query = new URLSearchParams({ limit: '100' })
        if (selectedOrganizationType !== 'all') {
          query.set('organizationType', selectedOrganizationType)
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganizationType, retryKey])

  const categories = [
    { value: 'all', label: 'Bütün Kateqoriyalar' },
    { value: 'Human Rights', label: 'İnsan Hüquqları' },
    { value: 'Women Rights', label: 'Qadın Hüquqları' },
    { value: 'Youth Development', label: 'Gənclərin İnkişafı' },
    { value: 'Education', label: 'Təhsil' },
    { value: 'Environment', label: 'Ətraf Mühit' },
    { value: 'Healthcare', label: 'Səhiyyə' }
  ];

  const locations = [
    { value: 'all', label: 'Bütün Yerlər' },
    { value: 'Baku', label: 'Bakı' },
    { value: 'Ganja', label: 'Gəncə' },
    { value: 'Sumgayit', label: 'Sumqayıt' },
    { value: 'Mingachevir', label: 'Mingəçevir' },
    { value: 'Other', label: 'Digər Regionlar' }
  ];

  const organizationTypes = [
    { value: 'all', label: 'Bütün Kateqoriyalar' },
    ...ORGANIZATION_TYPE_VALUES.map((value) => ({ value,
      label: ORGANIZATION_TYPE_LABELS[value] }))
  ];

  const getCategoryLabel = (val: string) => categories.find(c => c.value === val)?.label || val;
  const getLocationLabel = (val: string) => locations.find(l => l.value === val)?.label || val;

  const filteredOrganizations = organizations.filter(organization => { const matchesSearch = organization.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         organization.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           (organization.focusAreas && organization.focusAreas.some(area => area === selectedCategory));
    const matchesLocation = selectedLocation === 'all' || 
                           (organization.address && organization.address.toLowerCase().includes(selectedLocation.toLowerCase()));
    const matchesType = selectedOrganizationType === 'all' ||
      (organization.organizationType && organization.organizationType === selectedOrganizationType);
    
    return matchesSearch && matchesCategory && matchesLocation && matchesType; });

  // Determine if any filters are active (used to control empty-state actions)
  const hasActiveFilters =
    searchTerm.trim() !== '' || selectedCategory !== 'all' || selectedLocation !== 'all' || selectedOrganizationType !== 'all';

  return (
    <ListPageLayout
      title="Təşkilat Kataloqu"
      description="Gender bərabərliyi proqramları və sağ qalanlara dəstək xidmətləri göstərən təşkilatları kəşf et."
      icon={Sparkles}
      headerActions={
        isOrganizationUser ? (
          <>
            <ButtonLink href={localePath('/dashboard/events/create')} variant="secondary" size="lg" hoverEffect="scale">
              {'Tədbir Paylaş'}
            </ButtonLink>
            <ButtonLink href={localePath('/dashboard/vacancies/create')} variant="outline" size="lg" hoverEffect="scale">
              {'Vakansiya Paylaş'}
            </ButtonLink>
            <ButtonLink href={localePath('/dashboard/profile')} variant="outline" size="lg" hoverEffect="scale">
              {'Təşkilat Paneli'}
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href={localePath('/submit')} variant="secondary" size="lg" hoverEffect="scale">
              {'Bloq Paylaş'}
            </ButtonLink>
            <ButtonLink href={localePath('/resources')} variant="outline" size="lg" hoverEffect="scale">
              {'Fürsətləri Kəşf Et'}
            </ButtonLink>
          </>
        )
      }
      isLoading={loading}
      isError={Boolean(error)}
      errorTitle="Təşkilatlar yüklənmədi. Yenidən cəhd et."
      errorMessage={error || undefined}
      onRetry={() => setRetryKey((prev) => prev + 1)}
      isEmpty={!loading && !error && filteredOrganizations.length === 0 && !hasActiveFilters}
      emptyTitle="Təşkilat tapılmadı"
      emptyMessage="Hazırda göstəriləcək təşkilat yoxdur."
      filterContainerClassName="max-w-6xl mx-auto"
      contentContainerClassName="max-w-6xl mx-auto"
      filterSection={
        <ResourceFilterContainer
              title={'Filtrlə və Axtar'}
              subtitle={'Ehtiyaclarına uyğun təşkilatları tapmaq üçün axtarışı dəqiqləşdir.'}
              iconGradient="from-blue-600 to-emerald-600"
              borderColor="border-blue-100"
              searchInput={ <Input
                  type="text"
                  id="search"
                  label={'Axtar'}
                  placeholder={'Ad və ya təsvir üzrə axtar...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                  iconPosition="left"
                  inputSize="md"
                /> }
              filterControls={ <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Select
                      label={'Kateqoriya'}
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      options={categories}
                      placeholder={'Bütün Kateqoriyalar'}
                      selectSize="md"
                    />
                  </div>

                  <div>
                    <Select
                      label={'Yer'}
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      options={locations}
                      placeholder={'Bütün Yerlər'}
                      selectSize="md"
                    />
                  </div>

                  <div>
                    <Select
                      label={'Növ'}
                      value={selectedOrganizationType}
                      onChange={(e) => setSelectedOrganizationType(e.target.value)}
                      options={organizationTypes}
                      placeholder={'Növ'}
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
                      ...(selectedOrganizationType !== 'all' ? [{ id: 'organizationType',
                        label: 'Növ',
                        value: ORGANIZATION_TYPE_LABELS[
                          selectedOrganizationType as keyof typeof ORGANIZATION_TYPE_LABELS
                        ],
                        onRemove: () => setSelectedOrganizationType('all'),
                        colorScheme: 'green' as const, }] : []),
                    ]}
                    onClearAll={() => { setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedLocation('all');
                      setSelectedOrganizationType('all'); }}
                  />
                ) : undefined }
            />
      }
      content={
        <>
          {filteredOrganizations.length === 0 ? (
            <EmptyState
              title="Təşkilat tapılmadı"
              message="Daha çox təşkilat tapmaq üçün axtarış və ya filtrləri dəyişməyi sına."
              actionText="Filtrləri Təmizlə"
              onAction={hasActiveFilters ? () => { setSearchTerm('');
                setSelectedCategory('all');
                setSelectedLocation('all');
                setSelectedOrganizationType('all'); } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrganizations.map((organization, idx) => (
                <ResourceCard
                  key={organization._id}
                  type="organization"
                  title={organization.organizationName}
                  description={organization.description}
                  wrapperClassName="animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  icon={
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-black text-primary">
                        {organization.organizationName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  }
                  topRight={organization.status === 'approved' ? (
                    <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold whitespace-nowrap">
                      {'Təsdiqlənmiş'}
                    </span>
                  ) : undefined}
                  badges={[
                    ...(organization.focusAreas && organization.focusAreas.length > 0
                      ? [{ label: getFocusAreaLabel(organization.focusAreas[0]) || organization.focusAreas[0], variant: 'info' as const }]
                      : []),
                    ...(organization.organizationType
                      ? [{
                          label:
                            ORGANIZATION_TYPE_LABELS[
                              organization.organizationType as keyof typeof ORGANIZATION_TYPE_LABELS
                            ] || organization.organizationType,
                          variant: 'success' as const,
                        }]
                      : []),
                    ...(organization.address
                      ? [{ label: organization.address.split(',')[0], variant: 'secondary' as const }]
                      : []),
                  ]}
                  metadata={
                    <>
                      {organization.website && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <ExternalLink className="w-4 h-4 text-primary flex-shrink-0" />
                          <a
                            href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium truncate text-xs"
                          >
                            {organization.website}
                          </a>
                        </div>
                      )}
                      {organization.contactPerson?.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                          <a href={`mailto:${organization.contactPerson.email}`} className="text-primary hover:underline font-medium truncate text-xs">
                            {organization.contactPerson.email}
                          </a>
                        </div>
                      )}
                      {organization.contactPhone && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs">{organization.contactPhone}</span>
                        </div>
                      )}
                    </>
                  }
                  actions={
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {organization.contactPerson?.email && (
                          <ButtonLink
                            href={`mailto:${organization.contactPerson.email}`}
                            variant="outline"
                            size="sm"
                            className="text-center justify-center"
                            hoverEffect="scale"
                          >
                            {'Təşkilat ilə əlaqə'}
                          </ButtonLink>
                        )}
                      </div>
                      <div className="flex gap-2">
                      <ButtonLink
                        href={localePath(`/o/${organization.slug}`)}
                        variant="secondary"
                        size="sm"
                        hoverEffect="scale"
                        className="flex-1"
                      >
                        {'Profili Gör'}
                      </ButtonLink>
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}

          {filteredOrganizations.length > 0 && (
            <div className="text-center mt-8 text-gray-600 font-medium">
              {`${organizations.length} təşkilatdan ${filteredOrganizations.length} göstərilir`}
            </div>
          )}
        </>
      }
      bottomCta={
          <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-12 text-center shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              {'Təşkilat-sənmi?'}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed px-4">
              {'İcma ilə əlaqə qurmaq, işini paylaşmaq və əlavə funksiyalara giriş əldə etmək üçün platformamıza qoşul.'}
            </p>
            <ButtonLink
              href={localePath('/auth/register?type=organization')}
              variant="secondary"
              size="lg"
              hoverEffect="scale"
            >
              {'Təşkilat-ni Qeydiyyatdan Keçir'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </ButtonLink>
          </div>
      }
    />
  );
}
