import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Story from '@/lib/models/Story';
import { processContentImages, updateMediaWithBlobReferences, getFeaturedImageBlobId, validateContentImages } from '@/lib/utils/imageUtils';
import { cache, generateCacheKey, withCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // If ID is provided, return single story
    if (id) {
      const story = await Story.findById(id).lean();
      if (!story) {
        return NextResponse.json(
          { error: 'Story not found' },
          { status: 404 }
        );
      }
      
      // Check if story is approved for public access
      if ((story as any).status === 'approved') {
        return NextResponse.json({ story });
      }
      
      // For non-approved stories, require authentication and ownership
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Story not found' },
          { status: 404 }
        );
      }
      
      // Check if user owns the story or is admin
      if ((story as any).author?.toString() !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Story not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ story });
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
    const cacheKey = generateCacheKey.stories(page, limit, search || undefined, tagsArray, status);
    
    // Try to get from cache first
    const cachedResult = await withCache(
      cache.stories,
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

        const total = await Story.countDocuments(query);
        const stories = await Story.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();
        
        return { stories, total };
      }
    );
    
    const { stories, total } = cachedResult as { stories: any[], total: number };

    return NextResponse.json({
      total,
      page,
      limit,
      results: stories
    });
  } catch (error) {
    console.error('GET /api/stories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
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
        { error: 'You must verify your email before submitting stories.' },
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
        { error: 'Your story must be at least 100 characters long' },
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
    const story = await Story.create(storyData);
    return NextResponse.json({
      message: 'Story submitted successfully',
      story: {
        id: story._id,
        title: story.title,
        status: story.status,
        authorName: story.authorName
      }
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/stories error:', error);
    return NextResponse.json(
      { error: 'Failed to submit story' },
      { status: 500 }
    );
  }
}

// PATCH for user editing stories
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

    // Find the story first to check its current status
    const existingStory = await Story.findOne({ _id: id, author: session.user.id });
    
    if (!existingStory) {
      return NextResponse.json({ error: 'Story not found or you do not have permission to edit it' }, { status: 404 });
    }

    // Prevent editing of approved stories
    if (existingStory.status === 'approved') {
      return NextResponse.json({ 
        error: 'Approved stories cannot be edited. Contact an administrator if changes are needed.' 
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

    // If editing a rejected story, automatically change status to pending when submitting
    if (existingStory.status === 'rejected' && reqStatus === 'pending') {
      updateData.adminComment = undefined; // Clear admin comment when resubmitting
    }

    const story = await Story.findOneAndUpdate(
      { _id: id, author: session.user.id },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({ story, message: 'Story updated successfully' });
    
  } catch (error) {
    console.error('PATCH /api/stories error:', error);
    return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
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

      const story = await Story.findByIdAndUpdate(
        id,
        { 
          status, 
          adminComment: status === 'rejected' ? adminComment : undefined,
          reviewedAt: new Date(),
          reviewedBy: session.user.id
        },
        { new: true }
      );

      if (!story) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      }

      // Invalidate cache
      cache.stories.clear();

      return NextResponse.json({ story });
    } else {
      // User story edit functionality
      if (!id) {
        return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
      }

      // Find the existing story
      const existingStory = await Story.findById(id);
      if (!existingStory) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      }

      // Check if user owns the story
      if (existingStory.author.toString() !== session.user.id) {
        return NextResponse.json({ error: 'You can only edit your own stories' }, { status: 403 });
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

      // Update the story
      const updatedStory = await Story.findByIdAndUpdate(
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
        return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
      }

      // Invalidate cache
      cache.stories.clear();

      return NextResponse.json({ 
        story: updatedStory,
        authorName: updatedStory.authorName
      });
    }
  } catch (error) {
    console.error('Error updating story:', error);
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

    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if user owns the story or is admin
    if (story.author.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Story.findByIdAndDelete(id);

    // Invalidate cache
    cache.stories.clear();

    return NextResponse.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
