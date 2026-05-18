import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateVacancyMetadata } from '@/lib/metadata/vacancies'
import VacancyDetailClient from './VacancyDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return generateVacancyMetadata(params.slug)
}

export default async function VacancyDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseAdminClient()

  const { data: resolved } = await supabase
    .from('vacancies')
    .select('id, slug, status, is_published')
    .or(`slug.eq.${params.slug},id.eq.${params.slug}`)
    .single()

  if (!resolved || resolved.status !== 'approved' || !resolved.is_published) {
    notFound()
  }

  return <VacancyDetailClient />
}
