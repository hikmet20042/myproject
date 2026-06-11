import { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { cache } from '@/lib/cache'
import { isAdminOrOwner } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { getBlogStats } from '@/lib/blogStats'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { processContentImages, isCloudinaryUrl } from '@/lib/utils/imageUtils'
import { isValidUUID } from '@/lib/utils'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

async function getAuthorUrlHandle(supabase: SupabaseClient, authorId: string | null): Promise<string | null> {
  if (!authorId) return null
  const { data } = await supabase
    .from('accounts')
    .select('url_handle')
    .eq('id', authorId)
    .single()
  return data?.url_handle || null
}

// GET /api/blogs/[id] - Get single blog by id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'publicRead', endpoint: '/api/blogs/[id]' })
  try {
    if (!rlResult.allowed) {
      const r = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    if (!isValidUUID(params.id)) {
      const r = errorResponse('Yanlış ID formatı', 'VALIDATION_ERROR', {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const supabase = createSupabaseAdminClient()

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', params.id)
      .single()
    if (error || !blog) {
      const r = errorResponse('Hekayə tapılmadı', 'BLOG_NOT_FOUND', {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    if (blog.status === 'approved') {
      const session = await getServerSession()
      const stats = await getBlogStats(supabase, blog.id, session?.user?.id)
      const authorUrlHandle = await getAuthorUrlHandle(supabase, blog.author_id)
      return successResponse({ blog: { ...blog, ...stats, authorUrlHandle } })
    }

    const session = await getServerSession()
    if (!session?.user) {
      const r = errorResponse('Hekayə tapılmadı', 'BLOG_NOT_FOUND', {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    if (!isAdminOrOwner(session, { author_id: blog.author_id })) {
      const r = errorResponse('Hekayə tapılmadı', 'BLOG_NOT_FOUND', {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const stats = await getBlogStats(supabase, blog.id, session?.user?.id)
    const authorUrlHandle = await getAuthorUrlHandle(supabase, blog.author_id)
    return successResponse({ blog: { ...blog, ...stats, authorUrlHandle } })
  } catch (error) {
    console.error('GET /api/blogs/[id] error:', error)
    const r = errorResponse('Bloq yüklənə bilmədi', 'FETCH_BLOG_FAILED', {}, 500)
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  }
}

// PATCH /api/blogs/[id] - User edit blog
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'write', endpoint: '/api/blogs/[id]' })
  try {
    if (!rlResult.allowed) {
      const r = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    if (!isValidUUID(params.id)) {
      const r = errorResponse('Yanlış ID formatı', 'VALIDATION_ERROR', {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const supabase = createSupabaseAdminClient()
    const session = await getServerSession()
    if (!session?.user?.id) {
      const r = errorResponse('Autentifikasiya tələb olunur', 'AUTH_REQUIRED', {}, 401)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    if (session.user.accountType === 'organization') {
      const r = errorResponse('Təşkilat hesabları bloqları idarə edə bilməz', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const blogId = params.id
    if (!blogId) {
      const r = errorResponse('Hekayə ID-si tələb olunur', 'VALIDATION_ERROR', {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      const r = errorResponse('Yanlış JSON sorğu gövdəsi', 'VALIDATION_ERROR', {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const { title, content, contentHtml, tags, abstract, isAnonymous, authorName, media, featuredImage, status: reqStatus, requestUpdate } = body

    const { data: existingStory } = await supabase
      .from('blogs')
      .select('id, status, author_id')
      .eq('id', blogId)
      .eq('author_id', session.user.id)
      .single()

    if (!existingStory) {
      const r = errorResponse('Hekayə tapılmadı və ya onu redaktə etməyə icazəniz yoxdur', 'BLOG_NOT_FOUND', {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const isApprovedUpdateRequest = existingStory.status === 'approved' && reqStatus === 'pending' && requestUpdate === true

    if (existingStory.status === 'approved' && !isApprovedUpdateRequest) {
      const r = errorResponse('Təsdiqlənmiş bloqlar birbaşa redaktə edilə bilməz. Bunun əvəzinə yeniləmə sorğusu göndərin.', 'FORBIDDEN', {}, 403)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
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
        const r = errorResponse('Hekayə məzmunu ən azı 100 simvol olmalıdır', 'VALIDATION_ERROR', {}, 400)
        for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
        return r
      }

      if (content !== undefined) {
        const { imageReferences } = processContentImages(content)
        const hasNonCloudinaryImage = imageReferences.some((ref) => ref.url && !isCloudinaryUrl(ref.url))
        if (hasNonCloudinaryImage) {
          const r = errorResponse('Bloq məzmun şəkilləri Cloudinary URL-ləri olmalıdır.', 'VALIDATION_ERROR', {}, 400)
          for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
          return r
        }
      }
    }

    if (tags !== undefined && !Array.isArray(tags)) {
      const r = errorResponse('Teqlər sətir massivi olmalıdır', 'VALIDATION_ERROR', {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) {
      const trimmedTitle = title.trim()
      if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
        const r = errorResponse('Başlıq 5-200 simvol arasında olmalıdır', 'VALIDATION_ERROR', {}, 400)
        for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
        return r
      }
      updateData.title = trimmedTitle
    }
    if (content !== undefined) updateData.content = content
    if (contentHtml !== undefined) updateData.content_html = contentHtml
    if (tags !== undefined) updateData.tags = tags
    if (abstract !== undefined) updateData.abstract = abstract
    if (isAnonymous !== undefined) updateData.is_anonymous = isAnonymous
    if (isAnonymous !== undefined && isAnonymous) {
      updateData.author_name = 'Anonim'
    } else if (authorName !== undefined) {
      if (session?.user?.name) {
        updateData.author_name = session.user.name
      } else {
        updateData.author_name = 'Anonim'
      }
    }
    if (media !== undefined) {
      if (!Array.isArray(media)) {
        const r = errorResponse('Media massiv olmalıdır.', 'VALIDATION_ERROR', {}, 400)
        for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
        return r
      }

      const hasInvalidMediaUrl = media.some((item: any) => !item?.url || !isCloudinaryUrl(String(item.url)))
      if (hasInvalidMediaUrl) {
        const r = errorResponse('Bloq media URL-ləri Cloudinary URL-ləri olmalıdır.', 'VALIDATION_ERROR', {}, 400)
        for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
        return r
      }

      updateData.media = media
    }
    if (featuredImage !== undefined) {
      if (featuredImage && !isCloudinaryUrl(String(featuredImage))) {
        const r = errorResponse('Ön şəkil Cloudinary URL-i olmalıdır.', 'VALIDATION_ERROR', {}, 400)
        for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
        return r
      }
      updateData.featured_image = featuredImage
    }
    if (reqStatus !== undefined) {
      if (reqStatus !== 'pending') {
        const r = errorResponse('İstifadəçi redaktələrindən yalnız gözləmə statusu tələb oluna bilər', 'FORBIDDEN', {}, 403)
        for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
        return r
      }
      updateData.status = 'pending'
    }

    if (isApprovedUpdateRequest) {
      const { data: originalBlog, error: originalBlogError } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', blogId)
        .eq('author_id', session.user.id)
        .single()

      if (originalBlogError || !originalBlog) {
        const r = errorResponse('Orijinal təsdiqlənmiş bloq tapılmadı', 'BLOG_NOT_FOUND', {}, 404)
        for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
        return r
      }

      const originalMedia = Array.isArray(originalBlog.media) ? originalBlog.media : []
      const newMedia = Array.isArray(media) ? media : []
      const mergedMedia = [
        ...originalMedia,
        ...newMedia,
        { updateRequestFor: originalBlog.id },
      ]

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
          const r = errorResponse('Bloq sorğusu yenilənə bilmədi', 'UPDATE_BLOG_FAILED', {}, 500)
          for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
          return r
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
          const r = errorResponse('Bloq yeniləmə sorğusu yaradıla bilmədi', 'CREATE_BLOG_FAILED', {}, 500)
          for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
          return r
        }
        requestBlog = insertedRequest
      }

      cache.blogs.clear()

      await NotificationService.notifyAdminsAboutSubmission(
        'blog',
        requestBlog.id,
        requestBlog.title,
        requestBlog.author_name || session.user.name || 'Naməlum göndərən'
      )

      return successResponse(
        { blog: requestBlog },
        { message: 'Bloq yeniləmə sorğusu nəzərdən keçirilmək üçün göndərildi' }
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
      const r = errorResponse('Bloq yenilənə bilmədi', 'UPDATE_BLOG_FAILED', {}, 500)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    cache.blogs.clear()
    return successResponse({ blog }, { message: 'Hekayə uğurla yeniləndi' })
  } catch (error) {
    console.error('PATCH /api/blogs/[id] error:', error)
    const r = errorResponse('Bloq yenilənə bilmədi', 'UPDATE_BLOG_FAILED', {}, 500)
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  }
}

// DELETE /api/blogs/[id] - Delete blog by id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'write', endpoint: '/api/blogs/[id]' })
  try {
    if (!rlResult.allowed) {
      const r = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    if (!isValidUUID(params.id)) {
      const r = errorResponse('Yanlış ID formatı', 'VALIDATION_ERROR', {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const session = await getServerSession()
    if (!session?.user) {
      const r = errorResponse('İcazəsiz giriş', 'AUTH_REQUIRED', {}, 401)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    if (session.user.accountType === 'organization') {
      const r = errorResponse('Təşkilat hesabları bloqları idarə edə bilməz', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const blogId = params.id
    if (!blogId) {
      const r = errorResponse('Hekayə ID-si tələb olunur', 'VALIDATION_ERROR', {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const supabase = createSupabaseAdminClient()

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('id, author_id')
      .eq('id', blogId)
      .single()
    if (error || !blog) {
      const r = errorResponse('Hekayə tapılmadı', 'BLOG_NOT_FOUND', {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    if (!isAdminOrOwner(session, { author_id: blog.author_id })) {
      const r = errorResponse('İcazəsiz giriş', 'FORBIDDEN', {}, 403)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    await supabase
      .from('blogs')
      .delete()
      .eq('id', blog.id)

    cache.blogs.clear()
    return successResponse({ id: blog.id }, { message: 'Hekayə uğurla silindi' })
  } catch (error) {
    console.error('DELETE /api/blogs/[id] error:', error)
    const r = errorResponse('Daxili server xətası', 'INTERNAL_SERVER_ERROR', {}, 500)
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  }
}
