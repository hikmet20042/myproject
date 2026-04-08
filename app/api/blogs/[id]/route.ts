import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getFeaturedImageBlobId } from '@/lib/utils/imageUtils'
import { cache } from '@/lib/cache'
import { isAdminOrOwner } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getBlogStats } from '@/lib/blogStats'

export const dynamic = 'force-dynamic'

// GET /api/blogs/[id] - Get single blog by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', params.id)
      .single()
    if (error || !blog) {
      return errorResponse('Story not found', 'BLOG_NOT_FOUND', {}, 404)
    }
    
    if (blog.status === 'approved') {
      const session = await getServerSession()
      const stats = await getBlogStats(supabase, blog.id, session?.user?.id)
      return successResponse({ blog: { ...blog, ...stats } })
    }

    const session = await getServerSession()
    if (!session?.user) {
      return errorResponse('Story not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    if (!isAdminOrOwner(session, { author_id: blog.author_id })) {
      return errorResponse('Story not found', 'BLOG_NOT_FOUND', {}, 404)
    }
    
    const stats = await getBlogStats(supabase, blog.id, session?.user?.id)
    return successResponse({ blog: { ...blog, ...stats } })
  } catch (error) {
    console.error('GET /api/blogs/[id] error:', error)
    return errorResponse('Failed to fetch blog', 'FETCH_BLOG_FAILED', {}, 500)
  }
}

// PATCH /api/blogs/[id] - User edit blog
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401)
    }

    const id = params.id
    if (!id) {
      return errorResponse('Story ID is required', 'VALIDATION_ERROR', {}, 400)
    }

    const body = await request.json()
    const { title, content, contentHtml, tags, abstract, isAnonymous, authorName, media, featuredImage, status: reqStatus } = body

    const { data: existingStory } = await supabase
      .from('blogs')
      .select('id, status, author_id')
      .eq('id', id)
      .eq('author_id', session.user.id)
      .single()

    if (!existingStory) {
      return errorResponse('Story not found or you do not have permission to edit it', 'BLOG_NOT_FOUND', {}, 404)
    }

    if (existingStory.status === 'approved') {
      return errorResponse('Approved blogs cannot be edited. Contact an administrator if changes are needed.', 'FORBIDDEN', {}, 403)
    }

    if (content !== undefined || contentHtml !== undefined) {
      let textContent = ''
      if (typeof content === 'string') {
        textContent = content
      } else if (content && (content as any).blocks && Array.isArray((content as any).blocks)) {
        textContent = (content as any).blocks
          .map((block: any) => {
            if (block.content && Array.isArray(block.content)) {
              return block.content.map((item: any) => item.text || '').join('')
            }
            return ''
          })
          .join(' ')
      } else if (contentHtml) {
        textContent = contentHtml.replace(/<[^>]*>/g, '').trim()
      }

      if (!textContent || textContent.trim().length < 100) {
        return errorResponse('Story content must be at least 100 characters long', 'VALIDATION_ERROR', {}, 400)
      }
    }

    if (tags !== undefined && !Array.isArray(tags)) {
      return errorResponse('Tags must be an array of strings', 'VALIDATION_ERROR', {}, 400)
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title.trim()
    if (content !== undefined) updateData.content = content
    if (contentHtml !== undefined) updateData.content_html = contentHtml
    if (tags !== undefined) updateData.tags = tags
    if (abstract !== undefined) updateData.abstract = abstract
    if (isAnonymous !== undefined) updateData.is_anonymous = isAnonymous
    if (authorName !== undefined) {
      if (isAnonymous) {
        updateData.author_name = 'Anonim'
      } else if (authorName && authorName.trim()) {
        updateData.author_name = authorName.trim()
      } else if (session?.user?.name) {
        updateData.author_name = session.user.name
      } else {
        updateData.author_name = 'Anonim'
      }
    }
    if (media !== undefined) updateData.media = media
    if (featuredImage !== undefined) {
      updateData.featured_image = featuredImage
      updateData.featured_image_blob_id = getFeaturedImageBlobId(featuredImage) ?? null
    }
    if (reqStatus !== undefined) updateData.status = reqStatus

    if (existingStory.status === 'rejected' && reqStatus === 'pending') {
      updateData.admin_comment = null
    }

    const { data: blog } = await supabase
      .from('blogs')
      .update(updateData)
      .eq('id', id)
      .eq('author_id', session.user.id)
      .select('*')
      .single()

    cache.blogs.clear()
    return successResponse({ blog }, { message: 'Story updated successfully' })
  } catch (error) {
    console.error('PATCH /api/blogs/[id] error:', error)
    return errorResponse('Failed to update blog', 'UPDATE_BLOG_FAILED', {}, 500)
  }
}

// DELETE /api/blogs/[id] - Delete blog by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return errorResponse('Unauthorized', 'AUTH_REQUIRED', {}, 401)
    }

    const id = params.id
    if (!id) {
      return errorResponse('Story ID is required', 'VALIDATION_ERROR', {}, 400)
    }

    const supabase = createSupabaseAdminClient()
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('id, author_id')
      .eq('id', id)
      .single()
    if (error || !blog) {
      return errorResponse('Story not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    if (!isAdminOrOwner(session, { author_id: blog.author_id })) {
      return errorResponse('Unauthorized', 'FORBIDDEN', {}, 403)
    }

    await supabase
      .from('blogs')
      .delete()
      .eq('id', id)

    cache.blogs.clear()
    return successResponse({ id }, { message: 'Story deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/blogs/[id] error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
