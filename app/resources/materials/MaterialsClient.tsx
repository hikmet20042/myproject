'use client'

import { useState, useEffect } from 'react';
import { Button, ButtonLink, SearchBar } from '@/components/ui';
import { Sparkles, RefreshCw, BookOpen } from 'lucide-react';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { EmptyState, ResourceFilterContainer } from '@/components/shared';
import { Select } from '@/components/ui/Select';
import { ApiError } from '@/lib/apiClient';
import { getUserErrorMessage } from '@/lib/errorMessages';
import { ListPageLayout } from '@/components/layout';
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback';
import { useAccountType } from '@/hooks/useAccountType';
import { ContentCard } from '@/components/shared/ContentCard';

interface Material { 
  _id: string;
  title: string;
  description: string;
  category: 'toolkit' | 'course' | 'video' | 'guide' | 'document' | 'emergency' | 'other';
  type: string;
  url: string;
  imageUrl?: string;
  provider?: string;
  createdAt?: string;
}

export default function MaterialsPage() {
  const localePath = useLocalizedPath();
  const accountType = useAccountType();
  const isOrganizationUser = accountType === 'organization';
  const { showError } = useGlobalFeedback();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMaterials = async () => { 
    try { 
      setLoading(true);
      const response = await fetch('/api/materials?limit=100');
      const data = await response.json();
      if (response.ok) {
        const items = data?.items || data?.materials || data?.data?.items || [];
        setMaterials(items.map((m: any) => ({
          ...m,
          _id: m._id || m.id
        })));
      } else {
        setError(getUserErrorMessage(data?.error));
      } 
    } catch (error) {
      setError(getUserErrorMessage(error)); 
    } finally { 
      setLoading(false); 
    } 
  };

  useEffect(() => { fetchMaterials(); }, []);
  useEffect(() => { if (error) showError(error) }, [error, showError]);

  const filteredMaterials = materials.filter(material => { 
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch; 
  });

  const categories = [
    { value: 'all', label: 'Bütün növlər' },
    { value: 'toolkit', label: 'Alətlər dəsti' },
    { value: 'course', label: 'Kurslar' },
    { value: 'video', label: 'Videolar' },
    { value: 'guide', label: 'Bələdçilər' },
    { value: 'emergency', label: 'Təcili resurslar' }
  ];

  const getCategoryLabel = (val: string) => categories.find(c => c.value === val)?.label || 'Material';

  const mappedMaterials = filteredMaterials.map(m => ({
    id: m._id,
    kind: 'blog' as const, 
    title: m.title,
    href: m.url,
    badge: getCategoryLabel(m.category),
    coverImage: m.imageUrl,
    dateLabel: m.createdAt ? new Date(m.createdAt).toLocaleDateString('az-AZ') : 'Yeni',
    ownerLabel: m.provider || 'icma360',
  }));

  const hasActiveFilters = selectedCategory !== 'all' || searchTerm.trim() !== '';

  return (
    <ListPageLayout
      title="Tədris Materialları"
      description="Gənclərin inkişafına və bacarıqların artırılmasına yönəlmiş təlimatlar, kurslar və bələdçilər."
      headerBadgeText="RESURSLAR"
      pageType="material"
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
            <ButtonLink href={localePath('/submit/blog')} variant="secondary" size="lg" className="rounded-full px-8 shadow-xl shadow-blue-500/20">
              Hekayəni Paylaş
            </ButtonLink>
          </>
        )
      }
      isLoading={loading}
      isError={Boolean(error) && materials.length === 0}
      onRetry={fetchMaterials}
      isEmpty={!loading && filteredMaterials.length === 0 && !hasActiveFilters}
      filterSection={
        <ResourceFilterContainer
          searchInput={
            <SearchBar 
              onSearch={setSearchTerm} 
              placeholder="Material axtar..." 
              value={searchTerm}
              variant="minimal"
            />
          }
          filterControls={
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Kateqoriya</label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={categories}
                className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
              />
            </div>
          }
          activeFilters={hasActiveFilters && (
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
               className="rounded-full text-xs font-black bg-white"
             >
               Filtrləri təmizlə
             </Button>
          )}
        />
      }
      content={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
          {mappedMaterials.length > 0 ? (
            mappedMaterials.map((material) => (
              <ContentCard key={material.id} item={material} />
            ))
          ) : (
            <div className="col-span-full py-20">
              <EmptyState
                title="Material tapılmadı"
                message="Axtarış meyarlarını dəyişərək yenidən yoxlayın."
                actionText="Filtrləri sıfırla"
                onAction={() => { setSearchTerm(''); setSelectedCategory('all'); }}
              />
            </div>
          )}
        </div>
      }
      bottomCta={
        <div className="text-center py-10">
          <h3 className="text-3xl md:text-5xl font-black mb-6 text-white text-center">Resursunuz var?</h3>
          <p className="text-slate-400 font-medium text-lg mb-10 max-w-2xl mx-auto text-center">
            Faydalı materiallarınızı icma ilə paylaşaraq gənclərin inkişafına töhfə verə bilərsiniz.
          </p>
          <div className="flex justify-center">
            <ButtonLink
              href={localePath('/submit/blog')}
              variant="white-on-dark"
              size="lg"
              className="rounded-2xl px-10 py-4 font-black"
            >
              Material göndər
            </ButtonLink>
          </div>
        </div>
      }
    />
  );
}
