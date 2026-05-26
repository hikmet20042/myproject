import { Metadata } from 'next'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateSEOMetadata, generateArticleSchema, generateSpeakableSchema } from '@/lib/seo'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

/**
 * Generate metadata for individual blog pages
 */
export async function generateBlogMetadata(slugOrId: string): Promise<Metadata> {
  try {
    if (slugOrId.startsWith('seed-')) {
      return generateSEOMetadata({
        title: 'Community Story | icma360',
        description: 'Read community stories on icma360',
        noindex: true,
        canonical: `/blogs/${slugOrId}`,
      })
    }

    const supabase = createSupabaseAdminClient()
    const { data: resolved } = await resolveEntityBySlugOrId(supabase, 'blogs', slugOrId, 'id, slug, status')

    if (!resolved?.id || resolved.status !== 'approved') {
      return generateSEOMetadata({
        title: 'Story Not Found | icma360',
        description: 'The story you are looking for could not be found.',
        noindex: true,
      })
    }

    const { data: blogRow, error } = await supabase
      .from('blogs')
      .select('id, slug, title, content, author_name, tags, created_at, updated_at, featured_image')
      .eq('id', resolved.id)
      .single()

    if (error) {
      throw error
    }

    const blog: any = blogRow ? {
      _id: blogRow.id,
      slug: blogRow.slug,
      title: blogRow.title,
      content: blogRow.content,
      authorName: blogRow.author_name || 'Anonymous',
      tags: blogRow.tags || [],
      createdAt: blogRow.created_at,
      updatedAt: blogRow.updated_at,
      featuredImage: blogRow.featured_image
    } : null
    
    if (!blog) {
      return generateSEOMetadata({
        title: 'Story Not Found | icma360',
        description: 'The story you are looking for could not be found.',
        noindex: true,
      })
    }

    // Extract excerpt from content
    let excerpt = ''
    if (blog.content) {
      if (Array.isArray(blog.content)) {
        excerpt = blog.content
          .map((block: any) => {
            if (block.content && Array.isArray(block.content)) {
              return block.content.map((item: any) => item.text || '').join('')
            }
            return ''
          })
          .join(' ')
          .trim()
          .slice(0, 160)
      } else if (typeof blog.content === 'string') {
        excerpt = blog.content.slice(0, 160)
      }
    }

    const description = excerpt || `${blog.title} - ${blog.authorName} tərəfindən icma360-da. Azərbaycan gənclik icmasından real hekayələr.`
    blog.excerpt = excerpt

    const canonicalSlug = blog.slug || slugOrId

    return generateSEOMetadata({
      title: `${blog.title} - ${blog.authorName} | İcma Hekayələri | icma360`,
      description,
      keywords: [
        blog.title,
        blog.authorName,
        'icma hekayələri Azərbaycan',
        'gənclik hekayələri Azərbaycan',
        'uğur hekayələri Azərbaycan',
        'şəxsi təcrübələr Azərbaycan',
        'gənc peşəkar hekayələri',
        'karyera təcrübəsi',
        ...(blog.tags || []),
        'gənclərin gücləndirilməsi',
        'icma iştirakı',
        'Azərbaycan gəncliyi',
        'motivasiya hekayələri',
      ],
      canonical: `/blogs/${canonicalSlug}`,
      ogType: 'article',
      author: blog.authorName,
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt,
      structuredData: {
        '@context': 'https://schema.org',
        '@graph': [
          generateArticleSchema(blog),
          generateSpeakableSchema({
            headline: blog.title,
            text: excerpt,
            url: `/blogs/${canonicalSlug}`,
            datePublished: blog.createdAt,
            author: blog.authorName,
          }),
        ],
      },
    })
  } catch (error) {
    console.error('Error generating blog metadata:', error)
    return generateSEOMetadata({
      title: 'Community Story | icma360',
      description: 'Read community stories on icma360',
    })
  }
}
