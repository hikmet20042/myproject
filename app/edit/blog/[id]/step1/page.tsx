'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { PageStateGuard } from '@/components/shared'
import { blogQueryKeys, fetchBlogById } from '@/lib/blogQueries'
import BlogStep1Form from '@/features/blogs/components/BlogStep1Form'
import { getEditDraftKey, readLocalDraft, writeLocalDraft } from '@/lib/blogDraftStorage'

type EditBlogData = {
  id: string
  title: string
  content: any
  contentHtml: string
  isAnonymous: boolean
  authorName: string
  status?: string
}

const normalizeBlogData = (blog: any, fallbackName?: string): EditBlogData => {
  const isAnonymous = !!(blog?.isAnonymous ?? blog?.is_anonymous ?? false)
  return {
    id: blog?.id || blog?._id || '',
    title: blog?.title || '',
    content: blog?.content || null,
    contentHtml: blog?.contentHtml || blog?.content_html || '',
    isAnonymous,
    authorName: isAnonymous ? 'Anonim' : (blog?.authorName || blog?.author_name || fallbackName || ''),
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
    authorName: parsed.authorName || '',
    status: parsed.status || 'pending',
  }
}

const saveLocalEditBlogData = (storageKey: string, data: EditBlogData) => {
  writeLocalDraft(storageKey, data)
}

export default function EditBlogStep1() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const localePath = useLocalizedPath()
  const blogId = params?.id as string
  const editDraftKey = getEditDraftKey(session?.user?.id, blogId)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [initialData, setInitialData] = useState<EditBlogData>({
    id: '',
    title: '',
    content: null,
    contentHtml: '',
    isAnonymous: false,
    authorName: '',
  })

  const blogQuery = useQuery({
    queryKey: blogQueryKeys.detail(blogId),
    queryFn: () => fetchBlogById(blogId),
    enabled: !!blogId && status !== 'loading',
    retry: false,
  })

  useEffect(() => {
    if (!blogId || status === 'loading' || blogQuery.isLoading) return
    setLoading(true)
    setError('')

    let apiData: EditBlogData | null = null
    const blog = blogQuery.data
    if (blog) {
      const authorId = (blog?.author_id || blog?.author || '').toString()
      if (
        authorId &&
        session?.user?.id &&
        authorId !== session.user.id
      ) {
        setError('Bu bloqu redaktə etmək icazəniz yoxdur')
        setLoading(false)
        return
      }
      apiData = normalizeBlogData(blog, session?.user?.name || undefined)
    }

    const localData = getLocalEditBlogData(editDraftKey, blogId)
    const resolvedData = apiData || localData
    if (!resolvedData) {
      setError('Bloq məlumatlarını yükləmək alınmadı. Zəhmət olmasa yenidən cəhd edin.')
      setLoading(false)
      return
    }

    setInitialData(resolvedData)
    saveLocalEditBlogData(editDraftKey, resolvedData)
    setLoading(false)
  }, [blogId, status, session, blogQuery.data, blogQuery.isLoading, editDraftKey])

  return (
    <PageStateGuard
      isLoading={status === 'loading' || loading}
      isError={Boolean(error)}
      isEmpty={false}
      loadingText="Bloq məlumatları yüklənir..."
      errorTitle="Bloq yüklənərkən xəta"
      errorMessage={error}
      retryText="Profilə qayıt"
      onRetry={() => {
        router.push(localePath('/profile'))
      }}
    >
      <BlogStep1Form
        mode="edit"
        initialValues={{
          title: initialData.title,
          isAnonymous: initialData.isAnonymous,
          authorName: initialData.authorName,
        }}
        userName={session?.user?.name || ''}
        submitLabel="Yazı mərhələsinə keç →"
        nextHint="Növbəti: Məzmunu yenilə"
        onSubmit={(values) => {
          const base = getLocalEditBlogData(editDraftKey, blogId)
          saveLocalEditBlogData(editDraftKey, {
            id: blogId,
            title: values.title,
            content: base?.content || null,
            contentHtml: base?.contentHtml || '',
            isAnonymous: values.isAnonymous,
            authorName: values.authorName,
            status: base?.status || initialData.status || 'pending',
          })
          router.push(localePath(`/edit/blog/${blogId}/step2`))
        }}
      />
    </PageStateGuard>
  )
}
