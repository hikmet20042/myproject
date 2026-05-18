import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateBlogMetadata } from '@/lib/metadata/blogs'
import BlogDetailClient from './BlogDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return generateBlogMetadata(params.slug)
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseAdminClient()
  const { data: resolved } = await resolveEntityBySlugOrId(supabase, 'blogs', params.slug, 'id, slug, status')

  if (!resolved?.id || resolved.status !== 'approved') {
    notFound()
  }

  return <BlogDetailClient params={{ slug: params.slug }} />
}
