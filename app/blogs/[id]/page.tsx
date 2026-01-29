'use client'

import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import dynamic from 'next/dynamic'
const BlocknoteReadOnly = dynamic(() => import('@/components/BlocknoteReadOnly'), { ssr: false })
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import BlogReactions from '@/components/BlogReactions'
import { LoadingState, ErrorState, AnimatedBackground } from '@/components/shared'
import { ArrowLeft, Calendar, User, Eye, Heart, MessageSquare, BookOpen, Sparkles } from 'lucide-react'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import ViewTracker from '@/components/ViewTracker'

// Custom CSS styles for professional BlocknoteReadOnly editor
const blogStyles = `
  .blog-content {
    line-height: 1.8;
    color: #2d3748;
  }
  
  /* Professional Magazine-Style BlocknoteReadOnly Editor */
  .bn-editor {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
  }
  
  .bn-editor .ProseMirror {
    padding: 0 !important;
    border: none !important;
    outline: none !important;
    line-height: 1.9 !important;
    color: #1a202c !important;
    background: transparent !important;
    font-size: 1.0625rem !important;
    letter-spacing: 0.01em !important;
  }
  
  /* Remove any editor-specific backgrounds */
  .bn-editor .ProseMirror-focused {
    background: transparent !important;
  }
  
  .bn-editor .bn-block-group {
    background: transparent !important;
  }
  
  .bn-editor .bn-block {
    background: transparent !important;
  }
  
  /* Beautiful Paragraphs */
  .bn-editor .ProseMirror p {
    margin-bottom: 1.75rem !important;
    text-align: justify !important;
    line-height: 1.9 !important;
    color: #374151 !important;
    font-weight: 400 !important;
    hyphens: auto !important;
    word-spacing: 0.05em !important;
  }
  
  .bn-editor .ProseMirror p:first-of-type::first-letter {
    font-size: 3.5em !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    float: left !important;
    margin: 0.1em 0.1em 0 0 !important;
    color: #4F46E5 !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }
  
  /* Elegant Headings */
  .bn-editor .ProseMirror h1, 
  .bn-editor .ProseMirror h2, 
  .bn-editor .ProseMirror h3, 
  .bn-editor .ProseMirror h4, 
  .bn-editor .ProseMirror h5, 
  .bn-editor .ProseMirror h6 {
    font-weight: 700 !important;
    margin-top: 2.5rem !important;
    margin-bottom: 1.25rem !important;
    color: #111827 !important;
    text-indent: 0 !important;
    letter-spacing: -0.02em !important;
    line-height: 1.3 !important;
  }
  
  .bn-editor .ProseMirror h1 {
    font-size: 2.25rem !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    border-bottom: 3px solid #E5E7EB !important;
    padding-bottom: 0.75rem !important;
  }
  
  .bn-editor .ProseMirror h2 {
    font-size: 1.875rem !important;
    color: #1F2937 !important;
    border-left: 4px solid #4F46E5 !important;
    padding-left: 1rem !important;
    border-bottom: 2px solid #E5E7EB !important;
    padding-bottom: 0.625rem !important;
  }
  
  .bn-editor .ProseMirror h3 {
    font-size: 1.5rem !important;
    color: #374151 !important;
    border-left: 3px solid #818CF8 !important;
    padding-left: 0.875rem !important;
  }
  
  .bn-editor .ProseMirro h4 {
    font-size: 1.25rem !important;
    color: #4B5563 !important;
  }
  
  /* Stylish Blockquotes */
  .bn-editor .ProseMirror blockquote {
    position: relative !important;
    border: none !important;
    padding: 1.5rem 2rem 1.5rem 4rem !important;
    margin: 2rem 0 !important;
    font-style: italic !important;
    background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%) !important;
    border-radius: 0.75rem !important;
    text-indent: 0 !important;
    color: #4338CA !important;
    font-size: 1.125rem !important;
    line-height: 1.75 !important;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06) !important;
  }
  
  .bn-editor .ProseMirror blockquote::before {
    content: '"' !important;
    position: absolute !important;
    left: 1rem !important;
    top: 0.5rem !important;
    font-size: 4rem !important;
    color: #818CF8 !important;
    opacity: 0.3 !important;
    font-family: Georgia, serif !important;
    line-height: 1 !important;
  }
  
  /* Enhanced Lists */
  .bn-editor .ProseMirror ul, 
  .bn-editor .ProseMirror ol {
    margin: 1.5rem 0 !important;
    padding-left: 2rem !important;
  }
  
  .bn-editor .ProseMirror ul li {
    margin-bottom: 0.75rem !important;
    text-indent: 0 !important;
    position: relative !important;
    padding-left: 0.5rem !important;
  }
  
  .bn-editor .ProseMirror ul li::marker {
    color: #4F46E5 !important;
    font-size: 1.2em !important;
  }
  
  .bn-editor .ProseMirror ol li {
    margin-bottom: 0.75rem !important;
    text-indent: 0 !important;
    padding-left: 0.5rem !important;
  }
  
  .bn-editor .ProseMirror ol li::marker {
    color: #4F46E5 !important;
    font-weight: 600 !important;
  }
  
  /* Inline Code */
  .bn-editor .ProseMirror code {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
    color: #DC2626 !important;
    padding: 0.25rem 0.5rem !important;
    border-radius: 0.375rem !important;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace !important;
    font-size: 0.9em !important;
    font-weight: 500 !important;
    border: 1px solid #E5E7EB !important;
  }
  
  /* Code Blocks */
  .bn-editor .ProseMirror pre {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
    color: #e2e8f0 !important;
    padding: 1.5rem !important;
    border-radius: 0.75rem !important;
    overflow-x: auto !important;
    margin: 2rem 0 !important;
    border: 1px solid #334155 !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2) !important;
  }
  
  .bn-editor .ProseMirror pre code {
    background: transparent !important;
    color: #e2e8f0 !important;
    border: none !important;
    padding: 0 !important;
    font-size: 0.9rem !important;
  }
  
  /* Beautiful Images */
  .bn-editor .ProseMirror img {
    max-width: 100% !important;
    height: auto !important;
    margin: 2.5rem auto !important;
    display: block !important;
    border-radius: 1rem !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
    border: 1px solid #E5E7EB !important;
  }
  
  /* Elegant Tables */
  .bn-editor .ProseMirror table {
    width: 100% !important;
    border-collapse: separate !important;
    border-spacing: 0 !important;
    margin: 2rem 0 !important;
    border-radius: 0.75rem !important;
    overflow: hidden !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  }
  
  .bn-editor .ProseMirror th, 
  .bn-editor .ProseMirror td {
    border: 1px solid #E5E7EB !important;
    padding: 1rem !important;
    text-align: left !important;
  }
  
  .bn-editor .ProseMirror th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    font-size: 0.875rem !important;
    letter-spacing: 0.05em !important;
  }
  
  .bn-editor .ProseMirror tr:nth-child(even) {
    background-color: #F9FAFB !important;
  }
  
  .bn-editor .ProseMirror tr:hover {
    background-color: #F3F4F6 !important;
  }
  
  /* Strong and Emphasis */
  .bn-editor .ProseMirror strong {
    font-weight: 700 !important;
    color: #111827 !important;
  }
  
  .bn-editor .ProseMirror em {
    font-style: italic !important;
    color: #4B5563 !important;
  }
  
  /* Links */
  .bn-editor .ProseMirror a {
    color: #4F46E5 !important;
    text-decoration: underline !important;
    text-decoration-color: #C7D2FE !important;
    text-decoration-thickness: 2px !important;
    text-underline-offset: 2px !important;
    transition: all 0.2s ease !important;
  }
  
  .bn-editor .ProseMirror a:hover {
    color: #4338CA !important;
    text-decoration-color: #4F46E5 !important;
    text-decoration-thickness: 3px !important;
  }
  
  /* Hide editor controls */
  .bn-toolbar, .bn-side-menu, .bn-slash-menu {
    display: none !important;
  }
`

// Helper function to validate ObjectId format
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

type Blog = {
  id: string
  _id?: string
  title: string
  authorName: string
  author?: string // User ID
  isAnonymous?: boolean
  submittedAt?: string
  date?: string
  status?: string
  abstract?: string
  content?: string
  contentHtml?: string
  contentBlocksJson?: any
  likes?: number
  dislikes?: number
  views?: number
}

export default function BlogDetailPage({ params }: { params: { id: string } }) {
  const { t, isLoading: translationsLoading } = useLanguage();
  // localized pattern for author display, supports templates like "by {{author}}" (en)
  // and "{{author}} tərəfindən" (az)
  const byPattern = t('blogs.byAuthor');
  const byParts = (byPattern || '').split('{{author}}');
  const byPre = byParts[0] || '';
  const byPost = byParts[1] || '';
  const targetId = useMemo(() => {
    return params.id
  }, [params.id])

  const [blog, setBlog] = useState<Blog | null>(null)
  const localePath = useLocalizedPath()
  const [loading, setLoading] = useState(true)
  const [contentReady, setContentReady] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        setContentReady(false)
        // 1) Try localStorage (user-submitted)
        const local = localStorage.getItem('submittedBlogs')
        if (local) {
          try {
            const list: Blog[] = JSON.parse(local)
            const found = list.find(s => String(s.id) == String(targetId))
            if (found) {
              if (!mounted) return
              setBlog(found)
              // Give time for content to render
              setTimeout(() => {
                if (mounted) setContentReady(true)
              }, 300)
              return
            }
          } catch { }
        }
        // 2) Try sample data
        // Try to fetch from API first
        const apiRes = await fetch(`/api/blogs?id=${targetId}`)
        if (apiRes.ok) {
          const apiData = await apiRes.json()
          if (apiData.blog) {
            if (!mounted) return
            setBlog({
              id: apiData.blog._id,
              _id: apiData.blog._id,
              title: apiData.blog.title,
              authorName: apiData.blog.authorName,
              author: apiData.blog.author?.toString(),
              isAnonymous: apiData.blog.isAnonymous,
              submittedAt: apiData.blog.createdAt,
              date: apiData.blog.createdAt,
              status: apiData.blog.status,
              abstract: apiData.blog.abstract || '',
              content: apiData.blog.content,
              contentBlocksJson: apiData.blog.content,
              likes: apiData.blog.likes || 0,
              dislikes: apiData.blog.dislikes || 0,
              views: apiData.blog.views || 0
            })

            // Give time for content to render
            setTimeout(() => {
              if (mounted) setContentReady(true)
            }, 300)


            // Give time for content to render
            setTimeout(() => {
              if (mounted) setContentReady(true)
            }, 300)

            return
          }
        }
        if (mounted) setBlog(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [targetId])

  // Show loading state while translations are loading OR blog is loading
  if (loading || translationsLoading) {
    return (
      <LoadingState
        text={t('blogs.loadingBlog') || 'Loading blog...'}
        gradientFrom="from-blue-500"
        gradientVia="via-indigo-500"
        gradientTo="to-purple-500"
        spinnerColor="border-blue-600"
      />
    )
  }

  if (!blog) {
    return (
      <ErrorState
        title={t('blogs.blogNotFound') || 'Blog Not Found'}
        message={t('blogs.blogNotFoundText') || 'The blog you are looking for does not exist or has been removed.'}
        onRetry={() => window.location.href = localePath('/blogs')}
        retryText={t('blogs.backToBlogs') || 'Back to Blogs'}
      />
    )
  }

  const publishedDate = blog.submittedAt || blog.date
  const safeHtml = blog.contentHtml ? DOMPurify.sanitize(blog.contentHtml) : ''

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: blogStyles }} />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section with Gradient */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 text-white py-12 sm:py-16">
          <AnimatedBackground
            colors={{
              blob1: 'bg-blue-400',
              blob2: 'bg-purple-400',
              blob3: 'bg-indigo-400'
            }}
          />

          <div className="section-padding relative z-10">
            <div className="max-w-5xl mx-auto">
              {/* Back Button */}
              <Link href={localePath("/blogs")}
                className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 sm:mb-8 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">{t('blogs.backToBlogs') || 'Back to Blogs'}</span>
              </Link>

              {/* View Tracker - Only show for approved blogs with valid IDs */}
              {blog._id && blog.status === 'approved' && isValidObjectId(blog._id) && (
                <div className="mb-4">
                  <ViewTracker
                    itemId={blog._id}
                    itemType="blog"
                    initialViews={blog.views || 0}
                    className="text-white/90"
                  />
                </div>
              )}

              {/* Blog Header */}
              <div className="animate-fade-in">


                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 leading-tight">
                  {blog.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm sm:text-base text-white/90">
                  {blog.authorName && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      <div className="flex items-center">
                        {byPre && <span className="mr-1">{byPre}</span>}
                        {!blog.isAnonymous && blog.author && isValidObjectId(blog.author) ? (
                          <Link
                            href={`/profile/${blog.author}`}
                            className="text-yellow-300 hover:text-yellow-200 font-semibold underline decoration-2 underline-offset-2 transition-colors"
                          >
                            {blog.authorName}
                          </Link>
                        ) : (
                          <span className="font-semibold">{blog.authorName}</span>
                        )}
                        {byPost && <span className="ml-1">{byPost}</span>}
                      </div>
                    </div>
                  )}

                  {publishedDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                      <time className="font-medium">
                        {new Date(publishedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                  )}

                  {blog.views !== undefined && blog.views > 0 && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-medium">{blog.views.toLocaleString()} {t('blogs.views') || 'views'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Main Content */}
        <article className="section-padding py-10 sm:py-14">
          <div className="max-w-4xl mx-auto">
            {/* Unified Main Content Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8 animate-fade-in animation-delay-200">



              {/* Blog Content */}
              <div className="p-6 sm:p-10">
                <div className="blog-content text-base sm:text-lg prose prose-lg max-w-none">
                  {blog.content && typeof blog.content === 'object' ? (
                    <BlocknoteReadOnly initialJSON={blog.content} />
                  ) : safeHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
                  ) : (
                    <div className="whitespace-pre-wrap">{blog.content || ''}</div>
                  )}
                </div>
              </div>

              {/* Show loading spinner while content renders */}
              {!contentReady && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">{t('blogs.loadingContent') || 'Loading content...'}</p>
                  </div>
                </div>
              )}

              {/* Blog Reactions - Integrated Bottom Section */}
              {contentReady && (blog._id || blog.id) && blog.status === 'approved' && (
                <div className="px-6 sm:px-10 py-6 border-t border-gray-100 bg-gradient-to-br from-gray-50/80 to-blue-50/30">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">
                          {t('blogs.yourReaction') || 'What do you think?'}
                        </h3>
                        <p className="text-xs text-gray-600">{t('blogs.shareReaction') || 'Share your reaction'}</p>
                      </div>
                    </div>
                    <BlogReactions
                      blogId={blog._id || blog.id}
                      initialLikes={blog.likes || 0}
                      initialDislikes={blog.dislikes || 0}
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </article>
      </div>
    </>
  )
}


