import fs from 'fs/promises';
import path from 'path';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Migration utility to convert file-based images to blob storage
 */

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  skippedCount: number;
}

/**
 * Migrate a single file to blob storage
 */
async function migrateFileToBlob(
  filePath: string,
  userId: string,
  description?: string
): Promise<{ success: boolean; blobId?: string; url?: string; error?: string }> {
  try {
    // Check if file exists
    const fullPath = path.join(process.cwd(), 'public', filePath.replace(/^\//, ''));
    
    try {
      await fs.access(fullPath);
    } catch {
      return { success: false, error: `File not found: ${filePath}` };
    }

    // Read file
    const buffer = await fs.readFile(fullPath);
    const stats = await fs.stat(fullPath);
    
    // Determine mimetype from extension
    const ext = path.extname(filePath).toLowerCase();
    let mimetype = 'application/octet-stream';
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimetype = 'image/jpeg';
        break;
      case '.png':
        mimetype = 'image/png';
        break;
      case '.gif':
        mimetype = 'image/gif';
        break;
      case '.webp':
        mimetype = 'image/webp';
        break;
      case '.svg':
        mimetype = 'image/svg+xml';
        break;
    }

    // Create blob
    const filename = `migrated-${Date.now()}-${path.basename(filePath)}`;
    const supabase = createSupabaseAdminClient();
    const { data: imageBlob, error } = await supabase
      .from('image_blobs')
      .insert({
        filename,
        original_name: path.basename(filePath),
        mimetype,
        content_type: mimetype,
        size: buffer.length,
        data: buffer,
        uploaded_by: userId,
        description: description || `Migrated from ${filePath}`,
        usage_count: 1
      })
      .select('id')
      .single();

    if (error || !imageBlob) {
      throw error || new Error('Failed to create image blob');
    }

    return {
      success: true,
      blobId: imageBlob.id,
      url: `/api/images/${imageBlob.id}`
    };

  } catch (error) {
    console.error('Error migrating file to blob:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Migrate user profile avatars
 */
export async function migrateProfileAvatars(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
    skippedCount: 0
  };

  try {
    const supabase = createSupabaseAdminClient();

    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, avatar')
      .not('avatar', 'is', null)
      .neq('avatar', '')
      .is('avatar_blob_id', null);

    if (error) {
      throw error;
    }

    for (const profile of profiles || []) {
      if (!profile.avatar || profile.avatar.startsWith('/api/images/')) {
        result.skippedCount++;
        continue;
      }

      const migration = await migrateFileToBlob(
        profile.avatar,
        profile.user_id,
        'Profile avatar'
      );

      if (migration.success && migration.blobId) {
        // Update profile with blob reference
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            avatar_blob_id: migration.blobId,
            avatar: null
          })
          .eq('id', profile.id);

        if (updateError) {
          throw updateError;
        }
        result.migratedCount++;
      } else {
        result.errors.push(`Profile ${profile.id}: ${migration.error}`);
      }
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Migrate article images - DISABLED (Article model removed, only Blog exists)
 */
export async function migrateArticleImages(): Promise<MigrationResult> {
  // Articles have been replaced by Blogs
  // This function is kept for reference but returns empty result
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
    skippedCount: 0
  };

  return result;
}

/**
 * Migrate blog images
 */
export async function migrateBlogImages(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
    skippedCount: 0
  };

  try {
    const supabase = createSupabaseAdminClient();

    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('id, title, featured_image, author_id')
      .not('featured_image', 'is', null)
      .neq('featured_image', '')
      .is('featured_image_blob_id', null);

    if (error) {
      throw error;
    }

    for (const blog of blogs || []) {
      if (!blog.featured_image || blog.featured_image.startsWith('/api/images/')) {
        result.skippedCount++;
        continue;
      }

      const userId = blog.author_id;
      if (!userId) {
        result.errors.push(`Blog ${blog.id}: No author ID found`);
        continue;
      }

      const migration = await migrateFileToBlob(
        blog.featured_image,
        userId,
        `Featured image for blog: ${blog.title}`
      );

      if (migration.success && migration.blobId) {
        // Update blog with blob reference
        const { error: updateError } = await supabase
          .from('blogs')
          .update({
            featured_image_blob_id: migration.blobId,
            featured_image: null
          })
          .eq('id', blog.id);

        if (updateError) {
          throw updateError;
        }
        result.migratedCount++;
      } else {
        result.errors.push(`Blog ${blog.id}: ${migration.error}`);
      }
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Run complete migration
 */
export async function runCompleteMigration(): Promise<{
  profiles: MigrationResult;
  articles: MigrationResult;
  blogs: MigrationResult;
  summary: {
    totalMigrated: number;
    totalErrors: number;
    totalSkipped: number;
  };
}> {
  console.log('Starting image migration to blob storage...');

  const profiles = await migrateProfileAvatars();
  console.log(`Profile avatars: ${profiles.migratedCount} migrated, ${profiles.skippedCount} skipped, ${profiles.errors.length} errors`);

  const articles = await migrateArticleImages();
  console.log(`Article images: ${articles.migratedCount} migrated, ${articles.skippedCount} skipped, ${articles.errors.length} errors`);

  const blogs = await migrateBlogImages();
  console.log(`Blog images: ${blogs.migratedCount} migrated, ${blogs.skippedCount} skipped, ${blogs.errors.length} errors`);

  const summary = {
    totalMigrated: profiles.migratedCount + articles.migratedCount + blogs.migratedCount,
    totalErrors: profiles.errors.length + articles.errors.length + blogs.errors.length,
    totalSkipped: profiles.skippedCount + articles.skippedCount + blogs.skippedCount
  };

  console.log('Migration complete:', summary);

  return { profiles, articles, blogs, summary };
}
