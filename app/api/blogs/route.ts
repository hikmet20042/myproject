import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Blog from '@/lib/models/Blog';
import { processContentImages, updateMediaWithBlobReferences, getFeaturedImageBlobId, validateContentImages } from '@/lib/utils/imageUtils';
import { cache, generateCacheKey, withCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // If ID is provided, return single blog
    if (id) {
      const blog = await Blog.findById(id).lean();
      if (!blog) {
        return NextResponse.json(
          { error: 'Story not found' },
          { status: 404 }
        );
      }
      
      // Check if blog is approved for public access
      if ((blog as any).status === 'approved') {
        return NextResponse.json({ blog });
      }
      
      // For non-approved blogs, require authentication and ownership
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Story not found' },
          { status: 404 }
        );
      }
      
      // Check if user owns the blog or is admin
      if ((blog as any).author?.toString() !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Story not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ blog });
    }
    
    // Otherwise, return paginated list
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
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
        const query: any = { status };
        if (search && search.trim()) {
          query.$or = [
            { title: { $regex: search.trim(), $options: 'i' } },
            { content: { $regex: search.trim(), $options: 'i' } },
            { abstract: { $regex: search.trim(), $options: 'i' } }
          ];
        }
        if (tags && tags.trim()) {
          const tagArray = tags.split(',').map(tag => tag.trim());
          query.tags = { $in: tagArray };
        }

        const total = await Blog.countDocuments(query);
        const blogs = await Blog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();
        
        return { blogs, total };
      }
    );
    
    const { blogs, total } = cachedResult as { blogs: any[], total: number };

    return NextResponse.json({
      total,
      page,
      limit,
      results: blogs
    });
  } catch (error) {
    console.error('GET /api/blogs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // Check email verification
    if (!('emailVerified' in session.user) || !session.user.emailVerified) {
      return NextResponse.json(
        { error: 'You must verify your email before submitting blogs.' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { title, content, contentHtml, tags, abstract, isAnonymous, media, featuredImage } = body;
    if (!title || title.length < 5 || title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 200 characters' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Your blog must be at least 100 characters long' },
        { status: 400 }
      );
    }

    // Validate tags if provided
    if (tags && !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Tags must be an array of strings' },
        { status: 400 }
      );
    }

    // Process content images and validate blob references
    const { processedContent, imageReferences } = processContentImages(content);

    // Validate that all blob images belong to the user
    if (imageReferences.some(ref => ref.blobId)) {
      const validation = await validateContentImages(processedContent, session.user.id);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Some images in the content are invalid or do not belong to you.' },
          { status: 400 }
        );
      }
    }

    // Process media array with blob references
    const processedMedia = updateMediaWithBlobReferences(media);

    // Process featured image
    const featuredImageBlobId = getFeaturedImageBlobId(featuredImage);

    // Handle author assignment similar to articles
    let finalAuthorName = '';
    if (isAnonymous) {
      finalAuthorName = 'Anonymous';
    } else if (session?.user?.name) {
      finalAuthorName = session.user.name;
    } else {
      finalAuthorName = 'Anonymous';
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
    const blog = await Blog.create(storyData);
    return NextResponse.json({
      message: 'Story submitted successfully',
      blog: {
        id: blog._id,
        title: blog.title,
        status: blog.status,
        authorName: blog.authorName
      }
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/blogs error:', error);
    return NextResponse.json(
      { error: 'Failed to submit blog' },
      { status: 500 }
    );
  }
}

// PATCH for user editing blogs
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, contentHtml, tags, abstract, isAnonymous, authorName, media, featuredImage, status: reqStatus } = body;

    if (!id) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    // Find the blog first to check its current status
    const existingStory = await Blog.findOne({ _id: id, author: session.user.id });
    
    if (!existingStory) {
      return NextResponse.json({ error: 'Story not found or you do not have permission to edit it' }, { status: 404 });
    }

    // Prevent editing of approved blogs
    if (existingStory.status === 'approved') {
      return NextResponse.json({ 
        error: 'Approved blogs cannot be edited. Contact an administrator if changes are needed.' 
      }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;
    if (contentHtml !== undefined) updateData.contentHtml = contentHtml;
    if (tags !== undefined) updateData.tags = tags;
    if (abstract !== undefined) updateData.abstract = abstract;
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;
    if (authorName !== undefined) updateData.authorName = isAnonymous ? 'Anonymous' : authorName;
    if (media !== undefined) updateData.media = media;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (reqStatus !== undefined) updateData.status = reqStatus;

    // If editing a rejected blog, automatically change status to pending when submitting
    if (existingStory.status === 'rejected' && reqStatus === 'pending') {
      updateData.adminComment = undefined; // Clear admin comment when resubmitting
    }

    const blog = await Blog.findOneAndUpdate(
      { _id: id, author: session.user.id },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({ blog, message: 'Story updated successfully' });
    
  } catch (error) {
    console.error('PATCH /api/blogs error:', error);
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

// PUT for admin review (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { id, status, adminComment, title, content, contentHtml, tags, isAnonymous, media } = body;

    // Check if this is an admin review (has status field) or user edit (has content fields)
    if (status && ['approved', 'rejected'].includes(status)) {
      // Admin review functionality
      if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!id || !status) {
        return NextResponse.json({ error: 'Story ID and status are required' }, { status: 400 });
      }

      const blog = await Blog.findByIdAndUpdate(
        id,
        { 
          status, 
          adminComment: status === 'rejected' ? adminComment : undefined,
          reviewedAt: new Date(),
          reviewedBy: session.user.id
        },
        { new: true }
      );

      if (!blog) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      }

      // Invalidate cache
      cache.blogs.clear();

      return NextResponse.json({ blog });
    } else {
      // User blog edit functionality
      if (!id) {
        return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
      }

      // Find the existing blog
      const existingStory = await Blog.findById(id);
      if (!existingStory) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      }

      // Check if user owns the blog
      if (existingStory.author.toString() !== session.user.id) {
        return NextResponse.json({ error: 'You can only edit your own blogs' }, { status: 403 });
      }

      // Validate title
      if (!title || title.length < 5 || title.length > 200) {
        return NextResponse.json(
          { error: 'Title must be between 5 and 200 characters' },
          { status: 400 }
        );
      }

      // Extract plain text from content for validation
      let textContent = '';
      if (typeof content === 'string') {
        textContent = content;
      } else if (content && content.blocks && Array.isArray(content.blocks)) {
        textContent = content.blocks
          .map((block: any) => {
            if (block.content && Array.isArray(block.content)) {
              return block.content.map((item: any) => item.text || '').join('');
            }
            return '';
          })
          .join(' ');
      } else if (contentHtml) {
         // Remove HTML tags to get plain text
         textContent = contentHtml.replace(/<[^>]*>/g, '').trim();
      }

      if (textContent.length < 100) {
        return NextResponse.json(
          { error: 'Story content must be at least 100 characters long' },
          { status: 400 }
        );
      }

      // Validate tags
      if (tags && !Array.isArray(tags)) {
        return NextResponse.json(
          { error: 'Tags must be an array of strings' },
          { status: 400 }
        );
      }

      // Process images if any
      let processedContent = content;
      let processedContentHtml = contentHtml;
      let processedMedia = media || [];

      if (content) {
        try {
          const imageValidation = await validateContentImages(content, session.user.id);
          if (!imageValidation.isValid) {
            return NextResponse.json(
              { error: `Invalid images: ${imageValidation.missingImages.join(', ')}` },
              { status: 400 }
            );
          }

          const imageProcessingResult = await processContentImages(content);
          processedContent = imageProcessingResult.processedContent;
          processedContentHtml = contentHtml; // Keep original HTML
          processedMedia = await updateMediaWithBlobReferences(imageProcessingResult.imageReferences.map(ref => ({ type: 'image', url: ref.url, alt: ref.alt, blobId: ref.blobId })));
        } catch (error) {
          console.error('Error processing images:', error);
          return NextResponse.json(
            { error: 'Failed to process images' },
            { status: 500 }
          );
        }
      }

      // Determine author name
      let authorName;
      if (isAnonymous) {
        authorName = 'Anonymous';
      } else if (body.authorName && body.authorName.trim()) {
        authorName = body.authorName.trim();
      } else {
        authorName = session.user.name || 'Unknown';
      }

      // Update the blog
      const updatedStory = await Blog.findByIdAndUpdate(
        id,
        {
          title,
          content: processedContent,
          contentHtml: processedContentHtml,
          tags: tags || [],
          authorName,
          media: processedMedia,
          status: 'pending', // Reset to pending when edited
          adminComment: undefined, // Clear admin comment when resubmitted
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedStory) {
        return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
      }

      // Invalidate cache
      cache.blogs.clear();

      return NextResponse.json({ 
        blog: updatedStory,
        authorName: updatedStory.authorName
      });
    }
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if user owns the blog or is admin
    if (blog.author.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Blog.findByIdAndDelete(id);

    // Invalidate cache
    cache.blogs.clear();

    return NextResponse.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
