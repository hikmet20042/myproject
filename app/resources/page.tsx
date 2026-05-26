import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import ResourcesClient from './ResourcesClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "Resurslar və İmkanlar | icma360 — Vakansiya, Təlim, Təcrübə, Tədbir, Materiallar və Təşkilatlar",
    description: "Azərbaycanda gənclər üçün bütün imkanlar bir yerdə: vakansiyalar, təlimlər, təcrübə proqramları, pulsuz tədbirlər, tədris materialları və təşkilat kataloqu. Karyerana başlamaq üçün lazım olan hər şey.",
    keywords: [
      'vakansiya',
      'təlim',
      'təcrübə',
      'könüllülük',
      'resurslar Azərbaycan',
      'gənclər üçün resurslar',
      'iş elanları Bakı',
      'tədbirlər Azərbaycan',
      'tədris materialları',
      'təşkilat kataloqu',
      'gənclər üçün imkanlar',
      'karyera resursları',
      'pulsuz tədbirlər',
      'təlimə qeydiyyat',
    ],
    canonical: '/resources',
    ogType: 'website',
    locale: 'az_AZ',
  })
}

export default function ResourcesPage() {
  return <ResourcesClient />
}
