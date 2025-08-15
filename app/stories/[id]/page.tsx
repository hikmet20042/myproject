'use client'

import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import dynamic from 'next/dynamic'
const BlocknoteReadOnly = dynamic(() => import('@/components/BlocknoteReadOnly'), { ssr: false })
import Link from 'next/link'

type Story = {
  id: number
  title: string
  author: string
  submittedAt?: string
  date?: string
  tags?: string[]
  status?: string
  content?: string
  contentHtml?: string
  contentBlocksJson?: any
}

export default function StoryDetailPage({ params }: { params: { id: string } }) {
  const targetId = useMemo(() => {
    const n = Number.parseInt(params.id, 10)
    return Number.isFinite(n) ? n : params.id
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
        const res = await fetch('/sample-data/stories.json')
        if (res.ok) {
          const data: Story[] = await res.json()
          const found = data.find(s => String((s as any).id) == String(targetId))
          if (found) {
            if (!mounted) return
            setStory(found)
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
          <Link href="/stories" className="btn-primary inline-block">Back to Stories</Link>
        </div>
      </div>
    )
  }

  const publishedDate = story.submittedAt || story.date
  const safeHtml = story.contentHtml ? DOMPurify.sanitize(story.contentHtml) : ''

  return (
    <article className="section-padding py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/stories" className="text-primary hover:underline">← Back to Stories</Link>
        </div>
  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{story.title}</h1>
        <div className="text-sm text-gray-500 mb-6">
          {publishedDate && (
            <span>{new Date(publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          )}
          {story.author && <span className="ml-3">by {story.author}</span>}
        </div>

        {Array.isArray(story.tags) && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {story.tags.map((t, i) => (
              <span key={i} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700">{t}</span>
            ))}
          </div>
        )}

  <div className="prose max-w-none">
          {story.content && typeof story.content === 'object' ? (
            <BlocknoteReadOnly content={story.content} />
          ) : safeHtml ? (
            <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
          ) : (
            <p className="whitespace-pre-wrap leading-7">{story.content || ''}</p>
          )}
        </div>
      </div>
    </article>
  )
}


