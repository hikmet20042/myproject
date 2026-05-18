import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import OrganizationsClient from './OrganizationsClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "Təşkilat Kataloqu | icma360 — Gənclər Təşkilatları və QHT-lər",
    description: "Azərbaycanda fəal gənclər təşkilatlarını və QHT-ləri kəşf edin. Təşkilatların fokus sahələri, əlaqə məlumatları və fəaliyyətləri haqqında məlumat alın.",
    keywords: [
      'təşkilat kataloqu Azərbaycan',
      'gənclər təşkilatları',
      'QHT Azərbaycan',
      'QHT siyahısı',
      'ictimai təşkilatlar',
      'gənclik təşəbbüsləri',
      'təşkilatlar Bakı',
      'qeyri-hökumət təşkilatları',
    ],
    canonical: '/resources/organizations',
    ogType: 'website',
    locale: 'az_AZ',
  })
}

export default function OrganizationsPage() {
  return <OrganizationsClient />
}
