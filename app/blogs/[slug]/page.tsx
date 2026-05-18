import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateBlogMetadata } from '@/lib/metadata/blogs'
import BlogDetailClient from './BlogDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return generateBlogMetadata(params.slug)
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseAdminClient()

  const { data: resolved } = await supabase
    .from('blogs')
    .select('id, slug, status')
    .or(`slug.eq.${params.slug},id.eq.${params.slug}`)
    .single()

  if (!resolved || resolved.status !== 'approved') {
    notFound()
  }

  return <BlogDetailClient params={{ slug: params.slug }} />
}
