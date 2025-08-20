import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Article from '@/lib/models/Article'
import UserAnalytics from '@/lib/models/UserAnalytics';
import { getDraftDeletionStatus, updateDraftActivity } from '@/lib/services/draftManagementService';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// Helper function to calculate word count and reading time
function calculateMetrics(content: any, title: string, abstract: string): { wordCount: number; estimatedReadTime: number } {
  let text = title + ' ' + (abstract || '');

  if (typeof content === 'string') {
    text += ' ' + content;
  } else if (content && Array.isArray(content)) {
    // BlockNote content - extract text from blocks
    const extractText = (blocks: any[]): string => {
      return blocks.map(block => {
        if (block.content && Array.isArray(block.content)) {
          return block.content.map((item: any) => item.text || '').join(' ');
        }
        return '';
      }).join(' ');
    };
    text += ' ' + extractText(content);
  }

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const estimatedReadTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute

  return { wordCount, estimatedReadTime };
}

// Save or update a draft (article or story) with enhanced features
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      draftId,
      title,
      content,
      abstract,
      category,
      tags,
      type,
      draftMetadata
    } = body;

    if (!title && !content) {
      return NextResponse.json({ error: 'Draft must have at least a title or content' }, { status: 400 });
    }

    // Calculate metrics
    const { wordCount, estimatedReadTime } = calculateMetrics(content, title || '', abstract || '');

    // Calculate completion percentage based on filled fields
    let completionPercentage = 0;
    if (title?.trim()) completionPercentage += 25;
    if (abstract?.trim()) completionPercentage += 20;
    if (content) completionPercentage += 35;
    if (tags && tags.length > 0) completionPercentage += 10;
    if (category && category !== 'other') completionPercentage += 10;

    const enhancedDraftMetadata = {
      ...draftMetadata,
      wordCount,
      estimatedReadTime,
      completionPercentage: draftMetadata?.completionPercentage || completionPercentage,
      lastEditedSection: draftMetadata?.lastEditedSection || 'content'
    };

    const draftData = {
      title: title || '',
      content: content || '',
      abstract: abstract || '',
      author: session.user.name || 'Unknown',
      category: category || type || 'other',
      tags: tags || [],
      status: 'draft',
      userId: session.user.id,
      updatedAt: new Date(),
      draftMetadata: enhancedDraftMetadata
    };

    let draft;
    if (draftId) {
      draft = await Article.findOneAndUpdate(
        { _id: draftId, userId: session.user.id },
        { $set: draftData },
        { new: true, upsert: true }
      );
    } else {
      draft = await Article.create({
        ...draftData,
        createdAt: new Date()
      });


    }



    // Update draft activity timestamp
    const activityResult = await updateDraftActivity(draft._id, session.user.id);
    if (!activityResult.success) {
      console.error('Failed to update draft activity:', activityResult.error);
    }

    // Update user analytics
    try {
      await UserAnalytics.findOneAndUpdate(
        { userId: session.user.id },
        {
          $inc: {
            totalDrafts: draftId ? 0 : 1, // Only increment for new drafts
            totalWordCount: draft.draftMetadata?.wordCount || 0
          },
          $set: {
            lastActiveDate: new Date(),
            lastCalculated: new Date()
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Failed to update user analytics:', error);
    }

    return NextResponse.json({ draft, message: 'Draft saved successfully' });
  } catch (error) {
    console.error('Draft save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get all drafts for the logged-in user with advanced filtering and search
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      try {
        const draft = await Article.findOne({ _id: id, userId: session.user.id, status: 'draft' }).lean();
        if (!draft) {
          return NextResponse.json({ error: 'Draft not found or unauthorized' }, { status: 404 });
        }
        return NextResponse.json({ draft });
      } catch (error) {
        console.error('Error fetching single draft:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    const search = searchParams.get('search');
    const folder = searchParams.get('folder');
    const priority = searchParams.get('priority');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeTemplates = searchParams.get('includeTemplates') === 'true';
    const onlyTemplates = searchParams.get('onlyTemplates') === 'true';

    // Build query
    let query: any = {
      userId: session.user.id,
      status: 'draft',
      $or: [
        { category: { $ne: 'story' } },
        { type: { $ne: 'story' } },
        { type: { $exists: false } }
      ]
    };

    // Search functionality
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { abstract: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
          { 'draftMetadata.notes': { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Filter by folder
    if (folder && folder !== 'all') {
      query['draftMetadata.folder'] = folder;
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query['draftMetadata.priority'] = priority;
    }

    // Template filtering
    if (onlyTemplates) {
      query['draftMetadata.isTemplate'] = true;
    } else if (!includeTemplates) {
      query['draftMetadata.isTemplate'] = { $ne: true };
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [drafts, totalCount, folders, priorities] = await Promise.all([
      Article.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(query),
      // Get unique folders for filter options
      Article.distinct('draftMetadata.folder', {
        userId: session.user.id,
        status: 'draft',
        'draftMetadata.folder': { $exists: true, $ne: null }
      }),
      // Get unique priorities for filter options
      Article.distinct('draftMetadata.priority', {
        userId: session.user.id,
        status: 'draft',
        'draftMetadata.priority': { $exists: true, $ne: null }
      })
    ]);

    // Add deletion status to each draft
    const draftsWithStatus = drafts.map(draft => {
      const deletionStatus = getDraftDeletionStatus(draft);
      return {
        ...draft,
        ...deletionStatus
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      drafts: draftsWithStatus,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      },
      filters: {
        folders: folders.filter(f => f), // Remove null/undefined
        priorities: priorities.filter(p => p)
      }
    });
  } catch (error) {
    console.error('Draft fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update an existing draft
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id, // Use 'id' to match the frontend request body
      title,
      content,
      abstract,
      category,
      tags,
      type,
      draftMetadata,

    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Draft ID is required for updates' }, { status: 400 });
    }

    // Calculate metrics
    const { wordCount, estimatedReadTime } = calculateMetrics(content, title || '', abstract || '');

    // Calculate completion percentage based on filled fields
    let completionPercentage = 0;
    if (title?.trim()) completionPercentage += 25;
    if (abstract?.trim()) completionPercentage += 20;
    if (content) completionPercentage += 35;
    if (tags && tags.length > 0) completionPercentage += 10;
    if (category && category !== 'other') completionPercentage += 10;

    const enhancedDraftMetadata = {
      ...draftMetadata,
      wordCount,
      estimatedReadTime,
      completionPercentage: draftMetadata?.completionPercentage || completionPercentage,
      lastEditedSection: draftMetadata?.lastEditedSection || 'content'
    };

    const draftData = {
      title: title || '',
      content: content || '',
      abstract: abstract || '',
      author: session.user.name || 'Unknown',
      category: category || type || 'other',
      tags: tags || [],
      status: 'draft',
      userId: session.user.id,
      updatedAt: new Date(),
      draftMetadata: enhancedDraftMetadata
    };

    const draft = await Article.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: draftData },
      { new: true }
    );

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found or you do not have permission to edit it' }, { status: 404 });
    }



    // Update draft activity timestamp
    const activityResult = await updateDraftActivity(draft._id, session.user.id);
    if (!activityResult.success) {
      console.error('Failed to update draft activity:', activityResult.error);
    }

    return NextResponse.json({ draft, message: 'Draft updated successfully' });
  } catch (error) {
    console.error('Draft update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    // Delete the draft (only if it belongs to the user)
    const result = await Article.findOneAndDelete({
      _id: id,
      userId: session.user.id,
      status: 'draft'
    });

    if (!result) {
      return NextResponse.json({ error: 'Draft not found or you do not have permission to delete it' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Draft delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
