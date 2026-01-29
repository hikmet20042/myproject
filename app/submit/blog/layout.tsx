"use client"

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function BlogSubmissionLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Removed the header section since pages have their own headers */}
      <section className="py-0">
        {children}
      </section>
    </div>
  )
}


