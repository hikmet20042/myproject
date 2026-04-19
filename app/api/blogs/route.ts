import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processContentImages, isCloudinaryUrl } from '@/lib/utils/imageUtils';
import { cache, generateCacheKey, withCache } from '@/lib/cache';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { NotificationService } from '@/features/notifications/services/notificationService';
import { getBlogStats } from '@/lib/blogStats';

const MAX_PAGE_SIZE = 50;

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
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);

    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
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
    const cacheKey = generateCacheKey.blogs(page, limit, search || undefined, tagsArray, status);
    
    // Try to get from cache first
    const cachedResult = await withCache(
      cache.blogs,
      cacheKey,
      async () => {
        let queryBuilder = supabase
          .from('blogs_with_stats')
          .select('*', { count: 'exact' })
          .eq('status', status)
          .order('created_at', { ascending: false })
          .range(skip, skip + limit - 1);

        if (search && search.trim()) {
          queryBuilder = queryBuilder.or(`title.ilike.%${search.trim()}%,content_html.ilike.%${search.trim()}%,abstract.ilike.%${search.trim()}%`);
        }
        if (tags && tags.trim()) {
          const tagArray = tags.split(',').map(tag => tag.trim());
          queryBuilder = queryBuilder.overlaps('tags', tagArray);
        }

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

    return successResponse(
      { items: blogsWithStats },
      {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    console.error('GET /api/blogs error:', error);
    return errorResponse('Failed to fetch blogs', 'FETCH_BLOGS_FAILED', {}, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session || !session.user) {
      return errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401);
    }
    if (session.user.accountType === 'organization') {
      return errorResponse(
        'Organization accounts cannot submit blogs. Blog sharing is available for individual users only.',
        'FORBIDDEN_ACCOUNT_TYPE',
        {},
        403
      );
    }
    // Check email verification
    if (!('emailVerified' in session.user) || !session.user.emailVerified) {
      return errorResponse('You must verify your email before submitting blogs.', 'EMAIL_NOT_VERIFIED', {}, 403);
    }
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 'VALIDATION_ERROR', {}, 400);
    }
    const { title, content, contentHtml, tags, abstract, isAnonymous, authorName, media, featuredImage } = body;
    if (!title || title.length < 5 || title.length > 200) {
      return errorResponse('Title must be between 5 and 200 characters', 'VALIDATION_ERROR', {}, 400);
    }
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
      return errorResponse('Your blog must be at least 100 characters long', 'VALIDATION_ERROR', {}, 400);
    }

    // Validate tags if provided
    if (tags && !Array.isArray(tags)) {
      return errorResponse('Tags must be an array of strings', 'VALIDATION_ERROR', {}, 400);
    }

    const { processedContent } = processContentImages(content);

    if (containsLegacyBlobUrl(processedContent)) {
      return errorResponse('Legacy blob image URLs are no longer supported. Please re-upload images.', 'VALIDATION_ERROR', {}, 400);
    }

    if (containsNonCloudinaryImages(processedContent)) {
      return errorResponse('Blog content images must be Cloudinary URLs.', 'VALIDATION_ERROR', {}, 400);
    }

    if (featuredImage && String(featuredImage).startsWith('/api/images/')) {
      return errorResponse('Legacy blob featured images are no longer supported. Please upload to Cloudinary.', 'VALIDATION_ERROR', {}, 400);
    }

    if (featuredImage && !isCloudinaryUrl(String(featuredImage))) {
      return errorResponse('Featured image must be a Cloudinary URL.', 'VALIDATION_ERROR', {}, 400);
    }

    const processedMedia = normalizeMediaUrls(media);
    if (Array.isArray(media) && processedMedia.length !== media.length) {
      return errorResponse('Legacy blob media URLs are no longer supported. Please re-upload media to Cloudinary.', 'VALIDATION_ERROR', {}, 400);
    }

    if (processedMedia.some((item) => !isCloudinaryUrl(item.url))) {
      return errorResponse('Blog media URLs must be Cloudinary URLs.', 'VALIDATION_ERROR', {}, 400);
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
      return errorResponse('Failed to submit blog', 'CREATE_BLOG_FAILED', {}, 500);
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
      })
    }

    return successResponse({
      blog: {
        id: blog.id,
        title: blog.title,
        status: blog.status,
        authorName: blog.author_name
      }
    }, { message: 'Story submitted successfully' }, 201);
  } catch (error) {
    console.error('POST /api/blogs error:', error);
    return errorResponse('Failed to submit blog', 'CREATE_BLOG_FAILED', {}, 500);
  }
}
