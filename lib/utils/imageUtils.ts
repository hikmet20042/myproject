/**
 * Utility functions for handling image URLs after blob storage deprecation.
 */

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
}

/**
 * Extract legacy blob ID from a deprecated blob URL.
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
 * Convert legacy blob ID to URL (deprecated).
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
 * Validate image references in content.
 * Blocks legacy /api/images URLs after migration away from image_blobs.
 */
export async function validateContentImages(
  content: any,
  userId: string
): Promise<{
  isValid: boolean;
  invalidImages: string[];
  missingImages: string[];
}> {
  void userId;
  const { imageReferences } = processContentImages(content);
  const hasLegacyBlobUrl = imageReferences.some((ref) => ref.url.startsWith('/api/images/'));

  if (!hasLegacyBlobUrl) {
    return { isValid: true, invalidImages: [], missingImages: [] };
  }

  const invalidImages = imageReferences
    .filter((ref) => ref.url.startsWith('/api/images/'))
    .map((ref) => ref.url);

  return {
    isValid: false,
    invalidImages,
    missingImages: [],
  };
}

/**
 * Legacy no-op kept for compatibility with old callers.
 */
export async function cleanupUnusedImages(daysOld: number = 30): Promise<number> {
  void daysOld;
  return 0;
}

/**
 * Legacy no-op kept for compatibility with old callers.
 */
export async function getImageMetadata(blobId: string): Promise<any | null> {
  void blobId;
  return null;
}
