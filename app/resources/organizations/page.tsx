'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ButtonLink } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Search, Users, MapPin, ExternalLink, Mail, Sparkles, ArrowRight } from 'lucide-react';
import { useLocalizedPath } from '@/lib/useLocalizedPath';
import { LoadingState, ErrorState, ResourceFilterContainer, ActiveFilterBadges } from '@/components/shared';
import { ORGANIZATION_TYPE_LABELS, ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes';

interface Organization { _id: string
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
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedOrganizationType, setSelectedOrganizationType] = useState('all');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getFocusAreaLabel = (value: string) => { if (!value) { return value; }
    return value; };

  // Fetch organizations from API
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true)
        // Request a larger page size to show more organizations on the directory
        const query = new URLSearchParams({ limit: '100' })
        if (selectedOrganizationType !== 'all') {
          query.set('organizationType', selectedOrganizationType)
        }
        const response = await fetch(`/api/organizations?${query.toString()}`)
        if (!response.ok) {
          throw new Error('Təşkilatlar yüklənmədi')
        }
        const data = await response.json()
        setOrganizations(data.organizations || [])
      } catch (err) {
        console.error('Təşkilatları yükləmə xətası:', err)
        setError('Təşkilatlar yüklənmədi. Yenidən cəhd et.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganizationType])

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

  if (loading) { return (
      <LoadingState 
        text={'Yüklənir'}
      />
    ) }

  if (error) { return (
      <ErrorState 
        title={'Təşkilatlar yüklənmədi. Yenidən cəhd et.'}
        message={error}
        retryText={'Yenidən cəhd edin'}
        onRetry={() => router.refresh()}
      />
    ) }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/10 blur-3xl" />

        <div className="section-padding relative z-10">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 mb-8">
              <Sparkles size={14} className="text-accent" />
              {'Təşkilat Kataloqu'}
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
              {'Təşkilat Kataloqu'}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-gray-600 leading-relaxed">
              {'Gender bərabərliyi proqramları və sağ qalanlara dəstək xidmətləri göstərən təşkilatları kəşf et.'}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <ButtonLink href={localePath('/submit')} variant="secondary" size="lg" hoverEffect="scale">
                {'Bloq Paylaş'}
              </ButtonLink>
              <ButtonLink href={localePath('/resources')} variant="outline" size="lg" hoverEffect="scale">
                {'Fürsətləri Kəşf Et'}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
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
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between px-4 sm:px-0">
              <p className="text-gray-600 font-medium">
                {`${organizations.length} təşkilatdan ${filteredOrganizations.length} göstərilir`}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOrganizations.map((organization) => (
                <article key={organization._id} className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-black text-primary">
                        {organization.organizationName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {organization.status === 'approved' && (
                      <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold whitespace-nowrap">
                        {'Təsdiqlənmiş'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {organization.organizationName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {organization.description}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    {organization.focusAreas && organization.focusAreas.length > 0 && (
                      <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                        {getFocusAreaLabel(organization.focusAreas[0]) || organization.focusAreas[0]}
                      </span>
                    )}
                    {organization.organizationType && (
                      <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-semibold">
                        {ORGANIZATION_TYPE_LABELS[
                          organization.organizationType as keyof typeof ORGANIZATION_TYPE_LABELS
                        ] || organization.organizationType}
                      </span>
                    )}
                    {organization.address && (
                      <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {organization.address.split(',')[0]}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mb-4 text-sm">
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
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <ButtonLink
                        href={localePath(`/resources/organizations/${organization._id}`)}
                        variant="outline"
                        size="sm"
                        hoverEffect="scale"
                        className="flex-1 text-center justify-center"
                      >
                        {'Profili Gör'}
                      </ButtonLink>
                      {organization.contactPerson?.email && (
                        <ButtonLink
                          href={`mailto:${organization.contactPerson.email}`}
                          variant="primary"
                          size="sm"
                          className="flex-1 text-center justify-center"
                          hoverEffect="scale"
                        >
                          {'Təşkilat ilə əlaqə'}
                        </ButtonLink>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredOrganizations.length === 0 && (
              <div className="text-center py-12 sm:py-16 rounded-2xl border border-gray-200 bg-white mt-6 shadow-sm">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {'Təşkilat tapılmadı'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto px-4">
                  {'Daha çox təşkilat tapmaq üçün axtarış və ya filtrləri dəyişməyi sına.'}
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={() => { setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedLocation('all'); }}
                    variant="primary"
                  >
                    {'Filtrləri Təmizlə'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-slate-50/60">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 md:p-12 text-center shadow-sm">
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
        </div>
      </section>
    </div>
  );
}
