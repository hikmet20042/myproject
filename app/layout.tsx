// @ts-ignore: allow side-effect import of global CSS without type declarations
import "./globals.css"
import type { Metadata, Viewport } from 'next'
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
    ogImage: '/opengraph-image',
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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
        
        {/* Additional SEO Meta Tags */}
        <meta name="geo.region" content="AZ" />
        <meta name="geo.placename" content="Baku" />
        <meta name="geo.position" content="40.4093;49.8671" />
        <meta name="ICBM" content="40.4093, 49.8671" />

        {/* Language and Content */}
        <meta httpEquiv="content-language" content="az" />
        <link rel="alternate" hrefLang="az" href={siteUrl} />
        <link rel="alternate" hrefLang="en" href={siteUrl} />
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />

        {/* Canonical Language Alternates for major pages */}
        <link rel="alternate" hrefLang="az" href={`${siteUrl}/about`} />
        <link rel="alternate" hrefLang="az" href={`${siteUrl}/resources`} />
        <link rel="alternate" hrefLang="az" href={`${siteUrl}/blogs`} />
        <link rel="alternate" hrefLang="az" href={`${siteUrl}/resources/vacancies`} />
        <link rel="alternate" hrefLang="az" href={`${siteUrl}/resources/events`} />
        <link rel="alternate" hrefLang="az" href={`${siteUrl}/resources/organizations`} />

        {/* PWA App Install Banner / Related Application */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="icma360" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Accessibility & Indexing */}
        <meta name="format-detection" content="telephone=no" />

        {/* RSS Feed for Blog Content Discovery */}
        <link rel="alternate" type="application/rss+xml" title="icma360 Bloq RSS Lenti" href={`${siteUrl}/api/rss`} />
        <link rel="alternate" type="application/atom+xml" title="icma360 Bloq Atom Lenti" href={`${siteUrl}/api/rss`} />

        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://grainy-gradients.vercel.app" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />

        {/* FAQ Schema — helps earn Rich Snippet dropdowns */}
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'icma360 nədir?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'icma360 Azərbaycanda gənclər üçün pulsuz imkan platformasıdır. Vakansiyalar, təcrübə proqramları, tədbirlər və QHT imkanlarını bir yerdə təqdim edərək gənclərin karyera inkişafına kömək edir.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'icma360-da necə qeydiyyatdan keçə bilərəm?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Həmçinn, icma360-da qeydiyyatdan keçməklə siz vakansiyalara müraciət edə, tədbirlərə qoşula, təhsil materiallarından yararlana və İcma Bloquna yazı yazıla bilərsiniz.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'icma360 pulsuzdurmu?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Bəli, icma360 tamamilə pulsuzdur. Gənclər və təşkilatlar qeydiyyatdan keçməklə bütün imkanlardan yararlana bilərlər.',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 text-slate-900 transition-colors duration-200" suppressHydrationWarning={true}>
        {/* eslint-disable-next-line no-restricted-syntax */}
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <QueryProvider>
          {/* eslint-disable-next-line no-restricted-syntax */}
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
