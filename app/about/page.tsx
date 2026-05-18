import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import AboutClient from './AboutClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "icma360 Haqqında | Azərbaycanda Gənclər Platforması",
    description: "icma360 - gəncləri sosial təşəbbüslər, vakansiyalar, tədbirlər və inkişaf imkanları ilə birləşdirən rəqəmsal platforma. Missiyamız, həllimiz və prinsiplərimiz haqqında öyrənin.",
    keywords: [
      'icma360 haqqında',
      'gənclər platforması Azərbaycan',
      'gənclər üçün imkanlar',
      'Azərbaycan gənclik təşkilatı',
      'gənclər üçün vakansiya',
      'gənclər üçün tədbirlər',
      'gənclərin inkişafı',
      'sosial təşəbbüslər Azərbaycan',
    ],
    canonical: '/about',
    ogType: 'website',
    locale: 'az_AZ',
  })
}

export default function AboutPage() {
  return <AboutClient />
}
