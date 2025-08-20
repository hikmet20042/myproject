import './globals.css'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthProvider from '@/components/AuthProvider'
import { NotificationProvider } from '@/components/NotificationContext'
import ArticleSubmissionCleanup from '@/components/ArticleSubmissionCleanup'

export const metadata: Metadata = {
  title: 'Social Justice Platform',
  description: 'Public service website promoting social justice and equality for all communities',
  keywords: 'social justice, equality, human rights, community advocacy, public service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
  <body className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200" suppressHydrationWarning={true}>
        <AuthProvider>
          <NotificationProvider>
            <ArticleSubmissionCleanup />
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
