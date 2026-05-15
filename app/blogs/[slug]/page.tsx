'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import BlogReactionsContainer from '@/features/blogs/components/BlogReactionsContainer'
import { LoadingState, ErrorState } from '@/components/shared'
import SaveItemButtonContainer from '@/components/containers/SaveItemButtonContainer'
import ViewTracker from '@/components/ViewTracker'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { blogQueryKeys, fetchBlogById } from '@/lib/blogQueries'

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

  const blogQuery = useQuery({
    queryKey: blogQueryKeys.detail(targetSlug),
    queryFn: async () => {
      const apiBlog = await fetchBlogById(targetSlug)
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
    if (blogQuery.isError) {
      showError('Bloq yüklənərkən xəta baş verdi')
    }
  }, [blogQuery.isError, showError])

  if (blogQuery.isLoading) {
    return <LoadingState text="Bloq yüklənir…" />
  }

  if (!blog || blogQuery.isError) {
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

  const mainContent = (
    <div id="blog-content" ref={contentRef} className="prose prose-lg max-w-none space-y-8
      prose-h2:font-bold prose-h2:text-3xl prose-h2:text-gray-900 prose-h2:mt-12 prose-h2:mb-6
      prose-h3:font-bold prose-h3:text-xl prose-h3:text-gray-900 prose-h3:mt-8 prose-h3:mb-4
      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-base
      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-gray-900 prose-strong:font-semibold
      prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-slate-50 prose-blockquote:rounded-r-lg prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:my-8
      prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-gray-900
      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
      prose-ul:text-gray-700 prose-ol:text-gray-700
      prose-li:text-gray-700 prose-li:leading-relaxed prose-li:my-2
      prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
      prose-hr:border-gray-200 prose-hr:my-12
      prose-figure:my-8
      prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-gray-600 prose-figcaption:italic prose-figcaption:mt-2
    ">
      {hasBlocknoteContent ? (
        <BlocknoteReadOnly initialJSON={blog.content} textSize="large" />
      ) : safeHtml ? (
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      ) : (
        <div className="whitespace-pre-wrap text-gray-700">
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
        <ViewTracker itemType="blog" itemId={blog.slug} minTimeMs={10000} selector="#blog-content" />
      )}

      {/* Reading progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-gray-100">
        <div style={{ width: `${readingProgress}%` }} className="h-1 bg-blue-600 transition-all duration-200" />
      </div>

      <div className="min-h-screen bg-white pt-20 pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* Breadcrumbs & Back Button */}
          <div className="flex items-center justify-between gap-6 mb-12 flex-col sm:flex-row">
            <nav className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest order-2 sm:order-1">
              <Link href={localePath('/')} className="hover:text-blue-600 transition-colors">
                Ana səhifə
              </Link>
              <span className="text-gray-300">/</span>
              <Link href={localePath('/blogs')} className="hover:text-blue-600 transition-colors">
                Bloqlar
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 truncate">{blog.title}</span>
            </nav>
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-all whitespace-nowrap order-1 sm:order-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Geri</span>
            </Link>
          </div>

          {/* Cover Image Card */}
          {blog.featuredImage && (
            <div className="mb-12 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              <div className="relative w-full aspect-video">
                <Image
                  src={blog.featuredImage}
                  alt={blog.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.15] text-gray-900 mb-8">
            {blog.title}
          </h1>

          {/* Metadata Block */}
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8 border-b border-gray-200 pb-6 mb-12">
            {/* Author Card */}
            {blog.authorName && (
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {blog.isAnonymous ? '?' : blog.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500">Müəllif</p>
                  {blog.authorUrlHandle ? (
                    <Link
                      href={localePath(`/u/${blog.authorUrlHandle}`)}
                      className="font-bold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {blog.authorName}
                    </Link>
                  ) : (
                    <p className="font-bold text-gray-900">{blog.authorName}</p>
                  )}
                </div>
              </div>
            )}

            <div className="hidden md:block w-px h-10 bg-gray-200" />

            {/* Published Date */}
            {formattedDate && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Tarix</p>
                <p className="font-medium text-gray-900">{formattedDate}</p>
              </div>
            )}

            <div className="hidden md:block w-px h-10 bg-gray-200" />

            {/* Reading Time */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">Oxuma müddəti</p>
              <div className="flex items-center gap-1.5 font-medium text-gray-900">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{readingTime} dəq</span>
              </div>
            </div>
          </div>

          {/* Interaction Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 py-6 mb-12 border-b border-gray-200">
            <div className="flex items-center gap-8">
              {blog.views !== undefined && blog.views >= 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{blog.views.toLocaleString()} baxış</span>
                </div>
              )}
              <div className="flex items-center gap-6">
                {blog.likes !== undefined && blog.likes >= 0 && (
                  <button className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-xs font-bold">{blog.likes.toLocaleString()}</span>
                  </button>
                )}
                {blog.dislikes !== undefined && blog.dislikes >= 0 && (
                  <button className="flex items-center gap-1.5 text-gray-600 hover:text-red-600 transition-colors">
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-xs font-bold">{blog.dislikes.toLocaleString()}</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
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
              </button>
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
          <div className="space-y-12 border-t border-gray-200 pt-12 mt-12">
            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {blog.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Reactions Section */}
            {blog.status === 'approved' && canAccessReactions && (
              <div className="text-center py-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Bu məqalə sənə necə gəldi?</h3>
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
