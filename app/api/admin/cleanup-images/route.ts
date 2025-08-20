import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { cleanupUnusedImages } from '@/lib/utils/imageUtils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { daysOld = 30 } = body;

    // Validate daysOld parameter
    if (typeof daysOld !== 'number' || daysOld < 1 || daysOld > 365) {
      return NextResponse.json(
        { error: 'daysOld must be a number between 1 and 365' },
        { status: 400 }
      );
    }

    const deletedCount = await cleanupUnusedImages(daysOld);

    return NextResponse.json({
      message: 'Cleanup completed',
      deletedCount,
      criteria: `Images older than ${daysOld} days with 0 usage count`
    });

  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('daysOld') || '30');

    // Get count of images that would be deleted
    const ImageBlob = require('@/lib/models/ImageBlob').default;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const [unusedCount, unusedSize, totalCount, totalSize] = await Promise.all([
      ImageBlob.countDocuments({
        usageCount: 0,
        uploadedAt: { $lt: cutoffDate }
      }),
      ImageBlob.aggregate([
        {
          $match: {
            usageCount: 0,
            uploadedAt: { $lt: cutoffDate }
          }
        },
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$size' }
          }
        }
      ]),
      ImageBlob.countDocuments(),
      ImageBlob.aggregate([
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$size' }
          }
        }
      ])
    ]);

    return NextResponse.json({
      cleanup: {
        daysOld,
        unusedCount,
        unusedSizeMB: Math.round((unusedSize[0]?.totalSize || 0) / (1024 * 1024) * 100) / 100,
        wouldDelete: unusedCount
      },
      storage: {
        totalCount,
        totalSizeMB: Math.round((totalSize[0]?.totalSize || 0) / (1024 * 1024) * 100) / 100
      }
    });

  } catch (error) {
    console.error('Cleanup status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get cleanup status' },
      { status: 500 }
    );
  }
}
