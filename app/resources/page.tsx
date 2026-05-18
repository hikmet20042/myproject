import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import ResourcesClient from './ResourcesClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "Resurslar və İmkanlar | icma360 — Vakansiya, Tədbir, Tədris Materialları və Təşkilatlar",
    description: "Azərbaycanda gənclər üçün bütün imkanlar bir yerdə: vakansiyalar, tədbirlər, tədris materialları və təşkilat kataloqu. Karyerana başlamaq üçün lazım olan hər şey.",
    keywords: [
      'resurslar Azərbaycan',
      'gənclər üçün resurslar',
      'iş elanları Bakı',
      'tədbirlər Azərbaycan',
      'tədris materialları',
      'təşkilat kataloqu',
      'gənclər üçün imkanlar',
      'karyera resursları',
    ],
    canonical: '/resources',
    ogType: 'website',
    locale: 'az_AZ',
  })
}

export default function ResourcesPage() {
  return <ResourcesClient />
}
