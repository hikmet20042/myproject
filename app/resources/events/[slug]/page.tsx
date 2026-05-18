import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateEventMetadata } from '@/lib/metadata/events'
import EventDetailClient from './EventDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return generateEventMetadata(slug)
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createSupabaseAdminClient()

  const { data: resolved } = await supabase
    .from('events')
    .select('id, slug, status, is_published')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (!resolved || resolved.status !== 'approved' || !resolved.is_published) {
    notFound()
  }

  return <EventDetailClient />
}
