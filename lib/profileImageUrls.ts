import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const PROFILE_BUCKET = process.env.SUPABASE_PROFILE_IMAGES_BUCKET || 'profile-images'
const PROFILE_URL_TTL_SECONDS = 60 * 60 * 24 * 30

const getPathFromObject = (value: any): string | null => {
  if (!value || typeof value !== 'object') return null
  if (typeof value.path === 'string' && value.path.trim().length > 0) return value.path
  if (typeof value.storagePath === 'string' && value.storagePath.trim().length > 0) return value.storagePath
  return null
}

export const getUserAvatarPath = (avatarMetadata: any): string | null => {
  return getPathFromObject(avatarMetadata)
}

export const getOrganizationImagePath = (profileImage: any): string | null => {
  return getPathFromObject(profileImage)
}

export async function resolveProfileImageUrl(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  path: string | null,
  fallbackUrl?: string | null
): Promise<string | null> {
  if (!path) return fallbackUrl || null

  const { data, error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .createSignedUrl(path, PROFILE_URL_TTL_SECONDS)

  if (!error && data?.signedUrl) {
    return data.signedUrl
  }

  const { data: publicData } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path)
  return publicData?.publicUrl || fallbackUrl || null
}
