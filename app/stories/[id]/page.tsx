'use client'

import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import dynamic from 'next/dynamic'
const BlocknoteReadOnly = dynamic(() => import('@/components/BlocknoteReadOnly'), { ssr: false })
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

// Custom CSS styles for professional BlocknoteReadOnly editor
const storyStyles = `
  .story-content {
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

type Story = {
  id: string
  title: string
  authorName: string
  author?: string // User ID
  isAnonymous?: boolean
  submittedAt?: string
  date?: string
  tags?: string[]
  status?: string
  abstract?: string
  content?: string
  contentHtml?: string
  contentBlocksJson?: any
}

export default function StoryDetailPage({ params }: { params: { id: string } }) {
  const targetId = useMemo(() => {
    return params.id
  }, [params.id])

  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        // 1) Try localStorage (user-submitted)
        const local = localStorage.getItem('submittedStories')
        if (local) {
          try {
            const list: Story[] = JSON.parse(local)
            const found = list.find(s => String(s.id) == String(targetId))
            if (found) {
              if (!mounted) return
              setStory(found)
              return
            }
          } catch {}
        }
        // 2) Try sample data
        // Try to fetch from API first
        const apiRes = await fetch(`/api/stories?id=${targetId}`)
        if (apiRes.ok) {
          const apiData = await apiRes.json()
          if (apiData.story) {
            if (!mounted) return
            setStory({
              id: apiData.story._id,
              title: apiData.story.title,
              authorName: apiData.story.authorName,
              author: apiData.story.author?.toString(),
              isAnonymous: apiData.story.isAnonymous,
              submittedAt: apiData.story.createdAt,
              date: apiData.story.createdAt,
              tags: apiData.story.tags,
              status: apiData.story.status,
              abstract: apiData.story.abstract || '',
              content: apiData.story.content,
              contentBlocksJson: apiData.story.content
            })
            return
          }
        }
        if (mounted) setStory(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [targetId])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-gray-600">Loading story…</div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="section-padding py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2">Story not found</h1>
          <p className="text-gray-600 mb-4">The story you were looking for doesn’t exist or was removed.</p>
          <Link href="/stories">
                  <Button variant="primary">
                    Back to Stories
                  </Button>
                </Link>
        </div>
      </div>
    )
  }

  const publishedDate = story.submittedAt || story.date
  const safeHtml = story.contentHtml ? DOMPurify.sanitize(story.contentHtml) : ''

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: storyStyles }} />
      <article className="section-padding py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link href="/stories" className="text-primary hover:underline text-sm">← Back to Stories</Link>
          </div>
          
          {/* Story Header */}
          <header className="mb-10 pb-6 border-b border-gray-200">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">{story.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {publishedDate && (
                <time className="font-medium">
                  {new Date(publishedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </time>
              )}
              {story.authorName && (
                <div className="flex items-center">
                  <span className="mr-1">by</span>
                  {!story.isAnonymous && story.author && isValidObjectId(story.author) ? (
                    <Link href={`/profile/${story.author}`} className="text-primary hover:underline font-medium">
                      {story.authorName}
                    </Link>
                  ) : (
                    <span className="font-medium">{story.authorName}</span>
                  )}
                </div>
              )}
            </div>
          </header>

          {story.abstract && story.abstract.trim().length > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Abstract</h2>
              <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-primary">
                <p className="text-gray-800 leading-relaxed text-justify text-lg">
                  {story.abstract}
                </p>
              </div>
            </section>
          )}

          {Array.isArray(story.tags) && story.tags.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {story.tags.map((t, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          <main className="mt-10">
            <div className="story-content text-lg">
              {story.content && typeof story.content === 'object' ? (
                <BlocknoteReadOnly initialJSON={story.content} />
              ) : safeHtml ? (
                <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
              ) : (
                <div className="whitespace-pre-wrap">{story.content || ''}</div>
              )}
            </div>
          </main>
        </div>
      </article>
    </>
  )
}


