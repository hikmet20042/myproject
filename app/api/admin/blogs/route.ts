import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdminSession } from '@/lib/roles';
import { cache, invalidateUserCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session || !isAdminSession(session)) {
      return NextResponse.json({ error: 'Admin giriş icazəsi tələb olunur' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const author = searchParams.get('author');

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;

    // Build query object
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (author) {
      query.author = author;
    }

    const sortFieldMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    const orderField = sortFieldMap[sortBy] || 'created_at';
    const ascending = sortOrder === 'asc';

    let queryBuilder = supabase
      .from('blogs')
      .select('*, author_id (id, name, email)', { count: 'exact' })
      .order(orderField, { ascending })
      .range(skip, skip + limit - 1);

    if (status) queryBuilder = queryBuilder.eq('status', status);

    if (author) {
      if (/^[0-9a-f-]{36}$/i.test(author)) {
        queryBuilder = queryBuilder.eq('author_id', author);
      } else {
        queryBuilder = queryBuilder.ilike('author_name', `%${author}%`);
      }
    }

    if (search) {
      queryBuilder = queryBuilder.or(`title.ilike.%${search}%,abstract.ilike.%${search}%,content_html.ilike.%${search}%`);
    }

    if (dateFrom) queryBuilder = queryBuilder.gte('created_at', new Date(dateFrom).toISOString());
    if (dateTo) queryBuilder = queryBuilder.lte('created_at', new Date(dateTo).toISOString());

    const { data: blogs, error, count: total } = await queryBuilder;

    if (error) {
      console.error('GET /api/admin/blogs error:', error);
      return NextResponse.json({ error: 'Bloqları yükləmək alınmadı' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      total: total || 0, 
      page, 
      limit, 
      results: blogs,
      filters: {
        authors: blogs
          .map((blog: any) => blog.author_id)
          .filter((author: any) => author && author.id)
          .map((author: any) => ({
            id: author.id.toString(),
            name: author.name || author.email || author.id.toString()
          }))
      }
    });
  } catch (error) {
    console.error('GET /api/admin/blogs error:', error);
    return NextResponse.json({ error: 'Bloqları yükləmək alınmadı' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session || !isAdminSession(session)) {
      return NextResponse.json({ error: 'Admin giriş icazəsi tələb olunur' }, { status: 403 });
    }
    const body = await request.json();
    const { id, status, adminComment } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'Tələb olunan sahələr çatışmır' }, { status: 400 });
    }
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Yanlış status' }, { status: 400 });
    }
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id, title, author_id')
      .eq('id', id)
      .single();
    if (blogError || !blog) {
      return NextResponse.json({ error: 'Bloq tapılmadı' }, { status: 404 });
    }
    await supabase
      .from('blogs')
      .update({ status, admin_comment: adminComment || null, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    // Invalidate caches
    cache.blogs.invalidateAll();
    if (blog.author_id) {
      invalidateUserCache(blog.author_id.toString());
    }

    // Send notification to author
    if (blog.author_id) {
      await supabase.from('notifications').insert({
        user_id: blog.author_id,
        type: 'blog',
        title: `Bloqunuz ${status === 'approved' ? 'təsdiqləndi' : 'rədd edildi'}`,
        message: status === 'approved'
          ? `Təbriklər! "${blog.title}" adlı bloqunuz təsdiqlənərək yayımlandı.`
          : `"${blog.title}" adlı bloqunuz rədd edildi.${adminComment ? ' Səbəb: ' + adminComment : ''}`,
        data: { blogId: blog.id, status },
      });
    }
    return NextResponse.json({ message: `Bloq uğurla ${status === 'approved' ? 'təsdiqləndi' : 'rədd edildi'}` });
  } catch (error) {
    console.error('PUT /api/admin/blogs error:', error);
    return NextResponse.json({ error: 'Daxili server xətası' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session || !isAdminSession(session)) {
      return NextResponse.json({ error: 'Admin giriş icazəsi tələb olunur' }, { status: 403 });
    }

    const body = await request.json();
    const { action, storyIds, status, adminComment } = body;

    if (!action || !storyIds || !Array.isArray(storyIds)) {
      return NextResponse.json({ error: 'Tələb olunan sahələr çatışmır' }, { status: 400 });
    }

    let updateData: any = {};
    let results: any[] = [];

    switch (action) {
      case 'bulk_approve':
        updateData = { status: 'approved', admin_comment: adminComment || '' };
        break;
      case 'bulk_reject':
        updateData = { status: 'rejected', admin_comment: adminComment || 'Toplu şəkildə rədd edildi' };
        break;
      case 'bulk_delete':
        // Soft delete by setting a deleted flag or actually delete
        await supabase
          .from('blogs')
          .delete()
          .in('id', storyIds);
        return NextResponse.json({ 
          success: true, 
          message: `${storyIds.length} bloq uğurla silindi`,
          deletedCount: storyIds.length
        });
      case 'bulk_status_change':
        if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
          return NextResponse.json({ error: 'Yanlış status' }, { status: 400 });
        }
        updateData = { status, admin_comment: adminComment || '' };
        break;
      default:
        return NextResponse.json({ error: 'Yanlış əməliyyat' }, { status: 400 });
    }

    // Update blogs and collect results
    const { data: updatedBlogs } = await supabase
      .from('blogs')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .in('id', storyIds)
      .select('id, title, author_id');

    const updatedBlogMap = new Map((updatedBlogs || []).map(blog => [blog.id, blog]));

    for (const storyId of storyIds) {
      const blog = updatedBlogMap.get(storyId);
      if (blog) {
        results.push({ id: storyId, success: true, blog });
        if (updateData.status && blog.author_id) {
          await supabase.from('notifications').insert({
            user_id: blog.author_id,
            type: 'blog_status',
            title: `Bloq ${updateData.status === 'approved' ? 'təsdiqləndi' : updateData.status === 'rejected' ? 'rədd edildi' : 'gözləmədədir'}`,
            message: `"${blog.title}" adlı bloqunuz ${updateData.status === 'approved' ? 'təsdiqləndi' : updateData.status === 'rejected' ? 'rədd edildi' : 'gözləməyə alındı'}.${updateData.admin_comment ? ` Admin şərhi: ${updateData.admin_comment}` : ''}`,
            is_read: false
          });
        }
      } else {
        results.push({ id: storyId, success: false, error: 'Bloq tapılmadı' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Toplu əməliyyat tamamlandı. ${successCount} uğurlu, ${failureCount} uğursuz.`,
      results,
      successCount,
      failureCount
    });

  } catch (error) {
    console.error('PATCH /api/admin/blogs error:', error);
    return NextResponse.json({ error: 'Toplu əməliyyatı icra etmək alınmadı' }, { status: 500 });
  }
}
