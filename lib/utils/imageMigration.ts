import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import ImageBlob from '@/lib/models/ImageBlob';
import Blog from '@/lib/models/Blog';
import UserProfile from '@/lib/models/UserProfile';

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
  userId: mongoose.Types.ObjectId,
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
    const imageBlob = new ImageBlob({
      filename,
      originalName: path.basename(filePath),
      mimetype,
      size: buffer.length,
      data: buffer,
      uploadedBy: userId,
      description: description || `Migrated from ${filePath}`,
      usageCount: 1 // Mark as used since it's being migrated
    });

    await imageBlob.save();

    return {
      success: true,
      blobId: (imageBlob._id as mongoose.Types.ObjectId).toString(),
      url: `/api/images/${imageBlob._id as mongoose.Types.ObjectId}`
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
    // Find profiles with legacy avatar paths
    const profiles = await UserProfile.find({
      avatar: { $exists: true, $nin: [null, ''] },
      avatarBlobId: { $exists: false }
    });

    for (const profile of profiles) {
      if (!profile.avatar || profile.avatar.startsWith('/api/images/')) {
        result.skippedCount++;
        continue;
      }

      const migration = await migrateFileToBlob(
        profile.avatar,
        profile.userId,
        'Profile avatar'
      );

      if (migration.success && migration.blobId) {
        // Update profile with blob reference
        await UserProfile.findByIdAndUpdate(profile._id, {
          avatarBlobId: new mongoose.Types.ObjectId(migration.blobId),
          avatar: undefined // Clear legacy field
        });
        result.migratedCount++;
      } else {
        result.errors.push(`Profile ${profile._id}: ${migration.error}`);
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
    // Find blogs with legacy featured images
    const blogs = await Blog.find({
      featuredImage: { $exists: true, $nin: [null, ''] },
      featuredImageBlobId: { $exists: false }
    });

    for (const blog of blogs) {
      if (!blog.featuredImage || blog.featuredImage.startsWith('/api/images/')) {
        result.skippedCount++;
        continue;
      }

      const userId = blog.author;
      if (!userId) {
        result.errors.push(`Blog ${blog._id}: No author ID found`);
        continue;
      }

      const migration = await migrateFileToBlob(
        blog.featuredImage,
        new mongoose.Types.ObjectId(userId.toString()),
        `Featured image for blog: ${blog.title}`
      );

      if (migration.success && migration.blobId) {
        // Update blog with blob reference
        await Blog.findByIdAndUpdate(blog._id, {
          featuredImageBlobId: new mongoose.Types.ObjectId(migration.blobId),
          featuredImage: undefined // Clear legacy field
        });
        result.migratedCount++;
      } else {
        result.errors.push(`Blog ${blog._id}: ${migration.error}`);
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
