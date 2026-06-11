import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { isAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { cache, invalidateUserCache } from '@/lib/cache'
import { isValidUUID } from '@/lib/utils'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// GET /api/admin/blogs/[id] - Get single blog by ID for admin preview
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'admin', endpoint: '/api/admin/blogs/[id]' })
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
    if (!session || !isAdmin(session)) {
      const r = errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*, author_id (id, name, email)')
      .eq('id', params.id)
      .single()
    if (error || !blog) {
      const r = errorResponse('Hekayə tapılmadı', "API_ERROR", {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    
    return successResponse({ blog })
  } catch (error) {
    console.error('GET /api/admin/blogs/[id] error:', error)
    const r = errorResponse('Bloq yüklənə bilmədi', "API_ERROR", {}, 500)
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  }
}

// DELETE /api/admin/blogs/[id] - Delete blog permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'admin', endpoint: '/api/admin/blogs/[id]' })
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
    if (!session || !isAdmin(session)) {
      const r = errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', params.id)
      .select('*')
      .single()
    
    if (error || !blog) {
      const r = errorResponse('Hekayə tapılmadı', "API_ERROR", {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    cache.blogs.invalidateAll()
    if (blog.author_id) {
      invalidateUserCache(blog.author_id.toString())
    }
    
    return successResponse({ 
      message: 'Hekayə uğurla silindi'
    })
  } catch (error) {
    console.error('DELETE /api/admin/blogs/[id] error:', error)
    const r = errorResponse('Bloq silinə bilmədi', "API_ERROR", {}, 500)
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  }
}

// PUT /api/admin/blogs/[id] - Update blog status and admin comment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { result: rlResult, headers: rlHeaders } = await applyRateLimit({ request, preset: 'admin', endpoint: '/api/admin/blogs/[id]' })
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
    if (!session || !isAdmin(session)) {
      const r = errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    
    let body: any
    try {
      body = await request.json()
    } catch {
      const r = errorResponse('Yanlış JSON sorğu gövdəsi', "API_ERROR", {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    const { status, adminComment } = body
    
    if (!status) {
      const r = errorResponse('Status tələb olunur', "API_ERROR", {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      const r = errorResponse('Yanlış status', "API_ERROR", {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const normalizedAdminComment = typeof adminComment === 'string' ? adminComment.trim() : ''
    if (status === 'rejected' && !normalizedAdminComment) {
      const r = errorResponse('Rədd səbəbi tələb olunur', "API_ERROR", {}, 400)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const { data: existingBlog, error: existingBlogError } = await supabase
      .from('blogs')
      .select('id, title, author_id, status, admin_comment, media, content, content_html, tags, abstract, is_anonymous, author_name, featured_image')
      .eq('id', params.id)
      .single()

    if (existingBlogError || !existingBlog) {
      const r = errorResponse('Hekayə tapılmadı', "API_ERROR", {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    const previousComment = typeof existingBlog.admin_comment === 'string' ? existingBlog.admin_comment.trim() : ''
    const statusChanged = existingBlog.status !== status
    const commentChanged = previousComment !== normalizedAdminComment

    const updateRequestFor =
      existingBlog.media && typeof existingBlog.media === 'object'
        ? (existingBlog.media as Record<string, any>).updateRequestFor
        : null

    if (!statusChanged && !commentChanged) {
      return successResponse({
        blog: existingBlog,
        message: 'Hekayə artıq istənilən vəziyyətdədir',
      })
    }

    if (status === 'approved' && statusChanged && updateRequestFor) {
      const { data: originalBlog, error: originalBlogError } = await supabase
        .from('blogs')
        .update({
          title: existingBlog.title,
          content: existingBlog.content,
          content_html: existingBlog.content_html,
          tags: existingBlog.tags,
          abstract: existingBlog.abstract,
          is_anonymous: existingBlog.is_anonymous,
          author_name: existingBlog.author_name,
          featured_image: existingBlog.featured_image,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updateRequestFor)
        .select('*')
        .single()

      if (originalBlogError || !originalBlog) {
        const r = errorResponse('Yeniləmə sorğusu orijinal bloqa tətbiq edilə bilmədi', "API_ERROR", {}, 500)
        for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
        return r
      }

      const { error: deleteRequestError } = await supabase
        .from('blogs')
        .delete()
        .eq('id', existingBlog.id)

      if (deleteRequestError) {
        const r = errorResponse('Yeniləmə sorğusunun təsdiqi tamamlana bilmədi', "API_ERROR", {}, 500)
        for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
        return r
      }

      cache.blogs.invalidateAll()
      if (originalBlog.author_id) {
        invalidateUserCache(originalBlog.author_id.toString())
      }

      if (originalBlog.author_id) {
        try {
          await NotificationService.notifyBlogStatus(
            originalBlog.author_id.toString(),
            originalBlog.id.toString(),
            originalBlog.title,
            'approved',
            normalizedAdminComment || undefined
          )
        } catch (notifError) {
          console.error('Failed to send notification:', notifError)
        }
      }

      try {
        await NotificationService.notifyUsersAboutRelevantItem({
          itemType: 'blog',
          itemId: originalBlog.id.toString(),
          title: originalBlog.title,
          description: originalBlog.abstract || '',
          tags: Array.isArray(originalBlog.tags) ? originalBlog.tags : [],
          actionUrl: `/blogs/${originalBlog.id}`,
        })
      } catch (notifError) {
        console.error('Failed to notify relevant users for blog:', notifError)
      }

      return successResponse({
        blog: originalBlog,
        message: 'Hekayə uğurla təsdiqləndi',
      })
    }
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .update({
        status,
        admin_comment: normalizedAdminComment || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id
      })
      .eq('id', params.id)
      .select('*')
      .single()
    
    if (error || !blog) {
      const r = errorResponse('Hekayə tapılmadı', "API_ERROR", {}, 404)
      for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
      return r
    }

    cache.blogs.invalidateAll()
    if (blog.author_id) {
      invalidateUserCache(blog.author_id.toString())
    }

    // Send notification to blog author about the status change
    if (statusChanged && blog.author_id) {
      try {
        await NotificationService.notifyBlogStatus(
          blog.author_id.toString(),
          blog.id.toString(),
          blog.title,
          status,
          normalizedAdminComment || undefined
        )
      } catch (notifError) {
        console.error('Failed to send notification:', notifError)
        // Don't fail the whole request if notification fails
      }
    }

    if (statusChanged && status === 'approved') {
      try {
        await NotificationService.notifyUsersAboutRelevantItem({
          itemType: 'blog',
          itemId: blog.id.toString(),
          title: blog.title,
          description: blog.abstract || '',
          tags: Array.isArray(blog.tags) ? blog.tags : [],
          actionUrl: `/blogs/${blog.id}`,
        })
      } catch (notifError) {
        console.error('Failed to notify relevant users for blog:', notifError)
      }
    }
    
    return successResponse({ 
      blog,
      message: `Story ${status} successfully`
    })
  } catch (error) {
    console.error('PUT /api/admin/blogs/[id] error:', error)
    const r = errorResponse('Bloq yenilənə bilmədi', "API_ERROR", {}, 500)
    for (const [k,v] of Object.entries(rlHeaders)) r.headers.set(k,v)
    return r
  }
}
