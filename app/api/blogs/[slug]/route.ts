import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getFeaturedImageBlobId } from '@/lib/utils/imageUtils'
import { cache } from '@/lib/cache'
import { isAdminOrOwner } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getBlogStats } from '@/lib/blogStats'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

export const dynamic = 'force-dynamic'

async function getAuthorUrlHandle(supabase: any, authorId: string | null): Promise<string | null> {
  if (!authorId) return null
  const { data } = await supabase
    .from('accounts')
    .select('url_handle')
    .eq('id', authorId)
    .single()
  return data?.url_handle || null
}

// GET /api/blogs/[slug] - Get single blog by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()

    const { data: resolvedBlog, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'blogs',
      params.slug,
      'id'
    )

    if (resolveError || !resolvedBlog?.id) {
      return errorResponse('Story not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', resolvedBlog.id)
      .single()
    if (error || !blog) {
      return errorResponse('Story not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    if (blog.status === 'approved') {
      const session = await getServerSession()
      const stats = await getBlogStats(supabase, blog.id, session?.user?.id)
      const authorUrlHandle = await getAuthorUrlHandle(supabase, blog.author_id)
      return successResponse({ blog: { ...blog, ...stats, authorUrlHandle } })
    }

    const session = await getServerSession()
    if (!session?.user) {
      return errorResponse('Story not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    if (!isAdminOrOwner(session, { author_id: blog.author_id })) {
      return errorResponse('Story not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    const stats = await getBlogStats(supabase, blog.id, session?.user?.id)
    const authorUrlHandle = await getAuthorUrlHandle(supabase, blog.author_id)
    return successResponse({ blog: { ...blog, ...stats, authorUrlHandle } })
  } catch (error) {
    console.error('GET /api/blogs/[slug] error:', error)
    return errorResponse('Failed to fetch blog', 'FETCH_BLOG_FAILED', {}, 500)
  }
}

// PATCH /api/blogs/[slug] - User edit blog
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401)
    }

    // Block organizations from editing blogs - blog management is for regular users only
    if (session.user.accountType === 'organization') {
      return errorResponse('Organization accounts cannot manage blogs', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
    }

    const slug = params.slug
    if (!slug) {
      return errorResponse('Story slug is required', 'VALIDATION_ERROR', {}, 400)
    }

    const { data: resolvedBlog, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'blogs',
      slug,
      'id'
    )

    if (resolveError || !resolvedBlog?.id) {
      return errorResponse('Story not found or you do not have permission to edit it', 'BLOG_NOT_FOUND', {}, 404)
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 'VALIDATION_ERROR', {}, 400)
    }
    const { title, content, contentHtml, tags, abstract, isAnonymous, authorName, media, featuredImage, status: reqStatus, requestUpdate } = body

    const { data: existingStory } = await supabase
      .from('blogs')
      .select('id, status, author_id')
      .eq('id', resolvedBlog.id)
      .eq('author_id', session.user.id)
      .single()

    if (!existingStory) {
      return errorResponse('Story not found or you do not have permission to edit it', 'BLOG_NOT_FOUND', {}, 404)
    }

    const isApprovedUpdateRequest = existingStory.status === 'approved' && reqStatus === 'pending' && requestUpdate === true

    if (existingStory.status === 'approved' && !isApprovedUpdateRequest) {
      return errorResponse('Approved blogs cannot be edited directly. Submit an update request instead.', 'FORBIDDEN', {}, 403)
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

    if (title !== undefined) {
      const trimmedTitle = title.trim()
      if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
        return errorResponse('Title must be between 5 and 200 characters', 'VALIDATION_ERROR', {}, 400)
      }
      updateData.title = trimmedTitle
    }
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
    if (reqStatus !== undefined) {
      if (reqStatus !== 'pending') {
        return errorResponse('Only pending status can be requested from user edits', 'FORBIDDEN', {}, 403)
      }
      updateData.status = 'pending'
    }

    if (isApprovedUpdateRequest) {
      const { data: originalBlog, error: originalBlogError } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', resolvedBlog.id)
        .eq('author_id', session.user.id)
        .single()

      if (originalBlogError || !originalBlog) {
        return errorResponse('Original approved blog not found', 'BLOG_NOT_FOUND', {}, 404)
      }

      const mergedMedia = {
        ...(originalBlog.media && typeof originalBlog.media === 'object' ? originalBlog.media : {}),
        ...(media && typeof media === 'object' ? media : {}),
        updateRequestFor: originalBlog.id,
      }

      const requestPayload: any = {
        title: title !== undefined ? updateData.title : originalBlog.title,
        content: content !== undefined ? content : originalBlog.content,
        content_html: contentHtml !== undefined ? contentHtml : originalBlog.content_html,
        tags: tags !== undefined ? tags : originalBlog.tags,
        abstract: abstract !== undefined ? abstract : originalBlog.abstract,
        is_anonymous: isAnonymous !== undefined ? isAnonymous : originalBlog.is_anonymous,
        author_name: updateData.author_name || originalBlog.author_name,
        media: mergedMedia,
        featured_image: featuredImage !== undefined ? featuredImage : originalBlog.featured_image,
        featured_image_blob_id:
          featuredImage !== undefined
            ? getFeaturedImageBlobId(featuredImage) ?? null
            : (originalBlog.featured_image_blob_id ?? null),
        status: 'pending',
        updated_at: new Date().toISOString(),
      }

      const { data: existingRequest } = await supabase
        .from('blogs')
        .select('id')
        .eq('author_id', session.user.id)
        .eq('status', 'pending')
        .contains('media', { updateRequestFor: originalBlog.id })
        .maybeSingle()

      let requestBlog: any = null
      if (existingRequest?.id) {
        const { data: updatedRequest, error: updateRequestError } = await supabase
          .from('blogs')
          .update(requestPayload)
          .eq('id', existingRequest.id)
          .eq('author_id', session.user.id)
          .select('*')
          .single()

        if (updateRequestError || !updatedRequest) {
          return errorResponse('Failed to update blog request', 'UPDATE_BLOG_FAILED', {}, 500)
        }
        requestBlog = updatedRequest
      } else {
        const { data: insertedRequest, error: insertRequestError } = await supabase
          .from('blogs')
          .insert({
            ...requestPayload,
            author_id: session.user.id,
            reviewed_at: null,
            reviewed_by: null,
          })
          .select('*')
          .single()

        if (insertRequestError || !insertedRequest) {
          return errorResponse('Failed to create blog update request', 'CREATE_BLOG_FAILED', {}, 500)
        }
        requestBlog = insertedRequest
      }

      cache.blogs.clear()

      await NotificationService.notifyAdminsAboutSubmission(
        'blog',
        requestBlog.id,
        requestBlog.title,
        requestBlog.author_name || session.user.name || 'Unknown submitter'
      )

      return successResponse(
        { blog: requestBlog },
        { message: 'Blog update request submitted for review' }
      )
    }

    const { data: blog, error: updateError } = await supabase
      .from('blogs')
      .update(updateData)
      .eq('id', existingStory.id)
      .eq('author_id', session.user.id)
      .select('*')
      .single()

    if (updateError || !blog) {
      return errorResponse('Failed to update blog', 'UPDATE_BLOG_FAILED', {}, 500)
    }

    cache.blogs.clear()
    return successResponse({ blog }, { message: 'Story updated successfully' })
  } catch (error) {
    console.error('PATCH /api/blogs/[slug] error:', error)
    return errorResponse('Failed to update blog', 'UPDATE_BLOG_FAILED', {}, 500)
  }
}

// DELETE /api/blogs/[slug] - Delete blog by slug
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return errorResponse('Unauthorized', 'AUTH_REQUIRED', {}, 401)
    }

    // Block organizations from deleting blogs - blog management is for regular users only
    if (session.user.accountType === 'organization') {
      return errorResponse('Organization accounts cannot manage blogs', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
    }

    const slug = params.slug
    if (!slug) {
      return errorResponse('Story slug is required', 'VALIDATION_ERROR', {}, 400)
    }

    const supabase = createSupabaseAdminClient()
    const { data: resolvedBlog, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'blogs',
      slug,
      'id'
    )

    if (resolveError || !resolvedBlog?.id) {
      return errorResponse('Story not found', 'BLOG_NOT_FOUND', {}, 404)
    }

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('id, author_id')
      .eq('id', resolvedBlog.id)
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
      .eq('id', blog.id)

    cache.blogs.clear()
    return successResponse({ id: blog.id }, { message: 'Story deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/blogs/[slug] error:', error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', {}, 500)
  }
}
