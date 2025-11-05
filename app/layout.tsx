import './globals.css'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthProvider from '@/components/AuthProvider'
import { NotificationProvider } from '@/components/NotificationContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { SocketProvider } from '@/components/SocketProvider'
import { SSENotificationProvider } from '@/components/SSENotificationProvider'

export const metadata: Metadata = {
  title: 'icma360 — Youth & Community Platform',
  description: 'Empowering youth and communities in Azerbaijan through connection, learning, and opportunities',
  keywords: 'youth empowerment, community building, NGO network, opportunities, volunteering, Azerbaijan',
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
          <LanguageProvider>
            <SocketProvider>
              <SSENotificationProvider>
                <NotificationProvider>
                  <Header />
                  <main className="min-h-screen">
                    {children}
                  </main>
                  <Footer />
                </NotificationProvider>
              </SSENotificationProvider>
            </SocketProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
