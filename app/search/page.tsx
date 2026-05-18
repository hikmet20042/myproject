import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import SearchClient from './SearchClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "Axtarış | icma360 — Vakansiya, Tədbir, Bloq və Təşkilat Axtar",
    description: "icma360 platformasında vakansiya, tədbir, bloq və təşkilatları bir yerdən axtar. Qlobal axtarış ilə lazım olan imkanları tez tap.",
    keywords: [
      'axtarış icma360',
      'vakansiya axtar',
      'tədbir axtar',
      'bloq axtar',
      'təşkilat axtar',
      'gənclər üçün axtarış',
    ],
    canonical: '/search',
    ogType: 'website',
    locale: 'az_AZ',
    noindex: true,
  })
}

export default function SearchPage() {
  return <SearchClient />
}
