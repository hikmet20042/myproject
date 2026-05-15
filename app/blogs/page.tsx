'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, ButtonLink, SearchBar } from '@/components/ui'
import { EmptyState, ResourceFilterContainer } from '@/components/shared'
import { ListPageLayout } from '@/components/layout'
import { Sparkles, RefreshCw } from 'lucide-react'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useSession } from '@/lib/auth/client'
import { blogQueryKeys, fetchBlogs } from '@/lib/blogQueries'
import { ApiError } from '@/lib/apiClient'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { logError } from '@/lib/logger'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { ContentCard } from '@/components/shared/ContentCard'

interface CommunityBlog {
  id: string | number;
  slug: string;
  title: string;
  authorName: string;
  authorId?: string | null;
  authorUrlHandle?: string | null;
  date: string;
  excerpt: string;
  content: any;
  status: string;
  type: 'community-blog';
}

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

export default function CommunityBlogs() {
  const localePath = useLocalizedPath();
  const { data: session } = useSession()
  const isOrganizationUser = session?.user?.accountType === 'organization'
  const { showError } = useGlobalFeedback()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const blogsLimit = 50
  
  const blogsQuery = useQuery({
    queryKey: blogQueryKeys.list({ page: 1, limit: blogsLimit }),
    queryFn: () => fetchBlogs({ page: 1, limit: blogsLimit })
  })

  const handleSearch = (query: string) => { setSearchQuery(query); };
  const handleClearSearch = () => { setSearchQuery(''); };

  useEffect(() => {
    if (blogsQuery.isError) {
      logError('Blogs API error', blogsQuery.error)
      showError(getUserErrorMessage(blogsQuery.error))
    }
  }, [blogsQuery.isError, blogsQuery.error, showError])

  const allBlogs = (blogsQuery.data?.items || [])
    .filter((blog: any) => blog.status === 'approved')
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

  const filteredBlogs = allBlogs.filter(blog => {
    const matchesSearch = !searchQuery || 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.ownerLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
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
            <ButtonLink href={localePath('/dashboard/vacancies/create')} variant="outline" size="lg" className="rounded-full px-8 bg-white/70 backdrop-blur-sm">
              Vakansiya Paylaş
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href={localePath('/submit/blog')} variant="secondary" size="lg" className="rounded-full px-8 shadow-xl shadow-blue-500/20">
              Bloq Paylaş
            </ButtonLink>
            <ButtonLink href={localePath('/resources')} variant="outline" size="lg" className="rounded-full px-8 bg-white/70 backdrop-blur-sm">
              Fürsətləri Kəşf Et
            </ButtonLink>
          </>
        )
      }
      isLoading={blogsQuery.isLoading}
      isError={blogsQuery.isError}
      isEmpty={!blogsQuery.isLoading && !blogsQuery.isError && allBlogs.length === 0 && !searchQuery}
      onRetry={() => blogsQuery.refetch()}
      filterSection={
        <ResourceFilterContainer
          searchInput={
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              placeholder="Mövzu və ya müəllif axtarın..."
              value={searchQuery}
              storageKey="blogs-search"
              variant="minimal"
            />
          }
          filterControls={
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-slate-500 font-bold text-sm">Tapılan nəticə: {filteredBlogs.length}</p>
                <Button
                  onClick={() => blogsQuery.refetch()}
                  disabled={blogsQuery.isFetching}
                  variant="outline"
                  className="rounded-xl font-bold bg-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${blogsQuery.isFetching ? 'animate-spin' : ''}`} />
                  Yenilə
                </Button>
             </div>
          }
        />
      }
      content={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map((blog) => (
              <ContentCard key={blog.id} item={blog} />
            ))
          ) : (
            <div className="col-span-full py-20">
              <EmptyState
                title="Bloq tapılmadı"
                message={`"${searchQuery}" üçün heç bir nəticə yoxdur.`}
                actionText="Filtrləri sıfırla"
                onAction={handleClearSearch}
              />
            </div>
          )}
        </div>
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
              variant="secondary"
              size="lg"
              className="rounded-2xl px-10 py-4 font-black bg-white text-slate-900 hover:bg-slate-100 border-none"
            >
              Bloq yazısını göndər
            </ButtonLink>
          </div>
        </div>
      }
    />
  )
}
