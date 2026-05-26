import { Metadata } from 'next'
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import OrgProfileClient from './OrgProfileClient'

export async function generateStaticParams() {
  const supabase = createSupabaseAdminClient()
  const { data: orgs } = await supabase
    .from('organization_profiles')
    .select('url_handle')
    .eq('moderation_status', 'approved')
    .not('url_handle', 'is', null)
    .limit(1000)

  return orgs?.map((org) => ({ handle: org.url_handle })).filter((o) => o.handle) || []
}

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const { handle } = params
  const supabase = createSupabaseAdminClient()

  const { data: orgRow } = await supabase
    .from('organization_profiles')
    .select('organization_name, organization_type, description, slug, url_handle')
    .or(`url_handle.eq.${handle},slug.eq.${handle}`)
    .eq('moderation_status', 'approved')
    .single()

  const orgName = orgRow?.organization_name
  const orgType = orgRow?.organization_type || 'Gənclər Təşkilatı'
  const canonicalHandle = orgRow?.url_handle || orgRow?.slug || handle

  return generateSEOMetadata({
    title: orgName
      ? `${orgName} | ${orgType} | icma360`
      : `Təşkilat Profili | icma360`,
    description: orgRow?.description
      ? `${orgName} - ${orgRow.description.slice(0, 120)}...`
      : `${orgName || 'Təşkilat'} haqqında məlumat. icma360 platformasında təşkilatların fəaliyyəti, tədbirləri və vakansiyaları.`,
    keywords: orgName
      ? [
          orgName,
          `${orgName} Azərbaycan`,
          `${orgType} Azərbaycan`,
          'gənclər təşkilatı',
          'gənclər təşkilatları',
          'QHT Azərbaycan',
          'gənclik təşəbbüsləri',
          'ictimai təşkilat',
          'təşəbbüs qrupu',
          'universitet klubları',
        ]
      : ['təşkilat profili', 'gənclər təşkilatı', 'QHT Azərbaycan'],
    canonical: `/o/${canonicalHandle}`,
    ogType: 'profile',
    locale: 'az_AZ',
    structuredData: generateBreadcrumbSchema([
      { name: 'Ana Səhifə', url: '/' },
      { name: 'Təşkilatlar', url: '/resources/organizations' },
      { name: orgName || 'Profil', url: `/o/${canonicalHandle}` },
    ]),
  })
}

export default function OrgProfilePage({ params }: { params: { handle: string } }) {
  return <OrgProfileClient />
}
