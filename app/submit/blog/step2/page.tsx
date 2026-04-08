'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { apiFetch, ApiError } from '@/lib/apiClient'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState, SuccessState, UnauthorizedState } from '@/components/shared'
import { ButtonLink } from '@/components/ui'
import BlogEditorForm from '@/features/blogs/components/BlogEditorForm'

type DraftBlog = {
  title?: string
  tags?: string[] | string
  isAnonymous?: boolean
  authorName?: string
  content?: any
  contentHtml?: string
}

function extractMedia(json: any): Array<{ type: string; url: string; alt?: string }> {
  if (!json || !Array.isArray(json?.blocks)) return []
  const media: Array<{ type: string; url: string; alt?: string }> = []
  for (const block of json.blocks) {
    if (block.type === 'image' && block.props?.url) media.push({ type: 'image', url: block.props.url, alt: block.props.alt || '' })
    if (block.type === 'embed' && block.props?.url) media.push({ type: 'embed', url: block.props.url })
  }
  return media
}

export default function SubmitBlogStep2Page() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const [content, setContent] = useState<any>(null)
  const [contentHtml, setContentHtml] = useState('')
  const [characterCount, setCharacterCount] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [init, setInit] = useState(false)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('draftBlog')
    if (!saved) {
      setInit(true)
      return
    }
    try {
      const d = JSON.parse(saved) as DraftBlog
      setTitle(d.title || '')
      setTags(
        Array.isArray(d.tags) ? d.tags : typeof d.tags === 'string' ? d.tags.split(',').filter(Boolean) : [],
      )
      setIsAnonymous(Boolean(d.isAnonymous))
      setAuthorName(d.authorName || '')
      if (d.content) {
        const normalized = Array.isArray(d.content) ? d.content : d.content?.blocks || d.content
        setContent(normalized)
      }
      if (d.contentHtml) setContentHtml(d.contentHtml)
    } catch {
      return
    } finally {
      setInit(true)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [])

  if (status === 'loading') return <LoadingState text="Yüklənir..." />

  if (session?.user?.accountType === 'organization') {
    return (
      <UnauthorizedState
        title="Bloq paylaşımı məhduddur"
        message="Təşkilat hesabları bloq paylaşa bilməz. Bloq göndərilməsi yalnız fərdi istifadəçilər üçün aktivdir."
        actionText="Bloqlara bax"
        onAction={() => router.push(localePath('/blogs'))}
      />
    )
  }

  if (!init) return <LoadingState text="Redaktor yüklənir..." />

  const displayAuthor = isAnonymous ? 'Anonim' : authorName || session?.user?.name || 'İcma Üzvü'

  const progressHint =
    characterCount < 100
      ? `Minimum 100 simvol tələb olunur (${100 - characterCount} simvol qalıb)`
      : 'Məzmun hazırdır. Göndərə bilərsiniz.'

  if (success) {
    return (
      <SuccessState
        title={'Bloq uğurla göndərildi'}
        message={'Bloqunuz yoxlama üçün göndərildi. Təsdiq edildikdə bildiriş alacaqsınız.'}
        actions={
          <>
            <ButtonLink href={localePath('/profile')} variant="gradient-green" hoverEffect="scale">
              Profilə keç
            </ButtonLink>
            <ButtonLink href={localePath('/submit/blog/step1')} variant="secondary" hoverEffect="scale">
              Yeni bloq yaz
            </ButtonLink>
          </>
        }
      />
    )
  }

  return (
    <BlogEditorForm
      mode="submit"
      title={title}
      displayAuthor={displayAuthor}
      content={content}
      contentHtml={contentHtml}
      characterCount={characterCount}
      showPreview={showPreview}
      isSubmitting={isSubmitting}
      error={error}
      backLabel="Geri"
      submitLabel="Bloqu göndər"
      progressHint={progressHint}
      onTogglePreview={() => setShowPreview((prev) => !prev)}
      onEditorChange={(json, html, text) => {
        setContent(json)
        setContentHtml(html)
        setCharacterCount(text.length)
        const saved = localStorage.getItem('draftBlog')
        const base = saved ? JSON.parse(saved) : {}
        localStorage.setItem(
          'draftBlog',
          JSON.stringify({
            ...base,
            title,
            tags,
            isAnonymous,
            authorName,
            content: json,
            contentHtml: html,
            characterCount: text.length,
          }),
        )
      }}
      onBack={() => {
        const saved = localStorage.getItem('draftBlog')
        const base = saved ? JSON.parse(saved) : {}
        localStorage.setItem(
          'draftBlog',
          JSON.stringify({
            ...base,
            title,
            tags,
            isAnonymous,
            authorName,
            content,
            contentHtml,
            characterCount,
          }),
        )
        router.push(localePath('/submit/blog/step1'))
      }}
      onSubmit={async () => {
        if (!title.trim()) {
          setError('Başlıq əlavə edin. Sonra bloqu göndərə bilərsiniz.')
          return
        }
        if (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}') {
          setError('Göndərməzdən əvvəl zəhmət olmasa məzmun əlavə edin')
          return
        }
        if (characterCount < 100) {
          setError('Bloqunuz ən azı 100 simvoldan ibarət olmalıdır')
          return
        }

        setIsSubmitting(true)
        setError('')
        try {
          await apiFetch<{ blog: { id: string } }>('/api/blogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'blog',
              title,
              content,
              contentHtml,
              tags: Array.isArray(tags) ? tags : [],
              isAnonymous,
              authorName: !isAnonymous ? authorName : undefined,
              media: extractMedia(content),
            }),
          })
          localStorage.removeItem('draftBlog')
          setSuccess(true)
          redirectTimeoutRef.current = setTimeout(() => {
            router.push(localePath('/profile'))
          }, 1800)
        } catch (submitError) {
          const resolved =
            submitError instanceof ApiError && submitError.message
              ? getUserErrorMessage(submitError) === 'Something went wrong'
                ? submitError.message
                : getUserErrorMessage(submitError)
              : getUserErrorMessage(submitError)
          setError(resolved)
        } finally {
          setIsSubmitting(false)
        }
      }}
    />
  )
}
