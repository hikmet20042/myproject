'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { LoadingState, UnauthorizedState } from '@/components/shared'
import BlogStep1Form from '@/features/blogs/components/BlogStep1Form'

type DraftBlog = {
  title?: string
  isAnonymous?: boolean
  authorName?: string
  content?: any
  contentHtml?: string
  characterCount?: number
}

export default function BlogStep1Page() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { data: session, status } = useSession()
  const [initialTitle, setInitialTitle] = useState('')
  const [initialAnonymous, setInitialAnonymous] = useState(false)
  const [initialAuthorName, setInitialAuthorName] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('draftBlog')
    if (!saved) return
    try {
      const d = JSON.parse(saved) as DraftBlog
      if (d.title) setInitialTitle(d.title)
      if (typeof d.isAnonymous === 'boolean') setInitialAnonymous(d.isAnonymous)
      if (typeof d.authorName === 'string') setInitialAuthorName(d.authorName)
    } catch {
      return
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

  return (
    <BlogStep1Form
      mode="submit"
      initialValues={{
        title: initialTitle,
        isAnonymous: initialAnonymous,
        authorName: initialAuthorName,
      }}
      userName={session?.user?.name || ''}
      submitLabel="Yazmağa davam et →"
      nextHint="Növbəti: Məzmunu yazın"
      onSubmit={(values) => {
        const saved = localStorage.getItem('draftBlog')
        const base: DraftBlog = saved ? JSON.parse(saved) : {}
        localStorage.setItem(
          'draftBlog',
          JSON.stringify({
            ...base,
            title: values.title,
            isAnonymous: values.isAnonymous,
            authorName: values.authorName,
            content: base.content || null,
            contentHtml: base.contentHtml || '',
            characterCount: base.characterCount || 0,
          }),
        )
        router.push(localePath('/submit/blog/step2'))
      }}
    />
  )
}
