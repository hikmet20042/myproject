import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { runCompleteMigration, migrateProfileAvatars, migrateArticleImages, migrateBlogImages } from '@/lib/utils/imageMigration';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const User = require('@/lib/models/User').default;
    const user = await User.findById(session.user.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { type = 'all' } = body; // 'all', 'profiles', 'articles', 'blogs'

    let result;

    switch (type) {
      case 'profiles':
        result = { profiles: await migrateProfileAvatars() };
        break;
      case 'articles':
        result = { articles: await migrateArticleImages() };
        break;
      case 'blogs':
        result = { blogs: await migrateBlogImages() };
        break;
      case 'all':
      default:
        result = await runCompleteMigration();
        break;
    }

    return NextResponse.json({
      message: 'Migration completed',
      result
    });

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const User = require('@/lib/models/User').default;
    const user = await User.findById(session.user.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get migration status - count items that need migration
    const UserProfile = require('@/lib/models/UserProfile').default;
    const Article = require('@/lib/models/Article').default;
    const Story = require('@/lib/models/Story').default;
    const ImageBlob = require('@/lib/models/ImageBlob').default;

    const [
      profilesNeedingMigration,
      articlesNeedingMigration,
      storiesNeedingMigration,
      totalBlobs,
      totalBlobSize
    ] = await Promise.all([
      UserProfile.countDocuments({
        avatar: { $exists: true, $nin: [null, ''] },
        avatarBlobId: { $exists: false }
      }),
      Article.countDocuments({
        featuredImage: { $exists: true, $nin: [null, ''] },
        featuredImageBlobId: { $exists: false }
      }),
      Blog.countDocuments({
        featuredImage: { $exists: true, $nin: [null, ''] },
        featuredImageBlobId: { $exists: false }
      }),
      ImageBlob.countDocuments(),
      ImageBlob.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ])
    ]);

    return NextResponse.json({
      migrationStatus: {
        profilesNeedingMigration,
        articlesNeedingMigration,
        storiesNeedingMigration,
        totalItemsNeedingMigration: profilesNeedingMigration + articlesNeedingMigration + storiesNeedingMigration
      },
      blobStorage: {
        totalBlobs,
        totalSize: totalBlobSize[0]?.totalSize || 0,
        totalSizeMB: Math.round((totalBlobSize[0]?.totalSize || 0) / (1024 * 1024) * 100) / 100
      }
    });

  } catch (error) {
    console.error('Migration status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get migration status' },
      { status: 500 }
    );
  }
}
