import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { processContentImages, updateMediaWithBlobReferences, getFeaturedImageBlobId, validateContentImages } from '@/lib/utils/imageUtils';
import { cache, generateCacheKey, withCache } from '@/lib/cache';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { NotificationService } from '@/lib/services/notificationService';
import { getBlogStats } from '@/lib/blogStats';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const status = searchParams.get('status') || 'approved';
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
          .from('blogs')
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

    const blogsWithStats = await Promise.all(
      blogs.map(async (blog: any) => {
        const stats = await getBlogStats(supabase, blog.id, null)
        return { ...blog, ...stats }
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
    const body = await request.json();
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

    // Process content images and validate blob references
    const { processedContent, imageReferences } = processContentImages(content);

    // Validate that all blob images belong to the user
    if (imageReferences.some(ref => ref.blobId)) {
      const validation = await validateContentImages(processedContent, session.user.id);
      if (!validation.isValid) {
        return errorResponse('Some images in the content are invalid or do not belong to you.', 'VALIDATION_ERROR', {}, 400);
      }
    }

    // Process media array with blob references
    const processedMedia = updateMediaWithBlobReferences(media);

    // Process featured image
    const featuredImageBlobId = getFeaturedImageBlobId(featuredImage);

    // Handle author name assignment
    let finalAuthorName = '';
    if (isAnonymous) {
      finalAuthorName = 'Anonim';
    } else if (authorName && authorName.trim()) {
      // Use custom author name if provided
      finalAuthorName = authorName.trim();
    } else if (session?.user?.name) {
      // Fall back to session user name
      finalAuthorName = session.user.name;
    } else {
      finalAuthorName = 'Anonim';
    }

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
      featuredImageBlobId: featuredImageBlobId || undefined
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
        featured_image_blob_id: storyData.featuredImageBlobId || null
      })
      .select('*')
      .single();

    if (error || !blog) {
      return errorResponse('Failed to submit blog', 'CREATE_BLOG_FAILED', {}, 500);
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
