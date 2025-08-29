'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ArticleSubmissionCleanup() {
  const pathname = usePathname()

  useEffect(() => {
    // Check if we're outside the article submission flow
    const isInArticleFlow = pathname?.includes('/submit/article/')
    const wasInArticleFlow = sessionStorage.getItem('inArticleSubmissionFlow') === 'true'
    const shouldPreserve = sessionStorage.getItem('preserveArticleData') === 'true'

    // If we were in the article flow but now we're not, cleanup localStorage
    // But only if we're not supposed to preserve the data
    // Also check if we're not in story editing flow to avoid conflicts
    const isInStoryEditFlow = pathname?.includes('/edit/story/')
    
    if (wasInArticleFlow && !isInArticleFlow && !shouldPreserve && !isInStoryEditFlow) {
      // Clean up article submission data
      localStorage.removeItem('draftArticle')
      localStorage.removeItem('currentDraftId')
      localStorage.removeItem('currentEditId')

      // Clear the flow flags
      sessionStorage.removeItem('inArticleSubmissionFlow')
      sessionStorage.removeItem('navigatingWithinArticleFlow')
      sessionStorage.removeItem('preserveArticleData')
    }

    // If we're back in the article flow, clear the preserve flag
    if (isInArticleFlow && shouldPreserve) {
      sessionStorage.removeItem('preserveArticleData')
    }
  }, [pathname])

  return null // This component doesn't render anything
}
