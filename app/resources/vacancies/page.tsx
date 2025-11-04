"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, X, Briefcase, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useLanguage } from '@/contexts/LanguageContext';
import SaveButton from '@/components/SaveButton';
import ViewTracker from '@/components/ViewTracker'
import { useLocalizedPath } from '@/lib/useLocalizedPath';

export default function VacanciesPage() {
  const { t } = useLanguage();
  const localePath = useLocalizedPath();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/vacancies?status=approved&limit=50');
        if (!res.ok) throw new Error('Failed to fetch vacancies');
        const data = await res.json();
        const mapped = (data.vacancies || []).map((v: any) => {
          const locationString = v?.location?.isRemote
            ? 'Remote'
            : v?.location?.city || v?.location?.address || '—';
          const compensation = v?.compensation;
          let salary: string | undefined = undefined;
          if (compensation) {
            if (compensation.type === 'paid' && compensation.amount && compensation.currency) {
              salary = `${compensation.amount} ${compensation.currency}`;
            } else if (compensation.type === 'stipend') {
              salary = t('vacancies.stipend');
            } else if (compensation.type === 'unpaid') {
              salary = t('vacancies.volunteer');
            }
          }
          return {
            id: v._id,
            title: v.title,
            organization: v.createdBy?.name || '—',
            type: v.type,
            location: locationString,
            experience: v.experienceLevel,
            salary,
            deadline: v.applicationDeadline,
            description: v.description,
            requirements: v.requirements || [],
            applicationProcess: v.applicationProcess || {},
            applicationLink: v.applicationProcess?.applicationLink,
            postedDate: v.createdAt,
            verified: v.status === 'approved',
            views: v.views || 0,
          };
        });
        setVacancies(mapped);
      } catch (e) {
        console.error(e);
        setError(t('vacancies.errorLoading'));
      } finally {
        setLoading(false);
      }
    };
    fetchVacancies();
  }, [t]);

  const typesOptions = [
    { value: 'all', label: t('filters.allTypes') },
    { value: 'Full-time', label: t('vacancies.fullTime') },
    { value: 'Part-time', label: t('vacancies.partTime') },
    { value: 'Volunteer', label: t('vacancies.volunteer') },
    { value: 'Internship', label: t('vacancies.internship') },
    { value: 'Contract', label: 'Contract' },
  ];

  const locationsOptions = [
    { value: 'all', label: t('filters.allLocations') },
    { value: 'Baku', label: t('charts.regions.baku') },
    { value: 'Ganja', label: t('charts.regions.ganja') },
    { value: 'Sumgayit', label: t('charts.regions.sumqayit') },
    { value: 'Remote', label: t('vacancies.remote') },
    { value: 'Other', label: t('charts.regions.otherRegions') },
  ];

  const experienceOptions = [
    { value: 'all', label: t('filters.allLevels') },
    { value: 'Entry level', label: t('vacancies.experience.entry') },
    { value: '1-2 years', label: t('vacancies.experience.mid') || '1-2 years' },
    { value: '2-5 years', label: t('vacancies.experience.mid') || '2-5 years' },
    { value: '5+ years', label: t('vacancies.experience.senior') || '5+ years' },
  ];

  const getTypeLabel = (val: string) => {
    const found = typesOptions.find(o => o.value === val);
    return found ? found.label : val;
  };

  const getLocationLabel = (val: string) => {
    const found = locationsOptions.find(o => o.value === val);
    return found ? found.label : val;
  };

  const getExperienceLabel = (val: string) => {
    const found = experienceOptions.find(o => o.value === val);
    return found ? found.label : val;
  };

  const filteredVacancies = vacancies.filter(vacancy => {
    const matchesSearch = vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacancy.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacancy.description.toLowerCase().includes(searchTerm.toLowerCase());
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

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isDeadlinePassed = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' || selectedType !== 'all' || selectedLocation !== 'all' || selectedExperience !== 'all';

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Hero Section - Modern & Engaging */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-blue-600 to-indigo-900 text-white py-16 sm:py-20 lg:py-24">
        {/* Animated Blobs */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        <div className="section-padding relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4 sm:mb-6 animate-fade-in">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">{t('vacancies.careerOpportunities')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight animate-slide-up px-4">
              {t('vacancies.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto animate-fade-in px-4 font-light">
              {t('vacancies.subtitle')}
            </p>

            {/* Stats Pills */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 px-4 animate-scale-in">
              {[
                { icon: Briefcase, label: t('vacancies.totalJobs'), value: vacancies.length },
                { icon: MapPin, label: t('filters.allLocations'), value: new Set(vacancies.map(v => v.location)).size },
                { icon: Users, label: t('labels.active_members'), value: '1,000+' }
              ].map((stat, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 sm:hover:scale-110 w-full sm:w-auto"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-lg sm:text-xl font-black">{stat.value}</div>
                    <div className="text-xs text-white/80">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* Search and Filters - Enhanced Modern Design */}
      <section className="section-padding py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 animate-fade-in">
            {/* Section Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-5 h-5 text-green-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('filters.findYourJob')}</h2>
              </div>
              <p className="text-sm text-gray-600">{t('filters.useFiltersToNarrow')}</p>
            </div>

            {/* Top row: search + selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              {/* Search */}
              <div className="lg:col-span-2">
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
                  aria-label="Search vacancies"
                />
              </div>

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

            {/* Active filters row */}
            {hasActiveFilters && (
              <div className="mt-6 flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                <span className="text-sm font-medium text-gray-700">{t('common.activeFilters')}:</span>
                {selectedType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium border border-green-200 shadow-sm">
                    {t('filters.type')}: {getTypeLabel(selectedType)}
                    <button aria-label="Clear type filter" onClick={() => setSelectedType('all')} className="p-0.5 hover:text-green-900 hover:bg-green-200 rounded-full transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {selectedLocation !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium border border-blue-200 shadow-sm">
                    {t('filters.location')}: {getLocationLabel(selectedLocation)}
                    <button aria-label="Clear location filter" onClick={() => setSelectedLocation('all')} className="p-0.5 hover:text-blue-900 hover:bg-blue-200 rounded-full transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {selectedExperience !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium border border-indigo-200 shadow-sm">
                    {t('filters.experience')}: {getExperienceLabel(selectedExperience)}
                    <button aria-label="Clear experience filter" onClick={() => setSelectedExperience('all')} className="p-0.5 hover:text-indigo-900 hover:bg-indigo-200 rounded-full transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {/* Clear all */}
                <div className="ml-auto">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedType('all');
                      setSelectedLocation('all');
                      setSelectedExperience('all');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-medium transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                    {t('common.clearAll')}
                  </button>
                </div>
              </div>
            )}
          </div>
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
                <span className="text-2xl font-black text-gray-900">{filteredVacancies.length}</span>{' '}
                {t('vacancies.showingResults', { count: filteredVacancies.length, total: vacancies.length })}
              </p>
            </div>

            {/* Job Cards */}
            <div className="space-y-4 sm:space-y-6">
              {!loading && !error && filteredVacancies.map((vacancy, idx) => (
                <div 
                  key={vacancy.id} 
                  className={`group relative bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-green-500 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 ${vacancy.deadline && isDeadlinePassed(vacancy.deadline) ? 'opacity-60' : ''} animate-fade-in`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-blue-500/0 group-hover:from-green-500/5 group-hover:to-blue-500/5 transition-all duration-500 rounded-2xl"></div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors leading-tight">
                                  {vacancy.title}
                                </h3>
                                <p className="text-base sm:text-lg text-gray-700 mb-4 font-medium">
                                  {vacancy.organization}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <ViewTracker
                                  itemId={vacancy.id}
                                  itemType="vacancy"
                                  initialViews={vacancy.views}
                                  showCount={true}
                                />
                                <SaveButton
                                  itemId={vacancy.id}
                                  itemType="vacancy"
                                  itemTitle={vacancy.title}
                                  size="md"
                                  showText={false}
                                />
                              </div>
                            </div>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              <span className={`inline-flex items-center text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${getTypeColor(vacancy.type)}`}>
                                {vacancy.type}
                              </span>
                              <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-3 py-1.5 rounded-full font-medium">
                                <MapPin className="w-3 h-3 mr-1" />
                                {vacancy.location}
                              </span>
                              <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-3 py-1.5 rounded-full font-medium">
                                <Briefcase className="w-3 h-3 mr-1" />
                                {vacancy.experience}
                              </span>
                              {vacancy.salary && (
                                <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-3 py-1.5 rounded-full font-medium">
                                  💰 {vacancy.salary}
                                </span>
                              )}
                              {vacancy.verified && (
                                <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-3 py-1.5 rounded-full font-bold shadow-sm">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {t('ngos.verified')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">
                          {vacancy.description}
                        </p>

                        {vacancy.requirements && vacancy.requirements.length > 0 && (
                          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {t('vacancies.keyRequirements')}
                            </h4>
                            <ul className="space-y-1">
                              {vacancy.requirements?.slice(0, 3).map((req: string, index: number) => (
                                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-blue-600 mt-0.5">•</span>
                                  <span className="line-clamp-1">{req}</span>
                                </li>
                              ))}
                              {vacancy.requirements.length > 3 && (
                                <li className="text-sm text-blue-600 font-medium">{t('vacancies.moreRequirements', { count: vacancy.requirements.length - 3 })}</li>
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm">
                            <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {t('vacancies.posted')}: {new Date(vacancy.postedDate).toLocaleDateString()}
                            </span>
                            <span className={`flex items-center gap-1.5 font-bold ${
                              vacancy.deadline && isDeadlinePassed(vacancy.deadline) 
                                ? 'text-red-600' 
                                : vacancy.deadline && isDeadlineNear(vacancy.deadline) 
                                  ? 'text-orange-600' 
                                  : 'text-gray-700'
                            }`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {t('vacancies.deadline')}: {vacancy.deadline ? new Date(vacancy.deadline).toLocaleDateString() : '—'}
                              {vacancy.deadline && isDeadlineNear(vacancy.deadline) && !isDeadlinePassed(vacancy.deadline) && (
                                <span className="ml-1">⚠️</span>
                              )}
                              {vacancy.deadline && isDeadlinePassed(vacancy.deadline) && (
                                <span className="ml-1">❌</span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex gap-2 sm:gap-3">
                            <Link href={localePath(`/resources/vacancies/${vacancy.id}`)}>
                              <Button variant="outline" className="inline-flex items-center font-bold hover:scale-105 transition-all duration-300">
                                {t('vacancies.viewDetails')}
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Button>
                            </Link>
                            
                            {!vacancy.deadline || !isDeadlinePassed(vacancy.deadline) && (
                              <div>
                              {/* Application Process */}
                              {vacancy.applicationProcess?.applicationLink && (
                                <a
                                  href={vacancy.applicationLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="primary" className="inline-flex items-center font-bold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 shadow-lg">
                                    {t('vacancies.applyNow')}
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </Button>
                                </a>
                              )}
                              {vacancy.applicationProcess?.email && (
                                <a
                                  href={`mailto:${vacancy.applicationProcess.email}?subject=Application for ${vacancy.title}`}
                                >
                                  <Button variant="primary" className="inline-flex items-center font-bold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 shadow-lg">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {t('common.emailApplication') || 'Email Application'}
                                  </Button>
                                </a>
                              )}
                              {/* Fallback for old data structure */}
                              {!vacancy.applicationProcess && vacancy.applicationLink && (
                                <a
                                  href={vacancy.applicationLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="primary" className="inline-flex items-center font-bold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 shadow-lg">
                                    {t('vacancies.applyNow')}
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </Button>
                                </a>
                              )}
                            </div>
                          )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(!loading && !error && filteredVacancies.length === 0) && (
              <div className="text-center py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-green-50 rounded-3xl border-2 border-dashed border-gray-300 animate-fade-in">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-green-200 rounded-full blur-3xl opacity-20"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  { icon: Users, text: 'Reach Qualified Candidates' },
                  { icon: Briefcase, text: 'Free Posting' },
                  { icon: MapPin, text: 'Global & Local Reach' }
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
                <Link href={localePath("/auth/login")} className="w-full sm:w-auto">
                  <Button 
                    size="lg"
                    className="group bg-white text-green-700 hover:bg-yellow-300 hover:text-green-900 px-6 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-2xl hover:shadow-yellow-300/50 transition-all duration-300 hover:scale-105 sm:hover:scale-110 w-full"
                  >
                    <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:rotate-12 transition-transform" />
                    {t('vacancies.loginToPost')}
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </Link>
                <Link href={localePath("/auth/register?type=ngo")} className="w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="group border-2 sm:border-3 border-white/70 text-blue-700 hover:bg-white/20 backdrop-blur-md px-6 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg hover:scale-105 sm:hover:scale-110 transition-all duration-300 shadow-xl w-full"
                  >
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:rotate-12 transition-transform" />
                    {t('vacancies.registerAsNgo')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}