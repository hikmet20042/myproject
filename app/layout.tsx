import './globals.css'
import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AuthProvider from '@/components/AuthProvider'
import { NotificationProvider } from '@/features/notifications/context/NotificationContext'
import { SocketProvider } from '@/components/SocketProvider'
import { SSENotificationProvider } from '@/features/notifications/providers/SSENotificationProvider'
import QueryProvider from '@/components/QueryProvider'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import GlobalFeedback from '@/components/admin/GlobalFeedback'
import EventsRealtimeSyncContainer from '@/features/events/components/EventsRealtimeSyncContainer'
import { GlobalFeedbackProvider } from '@/hooks/useGlobalFeedback'
import { ErrorBoundary } from '@/components/shared'
import { generateSEOMetadata, generateOrganizationSchema, generateWebSiteSchema, generateLocalBusinessSchema, azerbaijanKeywords } from '@/lib/seo'
import Script from 'next/script'
import { Suspense } from 'react'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...generateSEOMetadata({
    title: "icma360 — Azərbaycanda Gənclər üçün #1 İmkan Platforması | İş, Təcrübə, Təlim və Tədbirlər",
    description: "Azərbaycanda ən yaxşı iş, təcrübə, könüllülük, təlim və QHT imkanlarını kəşf edin. 500+ vakansiya, təcrübə proqramı və tədbir. Gənclərin karyera uğuru üçün pulsuz platforma. 🇦🇿",
    keywords: [
      ...azerbaijanKeywords,
      'icma360',
      'icma360 Azərbaycan',
      'gənclər üçün platforma',
      'Azərbaycan iş portalı',
      'iş axtarış saytı',
      'təcrübə platforması',
      'QHT kataloqu Azərbaycan',
      'Bakı təlim proqramları',
      'könüllü imkanları',
      'gənclərin inkişafı Azərbaycan',
      'peşəkar şəbəkə Azərbaycan',
    ],
    canonical: '/',
    ogImage: '/og-image.png',
    ogType: 'website',
    locale: 'az_AZ',
    alternateLocales: ['az_AZ'],
  }),
  icons: {
    icon: '/apple-icon.png',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="az" className="scroll-smooth">
      <head>
        {/* Structured Data - Organization */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: generateOrganizationSchema() }}
        />
        
        {/* Structured Data - WebSite with Search */}
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: generateWebSiteSchema() }}
        />
        
        {/* Structured Data - LocalBusiness for Azerbaijan */}
        <Script
          id="localbusiness-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: generateLocalBusinessSchema() }}
        />
        
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE" />
        
        {/* Yandex Webmaster Verification (Important for Azerbaijan) */}
        <meta name="yandex-verification" content="YOUR_YANDEX_VERIFICATION_CODE" />
        
        {/* Bing Webmaster Verification */}
        <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="geo.region" content="AZ" />
        <meta name="geo.placename" content="Baku" />
        <meta name="geo.position" content="40.4093;49.8671" />
        <meta name="ICBM" content="40.4093, 49.8671" />
        
        {/* Language and Content */}
        <meta httpEquiv="content-language" content="az" />
        <link rel="alternate" hrefLang="az" href={siteUrl} />
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />
        
        {/* RSS Feed for Blog Content Discovery */}
        <link rel="alternate" type="application/rss+xml" title="icma360 Bloq RSS Lenti" href={`${siteUrl}/api/rss`} />
        <link rel="alternate" type="application/atom+xml" title="icma360 Bloq Atom Lenti" href={`${siteUrl}/api/rss`} />
      </head>
      <body className="min-h-screen bg-gray-50 text-slate-900 transition-colors duration-200" suppressHydrationWarning={true}>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <QueryProvider>
          <Suspense fallback={null}>
            <AuthProvider>
              <SocketProvider>
                <SSENotificationProvider>
                  <NotificationProvider>
                    <GlobalFeedbackProvider>
                      <ErrorBoundary>
                        <EventsRealtimeSyncContainer />
                        <GlobalFeedback />
                        <Header />
                        <main className="min-h-screen">
                          {children}
                        </main>
                        <Footer />
                      </ErrorBoundary>
                    </GlobalFeedbackProvider>
                  </NotificationProvider>
                </SSENotificationProvider>
              </SocketProvider>
            </AuthProvider>
          </Suspense>
        </QueryProvider>
      </body>
    </html>
  )
}
