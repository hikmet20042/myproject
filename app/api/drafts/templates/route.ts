import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Article from '@/lib/models/Article';

export const dynamic = 'force-dynamic';

// Get all templates
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includePublic = searchParams.get('includePublic') === 'true';

    let query: any = {
      status: 'draft',
      'draftMetadata.isTemplate': true
    };

    if (includePublic) {
      // Include both user's templates and public templates
      query = {
        ...query,
        $or: [
          { userId: session.user.id },
          { 'draftMetadata.isPublicTemplate': true }
        ]
      };
    } else {
      // Only user's templates
      query.userId = session.user.id;
    }

    const templates = await Article.find(query)
      .select('title abstract category tags draftMetadata createdAt updatedAt')
      .sort({ 'draftMetadata.templateName': 1, updatedAt: -1 })
      .lean();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new template or convert draft to template
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
      templateName, 
      templateDescription,
      isPublicTemplate = false,
      templateData 
    } = body;

    if (draftId) {
      // Convert existing draft to template
      const draft = await Article.findOne({ 
        _id: draftId, 
        userId: session.user.id, 
        status: 'draft' 
      });

      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

      draft.draftMetadata = {
        ...draft.draftMetadata,
        isTemplate: true,
        templateName: templateName || draft.title,
        templateDescription,
        isPublicTemplate
      };

      await draft.save();
      return NextResponse.json({ 
        message: 'Draft converted to template successfully',
        template: draft 
      });
    } else if (templateData) {
      // Create new template from scratch
      const template = await Article.create({
        title: templateData.title || 'New Template',
        content: templateData.content || '',
        abstract: templateData.abstract || '',
        category: templateData.category || 'other',
        tags: templateData.tags || [],
        status: 'draft',
        userId: session.user.id,
        author: session.user.name || 'Unknown',
        draftMetadata: {
          isTemplate: true,
          templateName: templateName || templateData.title,
          templateDescription,
          isPublicTemplate,
          folder: 'Templates',
          completionPercentage: 100
        }
      });

      return NextResponse.json({ 
        message: 'Template created successfully',
        template 
      });
    } else {
      return NextResponse.json({ error: 'Either draftId or templateData required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Template creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update template
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, templateName, templateDescription, isPublicTemplate } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const template = await Article.findOneAndUpdate(
      { 
        _id: templateId, 
        userId: session.user.id, 
        status: 'draft',
        'draftMetadata.isTemplate': true 
      },
      {
        $set: {
          'draftMetadata.templateName': templateName,
          'draftMetadata.templateDescription': templateDescription,
          'draftMetadata.isPublicTemplate': isPublicTemplate,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Template updated successfully',
      template 
    });
  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete template
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const result = await Article.findOneAndDelete({
      _id: templateId,
      userId: session.user.id,
      status: 'draft',
      'draftMetadata.isTemplate': true
    });

    if (!result) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
