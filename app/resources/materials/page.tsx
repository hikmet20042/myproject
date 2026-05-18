import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import MaterialsClient from './MaterialsClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "Tədris Materialları | icma360 — Kurslar, Bələdçilər və Resurslar",
    description: "Gənclərin inkişafına və bacarıqların artırılmasına yönəlmiş təlimatlar, kurslar və bələdçilər. Pulsuz təhsil resurslarını kəşf edin.",
    keywords: [
      'tədris materialları',
      'pulsuz kurslar Azərbaycan',
      'onlayn təhsil resursları',
      'bacarıq inkişafı',
      'peşəkar inkişaf materialları',
      'gənclər üçün təhsil',
      'karyera inkişafı resursları',
    ],
    canonical: '/resources/materials',
    ogType: 'website',
    locale: 'az_AZ',
  })
}

export default function MaterialsPage() {
  return <MaterialsClient />
}
