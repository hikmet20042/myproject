'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

export default function SubmitBlogPage() {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { t } = useLanguage()
  
  useEffect(() => {
    router.replace(localePath("/submit/blog/step1"))
  }, [router, localePath])
  
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">{t('submitBlog.redirecting')}</div>
    </div>
  )
}

