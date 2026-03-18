'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button, ButtonLink } from '@/components/ui';
import { ExternalLink, BookOpen, Sparkles, Search, FileText, Clock, Eye, ArrowRight } from 'lucide-react';
import { useLocalizedPath } from '@/lib/useLocalizedPath';
import { LoadingState, ErrorState, ResourceFilterContainer } from '@/components/shared';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

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
      
      if (response.ok) { setMaterials(data.materials || []); } else { setError(data.error || 'Materiallar yüklənmədi'); } } catch (error) { console.error('Materialları yükləmə xətası:', error);
      setError('Materiallar yüklənmədi'); } finally { setLoading(false); } };

  // Filter materials
  const filteredMaterials = materials.filter(material => { const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.provider?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch; });

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

  if (loading) { return (
      <LoadingState 
        text={'Yüklənir'}
      />
    ); }

  if (error) { return (
      <ErrorState 
        title={'Materiallar yüklənərkən xəta'}
        message={error}
        retryText={'Yenidən cəhd edin'}
        onRetry={fetchMaterials}
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
              {'Tədris Materialları'}
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
              {'Tədris Materialları'}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-gray-600 leading-relaxed">
              {'Gender bərabərliyi və icma rifahına fokuslanan təlimatlar, kurslar, videolar və endirilə bilən bələdçilərə daxil olun.'}
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

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12">
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
                      <article
                        key={material._id}
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-emerald-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />

                        <div className="relative z-10">
                          {material.imageUrl ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                              <Image
                                src={material.imageUrl}
                                alt={material.provider || material.title}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          ) : (
                            <div className={`w-14 h-14 bg-gradient-to-br ${getCategoryColor(category)} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-all duration-300`}>
                              <span className="text-2xl">{getCategoryIcon(category)}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                              {material.type}
                            </span>
                            {material.provider && (
                              <span className="text-xs text-gray-500 truncate">{material.provider}</span>
                            )}
                          </div>

                          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {material.title}
                          </h3>

                          <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3">
                            {material.description}
                          </p>

                          {material.tags && material.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {material.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {(material.duration || material.views) && (
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-200">
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

                          <div className="pt-4 border-t border-gray-200">
                            <a href={material.url} target="_blank" rel="noopener noreferrer" className="w-full block">
                              <Button
                                variant="primary"
                                icon={ExternalLink}
                                className="w-full justify-center"
                              >
                                {'Resursa bax'}
                              </Button>
                            </a>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ); })}

            {filteredMaterials.length === 0 && (
              <div className="text-center py-16 rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {'Material tapılmadı'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {'Axtarış və ya filtrləri dəyişməyi sına'}
                </p>
                <Button
                  onClick={() => { setSearchTerm('');
                    setSelectedCategory('all'); }}
                  variant="primary"
                >
                  {'Filtrləri təmizlə'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-slate-50/60">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 md:p-12 text-center shadow-sm">
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
        </div>
      </section>
    </div>
  ) }
