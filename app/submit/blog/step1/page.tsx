'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/client'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useGlobalFeedback } from '@/hooks/useGlobalFeedback'
import { LoadingState, UnauthorizedState } from '@/components/shared'
import BlogStep1Form from '@/features/blogs/components/BlogStep1Form'
import { getSubmitDraftKey, readLocalDraft, writeLocalDraft } from '@/lib/blogDraftStorage'

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
  const { showInfo } = useGlobalFeedback()
  const { data: session, status } = useSession()
  const draftKey = getSubmitDraftKey(session?.user?.id)
  const [initialTitle, setInitialTitle] = useState('')
  const [initialAnonymous, setInitialAnonymous] = useState(false)
  const [initialAuthorName, setInitialAuthorName] = useState('')

  useEffect(() => {
    const d = readLocalDraft<DraftBlog>(draftKey)
    if (!d) return
    if (d.title) setInitialTitle(d.title)
    if (typeof d.isAnonymous === 'boolean') setInitialAnonymous(d.isAnonymous)
    if (typeof d.authorName === 'string') setInitialAuthorName(d.authorName)
  }, [draftKey])

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

  return (
    <BlogStep1Form
      initialValues={{
        title: initialTitle,
        isAnonymous: initialAnonymous,
        authorName: initialAuthorName,
      }}
      userName={session?.user?.name || ''}
      submitLabel="Yazmağa davam et →"
      nextHint="Növbəti: Məzmunu yazın"
      onSubmit={(values) => {
        const base = readLocalDraft<DraftBlog>(draftKey) || {}
        writeLocalDraft(draftKey, {
          ...base,
          title: values.title,
          isAnonymous: values.isAnonymous,
          authorName: values.authorName,
          content: base.content || null,
          contentHtml: base.contentHtml || '',
          characterCount: base.characterCount || 0,
        })
        router.push(localePath('/submit/blog/step2'))
      }}
    />
  )
}
