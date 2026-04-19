/**
 * Legacy module kept for compatibility.
 * Blob-image migration logic has been removed after moving to:
 * - Cloudinary for blogs/events/vacancies content images
 * - Supabase Storage for profile images
 */

export async function migrateBlobToCloudinary() {
  throw new Error('Blob migration is deprecated. image_blobs has been removed from active flows.');
}

export async function migrateUserProfileImages() {
  throw new Error('Profile blob migration is deprecated. Use /api/profile/image with Supabase Storage.');
}

export async function migrateBlogImages() {
  throw new Error('Blog blob migration is deprecated. Use Cloudinary URLs for blog media and featured images.');
}

export async function runImageMigration() {
  throw new Error('Image migration utility is deprecated.');
}
