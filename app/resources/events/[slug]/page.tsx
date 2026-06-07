import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateEventMetadata } from '@/lib/metadata/events'
import EventDetailClient from './EventDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export async function generateStaticParams() {
  try {
    const supabase = createSupabaseAdminClient()
    const { data: events } = await supabase
      .from('events')
      .select('slug')
      .eq('status', 'approved')
      .eq('is_published', true)
      .limit(1000)

    return events?.map((event) => ({ slug: event.slug })) || []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return generateEventMetadata(params.slug)
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  if (process.env.ENABLE_TEST_AUTH_MODE === '1') {
    return <EventDetailClient />
  }

  const supabase = createSupabaseAdminClient()
  const { data: resolved } = await resolveEntityBySlugOrId(supabase, 'events', params.slug, 'id, slug, status, is_published')

  if (!resolved?.id || resolved.status !== 'approved' || !resolved.is_published) {
    notFound()
  }

  return <EventDetailClient />
}
