"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Briefcase, MapPin, Users, X, ExternalLink, Mail, Calendar } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useLanguage } from '@/contexts/LanguageContext';
import SaveButton from '@/components/SaveButton';
import { useLocalizedPath } from '@/lib/useLocalizedPath';
import { LoadingState, ResourceFilterContainer, ActiveFilterBadges } from '@/components/shared';
import type { FilterBadge } from '@/components/shared/ActiveFilterBadges';

export default function VacanciesPage() {
  const { t, language } = useLanguage();
  const localePath = useLocalizedPath();

  const locale = language === 'az' ? 'az-AZ' : 'en-US';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [rawVacancies, setRawVacancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        setLoading(true);
        setErrorKey('');
        const res = await fetch('/api/vacancies?status=approved&limit=50');
        if (!res.ok) throw new Error('Failed to fetch vacancies');
        const data = await res.json();
        setRawVacancies(data.vacancies || []);
      } catch (e) {
        console.error(e);
        setErrorKey('vacancies.errorLoading');
      } finally {
        setLoading(false);
      }
    };
    fetchVacancies();
  }, []);

  const vacancies = useMemo(() => {
    return rawVacancies.map((vacancy: any) => {
      const locationValue = vacancy?.location?.isRemote
        ? 'Remote'
        : vacancy?.location?.city || vacancy?.location?.address || 'Unknown';

      const compensation = vacancy?.compensation;
      let salary: string | undefined = undefined;

      if (compensation) {
        if (compensation.type === 'paid' && compensation.amount && compensation.currency) {
          const rawAmount = compensation.amount;
          const amount = typeof rawAmount === 'number'
            ? rawAmount.toLocaleString(locale)
            : rawAmount;
          salary = `${amount} ${compensation.currency}`;
        } else if (compensation.type === 'stipend') {
          salary = t('vacancies.stipend');
        } else if (compensation.type === 'unpaid') {
          salary = t('vacancies.volunteer');
        }
      }

      const applicationProcess = vacancy?.applicationProcess ?? undefined;
      const applicationLink = applicationProcess?.applicationLink || vacancy?.applicationLink;
      const applicationEmail = applicationProcess?.email || vacancy?.applicationEmail;

      return {
        id: vacancy._id,
        title: vacancy.title,
        organization: vacancy?.createdBy?.name || t('common.unknown'),
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
        views: vacancy.views || 0,
      };
    });
  }, [rawVacancies, locale, t]);

  const formatNumber = (value: number) => value.toLocaleString(locale);

  const formatDate = (dateString?: string, fallbackKey?: string) => {
    if (!dateString) {
      return fallbackKey ? t(fallbackKey) : t('vacancies.unknown');
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return t('vacancies.invalidDate');
    }

    return date.toLocaleDateString(locale);
  };

  const isValidDate = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !Number.isNaN(date.getTime());
  };

  const typesOptions = [
    { value: 'all', label: t('filters.allTypes') },
    { value: 'Full-time', label: t('vacancies.fullTime') },
    { value: 'Part-time', label: t('vacancies.partTime') },
    { value: 'Volunteer', label: t('vacancies.volunteer') },
    { value: 'Internship', label: t('vacancies.internship') },
    { value: 'Contract', label: t('vacancies.contract') },
  ];

  const locationsOptions = [
    { value: 'all', label: t('filters.allLocations') },
    // Cities
    { value: 'Baku', label: t('regions.baku') },
    { value: 'Ganja', label: t('regions.ganja') },
    { value: 'Nakhchivan', label: t('regions.nakhchivan') },
    { value: 'Sumgayit', label: t('regions.sumgayit') },
    { value: 'Lankaran', label: t('regions.lankaran') },
    { value: 'Mingachevir', label: t('regions.mingachevir') },
    { value: 'Naftalan', label: t('regions.naftalan') },
    { value: 'Khankendi', label: t('regions.khankendi') },
    { value: 'Shaki', label: t('regions.shaki') },
    { value: 'Shirvan', label: t('regions.shirvan') },
    { value: 'Yevlakh', label: t('regions.yevlakh') },
    // Districts (Rayons)
    { value: 'Absheron', label: t('regions.absheron') },
    { value: 'Aghjabadi', label: t('regions.aghjabadi') },
    { value: 'Agdam', label: t('regions.agdam') },
    { value: 'Agdash', label: t('regions.agdash') },
    { value: 'Agdere', label: t('regions.agdere') },
    { value: 'Agstafa', label: t('regions.agstafa') },
    { value: 'Agsu', label: t('regions.agsu') },
    { value: 'Astara', label: t('regions.astara') },
    { value: 'Babek', label: t('regions.babek') },
    { value: 'Balakan', label: t('regions.balakan') },
    { value: 'Beylagan', label: t('regions.beylagan') },
    { value: 'Barda', label: t('regions.barda') },
    { value: 'Bilasuvar', label: t('regions.bilasuvar') },
    { value: 'Jabrayil', label: t('regions.jabrayil') },
    { value: 'Jalilabad', label: t('regions.jalilabad') },
    { value: 'Julfa', label: t('regions.julfa') },
    { value: 'Dashkasan', label: t('regions.dashkasan') },
    { value: 'Fuzuli', label: t('regions.fuzuli') },
    { value: 'Gadabay', label: t('regions.gadabay') },
    { value: 'Goranboy', label: t('regions.goranboy') },
    { value: 'Goychay', label: t('regions.goychay') },
    { value: 'Goygol', label: t('regions.goygol') },
    { value: 'Hajigabul', label: t('regions.hajigabul') },
    { value: 'Khachmaz', label: t('regions.khachmaz') },
    { value: 'Khizi', label: t('regions.khizi') },
    { value: 'Khojaly', label: t('regions.khojaly') },
    { value: 'Khojavend', label: t('regions.khojavend') },
    { value: 'Imishli', label: t('regions.imishli') },
    { value: 'Ismayilli', label: t('regions.ismayilli') },
    { value: 'Kalbajar', label: t('regions.kalbajar') },
    { value: 'Kangarli', label: t('regions.kangarli') },
    { value: 'Kurdamir', label: t('regions.kurdamir') },
    { value: 'Gakh', label: t('regions.gakh') },
    { value: 'Gazakh', label: t('regions.gazakh') },
    { value: 'Gabala', label: t('regions.gabala') },
    { value: 'Gobustan', label: t('regions.gobustan') },
    { value: 'Guba', label: t('regions.guba') },
    { value: 'Gubadli', label: t('regions.gubadli') },
    { value: 'Gusar', label: t('regions.gusar') },
    { value: 'Lachin', label: t('regions.lachin') },
    { value: 'Lerik', label: t('regions.lerik') },
    { value: 'Masalli', label: t('regions.masalli') },
    { value: 'Neftchala', label: t('regions.neftchala') },
    { value: 'Oghuz', label: t('regions.oghuz') },
    { value: 'Ordubad', label: t('regions.ordubad') },
    { value: 'Saatli', label: t('regions.saatli') },
    { value: 'Sabirabad', label: t('regions.sabirabad') },
    { value: 'Salyan', label: t('regions.salyan') },
    { value: 'Samukh', label: t('regions.samukh') },
    { value: 'Sadarak', label: t('regions.sadarak') },
    { value: 'Siyazan', label: t('regions.siyazan') },
    { value: 'Shabran', label: t('regions.shabran') },
    { value: 'Shahbuz', label: t('regions.shahbuz') },
    { value: 'Shamakhi', label: t('regions.shamakhi') },
    { value: 'Shamkir', label: t('regions.shamkir') },
    { value: 'Sharur', label: t('regions.sharur') },
    { value: 'Shusha', label: t('regions.shusha') },
    { value: 'Tartar', label: t('regions.tartar') },
    { value: 'Tovuz', label: t('regions.tovuz') },
    { value: 'Ujar', label: t('regions.ujar') },
    { value: 'Yardimli', label: t('regions.yardimli') },
    { value: 'Zaqatala', label: t('regions.zaqatala') },
    { value: 'Zangilan', label: t('regions.zangilan') },
    { value: 'Zardab', label: t('regions.zardab') },
    { value: 'Remote', label: t('vacancies.remote') },
    { value: 'Other', label: t('regions.other') },
  ];

  const experienceOptions = [
    { value: 'all', label: t('filters.allLevels') },
    { value: 'Entry level', label: t('vacancies.experienceOptions.entry') },
    { value: '1-2 years', label: t('vacancies.experienceOptions.oneToTwo') },
    { value: '2-5 years', label: t('vacancies.experienceOptions.twoToFive') },
    { value: '5+ years', label: t('vacancies.experienceOptions.fivePlus') },
  ];

  const getTypeLabel = (val: string) => {
    const found = typesOptions.find(o => o.value === val);
    return found ? found.label : val;
  };

  const getLocationLabel = (val: string) => {
    const found = locationsOptions.find(o => o.value === val);
    if (found) return found.label;
    if (val === 'Unknown') return t('common.unknown');
    return val;
  };

  const getExperienceLabel = (val: string) => {
    const found = experienceOptions.find(o => o.value === val);
    return found ? found.label : val;
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredVacancies = vacancies.filter(vacancy => {
    const matchesSearch =
      normalizedSearch === '' ||
      [vacancy.title, vacancy.organization, vacancy.description].some(field =>
        typeof field === 'string' && field.toLowerCase().includes(normalizedSearch)
      );
    const matchesType = selectedType === 'all' || vacancy.type === selectedType;
    const matchesLocation = selectedLocation === 'all' || vacancy.location === selectedLocation;
    const matchesExperience = selectedExperience === 'all' || vacancy.experience === selectedExperience;
    
    return matchesSearch && matchesType && matchesLocation && matchesExperience;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Full-time': return 'bg-green-100 text-green-800';
      case 'Part-time': return 'bg-blue-100 text-blue-800';
      case 'Volunteer': return 'bg-purple-100 text-purple-800';
      case 'Internship': return 'bg-orange-100 text-orange-800';
      case 'Contract': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isDeadlineNear = (deadline?: string) => {
    if (!isValidDate(deadline)) return false;
    const deadlineDate = new Date(deadline as string);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isDeadlinePassed = (deadline?: string) => {
    if (!isValidDate(deadline)) return false;
    const deadlineDate = new Date(deadline as string);
    const today = new Date();
    return deadlineDate < today;
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' || selectedType !== 'all' || selectedLocation !== 'all' || selectedExperience !== 'all';

  const errorMessage = errorKey ? t(errorKey) : '';

  const hasApplicationProcess = (applicationProcess: any) => {
    if (!applicationProcess) return false;
    if (typeof applicationProcess !== 'object') return false;
    return Object.keys(applicationProcess).length > 0;
  };

  if (loading) {
    return (
      <LoadingState 
        text={t('common.loading')}
        gradientFrom="from-indigo-50"
        gradientVia="via-purple-50"
        gradientTo="to-pink-50"
        spinnerColor="border-indigo-600"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-blue-700 to-indigo-900 text-white py-16 sm:py-20 lg:py-24">
        {/* Animated Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

        <div className="section-padding relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight animate-slide-up px-4">
              {t('vacancies.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto animate-fade-in px-4">
              {t('vacancies.subtitle')}
            </p>
          </div>
        </div>

      </section>

      {/* Search and Filters - Standardized Design */}
      <section className="section-padding py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <ResourceFilterContainer
            title={t('filters.findYourJob')}
            subtitle={t('filters.useFiltersToNarrow')}
            iconGradient="from-green-600 to-emerald-600"
            borderColor="border-green-100"
            searchInput={
              <Input
                type="text"
                id="search"
                label={t('vacancies.searchLabel')}
                placeholder={t('vacancies.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                iconPosition="left"
                inputSize="md"
                aria-label={t('vacancies.searchAria')}
              />
            }
            filterControls={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Type Filter */}
                <div>
                  <Select
                    label={t('filters.type')}
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    options={typesOptions}
                    placeholder={t('filters.allTypes')}
                    selectSize="md"
                  />
                </div>

                {/* Location Filter */}
                <div>
                  <Select
                    label={t('filters.location')}
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    options={locationsOptions}
                    placeholder={t('filters.allLocations')}
                    selectSize="md"
                  />
                </div>

                {/* Experience Filter */}
                <div>
                  <Select
                    label={t('filters.experience')}
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    options={experienceOptions}
                    placeholder={t('filters.allLevels')}
                    selectSize="md"
                  />
                </div>
              </div>
            }
            activeFilters={
              hasActiveFilters ? (
                <ActiveFilterBadges
                  badges={[
                    ...(selectedType !== 'all' ? [{
                      id: 'type',
                      label: t('filters.type'),
                      value: getTypeLabel(selectedType),
                      onRemove: () => setSelectedType('all'),
                      colorScheme: 'green' as const,
                    }] : []),
                    ...(selectedLocation !== 'all' ? [{
                      id: 'location',
                      label: t('filters.location'),
                      value: getLocationLabel(selectedLocation),
                      onRemove: () => setSelectedLocation('all'),
                      colorScheme: 'blue' as const,
                    }] : []),
                    ...(selectedExperience !== 'all' ? [{
                      id: 'experience',
                      label: t('filters.experience'),
                      value: getExperienceLabel(selectedExperience),
                      onRemove: () => setSelectedExperience('all'),
                      colorScheme: 'indigo' as const,
                    }] : []),
                  ]}
                  onClearAll={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                    setSelectedLocation('all');
                    setSelectedExperience('all');
                  }}
                />
              ) : undefined
            }
          />
        </div>
      </section>

      {/* Job Listings - Modern Card Design */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-green-100 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="section-padding relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Results Count */}
            <div className="mb-6 sm:mb-8 flex items-center justify-between">
              <p className="text-gray-700 font-medium">
                {t('vacancies.showingResults', {
                  count: formatNumber(filteredVacancies.length),
                  total: formatNumber(vacancies.length)
                })}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Job Cards - Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!loading && !errorMessage && filteredVacancies.map((vacancy, idx) => {
                const deadlineNear = isDeadlineNear(vacancy.deadline);
                const deadlinePassed = isDeadlinePassed(vacancy.deadline);
                const structuredProcess = hasApplicationProcess(vacancy.applicationProcess);
                const formattedPostedDate = formatDate(vacancy.postedDate, 'vacancies.unknown');
                const formattedDeadline = formatDate(vacancy.deadline, 'vacancies.dateTBD');

                return (
                  <article 
                    key={vacancy.id} 
                    className={`group relative bg-gradient-to-br from-white to-teal-50/50 rounded-2xl p-6 border-2 border-gray-200 hover:border-teal-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${deadlinePassed ? 'opacity-60' : ''} animate-fade-in flex flex-col overflow-hidden`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {/* Shine Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-transparent to-cyan-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>

                    <div className="relative z-10 flex flex-col h-full">
                      {/* Icon Section */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg group-hover:shadow-xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
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
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
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
                          <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
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
                        <div className={`flex items-center gap-2 text-sm font-medium ${
                          deadlinePassed
                            ? 'text-red-600'
                            : deadlineNear
                              ? 'text-orange-600'
                              : 'text-gray-700'
                        }`}>
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
                            {t('vacancies.viewDetails')}
                          </ButtonLink>
                          
                          {(!vacancy.deadline || !deadlinePassed) && (
                            <>
                            {structuredProcess && vacancy.applicationProcess?.applicationLink && (
                              <ButtonLink
                                href={vacancy.applicationProcess.applicationLink}
                                external
                                variant="gradient-green"
                                size="sm"
                                hoverEffect="scale"
                                className="flex-1 text-center justify-center"
                              >
                                {t('vacancies.apply')}
                              </ButtonLink>
                            )}
                            {!structuredProcess && vacancy.applicationLink && (
                              <ButtonLink
                                href={vacancy.applicationLink}
                                external
                                variant="gradient-green"
                                size="sm"
                                hoverEffect="scale"
                                className="flex-1 text-center justify-center"
                              >
                                {t('vacancies.apply')}
                              </ButtonLink>
                            )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
            })}
            </div>

            {(!loading && !errorMessage && filteredVacancies.length === 0) && (
              <div className="text-center py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-teal-50 rounded-3xl border-2 border-dashed border-gray-300 animate-fade-in">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-teal-200 rounded-full blur-3xl opacity-20"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 sm:mb-3">
                  {t('vacancies.noVacanciesFound')}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
                  {t('vacancies.noVacanciesMessage')}
                </p>
                {hasActiveFilters && (
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedType('all');
                        setSelectedLocation('all');
                        setSelectedExperience('all');
                      }}
                      variant="primary"
                      size="lg"
                      className="group font-bold hover:scale-105 transition-all duration-300"
                    >
                      <X className="w-5 h-5 mr-2" />
                      {t('common.clearFilters')}
                    </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Post Opportunity Section - Enhanced & Engaging */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-blue-600 to-indigo-600"></div>
        
        {/* Animated Blobs */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-20 right-10 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="section-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Floating Icon */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-300 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 shadow-2xl animate-float">
                  <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 sm:mb-4 leading-tight px-4">
                {t('vacancies.postTitle')}
              </h3>
              <p className="text-base sm:text-lg lg:text-xl text-white/95 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto px-4 font-light">
                {t('vacancies.postSubtitle')}
              </p>
              
              {/* Stats Pills */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 px-4">
                {[
                    { icon: Users, text: t('vacancies.postStats.reachCandidates') },
                    { icon: Briefcase, text: t('vacancies.postStats.freePosting') }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full border border-white/20 hover:bg-white/25 transition-all duration-300 hover:scale-105 w-full sm:w-auto animate-scale-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <ButtonLink 
                  href={localePath("/auth/login")}
                  variant="white-on-dark"
                  size="lg"
                  icon={Briefcase}
                  iconPosition="left"
                  shadow="xl"
                  hoverEffect="scale"
                  className="w-full sm:w-auto"
                >
                  {t('vacancies.loginToPost')}
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </ButtonLink>
                <ButtonLink 
                  href={localePath("/auth/register?type=ngo")}
                  variant="outline"
                  size="lg"
                  icon={Users}
                  iconPosition="left"
                  shadow="xl"
                  hoverEffect="scale"
                  className="w-full sm:w-auto"
                >
                  {t('vacancies.registerAsNgo')}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}