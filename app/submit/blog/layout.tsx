import { Metadata } from 'next'
import BlogSubmissionLayoutClient from './BlogSubmissionLayoutClient'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function BlogSubmissionLayout({ children }: { children: React.ReactNode }) {
  return <BlogSubmissionLayoutClient>{children}</BlogSubmissionLayoutClient>
}
