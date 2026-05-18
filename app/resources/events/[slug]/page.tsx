import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateEventMetadata } from '@/lib/metadata/events'
import EventDetailClient from './EventDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return generateEventMetadata(params.slug)
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseAdminClient()

  const { data: resolved } = await supabase
    .from('events')
    .select('id, slug, status, is_published')
    .or(`slug.eq.${params.slug},id.eq.${params.slug}`)
    .single()

  if (!resolved || resolved.status !== 'approved' || !resolved.is_published) {
    notFound()
  }

  return <EventDetailClient />
}
