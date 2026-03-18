import { Metadata } from 'next'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateSEOMetadata, generateArticleSchema } from '@/lib/seo'

/**
 * Generate metadata for individual blog pages
 */
export async function generateBlogMetadata(id: string): Promise<Metadata> {
  try {
    const supabase = createSupabaseAdminClient()
    const { data: blogRow, error } = await supabase
      .from('blogs')
      .select('id, title, content, author_name, tags, submitted_at, created_at, updated_at, featured_image')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    const blog: any = blogRow ? {
      _id: blogRow.id,
      title: blogRow.title,
      content: blogRow.content,
      authorName: blogRow.author_name || 'Anonymous',
      tags: blogRow.tags || [],
      submittedAt: blogRow.submitted_at,
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
      canonical: `/blogs/${id}`,
      ogType: 'article',
      author: blog.authorName,
      publishedTime: blog.submittedAt || blog.createdAt,
      modifiedTime: blog.updatedAt,
      structuredData: generateArticleSchema(blog),
    })
  } catch (error) {
    console.error('Error generating blog metadata:', error)
    return generateSEOMetadata({
      title: 'Community Story | icma360',
      description: 'Read community stories on icma360',
    })
  }
}
