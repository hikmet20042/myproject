import { Metadata } from 'next'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateSEOMetadata, generateOrganizationProfileSchema } from '@/lib/seo'

export async function generateOrganizationMetadata(identifier: string): Promise<Metadata> {
  try {
    const supabase = createSupabaseAdminClient()

    const { data: orgRow, error } = await supabase
      .from('organization_profiles')
      .select('id, slug, organization_name, description, organization_type, focus_areas, website, address, social_media, status, created_at, updated_at')
      .or(`slug.eq.${identifier},url_handle.eq.${identifier}`)
      .single()

    if (error || !orgRow || orgRow.status !== 'approved') {
      return generateSEOMetadata({
        title: 'Təşkilat Tapılmadı | icma360',
        description: 'Axtardığınız təşkilat tapılmadı.',
        noindex: true,
      })
    }

    const org = {
      id: orgRow.id,
      slug: orgRow.slug,
      organizationName: orgRow.organization_name,
      description: orgRow.description,
      organizationType: orgRow.organization_type,
      focusAreas: orgRow.focus_areas || [],
      website: orgRow.website,
      address: orgRow.address,
      socialMedia: orgRow.social_media,
      createdAt: orgRow.created_at,
      updatedAt: orgRow.updated_at,
    }

    const description = org.description 
      ? `${org.organizationName} - ${org.description.slice(0, 120)}...`
      : `${org.organizationName} - Azərbaycanda fəal gənclər təşkilatı. icma360-da kəşf et.`

    return generateSEOMetadata({
      title: `${org.organizationName} | ${org.organizationType || 'Gənclər Təşkilatı'} | icma360`,
      description,
      keywords: [
        org.organizationName,
        `${org.organizationName} Azərbaycan`,
        `${org.organizationType || 'gənclər təşkilatı'} Azərbaycan`,
        'gənclər təşkilatları',
        'QHT Azərbaycan',
        ...org.focusAreas,
        'gənclik təşəbbüsləri',
        'ictimai təşkilat',
      ],
      canonical: `/o/${org.slug || identifier}`,
      ogType: 'profile',
      structuredData: generateOrganizationProfileSchema(org),
    })
  } catch (error) {
    console.error('Error generating organization metadata:', error)
    return generateSEOMetadata({
      title: 'Təşkilat | icma360',
      description: 'Təşkilat məlumatları icma360-da',
    })
  }
}
