import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateBlogMetadata } from '@/lib/metadata/blogs'
import BlogDetailClient from './BlogDetailClient'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return generateBlogMetadata(slug)
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createSupabaseAdminClient()

  const { data: resolved } = await supabase
    .from('blogs')
    .select('id, slug, status')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (!resolved || resolved.status !== 'approved') {
    notFound()
  }

  return <BlogDetailClient params={{ slug }} />
}
