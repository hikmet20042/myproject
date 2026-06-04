'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import Script from 'next/script'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button, ButtonLink, SearchBar } from '@/components/ui'
import { Select } from '@/components/ui/Select'
import { EmptyState, ResourceFilterContainer, ActiveFilterBadges } from '@/components/shared'
import type { FilterBadge } from '@/components/shared/ActiveFilterBadges'
import { ListPageLayout } from '@/components/layout'
import { Sparkles } from 'lucide-react'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useAccountType } from '@/hooks/useAccountType'
import { blogQueryKeys, fetchBlogs } from '@/lib/blogQueries'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { logError } from '@/lib/logger'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { ContentCard } from '@/components/shared/ContentCard'
import { generateItemListSchema } from '@/lib/seo'
import { ARTICLE_TAGS } from '@/lib/tagOptions'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Ən yeni' },
  { value: 'oldest', label: 'Ən köhnə' },
  { value: 'most-viewed', label: 'Ən çox baxılan' },
  { value: 'most-liked', label: 'Ən çox bəyənilən' },
]

const TAG_OPTIONS = [
  { value: 'all', label: 'Bütün mövzular' },
  ...ARTICLE_TAGS.slice(0, 20).map(tag => ({
    value: tag,
    label: tag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  })),
]

const generateExcerpt = (content: any): string => {
  let textContent = '';
  if (typeof content === 'string') {
    textContent = content;
  } else if (Array.isArray(content)) {
    textContent = content
      .map((block: any) => {
        if (block.content && Array.isArray(block.content)) {
          return block.content.map((item: any) => item.text || '').join('');
        }
        return '';
      })
      .join(' ')
      .trim();
  }
  const words = textContent.split(' ');
  if (words.length <= 30) {
    return textContent;
  }
  return words.slice(0, 30).join(' ') + '...';
}

const TAG_LABEL_MAP: Record<string, string> = {}
ARTICLE_TAGS.forEach(tag => {
  TAG_LABEL_MAP[tag] = tag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
})

export default function CommunityBlogs() {
  const localePath = useLocalizedPath();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountType = useAccountType()
  const isOrganizationUser = accountType === 'organization'
  const { showError } = useGlobalFeedback()
  const blogsLimit = 50

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const isUserAction = useRef(false);

  useEffect(() => {
    if (isUserAction.current) {
      isUserAction.current = false;
      return;
    }
    if (!searchParams) return;
    const q = searchParams.get('q') || '';
    const tag = searchParams.get('tag') || 'all';
    const sort = searchParams.get('sort') || 'newest';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const p = searchParams.get('page');
    const pageNum = p ? (Number.isFinite(Number.parseInt(p, 10)) ? Math.max(1, Number.parseInt(p, 10)) : 1) : 1;
    setSearchQuery(q);
    setSelectedTag(tag);
    setSortBy(sort);
    setDateFrom(from);
    setDateTo(to);
    setPage(pageNum);
  }, [searchParams]);

  const replaceUrl = useCallback((updates: Record<string, string | null>) => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const qs = params.toString();
    router.replace(qs ? `/blogs?${qs}` : '/blogs', { scroll: false });
  }, [router, searchParams]);

  const queryFilters = useMemo(() => ({
    page,
    limit: blogsLimit,
    search: searchQuery.trim() || undefined,
    tags: selectedTag !== 'all' ? selectedTag : undefined,
    sortBy: sortBy as 'newest' | 'oldest' | 'most-viewed' | 'most-liked',
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [searchQuery, selectedTag, sortBy, dateFrom, dateTo, page, blogsLimit])

  const blogsQuery = useQuery({
    queryKey: blogQueryKeys.list(queryFilters),
    queryFn: () => fetchBlogs(queryFilters)
  })

  const goToPage = (newPage: number) => {
    isUserAction.current = true;
    setPage(newPage);
    replaceUrl({ page: newPage > 1 ? String(newPage) : null });
  };

  const handleSearch = (query: string) => {
    isUserAction.current = true;
    setSearchQuery(query);
    setPage(1);
    replaceUrl({ q: query || null, page: null });
  };
  const handleClearSearch = () => {
    isUserAction.current = true;
    setSearchQuery('');
    setPage(1);
    replaceUrl({ q: null, page: null });
  };

  const handleTagChange = (tag: string) => {
    isUserAction.current = true;
    setSelectedTag(tag);
    setPage(1);
    replaceUrl({ tag: tag === 'all' ? null : tag, page: null });
  };
  const handleSortChange = (sort: string) => {
    isUserAction.current = true;
    setSortBy(sort);
    setPage(1);
    replaceUrl({ sort, page: null });
  };
  const handleDateFromChange = (date: string) => {
    isUserAction.current = true;
    setDateFrom(date);
    setPage(1);
    replaceUrl({ from: date || null, page: null });
  };
  const handleDateToChange = (date: string) => {
    isUserAction.current = true;
    setDateTo(date);
    setPage(1);
    replaceUrl({ to: date || null, page: null });
  };

  const clearAllFilters = () => {
    isUserAction.current = true;
    setSearchQuery('');
    setSelectedTag('all');
    setSortBy('newest');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    router.replace('/blogs', { scroll: false });
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedTag !== 'all' || sortBy !== 'newest' || dateFrom !== '' || dateTo !== '';

  const filterBadges: FilterBadge[] = useMemo(() => {
    const badges: FilterBadge[] = []
    if (searchQuery.trim()) {
      badges.push({
        id: 'search',
        label: 'Axtarış',
        value: searchQuery,
        onRemove: () => { isUserAction.current = true; setSearchQuery(''); setPage(1); replaceUrl({ q: null, page: null }); },
        colorScheme: 'blue',
      })
    }
    if (selectedTag !== 'all') {
      badges.push({
        id: 'tag',
        label: 'Mövzu',
        value: TAG_LABEL_MAP[selectedTag] || selectedTag,
        onRemove: () => { isUserAction.current = true; setSelectedTag('all'); setPage(1); replaceUrl({ tag: null, page: null }); },
        colorScheme: 'green',
      })
    }
    if (sortBy !== 'newest') {
      const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || sortBy
      badges.push({
        id: 'sort',
        label: 'Sıralama',
        value: sortLabel,
        onRemove: () => { isUserAction.current = true; setSortBy('newest'); setPage(1); replaceUrl({ sort: null, page: null }); },
        colorScheme: 'indigo',
      })
    }
    if (dateFrom) {
      badges.push({
        id: 'dateFrom',
        label: 'Tarixdən',
        value: dateFrom,
        onRemove: () => { isUserAction.current = true; setDateFrom(''); setPage(1); replaceUrl({ from: null, page: null }); },
        colorScheme: 'amber',
      })
    }
    if (dateTo) {
      badges.push({
        id: 'dateTo',
        label: 'Tarixə',
        value: dateTo,
        onRemove: () => { isUserAction.current = true; setDateTo(''); setPage(1); replaceUrl({ to: null, page: null }); },
        colorScheme: 'amber',
      })
    }
    return badges
  }, [searchQuery, selectedTag, sortBy, dateFrom, dateTo, replaceUrl])

  const allBlogs = (blogsQuery.data?.items || [])
    .map((blog: any) => ({
      id: blog._id || blog.id,
      kind: 'blog' as const,
      title: blog.title,
      href: localePath(`/blogs/${blog.slug}`),
      badge: 'İcma Bloqu',
      coverImage: blog.featuredImage || blog.featured_image,
      dateLabel: new Date(blog.createdAt || blog.created_at || blog.date || Date.now()).toLocaleDateString('az-AZ', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      ownerLabel: blog.authorName || blog.author_name || 'Anonim',
      excerpt: blog.excerpt || generateExcerpt(blog.content),
    }))

  const totalPages = blogsQuery.data?.pagination?.pages || 0;

  const itemListJsonLd = useMemo(() => {
    if (blogsQuery.isLoading || allBlogs.length === 0) return '';
    return JSON.stringify(generateItemListSchema({
      name: 'İcma Bloqları - icma360',
      description: 'Azərbaycan gənclərinin real təcrübələri, uğur hekayələri və faydalı məqalələri.',
      items: allBlogs.slice(0, 20).map((b) => ({
        name: b.title,
        url: b.href,
        description: b.excerpt?.slice(0, 100) || '',
      })),
    }));
  }, [allBlogs, blogsQuery.isLoading]);

  return (
    <>
      {itemListJsonLd && (
        <Script id="blogs-itemlist-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListJsonLd }} />
      )}
      <ListPageLayout
        title="İcma Bloqları"
        description="İcma üzvlərimizin real təcrübələri, çətinlikləri və uğurları. Dəyişikliyə ilham verən həqiqi hekayələr."
        headerBadgeText="BLOQLAR"
        pageType="blog"
        icon={Sparkles}
        headerActions={
          isOrganizationUser ? (
            <>
              <ButtonLink href={localePath('/dashboard/events/create')} variant="secondary" size="lg" className="rounded-full px-8">
                Tədbir Paylaş
              </ButtonLink>
              <ButtonLink href={localePath('/dashboard/vacancies/create')} variant="white-on-dark" size="lg" className="rounded-full px-8">
                Vakansiya Paylaş
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink href={localePath('/submit/blog')} variant="secondary" size="lg" className="rounded-full px-8 shadow-xl shadow-blue-500/20">
                Bloq Paylaş
              </ButtonLink>
              <ButtonLink href={localePath('/resources')} variant="white-on-dark" size="lg" className="rounded-full px-8">
                Fürsətləri Kəşf Et
              </ButtonLink>
            </>
          )
        }
        isLoading={blogsQuery.isLoading}
        isError={blogsQuery.isError}
        isEmpty={!blogsQuery.isLoading && !blogsQuery.isError && allBlogs.length === 0 && !hasActiveFilters}
        onRetry={() => blogsQuery.refetch()}
        filterSection={
          <ResourceFilterContainer
            searchInput={
              <SearchBar
                onSearch={handleSearch}
                onClear={handleClearSearch}
                placeholder="Mövzu və ya müəllif axtarın..."
                value={searchQuery}
                variant="minimal"
              />
            }
            filterControls={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mövzu</label>
                  <Select
                    value={selectedTag}
                    onChange={(e) => handleTagChange(e.target.value)}
                    options={TAG_OPTIONS}
                    placeholder="Mövzu seçin..."
                    className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sıralama</label>
                  <Select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    options={SORT_OPTIONS}
                    className="bg-slate-50 border-none rounded-2xl h-14 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tarixdən</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl h-14 px-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tarixə</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl h-14 px-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            }
            activeFilters={
              hasActiveFilters ? (
                <ActiveFilterBadges
                  badges={filterBadges}
                  onClearAll={clearAllFilters}
                  showClearAll={filterBadges.length > 1}
                />
              ) : undefined
            }
          />
        }
        content={
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
              {allBlogs.length > 0 ? (
                allBlogs.map((blog) => (
                  <ContentCard key={blog.id} item={blog} />
                ))
              ) : (
                <div className="col-span-full py-20">
                  <EmptyState
                    title="Bloq tapılmadı"
                    message={hasActiveFilters ? 'Axtarış meyarlarını dəyişərək yenidən yoxlayın.' : 'Hələlik bloq yazısı yoxdur.'}
                    actionText="Filtrləri sıfırla"
                    onAction={clearAllFilters}
                  />
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="rounded-xl px-4 py-2 text-xs font-bold"
                >
                  Əvvəlki
                </Button>
                <span className="text-sm font-semibold text-slate-500 px-4">
                  Səhifə {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="rounded-xl px-4 py-2 text-xs font-bold"
                >
                  Növbəti
                </Button>
              </div>
            )}
          </>
        }
        bottomCta={
          <div className="text-center py-10">
            <h3 className="text-3xl md:text-5xl font-black mb-6 text-white">Öz hekayəni danış</h3>
            <p className="text-slate-400 font-medium text-lg mb-10 max-w-2xl mx-auto">
              Sənin təcrübələrin başqalarına ilham verə bilər. İcma ilə bölüş və dəyişikliyin bir hissəsi ol.
            </p>
            <div className="flex justify-center">
              <ButtonLink
                href={localePath('/submit/blog')}
                variant="white-on-dark"
                size="lg"
                className="rounded-2xl px-10 py-4 font-black"
              >
                Bloq yazısını göndər
              </ButtonLink>
            </div>
          </div>
        }
      />
    </>
  );
}
