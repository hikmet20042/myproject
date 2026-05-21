import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateOrganizationMetadata } from '@/lib/metadata/organizations'
import OrganizationDetailClient from './OrganizationDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export async function generateStaticParams() {
  const supabase = createSupabaseAdminClient()
  const { data: orgs } = await supabase
    .from('organization_profiles')
    .select('slug')
    .eq('moderation_status', 'approved')
    .limit(1000)

  return orgs?.map((org) => ({ slug: org.slug })) || []
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const metadata = await generateOrganizationMetadata(params.slug)
  // This page is a duplicate of /o/[handle], mark as noindex
  metadata.robots = { index: false, follow: true }
  return metadata
}

export default async function OrganizationDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseAdminClient()
  const { data: resolved } = await resolveEntityBySlugOrId(supabase, 'organization_profiles', params.slug, 'id, slug, url_handle, status')

  if (!resolved?.id || resolved.status !== 'approved') {
    notFound()
  }

  return <OrganizationDetailClient />
}
