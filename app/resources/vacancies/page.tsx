"use client";

import { useEffect, useMemo, useState } from 'react';
import { Search, Briefcase, MapPin, Users, X, ExternalLink, Mail, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import SaveButton from '@/components/SaveButton';
import { useLocalizedPath } from '@/lib/useLocalizedPath';
import { LoadingState, ResourceFilterContainer, ActiveFilterBadges } from '@/components/shared';
import type { FilterBadge } from '@/components/shared/ActiveFilterBadges';

export default function VacanciesPage() {
  const localePath = useLocalizedPath();

  const locale = 'az-AZ';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [rawVacancies, setRawVacancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');

  useEffect(() => { const fetchVacancies = async () => { try { setLoading(true);
        setErrorKey('');
        const res = await fetch('/api/vacancies?status=approved&limit=50');
        if (!res.ok) throw new Error('Failed to fetch vacancies');
        const data = await res.json();
        setRawVacancies(data.vacancies || []); } catch (e) { console.error(e);
        setErrorKey('vacancies.errorLoading'); } finally { setLoading(false); } };
    fetchVacancies(); }, []);

  const vacancies = useMemo(() => { return rawVacancies.map((vacancy: any) => { const locationValue = vacancy?.location?.isRemote
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
        title: vacancy.title,
        organization: vacancy?.createdBy?.name || 'Naməlum',
        type: vacancy.type,
        location: locationValue,
        experience: vacancy.experienceLevel,
        salary,
        deadline: vacancy.applicationDeadline,
        description: vacancy.description || '',
        requirements: vacancy.requirements || [],
        applicationProcess,
        applicationLink,
        applicationEmail,
        postedDate: vacancy.createdAt,
        verified: vacancy.status === 'approved',
        views: vacancy.views || 0, }; }); }, [rawVacancies, locale]);

  const formatNumber = (value: number) => value.toLocaleString(locale);

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

    const getTypeColor = (type: string) => { switch (type) { case 'job': return 'bg-green-100 text-green-800';
      case 'volunteer': return 'bg-blue-100 text-blue-800';
      case 'internship': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800'; } };

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

  const errorMessage = errorKey ? 'Vakansiyalar yüklənmədi. Yenidən cəhd et.' : '';

  const hasApplicationProcess = (applicationProcess: any) => { if (!applicationProcess) return false;
    if (typeof applicationProcess !== 'object') return false;
    return Object.keys(applicationProcess).length > 0; };

  if (loading) { return (
      <LoadingState 
        text={'Yüklənir'}
      />
    ); }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/10 blur-3xl" />

        <div className="section-padding relative z-10">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 mb-8">
              <Sparkles size={14} className="text-accent" />
              {'İş İmkanları'}
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
              {'İş İmkanları'}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-gray-600 leading-relaxed">
              {'Gənclərlə iş üzrə ixtisaslaşmış Təşkilat və təşəbbüslərdə könüllülük, təcrübə və vakansiyalar tapın.'}
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

      {/* Search and Filters - Standardized Design */}
      <section className="section-padding py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
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
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 relative">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="section-padding relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Results Count */}
            <div className="mb-6 sm:mb-8 flex items-center justify-between">
              <p className="text-gray-700 font-medium">
                {`${formatNumber(vacancies.length)} imkandan ${formatNumber(filteredVacancies.length)} göstərilir`}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Job Cards - Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!loading && !errorMessage && filteredVacancies.map((vacancy, idx) => { const deadlineNear = isDeadlineNear(vacancy.deadline);
                const deadlinePassed = isDeadlinePassed(vacancy.deadline);
                const structuredProcess = hasApplicationProcess(vacancy.applicationProcess);
                const formattedPostedDate = formatDate(vacancy.postedDate, 'vacancies.unknown');
                const formattedDeadline = formatDate(vacancy.deadline, 'vacancies.dateTBD');

                return (
                  <article 
                    key={vacancy.id} 
                    className={`group relative rounded-2xl p-6 border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${deadlinePassed ? 'opacity-60' : ''} animate-fade-in flex flex-col overflow-hidden`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {/* Shine Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-emerald-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>

                    <div className="relative z-10 flex flex-col h-full">
                      {/* Icon Section */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg group-hover:shadow-xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <Briefcase className="w-7 h-7 text-white" />
                      </div>

                      {/* Save Button - Top Right */}
                      <div className="absolute top-6 right-6">
                        <SaveButton
                          itemId={vacancy.id}
                          itemType="vacancy"
                          itemTitle={vacancy.title}
                          size="sm"
                          showText={false}
                        />
                      </div>
                      
                      {/* Type Badge */}
                      <div className="mb-3">
                        <span className={`inline-flex items-center text-xs px-3 py-1 rounded-lg font-semibold ${getTypeColor(vacancy.type)}`}>
                          {getTypeLabel(vacancy.type)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {vacancy.title}
                      </h3>
                      
                      {/* Organization */}
                      <p className="text-sm text-gray-600 font-semibold mb-3">
                        {vacancy.organization}
                      </p>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {vacancy.description}
                      </p>
                      
                      {/* Meta Information */}
                      <div className="space-y-2 mb-4 flex-1">
                        {/* Location */}
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-gray-700 font-medium">
                            {getLocationLabel(vacancy.location)}
                          </span>
                        </div>

                        {/* Salary */}
                        {vacancy.salary && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-700 font-medium">{vacancy.salary}</span>
                          </div>
                        )}

                        {/* Deadline */}
                        <div className={`flex items-center gap-2 text-sm font-medium ${ deadlinePassed
                            ? 'text-red-600'
                            : deadlineNear
                              ? 'text-orange-600'
                              : 'text-gray-700' }`}>
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{formattedDeadline}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex gap-2">
                          <ButtonLink 
                            href={localePath(`/resources/vacancies/${vacancy.id}`)}
                            variant="outline"
                            size="sm"
                            hoverEffect="scale"
                            className="flex-1 text-center justify-center"
                          >
                            {'Ətraflı Bax'}
                          </ButtonLink>
                          
                          {(!vacancy.deadline || !deadlinePassed) && (
                            <>
                            {structuredProcess && vacancy.applicationProcess?.applicationLink && (
                              <ButtonLink
                                href={vacancy.applicationProcess.applicationLink}
                                external
                                variant="secondary"
                                size="sm"
                                hoverEffect="scale"
                                className="flex-1 text-center justify-center"
                              >
                                {'Müraciət'}
                              </ButtonLink>
                            )}
                            {!structuredProcess && vacancy.applicationLink && (
                              <ButtonLink
                                href={vacancy.applicationLink}
                                external
                                variant="secondary"
                                size="sm"
                                hoverEffect="scale"
                                className="flex-1 text-center justify-center"
                              >
                                {'Müraciət'}
                              </ButtonLink>
                            )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ); })}
            </div>

            {(!loading && !errorMessage && filteredVacancies.length === 0) && (
              <div className="text-center py-16 sm:py-20 rounded-2xl border border-gray-200 bg-white animate-fade-in shadow-sm">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 sm:mb-3">
                  {'İmkan Tapılmadı'}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
                  {'Daha çox imkan tapmaq üçün axtarış kriteriyalarını dəyişdir.'}
                </p>
                {hasActiveFilters && (
                    <Button
                      onClick={() => { setSearchTerm('');
                        setSelectedType('all');
                        setSelectedLocation('all');
                        setSelectedExperience('all'); }}
                      variant="primary"
                      size="lg"
                      className="group font-bold hover:scale-105 transition-all duration-300"
                    >
                      <X className="w-5 h-5 mr-2" />
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
                href={localePath('/auth/login')}
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
        </div>
      </section>
    </div>
  ); }