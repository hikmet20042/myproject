import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Check if user is admin
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401);
    }

    if (!canAccessAdmin(session)) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403);
    }

    const body = await request.json();
    const { daysOld = 30 } = body;

    // Validate daysOld parameter
    if (typeof daysOld !== 'number' || daysOld < 1 || daysOld > 365) {
      return errorResponse('daysOld must be a number between 1 and 365', "API_ERROR", {}, 400);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { count: deletedCount, error: deleteError } = await supabase
      .from('image_blobs')
      .delete({ count: 'exact' })
      .eq('usage_count', 0)
      .lt('uploaded_at', cutoffDate.toISOString());

    if (deleteError) {
      console.error('Cleanup delete error:', deleteError);
      return errorResponse('Cleanup failed', "API_ERROR", {}, 500);
    }

    return successResponse({
      message: 'Cleanup completed',
      deletedCount,
      criteria: `Images older than ${daysOld} days with 0 usage count`
    });

  } catch (error) {
    console.error('Cleanup API error:', error);
    return errorResponse('Cleanup failed', "API_ERROR", {}, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Check if user is admin
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401);
    }

    if (!canAccessAdmin(session)) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403);
    }

    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('daysOld') || '30');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const [unusedResult, totalResult] = await Promise.all([
      supabase
        .from('image_blobs')
        .select('size', { count: 'exact' })
        .eq('usage_count', 0)
        .lt('uploaded_at', cutoffDate.toISOString()),
      supabase
        .from('image_blobs')
        .select('size', { count: 'exact' })
    ]);

    if (unusedResult.error || totalResult.error) {
      console.error('Cleanup status query error:', unusedResult.error || totalResult.error);
      return errorResponse('Failed to get cleanup status', "API_ERROR", {}, 500);
    }

    const unusedCount = unusedResult.count || 0;
    const totalCount = totalResult.count || 0;
    const unusedSizeTotal = (unusedResult.data || []).reduce((sum, row) => sum + (row.size || 0), 0);
    const totalSizeTotal = (totalResult.data || []).reduce((sum, row) => sum + (row.size || 0), 0);

    return successResponse({
      cleanup: {
        daysOld,
        unusedCount,
        unusedSizeMB: Math.round((unusedSizeTotal || 0) / (1024 * 1024) * 100) / 100,
        wouldDelete: unusedCount
      },
      storage: {
        totalCount,
        totalSizeMB: Math.round((totalSizeTotal || 0) / (1024 * 1024) * 100) / 100
      }
    });

  } catch (error) {
    console.error('Cleanup status API error:', error);
    return errorResponse('Failed to get cleanup status', "API_ERROR", {}, 500);
  }
}
