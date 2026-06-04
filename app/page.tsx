import { Metadata } from 'next'
import { generateSEOMetadata, azerbaijanKeywords } from '@/lib/seo'
import HomePageClient from './HomePageClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "icma360 — Azərbaycanda Gənclər üçün #1 İmkan Platforması | Vakansiya, Təlim, Təcrübə və Tədbirlər",
    description: "Azərbaycanda ən yaxşı vakansiya, təlimlər, təcrübə proqramı, könüllülük və QHT imkanlarını kəşf edin. Pulsuz tədbirlər, təlimə qeydiyyat, universitet klubları, gənclər təşkilatı və təşəbbüs qrupları. Gənclərin karyera uğuru üçün pulsuz platforma.",
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
      'təlimə qeydiyyat',
      'pulsuz tədbirlər',
      'universitet klubları',
      'təşəbbüs qrupu',
      'gənclər təşkilatı',
    ],
    canonical: '/',
    ogImage: '/opengraph-image',
    ogType: 'website',
    locale: 'az_AZ',
    alternateLocales: ['az_AZ'],
  })
}

export default function HomePage() {
  return <HomePageClient />
}
