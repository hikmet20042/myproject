'use client'

import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import dynamic from 'next/dynamic'
const BlocknoteReadOnly = dynamic(() => import('@/components/BlocknoteReadOnly'), { ssr: false })
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import BlogReactions from '@/components/BlogReactions'
import { CommentSection } from '@/components/comments'
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
  
  /* Professional styling for BlocknoteReadOnly editor */
    .bn-editor {
      border: none !important;
      box-shadow: none !important;
      background: #F9FAFB !important;
      padding: 0 !important;
    }
    
    .bn-editor .ProseMirror {
      padding: 0 !important;
      border: none !important;
      outline: none !important;
      line-height: 1.8 !important;
      color: #2d3748 !important;
      background: #F9FAFB !important;
    }
    
    /* Remove any editor-specific backgrounds */
    .bn-editor .ProseMirror-focused {
      background: #F9FAFB !important;
    }
    
    .bn-editor .bn-block-group {
      background: #F9FAFB !important;
    }
    
    .bn-editor .bn-block {
      background: #F9FAFB !important;
    }
  
  .bn-editor .ProseMirror p {
    margin-bottom: 1.5rem !important;
    text-align: justify !important;
    text-indent: 1.5rem !important;
    line-height: 1.8 !important;
  }
  
  .bn-editor .ProseMirror h1, 
  .bn-editor .ProseMirror h2, 
  .bn-editor .ProseMirror h3, 
  .bn-editor .ProseMirror h4, 
  .bn-editor .ProseMirror h5, 
  .bn-editor .ProseMirror h6 {
    font-weight: 600 !important;
    margin-top: 2rem !important;
    margin-bottom: 1rem !important;
    color: #1a202c !important;
    text-indent: 0 !important;
  }
  
  .bn-editor .ProseMirror h2 {
    font-size: 1.5rem !important;
    border-bottom: 2px solid #e2e8f0 !important;
    padding-bottom: 0.5rem !important;
  }
  
  .bn-editor .ProseMirror h3 {
    font-size: 1.25rem !important;
  }
  
  .bn-editor .ProseMirror blockquote {
    border-left: 4px solid #3182ce !important;
    padding-left: 1rem !important;
    margin: 1.5rem 0 !important;
    font-style: italic !important;
    background-color: #f7fafc !important;
    padding: 1rem !important;
    text-indent: 0 !important;
  }
  
  
  .bn-editor .ProseMirror ul, 
  .bn-editor .ProseMirror ol {
    margin: 1rem 0 !important;
    padding-left: 2rem !important;
  }
  
  .bn-editor .ProseMirror li {
    margin-bottom: 0.5rem !important;
    text-indent: 0 !important;
  }
  
  .bn-editor .ProseMirror code {
    background-color: #f1f5f9 !important;
    padding: 0.25rem 0.5rem !important;
    border-radius: 0.25rem !important;
    font-family: 'Monaco', 'Menlo', monospace !important;
    font-size: 0.875rem !important;
  }
  
  .bn-editor .ProseMirror pre {
    background-color: #1a202c !important;
    color: #e2e8f0 !important;
    padding: 1rem !important;
    border-radius: 0.5rem !important;
    overflow-x: auto !important;
    margin: 1.5rem 0 !important;
  }
  
  .bn-editor .ProseMirror img {
    max-width: 100% !important;
    height: auto !important;
    margin: 1.5rem auto !important;
    display: block !important;
    border-radius: 0.5rem !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
  }
  
  .bn-editor .ProseMirror table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 1.5rem 0 !important;
  }
  
  .bn-editor .ProseMirror th, 
  .bn-editor .ProseMirror td {
    border: 1px solid #e2e8f0 !important;
    padding: 0.75rem !important;
    text-align: left !important;
  }
  
  .bn-editor .ProseMirror th {
    background-color: #f7fafc !important;
    font-weight: 600 !important;
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
          } catch {}
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
            
            // Track view for approved blogs
            if (apiData.blog.status === 'approved') {
              const viewedKey = `viewed_blog_${targetId}`
              let isFirstView = true
              
              // Check if already viewed in this session
              if (sessionStorage.getItem(viewedKey)) {
                isFirstView = false
              }
              
              // Track the view
              fetch(`/api/blogs/${targetId}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFirstView })
              })
                .then(res => res.json())
                .then(data => {
                  if (data.viewIncremented && mounted) {
                    // Update local blog state with new view count
                    setBlog(prev => prev ? { ...prev, views: data.views } : null)
                    // Mark as viewed for this session
                    sessionStorage.setItem(viewedKey, 'true')
                  }
                })
                .catch(err => console.error('Error tracking blog view:', err))
            }
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
        onRetry={() => window.location.href = '/blogs'}
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
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4 sm:mb-6">
                  <BookOpen className="w-4 h-4 text-pink-300" />
                  <span className="text-sm font-bold uppercase tracking-wide">Community Story</span>
                </div>

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
              
              {/* Abstract Section - Integrated Top */}
              {blog.abstract && blog.abstract.trim().length > 0 && (
                <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-gray-100 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/20">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 rounded-full flex-shrink-0 h-full min-h-[60px]"></div>
                    <div className="flex-1">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-blue-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {t('blogs.abstract') || 'Abstract'}
                      </h2>
                      <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                        {blog.abstract}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

            {/* Comment Section - Connected Design */}
            {contentReady && (blog._id || blog.id) && blog.author && blog.status === 'approved' && (
              <div className="animate-fade-in animation-delay-400">
                <CommentSection 
                  blogId={blog._id || blog.id}
                  blogAuthorId={blog.author}
                  className="bg-white rounded-2xl shadow-xl border border-gray-100"
                />
              </div>
            )}
          </div>
        </article>
      </div>
    </>
  )
}


