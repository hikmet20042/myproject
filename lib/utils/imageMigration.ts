import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import ImageBlob from '@/lib/models/ImageBlob';
import Article from '@/lib/models/Article';
import Story from '@/lib/models/Story';
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
 * Migrate article images
 */
export async function migrateArticleImages(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
    skippedCount: 0
  };

  try {
    // Find articles with legacy featured images
    const articles = await Article.find({
      featuredImage: { $exists: true, $nin: [null, ''] },
      featuredImageBlobId: { $exists: false }
    });

    for (const article of articles) {
      if (!article.featuredImage || article.featuredImage.startsWith('/api/images/')) {
        result.skippedCount++;
        continue;
      }

      const userId = article.userId;
      if (!userId) {
        result.errors.push(`Article ${article._id}: No user ID found`);
        continue;
      }

      const migration = await migrateFileToBlob(
        article.featuredImage,
        new mongoose.Types.ObjectId(userId.toString()),
        `Featured image for article: ${article.title}`
      );

      if (migration.success && migration.blobId) {
        // Update article with blob reference
        await Article.findByIdAndUpdate(article._id, {
          featuredImageBlobId: new mongoose.Types.ObjectId(migration.blobId),
          featuredImage: undefined // Clear legacy field
        });
        result.migratedCount++;
      } else {
        result.errors.push(`Article ${article._id}: ${migration.error}`);
      }
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Migrate story images
 */
export async function migrateStoryImages(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
    skippedCount: 0
  };

  try {
    // Find stories with legacy featured images
    const stories = await Story.find({
      featuredImage: { $exists: true, $nin: [null, ''] },
      featuredImageBlobId: { $exists: false }
    });

    for (const story of stories) {
      if (!story.featuredImage || story.featuredImage.startsWith('/api/images/')) {
        result.skippedCount++;
        continue;
      }

      const userId = story.author;
      if (!userId) {
        result.errors.push(`Story ${story._id}: No author ID found`);
        continue;
      }

      const migration = await migrateFileToBlob(
        story.featuredImage,
        new mongoose.Types.ObjectId(userId.toString()),
        `Featured image for story: ${story.title}`
      );

      if (migration.success && migration.blobId) {
        // Update story with blob reference
        await Story.findByIdAndUpdate(story._id, {
          featuredImageBlobId: new mongoose.Types.ObjectId(migration.blobId),
          featuredImage: undefined // Clear legacy field
        });
        result.migratedCount++;
      } else {
        result.errors.push(`Story ${story._id}: ${migration.error}`);
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
  stories: MigrationResult;
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

  const stories = await migrateStoryImages();
  console.log(`Story images: ${stories.migratedCount} migrated, ${stories.skippedCount} skipped, ${stories.errors.length} errors`);

  const summary = {
    totalMigrated: profiles.migratedCount + articles.migratedCount + stories.migratedCount,
    totalErrors: profiles.errors.length + articles.errors.length + stories.errors.length,
    totalSkipped: profiles.skippedCount + articles.skippedCount + stories.skippedCount
  };

  console.log('Migration complete:', summary);

  return { profiles, articles, stories, summary };
}
