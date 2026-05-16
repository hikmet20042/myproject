'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { apiFetch, ApiError } from '@/lib/apiClient'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, SuccessState, UnauthorizedState } from '@/components/shared'
import { Button, ButtonLink, Input } from '@/components/ui'
import { FormLayout } from '@/components/forms'
import { AlertCircle, ChevronRight, FileText, Send, Sparkles, User } from 'lucide-react'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { getSubmitDraftKey, readLocalDraft, removeLocalDraft, writeLocalDraft } from '@/lib/blogDraftStorage'
import { Card } from '@/components/ui/Card'
import BlocknoteEditor from '@/components/BlocknoteEditor'

type DraftBlog = {
  title?: string
  tags?: string[] | string
  isAnonymous?: boolean
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

export default function SubmitBlogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { showError, showSuccess, showInfo } = useGlobalFeedback()
  const draftKey = getSubmitDraftKey(session?.user?.id)
  const [content, setContent] = useState<any>(null)
  const [contentHtml, setContentHtml] = useState('')
  const [characterCount, setCharacterCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
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

  useEffect(() => {
    if (session?.user?.accountType === 'organization') {
      showInfo('Təşkilat hesabları bloq paylaşa bilməz')
    }
  }, [session?.user?.accountType, showInfo])

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

  const displayAuthor = isAnonymous ? 'Anonim' : (session?.user?.name || 'İcma Üzvü')

  const minChars = 100
  const progressHint =
    characterCount < minChars
      ? `Minimum ${minChars} simvol tələb olunur (${minChars - characterCount} simvol qalıb)`
      : 'Məzmun hazırdır. Göndərə bilərsiniz.'

  const isSubmitDisabled =
    isSubmitting ||
    !title.trim() ||
    !content ||
    !JSON.stringify(content).trim() ||
    JSON.stringify(content).trim() === '{}' ||
    characterCount < minChars

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
            <ButtonLink href={localePath('/submit/blog')} variant="secondary" hoverEffect="scale">
              Yeni bloq yaz
            </ButtonLink>
          </>
        }
      />
    )
  }

  const saveDraft = () => {
    writeLocalDraft(draftKey, {
      title,
      tags,
      isAnonymous,
      content,
      contentHtml,
      characterCount,
    })
  }

  const handleSubmit = async () => {
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
    if (characterCount < minChars) {
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
  }

  return (
    <FormLayout
      title={'Bloq yaz'}
      subtitle={'Bloqunuzu yazın və yoxlama üçün göndərin.'}
    >
      {/* Blog Details Section */}
      <Card className="mb-6 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          {'Bloq Təfərrüatları'}
        </h2>

        <div className="space-y-6">
          {/* Title Input */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-base font-bold text-slate-900">
              <FileText className="w-5 h-5 text-blue-600" />
              {'Bloq Başlığı *'}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  saveDraft()
                }}
                required
                maxLength={200}
                placeholder={'Bloqunuz üçün cəlbedici bir başlıq verin...'}
                className="w-full pl-4 pr-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                {title.length}/200
              </div>
            </div>
            <p className="text-sm text-slate-600 flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
              <span>{'Hekayənizi ən yaxşı ifadə edən cəlbedici başlıq seçin'}</span>
            </p>
          </div>

          {/* Author Display */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{'Müəllif'}</label>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <p className="text-base font-semibold text-slate-900">{displayAuthor}</p>
            </div>
          </div>

          {/* Anonymous Checkbox */}
          <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-slate-200 rounded-2xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="flex items-center h-6">
                <input
                  id="anon"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => {
                    setIsAnonymous(e.target.checked)
                    saveDraft()
                  }}
                  className="h-5 w-5 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="anon" className="text-base font-semibold text-slate-900 cursor-pointer">
                  {'Anonim göndər'}
                </label>
                <p className="text-sm text-slate-600 mt-1">
                  {isAnonymous
                    ? 'Kimliyiniz gizli saxlanılacaq. Yalnız "Anonim" göstəriləcək.'
                    : `Bloqunuz "${session?.user?.name || 'İstifadəçi adı'}" adı ilə dərc olunacaq.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Editor Section */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              {'Bloq Məzmunu'}
            </h2>
            <span className="text-sm font-semibold text-slate-700">{characterCount} simvol</span>
          </div>
        </div>
        <div className="p-6 min-h-[400px]">
          <BlocknoteEditor
            key={title || 'empty'}
            initialJSON={content}
            onChange={(json, html, text) => {
              setContent(json)
              setContentHtml(html)
              setCharacterCount(text.length)
              saveDraft()
            }}
            context="blog"
          />
        </div>
      </Card>

      {/* Progress Hint */}
      {progressHint && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {progressHint}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          variant="gradient-blue"
          loading={isSubmitting}
          size="lg"
          icon={Send}
          iconPosition="left"
          shadow="lg"
          hoverEffect="scale"
        >
          {'Bloqu göndər'}
        </Button>
      </div>
    </FormLayout>
  )
}
