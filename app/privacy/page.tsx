import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import PrivacyClient from './PrivacyClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "Məxfilik Siyasəti | icma360",
    description: "icma360 platformasının məxfilik siyasəti. Məlumatlarınızın necə toplandığını, istifadə edildiyini və qorunduğunu öyrənin.",
    keywords: [
      'məxfilik siyasəti',
      'icma360 gizlilik',
      'məlumatların qorunması',
      'şəxsi məlumatlar',
      'istifadəçi hüquqları',
      'çərəz siyasəti',
    ],
    canonical: '/privacy',
    ogType: 'website',
    locale: 'az_AZ',

  })
}

export default function PrivacyPage() {
  return <PrivacyClient />
}
