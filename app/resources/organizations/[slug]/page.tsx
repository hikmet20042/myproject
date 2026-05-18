import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateOrganizationMetadata } from '@/lib/metadata/organizations'
import OrganizationDetailClient from './OrganizationDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return generateOrganizationMetadata(slug)
}

export default async function OrganizationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createSupabaseAdminClient()

  const { data: resolved } = await supabase
    .from('organization_profiles')
    .select('id, slug, url_handle, status')
    .or(`slug.eq.${slug},url_handle.eq.${slug}`)
    .single()

  if (!resolved || resolved.status !== 'approved') {
    notFound()
  }

  return <OrganizationDetailClient />
}
