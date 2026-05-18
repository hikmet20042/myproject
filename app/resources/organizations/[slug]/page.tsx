import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateOrganizationMetadata } from '@/lib/metadata/organizations'
import OrganizationDetailClient from './OrganizationDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return generateOrganizationMetadata(params.slug)
}

export default async function OrganizationDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseAdminClient()
  const { data: resolved } = await resolveEntityBySlugOrId(supabase, 'organization_profiles', params.slug, 'id, slug, url_handle, status')

  if (!resolved?.id || resolved.status !== 'approved') {
    notFound()
  }

  return <OrganizationDetailClient />
}
