import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page
    const mimetype = searchParams.get('mimetype') || undefined;
    
    const skip = (page - 1) * limit;

    let query = supabase
      .from('image_blobs')
      .select('id, filename, original_name, mimetype, content_type, size, width, height, description, alt, tags, usage_count, uploaded_at, last_accessed', { count: 'exact' })
      .eq('uploaded_by', session.user.id)
      .order('uploaded_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (mimetype) {
      query = query.eq('mimetype', mimetype);
    }

    const { data: images, error, count } = await query;

    if (error) {
      console.error('Images list query error:', error);
      return errorResponse('Failed to retrieve images', "API_ERROR", {}, 500);
    }

    const total = count || 0;

    // Format response
    const formattedImages = (images || []).map(image => ({
      id: image.id,
      filename: image.filename,
      originalName: image.original_name,
      mimetype: image.mimetype || image.content_type,
      size: image.size,
      width: image.width,
      height: image.height,
      description: image.description,
      alt: image.alt,
      tags: image.tags,
      usageCount: image.usage_count,
      uploadedAt: image.uploaded_at,
      lastAccessed: image.last_accessed,
      url: `/api/images/${image.id}`
    }));

    return successResponse({
      images: formattedImages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Images list error:', error);
    return errorResponse('Failed to retrieve images', "API_ERROR", {}, 500);
  }
}

// Delete image
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401);
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('id');

    if (!imageId) {
      return errorResponse('Invalid image ID', "API_ERROR", {}, 400);
    }

    // Find and delete the image (only if owned by user)
    const { data: deletedImage, error } = await supabase
      .from('image_blobs')
      .delete()
      .eq('id', imageId)
      .eq('uploaded_by', session.user.id)
      .select('*')
      .single();

    if (error || !deletedImage) {
      return errorResponse('Image not found or not authorized', "API_ERROR", {}, 404);
    }

    return successResponse({ 
      message: 'Image deleted successfully',
      deletedImage: {
        id: deletedImage.id,
        filename: deletedImage.filename,
        originalName: deletedImage.original_name
      }
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    return errorResponse('Failed to delete image', "API_ERROR", {}, 500);
  }
}
