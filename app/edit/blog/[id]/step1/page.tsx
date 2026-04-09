'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { PageStateGuard } from '@/components/shared'
import { blogQueryKeys, fetchBlogById } from '@/lib/blogQueries'
import BlogStep1Form from '@/features/blogs/components/BlogStep1Form'

type EditBlogData = {
  id: string
  title: string
  content: any
  contentHtml: string
  isAnonymous: boolean
  authorName: string
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
  }
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

export default function EditBlogStep1() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const localePath = useLocalizedPath()
  const blogId = params?.id as string

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
        authorId !== session.user.id &&
        (blog?.author_name || blog?.authorName) !== session?.user?.name
      ) {
        setError('Bu bloqu redaktə etmək icazəniz yoxdur')
        setLoading(false)
        return
      }
      apiData = normalizeBlogData(blog, session?.user?.name || undefined)
    }

    const localData = getLocalEditBlogData(blogId)
    const resolvedData = apiData || localData
    if (!resolvedData) {
      setError('Bloq məlumatlarını yükləmək alınmadı. Zəhmət olmasa yenidən cəhd edin.')
      setLoading(false)
      return
    }

    setInitialData(resolvedData)
    saveLocalEditBlogData(resolvedData)
    setLoading(false)
  }, [blogId, status, session, blogQuery.data, blogQuery.isLoading])

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
          const base = getLocalEditBlogData(blogId)
          saveLocalEditBlogData({
            id: blogId,
            title: values.title,
            content: base?.content || null,
            contentHtml: base?.contentHtml || '',
            isAnonymous: values.isAnonymous,
            authorName: values.authorName,
          })
          router.push(localePath(`/edit/blog/${blogId}/step2`))
        }}
      />
    </PageStateGuard>
  )
}
