'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { PageStateGuard, SuccessState } from '@/components/shared'
import { ButtonLink } from '@/components/ui'
import { blogQueryKeys, editBlog, fetchBlogById } from '@/lib/blogQueries'
import BlogEditorForm from '@/features/blogs/components/BlogEditorForm'

type EditBlogData = {
  id: string
  title: string
  content: any
  contentHtml: string
  isAnonymous: boolean
  authorName: string
}

const getLocalEditBlogData = (blogId: string): EditBlogData | null => {
  const saved = localStorage.getItem('editBlogData')
  if (!saved) return null
  try {
    const parsed = JSON.parse(saved)
    if (parsed?.id !== blogId) return null
    return {
      id: parsed.id,
      title: parsed.title || '',
      content: parsed.content || null,
      contentHtml: parsed.contentHtml || '',
      isAnonymous: !!parsed.isAnonymous,
      authorName: parsed.authorName || '',
    }
  } catch {
    return null
  }
}

const saveLocalEditBlogData = (data: EditBlogData) => {
  localStorage.setItem('editBlogData', JSON.stringify(data))
}

function extractMedia(content: any) {
  const media: string[] = []
  if (Array.isArray(content)) {
    content.forEach((block: any) => {
      if (block.type === 'image' && block.props?.url) media.push(block.props.url)
    })
  }
  return media
}

export default function EditBlogStep2Page() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const blogId = params?.id as string
  const localePath = useLocalizedPath()
  const [content, setContent] = useState<any>(null)
  const [contentHtml, setContentHtml] = useState('')
  const [characterCount, setCharacterCount] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [title, setTitle] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [authorName, setAuthorName] = useState('')
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
    const localData = getLocalEditBlogData(blogId)
    const fallback = {
      id: blog?.id || blog?._id || blogId,
      title: blog?.title || '',
      content: blog?.content || null,
      contentHtml: blog?.contentHtml || '',
      isAnonymous: !!(blog?.isAnonymous ?? false),
      authorName: blog?.authorName || session?.user?.name || '',
    }
    const resolved = localData || fallback
    setTitle(resolved.title || '')
    setContent(resolved.content || null)
    setContentHtml(resolved.contentHtml || '')
    setIsAnonymous(!!resolved.isAnonymous)
    setAuthorName(resolved.authorName || '')
    saveLocalEditBlogData(resolved)
    setInit(true)
  }, [blogId, status, blogQuery.data, blogQuery.isLoading, session?.user?.name])

  if (success) {
    return (
      <SuccessState
        title={'Bloq uğurla yeniləndi'}
        message={'Bloqunuz yeniləndi və yoxlama üçün göndərildi.'}
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

  return (
    <PageStateGuard
      isLoading={!init}
      isError={false}
      isEmpty={false}
      loadingText="Redaktor yüklənir..."
    >
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
          saveLocalEditBlogData({
            id: blogId,
            title,
            content: json,
            contentHtml: html,
            isAnonymous,
            authorName,
          })
        }}
        onBack={() => {
          saveLocalEditBlogData({
            id: blogId,
            title,
            content,
            contentHtml,
            isAnonymous,
            authorName,
          })
          router.push(localePath(`/edit/blog/${blogId}/step1`))
        }}
        onSubmit={async () => {
          if (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}') {
            setError('Təqdim etməzdən əvvəl məzmun əlavə edin')
            return
          }
          if (characterCount < 100) {
            setError('Bloq məzmunu ən azı 100 simvol olmalıdır.')
            return
          }
          setError('')
          try {
            await editBlogMutation.mutateAsync({
              title,
              content,
              contentHtml,
              isAnonymous,
              authorName: isAnonymous ? 'Anonim' : (authorName || session?.user?.name),
              status: 'pending',
              media: extractMedia(content),
            })
            localStorage.removeItem('editBlogData')
            setSuccess(true)
            setTimeout(() => {
              router.push(localePath('/profile'))
            }, 1800)
          } catch (submitError: any) {
            setError(submitError?.message || 'Bloqu yeniləmək alınmadı')
          }
        }}
      />
    </PageStateGuard>
  )
}
