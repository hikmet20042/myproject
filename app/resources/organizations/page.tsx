import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import OrganizationsClient from './OrganizationsClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "Təşkilat Kataloqu | icma360 — Gənclər Təşkilatı, QHT, Universitet Klubları və Təşəbbüs Qrupları",
    description: "Azərbaycanda fəal gənclər təşkilatı, QHT, universitet klubları və təşəbbüs qruplarını kəşf edin. Təşkilatların fokus sahələri, əlaqə məlumatları və fəaliyyətləri haqqında məlumat alın.",
    keywords: [
      'gənclər təşkilatı',
      'qht',
      'təşkilat kataloqu Azərbaycan',
      'gənclər təşkilatları',
      'QHT Azərbaycan',
      'QHT siyahısı',
      'ictimai təşkilatlar',
      'gənclik təşəbbüsləri',
      'təşəbbüs qrupu',
      'universitet klubları',
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
