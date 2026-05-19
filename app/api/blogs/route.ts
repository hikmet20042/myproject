import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processContentImages, isCloudinaryUrl } from '@/lib/utils/imageUtils';
import { cache, generateCacheKey, withCache } from '@/lib/cache';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { NotificationService } from '@/features/notifications/services/notificationService';
import { getBlogStats } from '@/lib/blogStats';
import { applyRateLimit, RATE_LIMIT_PRESETS } from '@/lib/rateLimit';
import { validateRequestBody } from '@/lib/validation';
import { submitBlogToIndexNow } from '@/lib/indexnow';

const MAX_PAGE_SIZE = 50;

const blogCreateSchema = {
  title: { required: true, type: 'string' as const, minLength: 5, maxLength: 200 },
  content: { required: true, type: 'object' as const },
  contentHtml: { type: 'string' as const },
  tags: { type: 'array' as const, max: 20 },
  abstract: { type: 'string' as const, maxLength: 500 },
  isAnonymous: { type: 'boolean' as const },
  media: { type: 'array' as const, max: 10 },
  featuredImage: { type: 'string' as const },
};

function containsLegacyBlobUrl(content: any): boolean {
  const { imageReferences } = processContentImages(content);
  return imageReferences.some((ref) => ref.url.startsWith('/api/images/'));
}

function containsNonCloudinaryImages(content: any): boolean {
  const { imageReferences } = processContentImages(content);
  return imageReferences.some((ref) => ref.url && !isCloudinaryUrl(ref.url));
}

function normalizeMediaUrls(media: any): Array<{ type: string; url: string; alt?: string }> {
  if (!Array.isArray(media)) return [];
  return media
    .filter((item) => item && typeof item.url === 'string')
    .map((item) => ({
      type: typeof item.type === 'string' ? item.type : 'image',
      url: String(item.url),
      alt: typeof item.alt === 'string' ? item.alt : undefined,
    }))
    .filter((item) => !item.url.startsWith('/api/images/'));
}

export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'publicRead',
      endpoint: '/api/blogs',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse(
        'Too many requests. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        { retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) },
        429
      )
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);

    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = 'approved';

    if (!Number.isFinite(page) || page < 1) {
      return errorResponse('Invalid page parameter', 'VALIDATION_ERROR', {}, 400);
    }
    if (!Number.isFinite(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      return errorResponse(`Limit must be between 1 and ${MAX_PAGE_SIZE}`, 'VALIDATION_ERROR', {}, 400);
    }

    const skip = (page - 1) * limit;

    // Generate cache key
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : undefined;
    const cacheKey = generateCacheKey.blogs(page, limit, search || undefined, tagsArray, status, sortBy || undefined, dateFrom || undefined, dateTo || undefined);
    
    // Try to get from cache first
    const cachedResult = await withCache(
      cache.blogs,
      cacheKey,
      async () => {
        let queryBuilder = supabase
          .from('blogs_with_stats')
          .select('*', { count: 'exact' })
          .eq('status', status);

        if (search && search.trim()) {
          queryBuilder = queryBuilder.or(`title.ilike.%${search.trim()}%,content_html.ilike.%${search.trim()}%,abstract.ilike.%${search.trim()}%`);
        }
        if (tags && tags.trim()) {
          const tagArray = tags.split(',').map(tag => tag.trim());
          queryBuilder = queryBuilder.overlaps('tags', tagArray);
        }
        if (dateFrom) {
          queryBuilder = queryBuilder.gte('created_at', `${dateFrom}T00:00:00`);
        }
        if (dateTo) {
          queryBuilder = queryBuilder.lte('created_at', `${dateTo}T23:59:59`);
        }

        switch (sortBy) {
          case 'oldest':
            queryBuilder = queryBuilder.order('created_at', { ascending: true });
            break;
          case 'most-viewed':
            queryBuilder = queryBuilder.order('real_views', { ascending: false });
            break;
          case 'most-liked':
            queryBuilder = queryBuilder.order('real_likes', { ascending: false });
            break;
          default:
            queryBuilder = queryBuilder.order('created_at', { ascending: false });
        }

        queryBuilder = queryBuilder.range(skip, skip + limit - 1);

        const { data: blogs, count: total } = await queryBuilder;

        return { blogs: blogs || [], total: total || 0 };
      }
    );
    
    const { blogs, total } = cachedResult as { blogs: any[], total: number };

    // Post-process to map count names and include author handle if needed
    // (Note: views_count/likes_count/etc are from the view)
    const blogsWithStats = await Promise.all(
      blogs.map(async (blog: any) => {
        // Map view columns to expected names
        const mappedBlog = {
          ...blog,
          views: Number(blog.real_views),
          uniqueViews: Number(blog.real_unique_views),
          likes: Number(blog.real_likes),
          saves: Number(blog.real_saves || 0),
          dislikes: Number(blog.real_dislikes),
          engagementScore: Math.max(0, Number(blog.real_views) + Number(blog.real_likes) * 3 - Number(blog.real_dislikes))
        }

        // Include author handle (still N+1, but we can optimize this later if needed)
        let authorUrlHandle = null
        if (blog.author_id) {
          const { data: account } = await supabase
            .from('accounts')
            .select('url_handle')
            .eq('id', blog.author_id)
            .single()
          authorUrlHandle = account?.url_handle || null
        }
        return { ...mappedBlog, authorUrlHandle }
      })
    )

    const successResp = successResponse(
      { items: blogsWithStats },
      {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    )
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      successResp.headers.set(key, value)
    }
    return successResp;
  } catch (error) {
    console.error('GET /api/blogs error:', error);
    return errorResponse('Failed to fetch blogs', 'FETCH_BLOGS_FAILED', {}, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/blogs',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse(
        'Too many requests. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        { retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) },
        429
      )
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session || !session.user) {
      const response = errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    if (session.user.accountType === 'organization') {
      const response = errorResponse(
        'Organization accounts cannot submit blogs. Blog sharing is available for individual users only.',
        'FORBIDDEN_ACCOUNT_TYPE',
        {},
        403
      )
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    // Check email verification
    if (!('emailVerified' in session.user) || !session.user.emailVerified) {
      const response = errorResponse('You must verify your email before submitting blogs.', 'EMAIL_NOT_VERIFIED', {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    let body: any;
    try {
      body = await request.json();
    } catch {
      const response = errorResponse('Invalid JSON body', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const validationError = validateRequestBody(body, blogCreateSchema)
    if (validationError) {
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        validationError.headers.set(key, value)
      }
      return validationError
    }

    const { title, content, contentHtml, tags, abstract, isAnonymous, authorName, media, featuredImage } = body;

    // Extract plain text from content for validation
    let textContent = '';
    if (typeof content === 'string') {
      textContent = content;
    } else if (content && content.blocks && Array.isArray(content.blocks)) {
      // Extract text from BlockNote JSON structure
      textContent = content.blocks
        .map((block: any) => {
          if (block.content && Array.isArray(block.content)) {
            return block.content.map((item: any) => item.text || '').join('');
          }
          return '';
        })
        .join(' ');
    } else if (contentHtml) {
      // Fallback: strip HTML tags from contentHtml
      textContent = contentHtml.replace(/<[^>]*>/g, '').trim();
    }
    
    if (!textContent || textContent.trim().length < 100) {
      const response = errorResponse('Your blog must be at least 100 characters long', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const { processedContent } = processContentImages(content);

    if (containsLegacyBlobUrl(processedContent)) {
      const response = errorResponse('Legacy blob image URLs are no longer supported. Please re-upload images.', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (containsNonCloudinaryImages(processedContent)) {
      const response = errorResponse('Blog content images must be Cloudinary URLs.', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (featuredImage && String(featuredImage).startsWith('/api/images/')) {
      const response = errorResponse('Legacy blob featured images are no longer supported. Please upload to Cloudinary.', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (featuredImage && !isCloudinaryUrl(String(featuredImage))) {
      const response = errorResponse('Featured image must be a Cloudinary URL.', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const processedMedia = normalizeMediaUrls(media);
    if (Array.isArray(media) && processedMedia.length !== media.length) {
      const response = errorResponse('Legacy blob media URLs are no longer supported. Please re-upload media to Cloudinary.', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (processedMedia.some((item) => !isCloudinaryUrl(item.url))) {
      const response = errorResponse('Blog media URLs must be Cloudinary URLs.', 'VALIDATION_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    // Handle author name assignment securely
    // Users can only publish under their own name or anonymously - never a custom name
    // Defensive: fetch name from DB if session doesn't have it
    let dbUserName = session.user.name
    if (!dbUserName) {
      const { data: userRow } = await supabase
        .from('users')
        .select('name')
        .eq('id', session.user.id)
        .single()
      dbUserName = userRow?.name || null
    }
    const finalAuthorName = isAnonymous
      ? 'Anonim'
      : (dbUserName || 'Anonim');

    const storyData = {
      title: title.trim(),
      content: processedContent,
      contentHtml: contentHtml || '',
      author: session.user.id,
      authorName: finalAuthorName,
      tags: tags || [],
      abstract: abstract || '',
      status: 'pending',
      isAnonymous: !!isAnonymous,
      media: processedMedia,
      featuredImage: featuredImage || undefined,
    };
    const { data: blog, error } = await supabase
      .from('blogs')
      .insert({
        title: storyData.title,
        content: storyData.content,
        content_html: storyData.contentHtml,
        author_id: storyData.author,
        author_name: storyData.authorName,
        tags: storyData.tags,
        abstract: storyData.abstract,
        status: storyData.status,
        is_anonymous: storyData.isAnonymous,
        media: storyData.media,
        featured_image: storyData.featuredImage,
      })
      .select('*')
      .single();

    if (error || !blog) {
      const response = errorResponse('Failed to submit blog', 'CREATE_BLOG_FAILED', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (blog.status === 'pending') {
      await NotificationService.notifyAdminsAboutSubmission(
        'blog',
        blog.id,
        blog.title,
        finalAuthorName || session.user.name || 'Unknown submitter'
      )
    }

    if (blog.status === 'approved') {
      await NotificationService.notifyUsersAboutRelevantItem({
        itemType: 'blog',
        itemId: blog.id,
        title: blog.title,
        description: blog.abstract || '',
        tags: Array.isArray(blog.tags) ? blog.tags : [],
        actionUrl: `/blogs/${blog.id}`,
      });

      void submitBlogToIndexNow(blog.slug || blog.id);
    }

    const successResp = successResponse({
      blog: {
        id: blog.id,
        title: blog.title,
        status: blog.status,
        authorName: blog.author_name
      }
    }, { message: 'Story submitted successfully' }, 201)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      successResp.headers.set(key, value)
    }
    return successResp
  } catch (error) {
    console.error('POST /api/blogs error:', error)
    return errorResponse('Failed to submit blog', 'CREATE_BLOG_FAILED', {}, 500)
  }
}
