import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isApprovedOrganization } from '@/lib/auth/permissions';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { applyRateLimit } from '@/lib/rateLimit';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const PROFILE_BUCKET = process.env.SUPABASE_PROFILE_IMAGES_BUCKET || 'profile-images';
const PROFILE_AVATAR_SIZE = 256;

const sanitizeFileName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const buildStoragePath = (userId: string, originalName: string): string => {
  void originalName;
  const timestamp = Date.now();
  return `profiles/${userId}/${timestamp}.webp`;
};

const extractStoragePathFromOrganizationImage = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    return null;
  }
  if (typeof value === 'object') {
    if (typeof value.path === 'string') return value.path;
    if (typeof value.storagePath === 'string') return value.storagePath;
  }
  return null;
};

const extractStoragePathFromUserMetadata = (value: any): string | null => {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.path === 'string') return value.path;
  if (typeof value.storagePath === 'string') return value.storagePath;
  return null;
};

const getSignedUrl = async (supabase: ReturnType<typeof createSupabaseAdminClient>, path: string): Promise<string | null> => {
  const { data, error } = await supabase.storage.from(PROFILE_BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) {
    const { data: publicData } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path);
    return publicData?.publicUrl || null;
  }
  return data.signedUrl;
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
    void mimeType;

    // Always normalize avatars to a lightweight square for consistent small UI rendering.
    const optimized = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize(PROFILE_AVATAR_SIZE, PROFILE_AVATAR_SIZE, {
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: false,
      })
      .webp({ quality: 72, effort: 6 })
      .toBuffer();

    return {
      buffer: optimized,
      mimeType: 'image/webp',
    };
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw new Error('Profile image optimization failed');
  }
};

// POST /api/profile/image
export async function POST(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/profile/image',
    })

    const session = await getServerSession();
    if (!session?.user?.id) {
      const response = errorResponse('Autentifikasiya tələb olunur', 'API_ERROR', {}, 401);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {}, 429);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const supabase = createSupabaseAdminClient();
    const formData = await request.formData();
    const file = formData.get('file') as unknown as File | null;

    if (!file) {
      const response = errorResponse('Fayl təqdim edilməyib', 'API_ERROR', {}, 400);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const validationError = validateImage(file);
    if (validationError) {
      const response = errorResponse(validationError, 'API_ERROR', {}, 400);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);
    const optimizedImage = await optimizeProfileImage(originalBuffer, file.type);
    const buffer = optimizedImage.buffer;
    const isOrganization = isApprovedOrganization(session);
    const storagePath = buildStoragePath(session.user.id, file.name || 'profile.webp');

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: optimizedImage.mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      const response = errorResponse('Profil şəkli yüklənə bilmədi', 'API_ERROR', {}, 500);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const imageUrl = await getSignedUrl(supabase, storagePath);
    if (!imageUrl) {
      const response = errorResponse('Profil şəkli URL-i yaradıla bilmədi', 'API_ERROR', {}, 500);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    let oldStoragePath: string | null = null;

    if (isOrganization) {
      const { data: orgProfile } = await supabase
        .from('organization_profiles')
        .select('profile_image')
        .eq('account_id', session.user.id)
        .maybeSingle();

      oldStoragePath = extractStoragePathFromOrganizationImage(orgProfile?.profile_image);

      await supabase
        .from('organization_profiles')
        .update({
          profile_image: {
            url: imageUrl,
            path: storagePath,
            bucket: PROFILE_BUCKET,
            storage: 'supabase_storage',
          },
          updated_at: new Date().toISOString(),
        })
        .eq('account_id', session.user.id);
    } else {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, avatar_metadata')
        .eq('user_id', session.user.id)
        .maybeSingle();

      oldStoragePath = extractStoragePathFromUserMetadata(userProfile?.avatar_metadata);

      if (userProfile?.id) {
        await supabase
          .from('user_profiles')
          .update({
            avatar: imageUrl,
            avatar_metadata: { path: storagePath, bucket: PROFILE_BUCKET, storage: 'supabase_storage' },
            updated_at: new Date().toISOString(),
          })
          .eq('id', userProfile.id);
      } else {
        await supabase
          .from('user_profiles')
          .insert({
            user_id: session.user.id,
            avatar: imageUrl,
            avatar_metadata: { path: storagePath, bucket: PROFILE_BUCKET, storage: 'supabase_storage' },
          });
      }
    }

    if (oldStoragePath && oldStoragePath !== storagePath) {
      await supabase.storage.from(PROFILE_BUCKET).remove([oldStoragePath]);
    }

    const response = successResponse({
      success: true,
      message: 'Profil şəkli uğurla yeniləndi',
      profileImage: {
        url: imageUrl,
        path: storagePath,
        storage: 'supabase_storage',
      },
      url: imageUrl,
      thumbnailUrl: imageUrl,
    });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    const response = errorResponse('Profil şəkli yüklənə bilmədi', 'API_ERROR', {}, 500);
    return response;
  }
}

// DELETE /api/profile/image
export async function DELETE(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/profile/image',
    })

    const session = await getServerSession();
    if (!session?.user?.id) {
      const response = errorResponse('Autentifikasiya tələb olunur', 'API_ERROR', {}, 401);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {}, 429);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const supabase = createSupabaseAdminClient();
    const isOrganization = isApprovedOrganization(session);
    let oldStoragePath: string | null = null;

    if (isOrganization) {
      const { data: orgProfile } = await supabase
        .from('organization_profiles')
        .select('profile_image')
        .eq('account_id', session.user.id)
        .maybeSingle();

      oldStoragePath = extractStoragePathFromOrganizationImage(orgProfile?.profile_image);

      await supabase
        .from('organization_profiles')
        .update({ profile_image: null, updated_at: new Date().toISOString() })
        .eq('account_id', session.user.id);
    } else {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('avatar_metadata')
        .eq('user_id', session.user.id)
        .maybeSingle();

      oldStoragePath = extractStoragePathFromUserMetadata(userProfile?.avatar_metadata);

      await supabase
        .from('user_profiles')
        .update({ avatar: null, avatar_metadata: null, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id);
    }

    if (oldStoragePath) {
      await supabase.storage.from(PROFILE_BUCKET).remove([oldStoragePath]);
    }

    const response = successResponse({
      success: true,
      message: 'Profil şəkli uğurla silindi',
    });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    console.error('Error deleting profile image:', error);
    const response = errorResponse('Profil şəkli silinə bilmədi', 'API_ERROR', {}, 500);
    return response;
  }
}

// GET /api/profile/image
export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'authenticatedRead',
      endpoint: '/api/profile/image',
    })

    const session = await getServerSession();
    if (!session?.user?.id) {
      const response = errorResponse('Autentifikasiya tələb olunur', 'API_ERROR', {}, 401);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMITED', {}, 429);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
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
        const response = errorResponse('İstifadəçi tapılmadı', 'API_ERROR', {}, 404);
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      }

      const storagePath = extractStoragePathFromOrganizationImage(orgProfile.profile_image);
      const currentUrl = typeof (orgProfile.profile_image as any)?.url === 'string'
        ? (orgProfile.profile_image as any).url
        : null;

      if (!storagePath && !currentUrl) {
        const response = successResponse({ hasImage: false, url: null });
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      }

      const signedUrl = storagePath ? await getSignedUrl(supabase, storagePath) : currentUrl;

      const response = successResponse({
        hasImage: true,
        url: signedUrl,
        path: storagePath,
        thumbnailUrl: signedUrl,
      });
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('avatar, avatar_metadata')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!userProfile) {
      const response = errorResponse('İstifadəçi tapılmadı', 'API_ERROR', {}, 404);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const storagePath = extractStoragePathFromUserMetadata(userProfile.avatar_metadata);

    if (!userProfile.avatar && !storagePath) {
      const response = successResponse({ hasImage: false, url: null });
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const signedUrl = storagePath ? await getSignedUrl(supabase, storagePath) : userProfile.avatar;

    const response = successResponse({
      hasImage: true,
      url: signedUrl,
      path: storagePath,
      thumbnailUrl: signedUrl,
    });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    console.error('Error fetching profile image:', error);
    const response = errorResponse('Profil şəkli yüklənə bilmədi', 'API_ERROR', {}, 500);
    return response;
  }
}
