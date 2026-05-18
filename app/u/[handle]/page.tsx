import { Metadata } from 'next'
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo'
import UserProfileClient from './UserProfileClient'

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params
  return generateSEOMetadata({
    title: `İstifadəçi Profili | icma360`,
    description: `İstifadəçi profili haqqında məlumat. icma360 platformasında gənclərin profilləri və fəaliyyətləri.`,
    keywords: [
      'istifadəçi profili',
      'gənc profili',
      'icma360 istifadəçi',
    ],
    canonical: `/u/${handle}`,
    ogType: 'profile',
    locale: 'az_AZ',
    noindex: true,
    structuredData: generateBreadcrumbSchema([
      { name: 'Ana Səhifə', url: '/' },
      { name: 'Profil', url: `/u/${handle}` },
    ]),
  })
}

export default async function UserProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  await params
  return <UserProfileClient />
}
