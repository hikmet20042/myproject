'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, SuccessState } from '@/components/shared'
import { Button, ButtonLink, Input } from '@/components/ui'
import { FormLayout } from '@/components/forms'
import { AlertCircle, FileText, Send, Sparkles, User } from 'lucide-react'
import { blogQueryKeys, editBlog, fetchBlogById } from '@/lib/blogQueries'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { getEditDraftKey, readLocalDraft, removeLocalDraft, writeLocalDraft } from '@/lib/blogDraftStorage'
import BlocknoteEditor from '@/components/BlocknoteEditor'

type EditBlogData = {
  id: string
  title: string
  content: any
  contentHtml: string
  isAnonymous: boolean
  status?: string
}

const normalizeBlogData = (blog: any): EditBlogData => {
  const isAnonymous = !!(blog?.isAnonymous ?? blog?.is_anonymous ?? false)
  return {
    id: blog?.id || blog?._id || '',
    title: blog?.title || '',
    content: blog?.content || null,
    contentHtml: blog?.contentHtml || blog?.content_html || '',
    isAnonymous,
    status: blog?.status || 'pending',
  }
}

const getLocalEditBlogData = (storageKey: string, blogId: string): EditBlogData | null => {
  const parsed = readLocalDraft<Partial<EditBlogData>>(storageKey)
  if (!parsed || parsed?.id !== blogId) return null
  return {
    id: parsed.id || '',
    title: parsed.title || '',
    content: parsed.content || null,
    contentHtml: parsed.contentHtml || '',
    isAnonymous: !!parsed.isAnonymous,
    status: parsed.status || 'pending',
  }
}

const saveLocalEditBlogData = (storageKey: string, data: EditBlogData) => {
  writeLocalDraft(storageKey, data)
}

function extractMedia(content: any) {
  const blocks = Array.isArray(content)
    ? content
    : Array.isArray(content?.blocks)
      ? content.blocks
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

export default function EditBlogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const blogId = params?.slug as string
  const localePath = useLocalizedPath()
  const { showError, showSuccess } = useGlobalFeedback()
  const queryClient = useQueryClient()
  const editDraftKey = getEditDraftKey(session?.user?.id, blogId)
  const [content, setContent] = useState<any>(null)
  const [contentHtml, setContentHtml] = useState('')
  const [characterCount, setCharacterCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [title, setTitle] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [blogStatus, setBlogStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [init, setInit] = useState(false)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const blogQuery = useQuery({
    queryKey: blogQueryKeys.detail(blogId),
    queryFn: () => fetchBlogById(blogId),
    enabled: !!blogId && status !== 'loading',
    retry: false,
  })

  const editBlogMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => editBlog(blogId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.detail(blogId) })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.user })
    },
  })

  useEffect(() => {
    if (!blogId || status === 'loading' || blogQuery.isLoading) return

    const apiData = blogQuery.data ? normalizeBlogData(blogQuery.data) : null
    const localData = getLocalEditBlogData(editDraftKey, blogId)
    const resolved = apiData || localData

    if (!resolved) {
      showError('Bloq məlumatlarını yükləmək alınmadı.')
      setInit(true)
      return
    }

    // Check ownership
    const authorId = (blogQuery.data as any)?.author_id || (blogQuery.data as any)?.author
    if (authorId && session?.user?.id && authorId !== session.user.id) {
      showError('Bu bloqu redaktə etmək icazəniz yoxdur')
      setInit(true)
      return
    }

    setTitle(resolved.title || '')
    setContent(resolved.content || null)
    setContentHtml(resolved.contentHtml || '')
    setCharacterCount(getCharacterCount(resolved.content, resolved.contentHtml || ''))
    setIsAnonymous(resolved.isAnonymous)
    setBlogStatus(resolved.status as 'pending' | 'approved' | 'rejected' || 'pending')
    saveLocalEditBlogData(editDraftKey, resolved)
    setInit(true)
  }, [blogId, status, blogQuery.data, blogQuery.isLoading, session?.user?.id, editDraftKey, showError])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [])

  if (status === 'loading' || !init) {
    return <LoadingState text="Bloq məlumatları yüklənir..." />
  }

  if (success) {
    const successMessage =
      blogStatus === 'approved'
        ? 'Yenilənmə sorğunuz göndərildi və moderasiya üçün gözləmədədir.'
        : 'Bloqunuz yeniləndi və yoxlama üçün göndərildi.'

    return (
      <SuccessState
        title={'Bloq uğurla yeniləndi'}
        message={successMessage}
        actions={
          <>
            <ButtonLink href={localePath('/profile')} variant="gradient-green" hoverEffect="scale">
              Profilə keç
            </ButtonLink>
            <ButtonLink href={localePath('/blogs')} variant="secondary" hoverEffect="scale">
              Bloqlara bax
            </ButtonLink>
          </>
        }
      />
    )
  }

  const displayAuthor = isAnonymous ? 'Anonim' : (session?.user?.name || 'İcma Üzvü')

  const minChars = 100
  const progressHint =
    characterCount < minChars
      ? `Minimum ${minChars} simvol tələb olunur (${minChars - characterCount} simvol qalıb)`
      : 'Məzmun hazırdır. Yeniləyə bilərsiniz.'

  const isSubmitDisabled =
    isSubmitting ||
    !title.trim() ||
    !content ||
    !JSON.stringify(content).trim() ||
    JSON.stringify(content).trim() === '{}' ||
    characterCount < minChars

  const saveDraft = () => {
    saveLocalEditBlogData(editDraftKey, {
      id: blogId,
      title,
      content,
      contentHtml,
      isAnonymous,
      status: blogStatus,
    })
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError('Başlıq əlavə edin.')
      setError('Başlıq əlavə edin.')
      return
    }
    if (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}') {
      showError('Göndərməzdən əvvəl məzmun əlavə edin')
      setError('Göndərməzdən əvvəl məzmun əlavə edin')
      return
    }
    if (characterCount < minChars) {
      showError('Bloq məzmunu ən azı 100 simvol olmalıdır.')
      setError('Bloq məzmunu ən azı 100 simvol olmalıdır.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const isUpdateRequest = blogStatus === 'approved'
      await editBlogMutation.mutateAsync({
        title,
        content,
        contentHtml,
        isAnonymous,
        status: 'pending',
        requestUpdate: isUpdateRequest,
        media: extractMedia(content),
      })
      removeLocalDraft(editDraftKey)
      showSuccess('Bloq yenilənməsi uğurla göndərildi')
      setSuccess(true)
      redirectTimeoutRef.current = setTimeout(() => {
        router.push(localePath('/profile'))
      }, 1800)
    } catch (submitError: any) {
      const message = submitError?.message || 'Bloqu yeniləmək alınmadı'
      showError(message)
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormLayout
      title={'Bloqu redaktə et'}
      subtitle={'Bloqunuzu yeniləyin və yoxlama üçün göndərin.'}
    >
      {/* Blog Details Section */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          {'Bloq Təfərrüatları'}
        </h2>

        <div className="space-y-6">
          {/* Title Input */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-base font-bold text-gray-900">
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
                className="w-full pl-4 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {title.length}/200
              </div>
            </div>
            <p className="text-sm text-gray-600 flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
              <span>{'Hekayənizi ən yaxşı ifadə edən cəlbedici başlıq seçin'}</span>
            </p>
          </div>

          {/* Author Display */}
          <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{'Müəllif'}</label>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <p className="text-base font-semibold text-gray-900">{displayAuthor}</p>
            </div>
          </div>

          {/* Anonymous Checkbox */}
          <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="flex items-center h-6">
                <input
                  id="anon-edit"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => {
                    setIsAnonymous(e.target.checked)
                    saveDraft()
                  }}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="anon-edit" className="text-base font-semibold text-gray-900 cursor-pointer">
                  {'Anonim göndər'}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {isAnonymous
                    ? 'Kimliyiniz gizli saxlanılacaq. Yalnız "Anonim" göstəriləcək.'
                    : `Bloqunuz "${session?.user?.name || 'İstifadəçi adı'}" adı ilə dərc olunacaq.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Section */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-slate-50 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              {'Bloq Məzmunu'}
            </h2>
            <span className="text-sm font-semibold text-gray-700">{characterCount} simvol</span>
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
      </div>

      {/* Progress Hint */}
      {progressHint && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
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
          loading={editBlogMutation.isPending || isSubmitting}
          size="lg"
          icon={Send}
          iconPosition="left"
          shadow="lg"
          hoverEffect="scale"
        >
          {blogStatus === 'approved' ? 'Yenilənmə sorğusu göndər' : 'Bloqu yenilə'}
        </Button>
      </div>
    </FormLayout>
  )
}
