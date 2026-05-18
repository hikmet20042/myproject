import { Metadata } from 'next'
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo'
import OrgProfileClient from './OrgProfileClient'

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params
  return generateSEOMetadata({
    title: `Təşkilat Profili | icma360`,
    description: `Təşkilat profili haqqında məlumat. icma360 platformasında təşkilatların fəaliyyəti, tədbirləri və vakansiyaları.`,
    keywords: [
      'təşkilat profili',
      'gənclər təşkilatı',
      'QHT Azərbaycan',
      'təşkilat fəaliyyəti',
    ],
    canonical: `/o/${handle}`,
    ogType: 'profile',
    locale: 'az_AZ',
    structuredData: generateBreadcrumbSchema([
      { name: 'Ana Səhifə', url: '/' },
      { name: 'Təşkilatlar', url: '/resources/organizations' },
      { name: 'Profil', url: `/o/${handle}` },
    ]),
  })
}

export default async function OrgProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  await params
  return <OrgProfileClient />
}
