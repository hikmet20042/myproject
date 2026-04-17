"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Briefcase, MapPin, Users, ExternalLink, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import SaveItemButtonContainer from '@/components/containers/SaveItemButtonContainer';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback';
import { useSession } from '@/lib/auth/client';
import { ResourceFilterContainer, ActiveFilterBadges, EmptyState, ResourceCard } from '@/components/shared';
import { ListPageLayout } from '@/components/layout';
import { ApiError } from '@/lib/apiClient';
import { getUserErrorMessage } from '@/lib/errorMessages';

export default function VacanciesPage() {
  const localePath = useLocalizedPath();
  const { showError } = useGlobalFeedback();
  const { data: session } = useSession();
  const isOrganizationUser = session?.user?.accountType === 'organization';

  const locale = 'az-AZ';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
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
        try {
          payload = await res.json();
        } catch {}
        throw new ApiError(
          payload?.error?.message || 'Failed to fetch vacancies',
          payload?.error?.code,
          payload?.error?.details
        );
      }
      const responseJson = await res.json();
      const payload = responseJson?.data || {};
      const items = Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.vacancies)
          ? payload.vacancies
          : [];
      setRawVacancies(items);
    } catch (e) {
      if (e instanceof ApiError && e.code) {
        console.error('Vacancies API error code:', e.code, e.details);
      } else {
        console.error(e);
      }
      setErrorKey(getUserErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVacancies();
  }, [loadVacancies]);

  useEffect(() => {
    if (errorKey) showError(errorKey)
  }, [errorKey, showError])

  const vacancies = useMemo(() => { const source = Array.isArray(rawVacancies) ? rawVacancies : [];
    return source.map((vacancy: any) => { const locationValue = vacancy?.location?.isRemote
      ? 'Uzaqdan'
      : vacancy?.location?.city || vacancy?.location?.address || 'Naməlum';

      const compensation = vacancy?.compensation;
      let salary: string | undefined = undefined;

      if (compensation) { if (compensation.type === 'paid' && compensation.amount && compensation.currency) { const rawAmount = compensation.amount;
          const amount = typeof rawAmount === 'number'
            ? rawAmount.toLocaleString(locale)
            : rawAmount;
          salary = `${amount} ${compensation.currency}`; } else if (compensation.type === 'stipend') { salary = 'Məvacib'; } else if (compensation.type === 'unpaid') { salary = 'Könüllü'; } }

      const applicationProcess = vacancy?.applicationProcess ?? undefined;
      const applicationLink = applicationProcess?.applicationLink || vacancy?.applicationLink;
      const applicationEmail = applicationProcess?.email || vacancy?.applicationEmail;

      return { id: vacancy._id,
        slug: vacancy.slug,
        title: vacancy.title,
        organization: vacancy?.createdByOrganization?.organizationName || vacancy?.createdBy?.name || 'Naməlum',
        organizationId: vacancy?.createdByOrganization?.id || vacancy?.createdByOrganization?._id || null,
        organizationSlug: vacancy?.createdByOrganization?.urlHandle || vacancy?.createdByOrganization?.slug || null,
        type: vacancy.type,
        location: locationValue,
        experience: vacancy.experienceLevel,
        salary,
        deadline: vacancy.applicationDeadline,
        description: vacancy.description || '',
        requirements: vacancy.requirements,
        applicationProcess,
        applicationLink,
        applicationEmail,
        postedDate: vacancy.createdAt,
        verified: vacancy.status === 'approved',
        views: vacancy.views || 0,
        saves: vacancy.saves || 0, }; }); }, [rawVacancies, locale]);


  const formatDate = (dateString?: string, fallbackKey?: string) => { if (!dateString) { return fallbackKey ? 'Naməlum' : 'Naməlum'; }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) { return 'Etibarsız Tarix'; }

    return date.toLocaleDateString(locale); };

  const isValidDate = (dateString?: string) => { if (!dateString) return false;
    const date = new Date(dateString);
    return !Number.isNaN(date.getTime()); };

  const typesOptions = [
    { value: 'all', label: 'Bütün növlər' },
    { value: 'job', label: 'Tam iş günü' },
    { value: 'volunteer', label: 'Könüllü' },
    { value: 'internship', label: 'Təcrübə' },
  ];

  const locationsOptions = [
    { value: 'all', label: 'Bütün Yerlər' },
    // Cities
    { value: 'Baku', label: 'Bakı' },
    { value: 'Ganja', label: 'Gəncə' },
    { value: 'Nakhchivan', label: 'Naxçıvan' },
    { value: 'Sumgayit', label: 'Sumqayıt' },
    { value: 'Lankaran', label: 'Lənkəran' },
    { value: 'Mingachevir', label: 'Mingəçevir' },
    { value: 'Naftalan', label: 'Naftalan' },
    { value: 'Khankendi', label: 'Xankəndi' },
    { value: 'Shaki', label: 'Şəki' },
    { value: 'Shirvan', label: 'Şirvan' },
    { value: 'Yevlakh', label: 'Yevlax' },
    // Districts (Rayons)
    { value: 'Absheron', label: 'Abşeron rayonu' },
    { value: 'Aghjabadi', label: 'Ağcabədi rayonu' },
    { value: 'Agdam', label: 'Ağdam rayonu' },
    { value: 'Agdash', label: 'Ağdaş rayonu' },
    { value: 'Agdere', label: 'Ağdərə rayonu' },
    { value: 'Agstafa', label: 'Ağstafa rayonu' },
    { value: 'Agsu', label: 'Ağsu rayonu' },
    { value: 'Astara', label: 'Astara rayonu' },
    { value: 'Babek', label: 'Babək rayonu' },
    { value: 'Balakan', label: 'Balakən rayonu' },
    { value: 'Beylagan', label: 'Beyləqan rayonu' },
    { value: 'Barda', label: 'Bərdə rayonu' },
    { value: 'Bilasuvar', label: 'Biləsuvar rayonu' },
    { value: 'Jabrayil', label: 'Cəbrayıl rayonu' },
    { value: 'Jalilabad', label: 'Cəlilabad rayonu' },
    { value: 'Julfa', label: 'Culfa rayonu' },
    { value: 'Dashkasan', label: 'Daşkəsən rayonu' },
    { value: 'Fuzuli', label: 'Füzuli rayonu' },
    { value: 'Gadabay', label: 'Gədəbəy rayonu' },
    { value: 'Goranboy', label: 'Goranboy rayonu' },
    { value: 'Goychay', label: 'Göyçay rayonu' },
    { value: 'Goygol', label: 'Göygöl rayonu' },
    { value: 'Hajigabul', label: 'Hacıqabul rayonu' },
    { value: 'Khachmaz', label: 'Xaçmaz rayonu' },
    { value: 'Khizi', label: 'Xızı rayonu' },
    { value: 'Khojaly', label: 'Xocalı rayonu' },
    { value: 'Khojavend', label: 'Xocavənd rayonu' },
    { value: 'Imishli', label: 'İmişli rayonu' },
    { value: 'Ismayilli', label: 'İsmayıllı rayonu' },
    { value: 'Kalbajar', label: 'Kəlbəcər rayonu' },
    { value: 'Kangarli', label: 'Kəngərli rayonu' },
    { value: 'Kurdamir', label: 'Kürdəmir rayonu' },
    { value: 'Gakh', label: 'Qax rayonu' },
    { value: 'Gazakh', label: 'Qazax rayonu' },
    { value: 'Gabala', label: 'Qəbələ rayonu' },
    { value: 'Gobustan', label: 'Qobustan rayonu' },
    { value: 'Guba', label: 'Quba rayonu' },
    { value: 'Gubadli', label: 'Qubadlı rayonu' },
    { value: 'Gusar', label: 'Qusar rayonu' },
    { value: 'Lachin', label: 'Laçın rayonu' },
    { value: 'Lerik', label: 'Lerik rayonu' },
    { value: 'Masalli', label: 'Masallı rayonu' },
    { value: 'Neftchala', label: 'Neftçala rayonu' },
    { value: 'Oghuz', label: 'Oğuz rayonu' },
    { value: 'Ordubad', label: 'Ordubad rayonu' },
    { value: 'Saatli', label: 'Saatlı rayonu' },
    { value: 'Sabirabad', label: 'Sabirabad rayonu' },
    { value: 'Salyan', label: 'Salyan rayonu' },
    { value: 'Samukh', label: 'Samux rayonu' },
    { value: 'Sadarak', label: 'Sədərək rayonu' },
    { value: 'Siyazan', label: 'Siyəzən rayonu' },
    { value: 'Shabran', label: 'Şabran rayonu' },
    { value: 'Shahbuz', label: 'Şahbuz rayonu' },
    { value: 'Shamakhi', label: 'Şamaxı rayonu' },
    { value: 'Shamkir', label: 'Şəmkir rayonu' },
    { value: 'Sharur', label: 'Şərur rayonu' },
    { value: 'Shusha', label: 'Şuşa rayonu' },
    { value: 'Tartar', label: 'Tərtər rayonu' },
    { value: 'Tovuz', label: 'Tovuz rayonu' },
    { value: 'Ujar', label: 'Ucar rayonu' },
    { value: 'Yardimli', label: 'Yardımlı rayonu' },
    { value: 'Zaqatala', label: 'Zaqatala rayonu' },
    { value: 'Zangilan', label: 'Zəngilan rayonu' },
    { value: 'Zardab', label: 'Zərdab rayonu' },
    { value: 'Uzaqdan', label: 'Uzaqdan' },
    { value: 'Other', label: 'Digər' },
  ];

  const experienceOptions = [
    { value: 'all', label: 'Bütün səviyyələr' },
    { value: 'Entry level', label: 'Başlanğıc səviyyə' },
    { value: '1-2 years', label: '1-2 il təcrübə' },
    { value: '2-5 years', label: '2-5 il təcrübə' },
    { value: '5+ years', label: '5+ il təcrübə' },
  ];

  const getTypeLabel = (val: string) => { const found = typesOptions.find(o => o.value === val);
    return found ? found.label : val; };

  const getLocationLabel = (val: string) => { const found = locationsOptions.find(o => o.value === val);
    if (found) return found.label;
    if (val === 'Unknown') return 'Naməlum';
    return val; };

  const getExperienceLabel = (val: string) => { const found = experienceOptions.find(o => o.value === val);
    return found ? found.label : val; };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredVacancies = vacancies.filter(vacancy => { const matchesSearch =
      normalizedSearch === '' ||
      [vacancy.title, vacancy.organization, vacancy.description].some(field =>
        typeof field === 'string' && field.toLowerCase().includes(normalizedSearch)
      );
    const matchesType = selectedType === 'all' || vacancy.type === selectedType;
    const matchesLocation = selectedLocation === 'all' || vacancy.location === selectedLocation;
    const matchesExperience = selectedExperience === 'all' || vacancy.experience === selectedExperience;
    
    return matchesSearch && matchesType && matchesLocation && matchesExperience; });

  const isDeadlineNear = (deadline?: string) => { if (!isValidDate(deadline)) return false;
    const deadlineDate = new Date(deadline as string);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0; };

  const isDeadlinePassed = (deadline?: string) => { if (!isValidDate(deadline)) return false;
    const deadlineDate = new Date(deadline as string);
    const today = new Date();
    return deadlineDate < today; };

  const hasActiveFilters =
    searchTerm.trim() !== '' || selectedType !== 'all' || selectedLocation !== 'all' || selectedExperience !== 'all';

  const errorMessage = errorKey;

  const hasApplicationProcess = (applicationProcess: any) => { if (!applicationProcess) return false;
    if (typeof applicationProcess !== 'object') return false;
    return Object.keys(applicationProcess).length > 0; };

  return (
    <ListPageLayout
      title="Vakansiyalar"
      description="Gənclərlə iş üzrə ixtisaslaşmış Təşkilat və təşəbbüslərdə könüllülük, təcrübə və vakansiyalar tapın."
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
      isError={Boolean(errorMessage) && rawVacancies.length === 0}
      errorTitle="Vakansiyalar yüklənmədi"
      errorMessage={errorMessage || undefined}
      onRetry={() => { void loadVacancies(); }}
      isEmpty={!loading && !errorMessage && filteredVacancies.length === 0 && !hasActiveFilters}
      emptyTitle="Hələ vakansiya yoxdur"
      emptyMessage="Hazırda göstəriləcək vakansiya yoxdur."
      filterSection={
        <ResourceFilterContainer
            title={'Axtardığınız işi tapın'}
            subtitle={'Nəticələri dəqiqləşdirmək üçün filtrlərdən istifadə edin.'}
            iconGradient="from-blue-600 to-emerald-600"
            borderColor="border-blue-100"
            searchInput={ <Input
                type="text"
                id="search"
                label={'Axtar'}
                placeholder={'Vakansiya adı və ya təşkilat adı axtar.'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                iconPosition="left"
                inputSize="md"
                aria-label={'Vakansiyaları axtar'}
              /> }
            filterControls={ <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Type Filter */}
                <div>
                  <Select
                    label={'Növ'}
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    options={typesOptions}
                    placeholder={'Bütün növlər'}
                    selectSize="md"
                  />
                </div>

                {/* Location Filter */}
                <div>
                  <Select
                    label={'Yer'}
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    options={locationsOptions}
                    placeholder={'Bütün Yerlər'}
                    selectSize="md"
                  />
                </div>

                {/* Experience Filter */}
                <div>
                  <Select
                    label={'Təcrübə'}
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    options={experienceOptions}
                    placeholder={'Bütün səviyyələr'}
                    selectSize="md"
                  />
                </div>
              </div> }
            activeFilters={ hasActiveFilters ? (
                <ActiveFilterBadges
                  badges={[
                    ...(selectedType !== 'all' ? [{ id: 'type',
                      label: 'Növ',
                      value: getTypeLabel(selectedType),
                      onRemove: () => setSelectedType('all'),
                      colorScheme: 'teal' as const, }] : []),
                    ...(selectedLocation !== 'all' ? [{ id: 'location',
                      label: 'Yer',
                      value: getLocationLabel(selectedLocation),
                      onRemove: () => setSelectedLocation('all'),
                      colorScheme: 'blue' as const, }] : []),
                    ...(selectedExperience !== 'all' ? [{ id: 'experience',
                      label: 'Təcrübə',
                      value: getExperienceLabel(selectedExperience),
                      onRemove: () => setSelectedExperience('all'),
                      colorScheme: 'blue' as const, }] : []),
                  ]}
                  onClearAll={() => { setSearchTerm('');
                    setSelectedType('all');
                    setSelectedLocation('all');
                    setSelectedExperience('all'); }}
                />
              ) : undefined }
          />
      }
      content={
        <>
          {filteredVacancies.length === 0 ? (
            <div>
              <EmptyState
                title="Vakansiya tapılmadı"
                message="Axtarış və ya filtrləri dəyişməyi sına."
                actionText="Filtrləri sıfırla"
                onAction={hasActiveFilters ? () => { setSearchTerm('');
                  setSelectedType('all');
                  setSelectedLocation('all');
                  setSelectedExperience('all'); } : undefined}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!loading && !errorMessage && filteredVacancies.map((vacancy, idx) => { const deadlineNear = isDeadlineNear(vacancy.deadline);
                const deadlinePassed = isDeadlinePassed(vacancy.deadline);
                const structuredProcess = hasApplicationProcess(vacancy.applicationProcess);
                const formattedDeadline = formatDate(vacancy.deadline, 'vacancies.dateTBD');

                return (
                  <ResourceCard
                    key={vacancy.id}
                    type="vacancy"
                    title={vacancy.title}
                    description={vacancy.description}
                    views={vacancy.views}
                    saves={vacancy.saves}
                    wrapperClassName="animate-fade-in"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    className={deadlinePassed ? 'opacity-60' : ''}
                    icon={
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                        <Briefcase className="w-7 h-7 text-white" />
                      </div>
                    }
                    badges={[{ label: getTypeLabel(vacancy.type), variant: 'info' }]}
                    metadata={
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          {vacancy.organizationSlug ? (
                            <Link href={localePath(`/o/${vacancy.organizationSlug}`)} className="text-gray-700 font-medium hover:text-primary truncate">
                              {vacancy.organization}
                            </Link>
                          ) : (
                            <span className="text-gray-700 font-medium truncate">{vacancy.organization}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="text-gray-700 font-medium">{getLocationLabel(vacancy.location)}</span>
                        </div>
                        {vacancy.salary && (
                          <p className="text-sm text-gray-700 font-medium">{vacancy.salary}</p>
                        )}
                        <div className={`flex items-center gap-2 text-sm font-medium ${deadlinePassed ? 'text-red-600' : deadlineNear ? 'text-orange-600' : 'text-green-600'}`}>
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {formattedDeadline}
                            {deadlinePassed && ` (${'Keçib'})`}
                          </span>
                        </div>
                      </>
                    }
                    actions={
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <SaveItemButtonContainer
                            itemId={vacancy.id}
                            itemType="vacancy"
                            itemTitle={vacancy.title}
                            size="sm"
                            showText={true}
                          />
                          {(!vacancy.deadline || !deadlinePassed) && structuredProcess && vacancy.applicationProcess?.applicationLink && (
                            <ButtonLink
                              href={vacancy.applicationProcess.applicationLink}
                              external
                              variant="outline"
                              size="sm"
                              icon={ExternalLink}
                              iconPosition="right"
                              hoverEffect="scale"
                            >
                              {'Müraciət et'}
                            </ButtonLink>
                          )}
                          {(!vacancy.deadline || !deadlinePassed) && !structuredProcess && vacancy.applicationLink && (
                            <ButtonLink
                              href={vacancy.applicationLink}
                              external
                              variant="outline"
                              size="sm"
                              icon={ExternalLink}
                              iconPosition="right"
                              hoverEffect="scale"
                            >
                              {'Müraciət et'}
                            </ButtonLink>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <ButtonLink
                            href={localePath(`/resources/vacancies/${vacancy.slug}`)}
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            shadow="sm"
                            hoverEffect="scale"
                          >
                            {'Ətraflı bax'}
                          </ButtonLink>
                        </div>
                      </div>
                    }
                  />
                ); })}
            </div>
          )}

          {filteredVacancies.length > 0 && (
            <div className="text-center mt-8 text-gray-600 font-medium">
              {`${vacancies.length} vakansiyadan ${filteredVacancies.length} göstərilir`}
            </div>
          )}
        </>
      }
      bottomCta={
          <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-12 text-center shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Briefcase className="w-7 h-7 text-primary" />
            </div>

            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              {'Paylaşmaq üçün fürsətiniz var?'}
            </h3>
            <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              {'Əgər təsdiqlənmiş Təşkilat-sinizsə, iş elanları, könüllü və təcrübə proqramları yerləşdirə bilərsiniz.'}
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-8">
              {[
                  { icon: Users, text: 'Daha çox gəncə çatın' },
                  { icon: Briefcase, text: 'Fürsətləri pulsuz yerləşdirin' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-slate-50 px-4 py-2"
                >
                  <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <ButtonLink
                href={localePath('/auth/signin')}
                variant="secondary"
                size="lg"
                icon={Briefcase}
                iconPosition="left"
                hoverEffect="scale"
                className="w-full sm:w-auto"
              >
                {'Vakansiya əlavə etmək üçün daxil olun'}
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
              </ButtonLink>
              <ButtonLink
                href={localePath('/auth/register?type=organization')}
                variant="outline"
                size="lg"
                icon={Users}
                iconPosition="left"
                hoverEffect="scale"
                className="w-full sm:w-auto"
              >
                {'Təşkilat kimi qeydiyyatdan keçin'}
              </ButtonLink>
            </div>
          </div>
      }
    />
  ); }
