'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { apiFetch, ApiError } from '@/lib/apiClient'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, SuccessState, UnauthorizedState } from '@/components/shared'
import { ButtonLink } from '@/components/ui'
import BlogEditorForm from '@/features/blogs/components/BlogEditorForm'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { getSubmitDraftKey, readLocalDraft, removeLocalDraft, writeLocalDraft } from '@/lib/blogDraftStorage'

type DraftBlog = {
  title?: string
  tags?: string[] | string
  isAnonymous?: boolean
  authorName?: string
  content?: any
  contentHtml?: string
}

function extractMedia(json: any): Array<{ type: string; url: string; alt?: string }> {
  const blocks = Array.isArray(json)
    ? json
    : Array.isArray(json?.blocks)
      ? json.blocks
      : []

  if (!Array.isArray(blocks)) return []
  const media: Array<{ type: string; url: string; alt?: string }> = []
  for (const block of blocks) {
    if (block.type === 'image' && block.props?.url) media.push({ type: 'image', url: block.props.url, alt: block.props.alt || '' })
    if (block.type === 'embed' && block.props?.url) media.push({ type: 'embed', url: block.props.url })
  }
  return media
}

function getCharacterCount(content: any, contentHtml: string) {
  const blocks = Array.isArray(content)
    ? content
    : Array.isArray(content?.blocks)
      ? content.blocks
      : null

  if (Array.isArray(blocks)) {
    return blocks
      .map((block: any) => {
        if (Array.isArray(block?.content)) {
          return block.content.map((item: any) => item?.text || '').join('')
        }
        return ''
      })
      .join(' ')
      .trim().length
  }

  if (typeof contentHtml === 'string' && contentHtml.trim()) {
    return contentHtml.replace(/<[^>]*>/g, '').trim().length
  }

  return 0
}

export default function SubmitBlogStep2Page() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { showError, showSuccess } = useGlobalFeedback()
  const draftKey = getSubmitDraftKey(session?.user?.id)
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
    const d = readLocalDraft<DraftBlog>(draftKey)
    if (!d) {
      setInit(true)
      return
    }
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
    setCharacterCount(getCharacterCount(d.content, d.contentHtml || ''))
    setInit(true)
  }, [draftKey])

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
        const base = readLocalDraft<DraftBlog>(draftKey) || {}
        writeLocalDraft(draftKey, {
          ...base,
          title,
          tags,
          isAnonymous,
          authorName,
          content: json,
          contentHtml: html,
          characterCount: text.length,
        })
      }}
      onBack={() => {
        const base = readLocalDraft<DraftBlog>(draftKey) || {}
        writeLocalDraft(draftKey, {
          ...base,
          title,
          tags,
          isAnonymous,
          authorName,
          content,
          contentHtml,
          characterCount,
        })
        router.push(localePath('/submit/blog/step1'))
      }}
      onSubmit={async () => {
        if (!title.trim()) {
          showError('Başlıq əlavə edin. Sonra bloqu göndərə bilərsiniz.')
          setError('Başlıq əlavə edin. Sonra bloqu göndərə bilərsiniz.')
          return
        }
        if (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}') {
          showError('Göndərməzdən əvvəl zəhmət olmasa məzmun əlavə edin')
          setError('Göndərməzdən əvvəl zəhmət olmasa məzmun əlavə edin')
          return
        }
        if (characterCount < 100) {
          showError('Bloqunuz ən azı 100 simvoldan ibarət olmalıdır')
          setError('Bloqunuz ən azı 100 simvoldan ibarət olmalıdır')
          return
        }

        setIsSubmitting(true)
        setError('')
        try {
          const contentPayload = Array.isArray(content) ? { blocks: content } : content
          await apiFetch<{ blog: { id: string } }>('/api/blogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'blog',
              title,
              content: contentPayload,
              contentHtml,
              tags: Array.isArray(tags) ? tags : [],
              isAnonymous,
              authorName: !isAnonymous ? authorName : undefined,
              media: extractMedia(contentPayload),
            }),
          })
          removeLocalDraft(draftKey)
          showSuccess('Bloq uğurla göndərildi')
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
          showError(resolved)
          setError(resolved)
        } finally {
          setIsSubmitting(false)
        }
      }}
    />
  )
}
