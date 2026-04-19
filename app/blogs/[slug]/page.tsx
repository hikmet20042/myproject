'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Share2,
  BookmarkPlus,
  MessageSquare,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import BlogReactionsContainer from '@/features/blogs/components/BlogReactionsContainer'
import { LoadingState, ErrorState } from '@/components/shared'
import { DetailPageLayout } from '@/components/layout'
import SaveItemButtonContainer from '@/components/containers/SaveItemButtonContainer'
import ViewTracker from '@/components/ViewTracker'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { blogQueryKeys, fetchBlogById } from '@/lib/blogQueries'

function BlogContentSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="h-5 w-40 rounded bg-gray-200" />
      <div className="mt-6 h-4 w-full rounded bg-gray-100" />
      <div className="mt-3 h-4 w-[95%] rounded bg-gray-100" />
      <div className="mt-3 h-4 w-[92%] rounded bg-gray-100" />
      <div className="mt-3 h-4 w-[88%] rounded bg-gray-100" />
      <div className="mt-8 h-4 w-full rounded bg-gray-100" />
      <div className="mt-3 h-4 w-[94%] rounded bg-gray-100" />
      <div className="mt-3 h-4 w-[90%] rounded bg-gray-100" />
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

  const metadata = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-gray-600">
      {/* Author */}
      {blog.authorName && (
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white font-bold text-xs shadow-sm"
          >
            {blog.isAnonymous ? '?' : blog.authorName.charAt(0).toUpperCase()}
          </span>
          {blog.authorUrlHandle ? (
            <Link
              href={localePath(`/u/${blog.authorUrlHandle}`)}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {blog.authorName}
            </Link>
          ) : (
            <span className="font-semibold text-gray-900">{blog.authorName}</span>
          )}
        </div>
      )}

      <div className="hidden sm:block w-px h-5 bg-gray-200" />

      {/* Date */}
      {formattedDate && (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{formattedDate}</span>
        </div>
      )}

      {/* Reading time */}
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-gray-400" />
        <span>{readingTime} dəq oxuma</span>
      </div>

      {/* Views */}
      {blog.views !== undefined && blog.views >= 0 && (
        <>
          <div className="hidden sm:block w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-gray-400" />
            <span>{blog.views.toLocaleString()}</span>
          </div>
        </>
      )}

      {/* Likes */}
      {blog.likes !== undefined && blog.likes >= 0 && (
        <div className="flex items-center gap-1.5">
          <ThumbsUp className="h-4 w-4 text-blue-500" />
          <span>{blog.likes.toLocaleString()}</span>
        </div>
      )}

      {/* Dislikes */}
      {blog.dislikes !== undefined && blog.dislikes >= 0 && (
        <div className="flex items-center gap-1.5">
          <ThumbsDown className="h-4 w-4 text-rose-500" />
          <span>{blog.dislikes.toLocaleString()}</span>
        </div>
      )}

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <>
          <div className="hidden sm:block w-px h-5 bg-gray-200" />
          <div className="flex flex-wrap gap-1.5">
            {blog.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )

  const hasBlocknoteContent = Boolean(blog.content && typeof blog.content === 'object')

  const mainContent = (
    <div id="blog-content" ref={contentRef} className="prose prose-lg max-w-none
      prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
      prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
      prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-4
      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-gray-900 prose-strong:font-semibold
      prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:not-italic prose-blockquote:text-gray-700
      prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono
      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-lg
      prose-li:text-gray-700 prose-li:leading-relaxed
      prose-img:rounded-xl prose-img:shadow-md
      prose-hr:border-gray-200
    ">
      {hasBlocknoteContent ? (
        <BlocknoteReadOnly initialJSON={blog.content} textSize="large" />
      ) : safeHtml ? (
        <div className="text-[1.12rem] leading-9" dangerouslySetInnerHTML={{ __html: safeHtml }} />
      ) : (
        <div className="whitespace-pre-wrap text-gray-700 text-[1.12rem] leading-9">
          {blog.content || ''}
        </div>
      )}
    </div>
  )

  const actionSection = (
    <>
      {/* Reactions */}
      {blog.status === 'approved' && canAccessReactions && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Bu məqalə haqqında nə düşünürsən?</h3>
                <p className="text-sm text-gray-500">Rəyini bildir və digər oxucularla bölüş</p>
              </div>
            </div>
            <BlogReactionsContainer
              blogSlug={blog.slug}
              initialLikes={blog.likes || 0}
              initialDislikes={blog.dislikes || 0}
            />
          </div>
        </section>
      )}

      {/* Save & Share */}
      <section className="flex flex-wrap items-center gap-3">
        <SaveItemButtonContainer
          itemId={blog._id || blog.id}
          itemType="blog"
          itemTitle={blog.title}
          size="md"
        />
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
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
      </section>
    </>
  )

  return (
    <>
      {/* View tracking side-effect */}
      {blog?.status === 'approved' && (
        <ViewTracker itemType="blog" itemId={blog.slug} minTimeMs={10000} selector="#blog-content" />
      )}

      <DetailPageLayout
      backHref={localePath('/blogs')}
      backLabel="Bloqlara qayıt"
      breadcrumbItems={[
        { label: 'Ana səhifə', href: localePath('/') },
        { label: 'Bloqlar', href: localePath('/blogs') },
        { label: blog.title, current: true },
      ]}
      title={blog.title}
      metadata={metadata}
      mainContent={mainContent}
      actionSection={actionSection}
      contentMaxWidthClass="max-w-6xl"
    />
    </>
  )
}
