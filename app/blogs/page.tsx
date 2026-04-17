'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import BlogCard from '@/features/blogs/components/BlogCard'
import { Button, ButtonLink, SearchBar } from '@/components/ui'
import { EmptyState } from '@/components/shared'
import { ListPageLayout } from '@/components/layout'
import { BookOpen, Sparkles, RefreshCw, Heart, ArrowRight, Users } from 'lucide-react'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useSession } from '@/lib/auth/client'
import { blogQueryKeys, fetchBlogs } from '@/lib/blogQueries'
import { ApiError } from '@/lib/apiClient'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { logError } from '@/lib/logger'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'

interface CommunityBlog { id: string | number;
  slug: string;
  title: string;
  authorName: string;
  authorId?: string | null;
  authorUrlHandle?: string | null;
  date: string;
  excerpt: string;
  content: any; // Can be string or BlockNote array
  status: string;
  type: 'community-blog';
  likes?: number;
  dislikes?: number;
  views?: number;
  saves?: number; }

const generateExcerpt = (content: any): string => { let textContent = '';
  
  if (typeof content === 'string') { textContent = content; } else if (Array.isArray(content)) { // Handle BlockNote content array
    textContent = content
      .map((block: any) => { if (block.content && Array.isArray(block.content)) { return block.content
            .map((item: any) => item.text || '')
            .join(''); }
        return ''; })
      .join(' ')
      .trim(); }
  
  const words = textContent.split(' ');
  if (words.length <= 30) { return textContent; }
  return words.slice(0, 30).join(' ') + '...'; }

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

  // Client-side filtering based on search only
  const handleSearch = (query: string) => { setSearchQuery(query); };

  const handleClearSearch = () => { setSearchQuery(''); };

  if (blogsQuery.isError) {
    const apiError = blogsQuery.error instanceof ApiError ? blogsQuery.error : null
    if (apiError?.code) {
      logError('Blogs API error', apiError)
    }
  }

  useEffect(() => {
    if (blogsQuery.isError) {
      showError(getUserErrorMessage(blogsQuery.error))
    }
  }, [blogsQuery.isError, blogsQuery.error, showError])

  const allBlogs: CommunityBlog[] = (blogsQuery.data?.items || [])
    .filter((blog: any) => blog.status === 'approved')
    .map((blog: any) => ({
      id: blog._id || blog.id,
      slug: blog.slug,
      title: blog.title,
      authorName: blog.authorName || blog.author_name || 'Anonim',
      authorId: blog.author_id || blog.authorId || null,
      authorUrlHandle: blog.authorUrlHandle || blog.author_url_handle || null,
      date: blog.createdAt || blog.created_at || blog.submittedAt || blog.date || new Date().toISOString(),
      excerpt: blog.excerpt || generateExcerpt(blog.content),
      content: blog.content,
      status: blog.status,
      type: 'community-blog',
      likes: blog.likes || 0,
      dislikes: blog.dislikes || 0,
      views: blog.views || 0,
      saves: blog.saves || 0,
    }))

  const filteredBlogs = allBlogs.filter(blog => { const matchesSearch = !searchQuery || 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof blog.content === 'string' && blog.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch; });

  return (
    <ListPageLayout
      title="İcma Bloqları"
      description="İcma üzvlərimizin real təcrübələri, çətinlikləri və uğurları. Dəyişikliyə ilham verən və anlaşmanı genişləndirən həqiqi hekayələr."
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
            <ButtonLink href={localePath('/submit/blog')} variant="secondary" size="lg" hoverEffect="scale">
              {'Bloq Paylaş'}
            </ButtonLink>
            <ButtonLink href={localePath('/resources')} variant="outline" size="lg" hoverEffect="scale">
              {'Fürsətləri Kəşf Et'}
            </ButtonLink>
          </>
        )
      }
      isLoading={blogsQuery.isLoading}
      isError={blogsQuery.isError}
      errorTitle="Bloqlar yüklənmədi"
      errorMessage={blogsQuery.isError ? getUserErrorMessage(blogsQuery.error) : undefined}
      onRetry={() => blogsQuery.refetch()}
      isEmpty={!blogsQuery.isLoading && !blogsQuery.isError && allBlogs.length === 0 && !searchQuery}
      emptyTitle="Hələ bloq yoxdur"
      emptyMessage="Hal-hazırda heç bir icma bloqu yoxdur."
      filterSection={
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{'İcma Bloqları'}</h2>
              <p className="text-sm md:text-base text-gray-600 mt-1">{'İcmamızdan ilhamverici səsləri kəşf et'}</p>
            </div>

            <Button
              onClick={() => blogsQuery.refetch()}
              disabled={blogsQuery.isFetching}
              variant="outline"
              size="lg"
              className="group border border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold transition-colors w-full sm:w-auto"
            >
              {blogsQuery.isFetching ? (
                <>
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  {'Yenilənir...'}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  {'Bloqları Yenilə'}
                </>
              )}
            </Button>
          </div>

          <SearchBar
            onSearch={handleSearch}
            onClear={handleClearSearch}
            placeholder={'Başlıq, məzmun və ya xülasəyə görə axtarın...'}
            value={searchQuery}
            storageKey="blogs-search"
          />

          {searchQuery && (
            <div className="mt-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <span className="text-gray-700">
                {`"${searchQuery}" üçün axtarış nəticəsi - ${filteredBlogs.length} ${filteredBlogs.length === 1 ? 'nəticə' : 'nəticə'} tapıldı`}
              </span>
            </div>
          )}
        </div>
      }
      content={
        <>
            {allBlogs.length > 0 && allBlogs.some(blog => blog.status === 'pending') && (
              <div className="mb-6">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 shadow-sm sm:px-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-blue-900 mb-1">{'Sənin Bloqların'}</h3>
                      <p className="text-xs sm:text-sm text-blue-800">{'Bunlar sənin göndərdiyin şəxsi bloqlardır. Onlar brauzeriə yerli olaraq saxlanılır.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {filteredBlogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={'Axtarış nəticəsi tapılmadı'}
                message={`"${searchQuery}" üçün bloq tapılmadı.`}
                actionText={'Bütün Bloqlara Bax'}
                onAction={handleClearSearch}
              />
            )}
        </>
      }
      bottomCta={
          <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-12 text-center shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              {isOrganizationUser ? 'Tədbir və Vakansiyanı Paylaş' : 'Öz Bloqunu Paylaş'}
            </h3>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              {isOrganizationUser
                ? 'Təşkilat olaraq yeni tədbir və vakansiyalarını paneldən paylaş, daha çox gəncə çat.'
                : 'Sənin şəxsi təcrübələrin vacibdir. Öz yolunu, çətinliklərini və uğurlarını paylaşaraq başqalarına ilham ver və icmamızda mənalı dəyişikliklər yarat.'}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
              {[
                ...(isOrganizationUser
                  ? [
                      { icon: Sparkles, text: 'Tədbir Əlavə Et' },
                      { icon: Users, text: 'Vakansiya Paylaş' },
                      { icon: ArrowRight, text: 'Paneldən İdarə Et' },
                    ]
                  : [
                      { icon: Heart, text: 'Hekayəni Paylaş' },
                      { icon: Users, text: 'Başqalarına İlham Ver' },
                      { icon: Sparkles, text: 'Dəyişiklik Yarat' },
                    ]),
              ].map((item, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-slate-50 px-4 py-2">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {isOrganizationUser ? (
                <>
                  <ButtonLink href={localePath('/dashboard/events/create')} variant="secondary" size="lg" icon={Sparkles} iconPosition="left" hoverEffect="scale">
                    {'Tədbir Paylaş'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </ButtonLink>
                  <ButtonLink href={localePath('/dashboard/vacancies/create')} variant="outline" size="lg" icon={Sparkles} iconPosition="left" hoverEffect="scale">
                    {'Vakansiya Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/dashboard/profile')} variant="outline" size="lg" hoverEffect="scale">
                    {'Təşkilat Paneli'}
                  </ButtonLink>
                </>
              ) : (
                <ButtonLink
                  href={localePath('/submit/blog')}
                  variant="secondary"
                  size="lg"
                  icon={Sparkles}
                  iconPosition="left"
                  hoverEffect="scale"
                >
                  {'Bloqunu Göndər'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </ButtonLink>
              )}
            </div>
          </div>
      }
    />
  ) }
