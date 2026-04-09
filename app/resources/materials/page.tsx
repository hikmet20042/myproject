'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui';
import { ExternalLink, Sparkles, Search, FileText, Clock, Eye, ArrowRight } from 'lucide-react';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { ResourceFilterContainer, EmptyState, ResourceCard } from '@/components/shared';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ApiError } from '@/lib/apiClient';
import { getUserErrorMessage } from '@/lib/errorMessages';
import { ListPageLayout } from '@/components/layout';

interface Material { _id: string;
  title: string;
  description: string;
  category: 'toolkit' | 'course' | 'video' | 'guide' | 'document' | 'emergency' | 'other';
  type: string;
  url: string;
  imageUrl?: string;
  provider?: string;
  duration?: string;
  language?: string[];
  tags?: string[];
  featured?: boolean;
  views?: number; }

const normalizeMaterial = (raw: any): Material => ({
  _id: raw?._id || raw?.id || '',
  title: raw?.title || '',
  description: raw?.description || '',
  category: (raw?.category || 'other') as Material['category'],
  type: raw?.type || '',
  url: raw?.url || '',
  imageUrl: raw?.imageUrl || raw?.image_url || undefined,
  provider: raw?.provider || undefined,
  duration: raw?.duration || undefined,
  language: Array.isArray(raw?.language) ? raw.language : undefined,
  tags: Array.isArray(raw?.tags) ? raw.tags : [],
  featured: Boolean(raw?.featured),
  views: typeof raw?.views === 'number' ? raw.views : 0,
});

const extractMaterials = (payload: any): Material[] => {
  const candidates = [
    payload?.items,
    payload?.materials,
    payload?.data?.items,
    payload?.data?.materials,
  ];

  const list = candidates.find(Array.isArray);
  if (!Array.isArray(list)) return [];
  return list.map(normalizeMaterial);
};

export default function Resources() {
  const localePath = useLocalizedPath();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchMaterials(); }, []);

  const fetchMaterials = async () => { try { setLoading(true);
      const response = await fetch('/api/materials?limit=100');
      const data = await response.json();

      if (response.ok) {
        setMaterials(extractMaterials(data));
      } else {
        const apiError = new ApiError(
          data?.error?.message || 'Materiallar yüklənmədi',
          data?.error?.code,
          data?.error?.details
        );
        if (apiError.code) {
          console.error('Materials API error code:', apiError.code, apiError.details);
        }
        setError(getUserErrorMessage(apiError));
      } } catch (error) {
      if (error instanceof ApiError && error.code) {
        console.error('Materials API error code:', error.code, error.details);
      } else {
        console.error('Materialları yükləmə xətası:', error);
      }
      setError(getUserErrorMessage(error)); } finally { setLoading(false); } };

  // Filter materials
  const filteredMaterials = materials.filter(material => { const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.provider?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch; });
  const hasActiveFilters = selectedCategory !== 'all' || searchTerm.trim() !== '';

  // Group materials by category
  const groupedMaterials = { toolkit: filteredMaterials.filter(m => m.category === 'toolkit'),
    course: filteredMaterials.filter(m => m.category === 'course'),
    video: filteredMaterials.filter(m => m.category === 'video'),
    guide: filteredMaterials.filter(m => m.category === 'guide'),
    emergency: filteredMaterials.filter(m => m.category === 'emergency'),
    other: filteredMaterials.filter(m => m.category === 'other') };

  const categories = [
    { value: 'all', label: 'Hamısı' },
    { value: 'toolkit', label: 'Alətlər dəsti' },
    { value: 'course', label: 'Kurslar' },
    { value: 'video', label: 'Videolar' },
    { value: 'guide', label: 'Bələdçilər' },
    { value: 'emergency', label: 'Təcili resurslar' },
    { value: 'other', label: 'Digər' }
  ];

  const getCategoryIcon = (category: string) => { switch (category) { case 'toolkit': return '🛠️';
      case 'course': return '🎓';
      case 'video': return '🎥';
      case 'guide': return '📖';
      case 'emergency': return '🚨';
      default: return '📚'; } };

    const getCategoryColor = (category: string) => { switch (category) { case 'toolkit': return 'from-blue-500 to-blue-700';
      case 'course': return 'from-green-500 to-green-700';
      case 'video': return 'from-red-500 to-red-700';
      case 'guide': return 'from-cyan-500 to-blue-600';
      case 'emergency': return 'from-orange-500 to-orange-700';
      default: return 'from-gray-500 to-gray-700'; } };

    const getBorderColor = (category: string) => { switch (category) { case 'toolkit': return 'hover:border-blue-300';
      case 'course': return 'hover:border-green-300';
      case 'video': return 'hover:border-red-300';
      case 'guide': return 'hover:border-cyan-300';
      case 'emergency': return 'hover:border-orange-300';
      default: return 'hover:border-gray-300'; } };

  return (
    <ListPageLayout
      title="Tədris Materialları"
      description="Gender bərabərliyi və icma rifahına fokuslanan təlimatlar, kurslar, videolar və endirilə bilən bələdçilərə daxil olun."
      icon={Sparkles}
      headerActions={
        <>
          <ButtonLink href={localePath('/submit')} variant="secondary" size="lg" hoverEffect="scale">
            {'Bloq Paylaş'}
          </ButtonLink>
          <ButtonLink href={localePath('/resources')} variant="outline" size="lg" hoverEffect="scale">
            {'Fürsətləri Kəşf Et'}
          </ButtonLink>
        </>
      }
      isLoading={loading}
      isError={Boolean(error)}
      isEmpty={!loading && !error && filteredMaterials.length === 0 && !hasActiveFilters}
      loadingText="Yüklənir"
      errorTitle="Materiallar yüklənərkən xəta"
      errorMessage={error}
      retryText="Yenidən cəhd edin"
      onRetry={fetchMaterials}
      emptyTitle="Material tapılmadı"
      emptyMessage="Hazırda göstəriləcək material yoxdur."
      filterSection={
        <ResourceFilterContainer
              title={'Filtrlə və axtar'}
              subtitle={'Uyğun öyrənmə resursunu tap'}
              iconGradient="from-blue-600 to-emerald-600"
              borderColor="border-blue-100"
              searchInput={ <div className="space-y-4">
                  <Input
                    type="text"
                    label={'Axtar'}
                    placeholder={'Materiallar axtar...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={Search}
                    iconPosition="left"
                  />
                  <div className="text-sm text-gray-600">
                    {`${materials.length}-dən ${filteredMaterials.length} material göstərilir`}
                  </div>
                </div> }
              filterControls={ <div className="mt-4">
                  <Select
                    label={'Kateqoriya'}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    options={categories}
                  />
                </div> }
            />
      }
      contentContainerClassName="max-w-7xl mx-auto"
      content={
        <>

            {Object.entries(groupedMaterials).map(([category, categoryMaterials]) => { if (categoryMaterials.length === 0) return null;

              const categoryTitle = categories.find(c => c.value === category)?.label || category;

              return (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${getCategoryColor(category)} flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl">{getCategoryIcon(category)}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{categoryTitle}</h2>
                      <p className="text-sm text-gray-600">{categoryMaterials.length} material</p>
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 ${categoryMaterials.length > 1 ? 'md:grid-cols-2' : ''} ${categoryMaterials.length > 2 ? 'lg:grid-cols-3' : ''} gap-6`}>
                    {categoryMaterials.map((material) => (
                      <ResourceCard
                        key={material._id}
                        type="material"
                        title={material.title}
                        description={material.description}
                        hoverBorderColor={getBorderColor(category)}
                        icon={
                          material.imageUrl ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                              <Image
                                src={material.imageUrl}
                                alt={material.provider || material.title}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          ) : (
                            <div className={`w-14 h-14 bg-gradient-to-br ${getCategoryColor(category)} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300`}>
                              <span className="text-2xl">{getCategoryIcon(category)}</span>
                            </div>
                          )
                        }
                        badges={[
                          { label: material.type, variant: 'info' },
                          ...(material.tags || []).slice(0, 3).map((tag) => ({ label: `#${tag}`, variant: 'secondary' as const })),
                        ]}
                        metadata={
                          <>
                            {material.provider && (
                              <span className="text-xs text-gray-500 truncate">{material.provider}</span>
                            )}
                            {(material.duration || material.views) && (
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {material.duration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{material.duration}</span>
                                  </div>
                                )}
                                {material.views && (
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{material.views}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        }
                        actions={
                          <ButtonLink
                            href={material.url}
                            external
                            variant="primary"
                            icon={ExternalLink}
                            className="w-full justify-center"
                          >
                            {'Resursa bax'}
                          </ButtonLink>
                        }
                      />
                    ))}
                  </div>
                </div>
              ); })}

            {filteredMaterials.length === 0 && hasActiveFilters && (
              <EmptyState
                title="Material tapılmadı"
                message="Axtarış və ya filtrləri dəyişməyi sına"
                actionText="Filtrləri təmizlə"
                onAction={() => { setSearchTerm('');
                  setSelectedCategory('all'); }}
              />
            )}
        </>
      }
      bottomCta={
          <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-12 text-center shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              {'Dəyişiklik etməyə hazırsan?'}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              {'Resurslarını icma ilə paylaş və ya gender bərabərliyini dəstəkləmək üçün daha çox materiala bax.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ButtonLink
                href={localePath('/submit')}
                variant="secondary"
                size="lg"
                icon={FileText}
                iconPosition="left"
                hoverEffect="scale"
              >
                {'Resurs Göndər'}
              </ButtonLink>
              <ButtonLink
                href={localePath('/resources')}
                variant="outline"
                size="lg"
                hoverEffect="scale"
              >
                {'Daha Çoxunu Kəşf Et'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </ButtonLink>
            </div>
          </div>
      }
    />
  ) }
