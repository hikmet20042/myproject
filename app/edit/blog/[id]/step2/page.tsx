'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, SuccessState } from '@/components/shared'
import { ButtonLink } from '@/components/ui'
import { blogQueryKeys, editBlog, fetchBlogById } from '@/lib/blogQueries'
import BlogEditorForm from '@/features/blogs/components/BlogEditorForm'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { getEditDraftKey, readLocalDraft, removeLocalDraft, writeLocalDraft } from '@/lib/blogDraftStorage'

type EditBlogData = {
  id: string
  title: string
  content: any
  contentHtml: string
  isAnonymous: boolean
  authorName: string
  status?: string
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
    authorName: parsed.authorName || '',
    status: parsed.status || 'pending',
  }
}

const saveLocalEditBlogData = (storageKey: string, data: EditBlogData) => {
  writeLocalDraft(storageKey, data)
}

function extractMedia(content: any) {
  const media: string[] = []
  const blocks = Array.isArray(content)
    ? content
    : Array.isArray(content?.blocks)
      ? content.blocks
      : []

  if (Array.isArray(blocks)) {
    blocks.forEach((block: any) => {
      if (block.type === 'image' && block.props?.url) media.push(block.props.url)
    })
  }
  return media
}

function getCharacterCount(content: any, contentHtml: string) {
  if (Array.isArray(content)) {
    return content
      .map((block: any) => {
        if (Array.isArray(block?.content)) {
          return block.content.map((item: any) => item?.text || '').join('')
        }
        return ''
      })
      .join(' ')
      .trim().length
  }

  if (content && Array.isArray(content?.blocks)) {
    return content.blocks
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

export default function EditBlogStep2Page() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const blogId = params?.id as string
  const localePath = useLocalizedPath()
  const { showError, showSuccess } = useGlobalFeedback()
  const editDraftKey = getEditDraftKey(session?.user?.id, blogId)
  const [content, setContent] = useState<any>(null)
  const [contentHtml, setContentHtml] = useState('')
  const [characterCount, setCharacterCount] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [title, setTitle] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [blogStatus, setBlogStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [init, setInit] = useState(false)
  const queryClient = useQueryClient()

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
    const blog = blogQuery.data as any
    const localData = getLocalEditBlogData(editDraftKey, blogId)
    const fallback = {
      id: blog?.id || blog?._id || blogId,
      title: blog?.title || '',
      content: blog?.content || null,
      contentHtml: blog?.contentHtml || '',
      isAnonymous: !!(blog?.isAnonymous ?? false),
      authorName: blog?.authorName || session?.user?.name || '',
      status: blog?.status || 'pending',
    }
    const resolved = localData || fallback
    setTitle(resolved.title || '')
    setContent(resolved.content || null)
    setContentHtml(resolved.contentHtml || '')
    setCharacterCount(getCharacterCount(resolved.content, resolved.contentHtml || ''))
    setIsAnonymous(!!resolved.isAnonymous)
    setAuthorName(resolved.authorName || '')
    setBlogStatus((resolved.status as 'pending' | 'approved' | 'rejected') || 'pending')
    saveLocalEditBlogData(editDraftKey, resolved)
    setInit(true)
  }, [blogId, status, blogQuery.data, blogQuery.isLoading, session?.user?.name, editDraftKey])

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

  if (!init) {
    return <LoadingState text="Redaktor yüklənir..." />
  }

  return (
    <BlogEditorForm
      mode="edit"
      title={title}
      displayAuthor={isAnonymous ? 'Anonim' : authorName || session?.user?.name || 'İcma Üzvü'}
      content={content}
      contentHtml={contentHtml}
      characterCount={characterCount}
      showPreview={showPreview}
      isSubmitting={editBlogMutation.isPending}
      error={error}
      backLabel="Geri"
      submitLabel={editBlogMutation.isPending ? 'Yenilənir...' : 'Bloqu yenilə'}
      progressHint={
        characterCount < 100
          ? `Minimum 100 simvol tələb olunur (${100 - characterCount} simvol qalıb)`
          : 'Məzmun hazırdır. Yeniləyə bilərsiniz.'
      }
      onTogglePreview={() => setShowPreview((prev) => !prev)}
      onEditorChange={(json, html, text) => {
        setContent(json)
        setContentHtml(html)
        setCharacterCount(text.length)
        saveLocalEditBlogData(editDraftKey, {
          id: blogId,
          title,
          content: json,
          contentHtml: html,
          isAnonymous,
          authorName,
          status: blogStatus,
        })
      }}
      onBack={() => {
        saveLocalEditBlogData(editDraftKey, {
          id: blogId,
          title,
          content,
          contentHtml,
          isAnonymous,
          authorName,
          status: blogStatus,
        })
        router.push(localePath(`/edit/blog/${blogId}/step1`))
      }}
      onSubmit={async () => {
        if (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}') {
          showError('Təqdim etməzdən əvvəl məzmun əlavə edin')
          setError('Təqdim etməzdən əvvəl məzmun əlavə edin')
          return
        }
        if (characterCount < 100) {
          showError('Bloq məzmunu ən azı 100 simvol olmalıdır.')
          setError('Bloq məzmunu ən azı 100 simvol olmalıdır.')
          return
        }
        setError('')
        try {
          const isUpdateRequest = blogStatus === 'approved'
          await editBlogMutation.mutateAsync({
            title,
            content,
            contentHtml,
            isAnonymous,
            authorName: isAnonymous ? 'Anonim' : (authorName || session?.user?.name),
            status: 'pending',
            requestUpdate: isUpdateRequest,
            media: extractMedia(content),
          })
          removeLocalDraft(editDraftKey)
          showSuccess('Bloq yenilənməsi uğurla göndərildi')
          setSuccess(true)
          setTimeout(() => {
            router.push(localePath('/profile'))
          }, 1800)
        } catch (submitError: any) {
          const message = submitError?.message || 'Bloqu yeniləmək alınmadı'
          showError(message)
          setError(message)
        }
      }}
    />
  )
}
