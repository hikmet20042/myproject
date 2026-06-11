import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/permissions';
import { cache, invalidateUserCache } from '@/lib/cache';
import { NotificationService } from '@/features/notifications/services/notificationService';
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'
import { escapeIlike, isValidUUID } from '@/lib/utils'

export const dynamic = 'force-dynamic';

const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
      request,
      preset: 'admin',
      endpoint: '/api/admin/blogs',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session || !isAdmin(session)) {
      const response = errorResponse('Admin giriş icazəsi tələb olunur', "API_ERROR", {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const author = searchParams.get('author');

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    if (!Number.isFinite(page) || page < 1) {
      const response = errorResponse('Səhifə parametri yanlışdır', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    if (!Number.isFinite(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      const response = errorResponse(`Limit 1 ilə ${MAX_PAGE_SIZE} arasında olmalıdır`, "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const skip = (page - 1) * limit;

    const sortFieldMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      title: 'title',
      author: 'author_name',
    };
    const orderField = sortFieldMap[sortBy] || 'created_at';
    const ascending = sortOrder === 'asc';

    let queryBuilder = supabase
      .from('blogs')
      .select('*, author_id (id, name, email)', { count: 'exact' })
      .order(orderField, { ascending })
      .range(skip, skip + limit - 1);

    if (status && status !== 'all') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    if (author) {
      if (/^[0-9a-f-]{36}$/i.test(author)) {
        queryBuilder = queryBuilder.eq('author_id', author);
      } else {
        queryBuilder = queryBuilder.ilike('author_name', `%${author}%`);
      }
    }

    if (search) {
      const safeSearch = escapeIlike(search)
      queryBuilder = queryBuilder.or(`title.ilike.%${safeSearch}%,abstract.ilike.%${safeSearch}%,content_html.ilike.%${safeSearch}%`);
    }

    if (dateFrom) queryBuilder = queryBuilder.gte('created_at', new Date(dateFrom).toISOString());
    if (dateTo) queryBuilder = queryBuilder.lte('created_at', new Date(dateTo).toISOString());

    const { data: blogs, error, count: total } = await queryBuilder;

    if (error) {
      console.error('GET /api/admin/blogs error:', error);
      const response = errorResponse('Bloqları yükləmək alınmadı', "API_ERROR", {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    
    const successResp = successResponse({ 
      total: total || 0, 
      page, 
      limit, 
      results: blogs,
      filters: {
        authors: (blogs as { author_id?: { id: string; name?: string; email?: string } }[])
          .map((blog) => blog.author_id)
          .filter((author): author is { id: string; name?: string; email?: string } => !!(author && author.id))
          .map((author) => ({
            id: author.id.toString(),
            name: author.name || author.email || author.id.toString()
          }))
      }
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      successResp.headers.set(key, value)
    }
    return successResp
  } catch (error) {
    console.error('GET /api/admin/blogs error:', error);
    return errorResponse('Bloqları yükləmək alınmadı', "API_ERROR", {}, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
      request,
      preset: 'admin',
      endpoint: '/api/admin/blogs',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session || !isAdmin(session)) {
      const response = errorResponse('Admin giriş icazəsi tələb olunur', "API_ERROR", {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    let body: any;
    try {
      body = await request.json();
    } catch {
      const response = errorResponse('JSON formatı yanlışdır', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    const { id, status, adminComment } = body;
    if (!id || !status) {
      const response = errorResponse('Tələb olunan sahələr çatışmır', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    if (!['approved', 'rejected'].includes(status)) {
      const response = errorResponse('Yanlış status', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    const normalizedAdminComment = typeof adminComment === 'string' ? adminComment.trim() : '';
    if (status === 'rejected' && !normalizedAdminComment) {
      const response = errorResponse('Rədd səbəbi tələb olunur', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id, title, author_id, status, admin_comment')
      .eq('id', id)
      .single();
    if (blogError || !blog) {
      const response = errorResponse('Bloq tapılmadı', "API_ERROR", {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const previousComment = typeof blog.admin_comment === 'string' ? blog.admin_comment.trim() : '';
    const isStatusUnchanged = blog.status === status;
    const isCommentUnchanged = previousComment === normalizedAdminComment;
    if (isStatusUnchanged && isCommentUnchanged) {
      const response = successResponse({ message: 'Bloqda dəyişiklik yoxdur' })
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const statusChanged = blog.status !== status;

    const { error: updateError } = await supabase
      .from('blogs')
      .update({
        status,
        admin_comment: normalizedAdminComment || null,
        updated_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id,
      })
      .eq('id', id);

    if (updateError) {
      const r = errorResponse('Bloq yenilənə bilmədi', 'UPDATE_BLOG_FAILED', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        r.headers.set(key, value)
      }
      return r
    }
    
    // Invalidate caches
    cache.blogs.invalidateAll();
    if (blog.author_id) {
      invalidateUserCache(blog.author_id.toString());
    }

    // Send notification to author
    if (statusChanged && blog.author_id) {
      try {
        await NotificationService.notifyBlogStatus(
          blog.author_id.toString(),
          blog.id.toString(),
          blog.title,
          status,
          normalizedAdminComment || undefined
        );
      } catch (notificationError) {
        console.error('Failed to send blog status notification:', notificationError);
      }
    }
    const successResp = successResponse({ message: `Bloq uğurla ${status === 'approved' ? 'təsdiqləndi' : 'rədd edildi'}` })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      successResp.headers.set(key, value)
    }
    return successResp
  } catch (error) {
    // NOTE: rateLimitHeaders is scoped inside the try block and not accessible here.
    // This is acceptable for unexpected errors — rate limit headers are best-effort.
    console.error('PUT /api/admin/blogs error:', error);
    return errorResponse('Daxili server xətası', "API_ERROR", {}, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
      request,
      preset: 'admin',
      endpoint: '/api/admin/blogs',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session || !isAdmin(session)) {
      const response = errorResponse('Admin giriş icazəsi tələb olunur', "API_ERROR", {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      const response = errorResponse('JSON formatı yanlışdır', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    const { action, storyIds, status, adminComment } = body;

    if (!action || !storyIds || !Array.isArray(storyIds)) {
      const response = errorResponse('Tələb olunan sahələr çatışmır', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (storyIds.length === 0) {
      const response = errorResponse('Ən azı bir bloq seçilməlidir', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    let updateData: any = {};
    let results: any[] = [];
    const normalizedAdminComment = typeof adminComment === 'string' ? adminComment.trim() : '';
    const uniqueStoryIds = Array.from(new Set(storyIds));

    const invalidIds = uniqueStoryIds.filter((id: string) => !isValidUUID(id));
    if (invalidIds.length > 0) {
      const response = errorResponse(`Yanlış ID-lər: ${invalidIds.slice(0, 5).join(', ')}`, "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    if (action === 'bulk_delete') {
      const { data: existingBlogs } = await supabase
        .from('blogs')
        .select('id, author_id')
        .in('id', uniqueStoryIds);

      const existingIds = (existingBlogs || []).map((blog) => blog.id);

      if (existingIds.length > 0) {
        await supabase
          .from('blogs')
          .delete()
          .in('id', existingIds);

        cache.blogs.invalidateAll();
        const authorIds = Array.from(
          new Set(
            (existingBlogs || [])
              .map((blog) => blog.author_id)
              .filter(Boolean)
              .map((authorId) => authorId.toString())
          )
        );
        authorIds.forEach((authorId) => invalidateUserCache(authorId));
      }

      return successResponse({
        success: true,
        message: `${existingIds.length} bloq uğurla silindi`,
        deletedCount: existingIds.length,
      });
    }

    switch (action) {
      case 'bulk_approve':
        updateData = { status: 'approved', admin_comment: normalizedAdminComment || null };
        break;
      case 'bulk_reject':
        if (!normalizedAdminComment) {
          const r = errorResponse('Toplu rədd üçün səbəb tələb olunur', "API_ERROR", {}, 400);
          for (const [key, value] of Object.entries(rateLimitHeaders)) r.headers.set(key, value);
          return r;
        }
        updateData = { status: 'rejected', admin_comment: normalizedAdminComment };
        break;
      case 'bulk_status_change':
        if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
          const r = errorResponse('Yanlış status', "API_ERROR", {}, 400);
          for (const [key, value] of Object.entries(rateLimitHeaders)) r.headers.set(key, value);
          return r;
        }
        if (status === 'rejected' && !normalizedAdminComment) {
          const r = errorResponse('Toplu rədd üçün səbəb tələb olunur', "API_ERROR", {}, 400);
          for (const [key, value] of Object.entries(rateLimitHeaders)) r.headers.set(key, value);
          return r;
        }
        updateData = {
          status,
          admin_comment: normalizedAdminComment || null,
        };
        break;
      default:
        const r = errorResponse('Yanlış əməliyyat', "API_ERROR", {}, 400);
        for (const [key, value] of Object.entries(rateLimitHeaders)) r.headers.set(key, value);
        return r;
    }

    const { data: existingBlogs, error: existingError } = await supabase
      .from('blogs')
      .select('id, title, author_id, status, admin_comment')
      .in('id', uniqueStoryIds);

    if (existingError) {
      return errorResponse('Bloqları yükləmək alınmadı', "API_ERROR", {}, 500);
    }

    const existingMap = new Map((existingBlogs || []).map((blog) => [blog.id, blog]));
    const idsToUpdate: string[] = [];
    const previousStatusById = new Map<string, string>();

    for (const storyId of uniqueStoryIds) {
      const blog = existingMap.get(storyId);
      if (!blog) {
        results.push({ id: storyId, success: false, error: 'Bloq tapılmadı' });
        continue;
      }

      const previousComment = typeof blog.admin_comment === 'string' ? blog.admin_comment.trim() : '';
      const nextComment = typeof updateData.admin_comment === 'string'
        ? updateData.admin_comment.trim()
        : '';
      const shouldUpdate = blog.status !== updateData.status || previousComment !== nextComment;

      if (!shouldUpdate) {
        results.push({ id: storyId, success: true, blog, noChange: true });
        continue;
      }

      idsToUpdate.push(storyId);
      previousStatusById.set(storyId, blog.status);
    }

    if (idsToUpdate.length === 0) {
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      return successResponse({
        success: true,
        message: `Dəyişiklik edilmədi. ${successCount} uğurlu, ${failureCount} uğursuz.`,
        results,
        successCount,
        failureCount,
      });
    }

    const moderationAuditFields =
      updateData.status === 'approved' || updateData.status === 'rejected'
        ? { reviewed_at: new Date().toISOString(), reviewed_by: session.user.id }
        : updateData.status === 'pending'
          ? { reviewed_at: null, reviewed_by: null }
          : {};

    // Update blogs and collect results
    const { data: updatedBlogs } = await supabase
      .from('blogs')
      .update({ ...updateData, ...moderationAuditFields, updated_at: new Date().toISOString() })
      .in('id', idsToUpdate)
      .select('id, title, author_id');

    cache.blogs.invalidateAll();

    const updatedAuthorIds = Array.from(
      new Set((updatedBlogs || []).map((blog) => blog.author_id).filter(Boolean).map((id) => id.toString()))
    );
    updatedAuthorIds.forEach((authorId) => invalidateUserCache(authorId));

    const updatedBlogMap = new Map((updatedBlogs || []).map(blog => [blog.id, blog]));

    for (const storyId of idsToUpdate) {
      const blog = updatedBlogMap.get(storyId);
      if (blog) {
        results.push({ id: storyId, success: true, blog });
        const previousStatus = previousStatusById.get(storyId);
        const statusChanged = previousStatus !== updateData.status;
        if (statusChanged && (updateData.status === 'approved' || updateData.status === 'rejected') && blog.author_id) {
          try {
            await NotificationService.notifyBlogStatus(
              blog.author_id.toString(),
              blog.id.toString(),
              blog.title,
              updateData.status,
              updateData.admin_comment || undefined
            );
          } catch (notificationError) {
            console.error('Failed to send bulk blog status notification:', notificationError);
          }
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return successResponse({
      success: true,
      message: `Toplu əməliyyat tamamlandı. ${successCount} uğurlu, ${failureCount} uğursuz.`,
      results,
      successCount,
      failureCount
    });

  } catch (error) {
    console.error('PATCH /api/admin/blogs error:', error);
    return errorResponse('Toplu əməliyyatı icra etmək alınmadı', "API_ERROR", {}, 500);
  }
}
