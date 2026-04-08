import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isApprovedOrganization } from '@/lib/auth/permissions';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const IMAGE_ID_REGEX = /\/api\/images\/([0-9a-f-]{36})$/i;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1024;
const MAX_IMAGE_HEIGHT = 1024;

const extractBlobIdFromUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const match = url.match(IMAGE_ID_REGEX);
  return match?.[1] || null;
};

const extractBlobIdFromProfileImage = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return extractBlobIdFromUrl(value);
  if (typeof value === 'object') {
    if (typeof value.blobId === 'string') return value.blobId;
    if (typeof value.url === 'string') return extractBlobIdFromUrl(value.url);
  }
  return null;
};

const normalizeOrganizationImage = (value: any): { url: string | null; blobId: string | null } => {
  if (!value) return { url: null, blobId: null };
  if (typeof value === 'string') {
    return { url: value, blobId: extractBlobIdFromUrl(value) };
  }
  if (typeof value === 'object') {
    const url = typeof value.url === 'string' ? value.url : null;
    const blobId = typeof value.blobId === 'string' ? value.blobId : extractBlobIdFromUrl(url);
    return { url, blobId };
  }
  return { url: null, blobId: null };
};

const validateImage = (file: File): string | null => {
  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return 'Unsupported image format. Please use JPG, PNG, WEBP, or GIF.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Image size must be 5MB or less.';
  }
  return null;
};

const optimizeProfileImage = async (buffer: Buffer, mimeType: string) => {
  try {
    // GIF is kept as-is to avoid breaking animation frames.
    if (mimeType.toLowerCase() === 'image/gif') {
      return {
        buffer,
        mimeType: 'image/gif',
      };
    }

    let pipeline = sharp(buffer, { failOn: 'none' }).rotate();
    const metadata = await pipeline.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
      pipeline = pipeline.resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to webp to reduce DB footprint while preserving quality.
    const optimized = await pipeline.webp({ quality: 82, effort: 5 }).toBuffer();
    return {
      buffer: optimized,
      mimeType: 'image/webp',
    };
  } catch (error) {
    console.error('Image optimization failed, using original upload:', error);
    return {
      buffer,
      mimeType,
    };
  }
};

// POST /api/profile/image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'API_ERROR', {}, 401);
    }

    const supabase = createSupabaseAdminClient();
    const formData = await request.formData();
    const file = formData.get('file') as unknown as File | null;

    if (!file) {
      return errorResponse('No file provided', 'API_ERROR', {}, 400);
    }

    const validationError = validateImage(file);
    if (validationError) {
      return errorResponse(validationError, 'API_ERROR', {}, 400);
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);
    const optimizedImage = await optimizeProfileImage(originalBuffer, file.type);
    const buffer = optimizedImage.buffer;
    const isOrganization = isApprovedOrganization(session);

    const { data: insertedBlob, error: insertError } = await supabase
      .from('image_blobs')
      .insert({
        filename: file.name,
        original_name: file.name,
        mimetype: optimizedImage.mimeType,
        content_type: optimizedImage.mimeType,
        size: buffer.length,
        data: buffer,
        uploaded_by: session.user.id,
        uploaded_at: new Date().toISOString(),
        tags: ['profile'],
        metadata: {
          context: 'profile',
          storage: 'supabase_db',
          optimization: {
            originalSize: file.size,
            optimizedSize: buffer.length,
            reducedBytes: Math.max(0, file.size - buffer.length),
          },
        },
      })
      .select('id')
      .single();

    if (insertError || !insertedBlob?.id) {
      return errorResponse('Failed to upload profile image', 'API_ERROR', {}, 500);
    }

    const imageUrl = `/api/images/${insertedBlob.id}`;
    let oldBlobId: string | null = null;

    if (isOrganization) {
      const { data: orgProfile } = await supabase
        .from('organization_profiles')
        .select('profile_image')
        .eq('account_id', session.user.id)
        .maybeSingle();

      oldBlobId = extractBlobIdFromProfileImage(orgProfile?.profile_image);

      await supabase
        .from('organization_profiles')
        .update({
          profile_image: {
            url: imageUrl,
            blobId: insertedBlob.id,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('account_id', session.user.id);
    } else {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, avatar, avatar_blob_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      oldBlobId =
        (typeof userProfile?.avatar_blob_id === 'string' && userProfile.avatar_blob_id) ||
        extractBlobIdFromUrl(userProfile?.avatar) ||
        null;

      if (userProfile?.id) {
        await supabase
          .from('user_profiles')
          .update({
            avatar: imageUrl,
            avatar_blob_id: insertedBlob.id,
            avatar_metadata: { blobId: insertedBlob.id, storage: 'supabase_db' },
            updated_at: new Date().toISOString(),
          })
          .eq('id', userProfile.id);
      } else {
        await supabase
          .from('user_profiles')
          .insert({
            user_id: session.user.id,
            avatar: imageUrl,
            avatar_blob_id: insertedBlob.id,
            avatar_metadata: { blobId: insertedBlob.id, storage: 'supabase_db' },
          });
      }
    }

    if (oldBlobId && oldBlobId !== insertedBlob.id) {
      await supabase.from('image_blobs').delete().eq('id', oldBlobId);
    }

    return successResponse({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: {
        url: imageUrl,
        blobId: insertedBlob.id,
      },
      url: imageUrl,
      thumbnailUrl: imageUrl,
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return errorResponse('Failed to upload profile image', 'API_ERROR', {}, 500);
  }
}

// DELETE /api/profile/image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'API_ERROR', {}, 401);
    }

    const supabase = createSupabaseAdminClient();
    const isOrganization = isApprovedOrganization(session);
    let oldBlobId: string | null = null;

    if (isOrganization) {
      const { data: orgProfile } = await supabase
        .from('organization_profiles')
        .select('profile_image')
        .eq('account_id', session.user.id)
        .maybeSingle();

      oldBlobId = extractBlobIdFromProfileImage(orgProfile?.profile_image);

      await supabase
        .from('organization_profiles')
        .update({ profile_image: null, updated_at: new Date().toISOString() })
        .eq('account_id', session.user.id);
    } else {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('avatar, avatar_blob_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      oldBlobId =
        (typeof userProfile?.avatar_blob_id === 'string' && userProfile.avatar_blob_id) ||
        extractBlobIdFromUrl(userProfile?.avatar) ||
        null;

      await supabase
        .from('user_profiles')
        .update({ avatar: null, avatar_blob_id: null, avatar_metadata: null, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id);
    }

    if (oldBlobId) {
      await supabase.from('image_blobs').delete().eq('id', oldBlobId);
    }

    return successResponse({
      success: true,
      message: 'Profile image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    return errorResponse('Failed to delete profile image', 'API_ERROR', {}, 500);
  }
}

// GET /api/profile/image
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'API_ERROR', {}, 401);
    }

    const supabase = createSupabaseAdminClient();
    const isOrganization = isApprovedOrganization(session);

    if (isOrganization) {
      const { data: orgProfile } = await supabase
        .from('organization_profiles')
        .select('profile_image')
        .eq('account_id', session.user.id)
        .maybeSingle();

      if (!orgProfile) {
        return errorResponse('User not found', 'API_ERROR', {}, 404);
      }

      const normalized = normalizeOrganizationImage(orgProfile.profile_image);
      if (!normalized.url) {
        return successResponse({ hasImage: false, url: null });
      }

      return successResponse({
        hasImage: true,
        url: normalized.url,
        blobId: normalized.blobId,
        thumbnailUrl: normalized.url,
      });
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('avatar, avatar_blob_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!userProfile) {
      return errorResponse('User not found', 'API_ERROR', {}, 404);
    }

    if (!userProfile.avatar) {
      return successResponse({ hasImage: false, url: null });
    }

    return successResponse({
      hasImage: true,
      url: userProfile.avatar,
      blobId: userProfile.avatar_blob_id || extractBlobIdFromUrl(userProfile.avatar),
      thumbnailUrl: userProfile.avatar,
    });
  } catch (error) {
    console.error('Error fetching profile image:', error);
    return errorResponse('Failed to fetch profile image', 'API_ERROR', {}, 500);
  }
}
