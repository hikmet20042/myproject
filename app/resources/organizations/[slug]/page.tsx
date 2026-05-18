import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateOrganizationMetadata } from '@/lib/metadata/organizations'
import OrganizationDetailClient from './OrganizationDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return generateOrganizationMetadata(params.slug)
}

export default async function OrganizationDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseAdminClient()

  const { data: resolved } = await supabase
    .from('organization_profiles')
    .select('id, slug, url_handle, status')
    .or(`slug.eq.${params.slug},url_handle.eq.${params.slug}`)
    .single()

  if (!resolved || resolved.status !== 'approved') {
    notFound()
  }

  return <OrganizationDetailClient />
}
