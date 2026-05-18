import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateVacancyMetadata } from '@/lib/metadata/vacancies'
import VacancyDetailClient from './VacancyDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return generateVacancyMetadata(params.slug)
}

export default async function VacancyDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseAdminClient()
  const { data: resolved } = await resolveEntityBySlugOrId(supabase, 'vacancies', params.slug, 'id, slug, status, is_published')

  if (!resolved?.id || resolved.status !== 'approved' || !resolved.is_published) {
    notFound()
  }

  return <VacancyDetailClient />
}
