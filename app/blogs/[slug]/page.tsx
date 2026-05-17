'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Script from 'next/script'
import DOMPurify from 'dompurify'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calendar,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Share2,
  Bookmark,
  Home,
} from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import BlogReactionsContainer from '@/features/blogs/components/BlogReactionsContainer'
import { LoadingState, ErrorState } from '@/components/shared'
import SaveItemButtonContainer from '@/components/containers/SaveItemButtonContainer'
import ViewTracker from '@/components/ViewTracker'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { blogQueryKeys, fetchBlogById, resolveBlogIdentifier } from '@/lib/blogQueries'

function BlogContentSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 w-1/4 rounded bg-gray-200" />
      <div className="space-y-4">
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-[95%] rounded bg-gray-100" />
        <div className="h-4 w-[92%] rounded bg-gray-100" />
        <div className="h-4 w-[88%] rounded bg-gray-100" />
      </div>
    </div>
  )
}

const BlocknoteReadOnly = dynamic(
  () => import('@/components/BlocknoteReadOnly'),
  {
    ssr: false,
    loading: () => <BlogContentSkeleton />,
  },
)

function calculateReadingTime(content: any): number {
  if (!content) return 1
  let text = ''
  if (typeof content === 'string') {
    text = content
  } else if (typeof content === 'object') {
    const extractText = (obj: any): string => {
      if (typeof obj === 'string') return obj
      if (Array.isArray(obj)) return obj.map(extractText).join(' ')
      if (obj && typeof obj === 'object') {
        return Object.values(obj).map(extractText).join(' ')
      }
      return ''
    }
    text = extractText(content)
  }
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('az-AZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

type Blog = {
  id: string
  _id?: string
  slug: string
  title: string
  authorName: string
  author?: string
  authorUrlHandle?: string | null
  isAnonymous?: boolean
  submittedAt?: string
  date?: string
  status?: string
  abstract?: string
  content?: any
  contentHtml?: string
  likes?: number
  dislikes?: number
  views?: number
  tags?: string[]
  featuredImage?: string | null
}

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const localePath = useLocalizedPath()
  const { data: session } = useSession()
  const { showError } = useGlobalFeedback()
  const contentRef = useRef<HTMLDivElement>(null)
  const [readingProgress, setReadingProgress] = useState(0)

  const targetSlug = useMemo(() => params.slug, [params.slug])

  const resolveQuery = useQuery({
    queryKey: ['blog-resolve', targetSlug],
    queryFn: () => resolveBlogIdentifier(targetSlug),
    enabled: !!targetSlug,
    retry: false,
  })
  const blogId = resolveQuery.data?.id || ''

  const blogQuery = useQuery({
    queryKey: blogQueryKeys.detail(blogId),
    queryFn: async () => {
      const apiBlog = await fetchBlogById(blogId)
      const apiBlogId = apiBlog.id || apiBlog._id
      return {
        id: apiBlogId,
        _id: apiBlogId,
        slug: apiBlog.slug,
        title: apiBlog.title,
        authorName: apiBlog.authorName || apiBlog.author_name,
        author: apiBlog.author?.toString?.() || apiBlog.author_id?.toString?.(),
        authorUrlHandle: apiBlog.authorUrlHandle || apiBlog.author_url_handle || null,
        isAnonymous: apiBlog.isAnonymous ?? apiBlog.is_anonymous,
        submittedAt: apiBlog.createdAt || apiBlog.created_at,
        date: apiBlog.createdAt || apiBlog.created_at,
        status: apiBlog.status,
        abstract: apiBlog.abstract || '',
        content: apiBlog.content,
        contentHtml: apiBlog.contentHtml || apiBlog.content_html || '',
        likes: apiBlog.likes || 0,
        dislikes: apiBlog.dislikes || 0,
        views: apiBlog.views || 0,
        tags: apiBlog.tags || [],
        featuredImage: apiBlog.featuredImage || apiBlog.featured_image || null,
      } as Blog
    },
    enabled: !!blogId,
    retry: false,
  })

  const blog = blogQuery.data || null

  const readingTime = useMemo(() => {
    if (!blog) return 1
    return calculateReadingTime(blog.content || blog.contentHtml)
  }, [blog])

  const publishedDate = blog?.submittedAt || blog?.date || ''
  const formattedDate = formatDate(publishedDate)
  const canAccessReactions = session?.user?.accountType !== 'organization'
  const backHref = localePath('/blogs')

  const safeHtml = blog?.contentHtml ? DOMPurify.sanitize(blog.contentHtml) : ''

  // Reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return
      const element = contentRef.current
      const totalHeight = element.scrollHeight - window.innerHeight
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0
      setReadingProgress(Math.min(100, Math.max(0, progress)))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (resolveQuery.isError || blogQuery.isError) {
      showError(
        (resolveQuery.error instanceof Error && resolveQuery.error.message) ||
          (blogQuery.error instanceof Error && blogQuery.error.message) ||
          'Bloq yüklənərkən xəta baş verdi'
      )
    }
  }, [resolveQuery.isError, resolveQuery.error, blogQuery.isError, blogQuery.error, showError])

  if (resolveQuery.isLoading || blogQuery.isLoading) {
    return <LoadingState text="Bloq yüklənir…" />
  }

  if (!blog || resolveQuery.isError || blogQuery.isError) {
    return (
      <ErrorState
        title="Bloq tapılmadı"
        message="Axtardığın bloq artıq mövcud deyil və ya silinib."
        onRetry={() => blogQuery.refetch()}
        retryText="Yenidən cəhd et"
      />
    )
  }

  // Metadata will be rendered inline below in the main layout

  const hasBlocknoteContent = Boolean(blog.content && typeof blog.content === 'object')

  const breadcrumbItems = [
    { name: 'Ana səhifə', href: localePath('/') },
    { name: 'Bloqlar', href: localePath('/blogs') },
    { name: blog.title, href: localePath(`/blogs/${blog.slug}`) },
  ]

  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.href,
    })),
  })

  const articleJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.abstract || blog.title,
    image: blog.featuredImage || `${process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'}/og-home.png`,
    datePublished: publishedDate,
    dateModified: blog.updatedAt || publishedDate,
    author: {
      '@type': 'Person',
      name: blog.authorName || 'Anonim',
    },
    publisher: {
      '@type': 'Organization',
      name: 'icma360',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'}/icma360_logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'}/blogs/${blog.slug}`,
    },
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'}/blogs/${blog.slug}`,
    keywords: blog.tags?.join(', '),
  })

  const mainContent = (
    <div id="blog-content" ref={contentRef} className="prose prose-lg max-w-none space-y-8
      prose-h2:font-bold prose-h2:text-3xl prose-h2:text-slate-900 prose-h2:mt-12 prose-h2:mb-6
      prose-h3:font-bold prose-h3:text-xl prose-h3:text-slate-900 prose-h3:mt-8 prose-h3:mb-4
      prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-base
      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-slate-900 prose-strong:font-semibold
      prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-slate-50 prose-blockquote:rounded-r-lg prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:italic prose-blockquote:text-slate-700 prose-blockquote:my-8
      prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-slate-900
      prose-pre:bg-gray-900 prose-pre:text-slate-100 prose-pre:rounded-md prose-pre:p-4 prose-pre:overflow-x-auto
      prose-ul:text-slate-700 prose-ol:text-slate-700
      prose-li:text-slate-700 prose-li:leading-relaxed prose-li:my-2
      prose-img:rounded-md prose-img:shadow-md prose-img:my-8
      prose-hr:border-slate-200 prose-hr:my-12
      prose-figure:my-8
      prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-slate-600 prose-figcaption:italic prose-figcaption:mt-2
    ">
      {hasBlocknoteContent ? (
        <BlocknoteReadOnly initialJSON={blog.content} textSize="large" />
      ) : safeHtml ? (
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      ) : (
        <div className="whitespace-pre-wrap text-slate-700">
          {blog.content || ''}
        </div>
      )}
    </div>
  )

  // Sidebar removed - content moved to main layout

  // actionSection will be rendered inline in the main layout

  return (
    <>
      {/* View tracking side-effect */}
      {blog?.status === 'approved' && (
        <ViewTracker itemType="blog" itemId={blog.id || blog._id || ''} minTimeMs={10000} selector="#blog-content" />
      )}

      {/* Reading progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-gray-100">
        <div style={{ width: `${readingProgress}%` }} className="h-1 bg-blue-600 transition-all duration-200" />
      </div>

      <div className="min-h-screen bg-white pt-20 pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-6 mb-12 flex-col sm:flex-row">
            <ol className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest order-2 sm:order-1" itemScope itemType="https://schema.org/BreadcrumbList">
              {breadcrumbItems.map((item, i) => (
                <li key={item.href} className="flex items-center gap-2" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  {i > 0 && <span className="text-slate-300" aria-hidden="true">/</span>}
                  {i < breadcrumbItems.length - 1 ? (
                    <Link href={item.href} className="hover:text-blue-600 transition-colors" itemProp="item">
                      <span itemProp="name">{i === 0 && <Home className="inline w-3.5 h-3.5 mr-1" />}{item.name}</span>
                    </Link>
                  ) : (
                    <span className="text-slate-900 truncate" itemProp="name">{item.name}</span>
                  )}
                  <meta itemProp="position" content={String(i + 1)} />
                </li>
              ))}
            </ol>
            <ButtonLink
              href={backHref}
              variant="outline"
              size="sm"
              className="gap-2 order-1 sm:order-2"
              icon={ArrowLeft}
              iconPosition="left"
            >
              Geri
            </ButtonLink>
          </nav>

          {/* JSON-LD Breadcrumbs */}
          <Script id="blog-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />

          {/* JSON-LD Article Schema */}
          <Script id="blog-article-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd }} />

          {/* Cover Image Card */}
          {blog.featuredImage && (
            <Card className="mb-12 overflow-hidden">
              <div className="relative w-full aspect-video">
                <Image
                  src={blog.featuredImage}
                  alt={blog.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </Card>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.15] text-slate-900 mb-8">
            {blog.title}
          </h1>

          {/* Metadata Block */}
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8 border-b border-slate-200 pb-6 mb-12">
            {/* Author Card */}
            {blog.authorName && (
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {blog.isAnonymous ? '?' : blog.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Müəllif</p>
                  {blog.authorUrlHandle ? (
                    <Link
                      href={localePath(`/u/${blog.authorUrlHandle}`)}
                      className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {blog.authorName}
                    </Link>
                  ) : (
                    <p className="font-bold text-slate-900">{blog.authorName}</p>
                  )}
                </div>
              </div>
            )}

            <div className="hidden md:block w-px h-10 bg-gray-200" />

            {/* Published Date */}
            {formattedDate && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Tarix</p>
                <p className="font-medium text-slate-900">{formattedDate}</p>
              </div>
            )}

            <div className="hidden md:block w-px h-10 bg-gray-200" />

            {/* Reading Time */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Oxuma müddəti</p>
              <div className="flex items-center gap-1.5 font-medium text-slate-900">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{readingTime} dəq</span>
              </div>
            </div>
          </div>

          {/* Interaction Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 py-6 mb-12 border-b border-slate-200">
            <div className="flex items-center gap-8">
              {blog.views !== undefined && blog.views >= 0 && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Eye className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium">{blog.views.toLocaleString()} baxış</span>
                </div>
              )}
              <div className="flex items-center gap-6">
                {blog.likes !== undefined && blog.likes >= 0 && (
                  <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 hover:text-blue-600">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-xs font-bold">{blog.likes.toLocaleString()}</span>
                  </Button>
                )}
                {blog.dislikes !== undefined && blog.dislikes >= 0 && (
                  <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 hover:text-red-600">
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-xs font-bold">{blog.dislikes.toLocaleString()}</span>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-slate-700 hover:text-blue-600"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: blog.title, url: window.location.href })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
                Paylaş
              </Button>
              <SaveItemButtonContainer
                itemId={blog._id || blog.id}
                itemType="blog"
                itemTitle={blog.title}
                size="md"
              />
            </div>
          </div>

          {/* Main Content */}
          {mainContent}

          {/* Tags & Reactions Section */}
          <div className="space-y-12 border-t border-slate-200 pt-12 mt-12">
            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {blog.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Reactions Section */}
            {blog.status === 'approved' && canAccessReactions && (
              <div className="text-center py-12">
                <h3 className="text-2xl font-bold text-slate-900 mb-8">Bu məqalə sənə necə gəldi?</h3>
                <div className="flex justify-center">
                  <BlogReactionsContainer
                    blogSlug={blog.slug}
                    initialLikes={blog.likes || 0}
                    initialDislikes={blog.dislikes || 0}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
