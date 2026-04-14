import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Utility functions for handling image storage (both Supabase blobs and Cloudinary)
 */

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
}

/**
 * Extract blob ID from a blob URL
 */
export function extractBlobIdFromUrl(url: string): string | null {
  if (!url || !url.startsWith('/api/images/')) {
    return null;
  }

  const blobId = url.replace('/api/images/', '');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(blobId);
  return isUuid ? blobId : null;
}

/**
 * Convert blob ID to URL
 */
export function blobIdToUrl(blobId: string): string {
  return `/api/images/${blobId}`;
}

/**
 * Process content to extract and convert image references
 * This function scans BlockNote content for images and extracts their URLs
 */
export function processContentImages(content: any): {
  processedContent: any;
  imageReferences: Array<{
    url: string;
    blobId?: string;
    isCloudinary?: boolean;
    alt?: string;
  }>;
} {
  const imageReferences: Array<{ url: string; blobId?: string; isCloudinary?: boolean; alt?: string }> = [];

  if (!content || !Array.isArray(content)) {
    return { processedContent: content, imageReferences };
  }

  const processedContent = content.map((block: any) => {
    if (block.type === 'image' && block.props?.url) {
      const url = block.props.url;
      const alt = block.props.alt || '';
      const blobId = extractBlobIdFromUrl(url);
      const isCloudinary = isCloudinaryUrl(url);

      imageReferences.push({
        url,
        blobId: blobId || undefined,
        isCloudinary,
        alt
      });

      return block; // Return as-is, URLs are already correct
    }

    // Process nested content if it exists
    if (block.content && Array.isArray(block.content)) {
      const nestedResult = processContentImages(block.content);
      imageReferences.push(...nestedResult.imageReferences);
      return {
        ...block,
        content: nestedResult.processedContent
      };
    }

    return block;
  });

  return { processedContent, imageReferences };
}

/**
 * Update media array with blob references
 */
export function updateMediaWithBlobReferences(
  media: Array<{ type: string; url: string; alt?: string; blobId?: string }> = []
): Array<{ type: string; url: string; alt?: string; blobId?: string }> {
  return media.map(item => {
    const blobId = extractBlobIdFromUrl(item.url);
    const isCloudinary = isCloudinaryUrl(item.url);
    return {
      ...item,
      blobId: isCloudinary ? undefined : (blobId || undefined)
    };
  });
}

/**
 * Get featured image blob ID from URL
 */
export function getFeaturedImageBlobId(featuredImageUrl?: string): string | undefined {
  if (!featuredImageUrl) return undefined;

  // Don't try to extract blob ID from Cloudinary URLs
  if (isCloudinaryUrl(featuredImageUrl)) {
    return undefined;
  }

  const blobId = extractBlobIdFromUrl(featuredImageUrl);
  return blobId || undefined;
}

/**
 * Validate that all blob IDs in content exist and belong to the user
 * Skips validation for Cloudinary URLs (they are validated by Cloudinary)
 */
export async function validateContentImages(
  content: any,
  userId: string
): Promise<{
  isValid: boolean;
  invalidImages: string[];
  missingImages: string[];
}> {
  const { imageReferences } = processContentImages(content);
  
  // Only validate Supabase blob images, skip Cloudinary URLs
  const blobIds = imageReferences
    .filter(ref => !ref.isCloudinary && ref.blobId)
    .map(ref => ref.blobId!) as string[];

  if (blobIds.length === 0) {
    return { isValid: true, invalidImages: [], missingImages: [] };
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { data: existingImages, error } = await supabase
      .from('image_blobs')
      .select('id')
      .in('id', blobIds)
      .eq('uploaded_by', userId);

    if (error) {
      throw error;
    }

    const existingIds = (existingImages || []).map(img => img.id);
    const missingImages = blobIds.filter(id => !existingIds.includes(id));

    return {
      isValid: missingImages.length === 0,
      invalidImages: [], // For now, we only check ownership, not validity
      missingImages
    };
  } catch (error) {
    console.error('Error validating content images:', error);
    return {
      isValid: false,
      invalidImages: blobIds,
      missingImages: []
    };
  }
}

/**
 * Clean up unused images
 * This should be called periodically to remove images that are no longer referenced
 */
export async function cleanupUnusedImages(daysOld: number = 30): Promise<number> {
  try {
    const supabase = createSupabaseAdminClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { count } = await supabase
      .from('image_blobs')
      .delete({ count: 'exact' })
      .eq('usage_count', 0)
      .lt('uploaded_at', cutoffDate.toISOString());

    return count || 0;
  } catch (error) {
    console.error('Error cleaning up unused images:', error);
    return 0;
  }
}

/**
 * Get image metadata for display
 */
export async function getImageMetadata(blobId: string): Promise<any | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: image } = await supabase
      .from('image_blobs')
      .select('id, filename, original_name, mimetype, content_type, size, width, height, alt, description, uploaded_at')
      .eq('id', blobId)
      .single();
    return image ? {
      id: image.id,
      filename: image.filename,
      originalName: image.original_name,
      mimetype: image.mimetype || image.content_type,
      size: image.size,
      width: image.width,
      height: image.height,
      alt: image.alt,
      description: image.description,
      uploadedAt: image.uploaded_at,
      url: blobIdToUrl(image.id)
    } : null;
  } catch (error) {
    console.error('Error getting image metadata:', error);
    return null;
  }
}
