import './globals.css'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthProvider from '@/components/AuthProvider'
import { NotificationProvider } from '@/components/NotificationContext'

export const metadata: Metadata = {
  title: 'Gender Equality Azerbaijan',
  description: 'Public service website promoting gender equality and fighting gender-based violence in Azerbaijan',
  keywords: 'gender equality, Azerbaijan, women rights, gender-based violence, public service',
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
