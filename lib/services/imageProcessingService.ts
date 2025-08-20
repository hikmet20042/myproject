import sharp from 'sharp';
import ImageBlob from '@/lib/models/ImageBlob';
import mongoose from 'mongoose';

/**
 * Image Processing Service
 * Handles advanced image processing, optimization, and variant generation
 */

export interface ImageProcessingOptions {
  generateThumbnail?: boolean;
  generateMedium?: boolean;
  optimizeForWeb?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
}

export interface ProcessedImage {
  buffer: Buffer;
  mimetype: string;
  width?: number;
  height?: number;
  size: number;
  metadata: {
    originalMimetype: string;
    wasOptimized: boolean;
    wasCompressed: boolean;
    wasRotated: boolean;
    processingSteps: string[];
    format?: string;
    space?: string;
    channels?: number;
    depth?: string;
    density?: number;
    hasProfile?: boolean;
    hasAlpha?: boolean;
    isAnimated?: boolean;
    exif?: any;
  };
}

export interface ImageVariants {
  original: ProcessedImage;
  thumbnail?: ProcessedImage;
  medium?: ProcessedImage;
}

/**
 * Process and optimize an image with various options
 */
export async function processImage(
  buffer: Buffer, 
  mimetype: string, 
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    optimizeForWeb = true,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'auto'
  } = options;

  try {
    // Extract full metadata first
    const fullMetadata = await extractImageMetadata(buffer);

    // Auto-rotate based on EXIF orientation
    const { buffer: rotatedBuffer, wasRotated } = await autoRotateImage(buffer);

    // Check if animated
    const isAnimated = await isAnimatedImage(rotatedBuffer, mimetype);

    let sharpInstance = sharp(rotatedBuffer);
    const metadata = await sharpInstance.metadata();
    const processingSteps: string[] = [];
    let outputMimetype = mimetype;
    let wasOptimized = false;
    let wasCompressed = false;

    if (wasRotated) {
      processingSteps.push('auto-rotate');
    }

    // Resize if needed
    if (metadata.width && metadata.height && 
        (metadata.width > maxWidth || metadata.height > maxHeight)) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
      processingSteps.push('resize');
      wasOptimized = true;
    }

    // Format conversion and optimization
    if (optimizeForWeb && mimetype !== 'image/svg+xml') {
      if (format === 'auto') {
        // Choose best format based on image characteristics
        if (mimetype === 'image/png' && metadata.channels === 4) {
          // PNG with transparency - keep as PNG or convert to WebP
          sharpInstance = sharpInstance.webp({ quality, effort: 6, lossless: false });
          outputMimetype = 'image/webp';
        } else {
          // Convert to WebP for better compression
          sharpInstance = sharpInstance.webp({ quality, effort: 6, lossless: false });
          outputMimetype = 'image/webp';
        }
      } else if (format === 'webp') {
        sharpInstance = sharpInstance.webp({ quality, effort: 6, lossless: false });
        outputMimetype = 'image/webp';
      } else if (format === 'jpeg') {
        sharpInstance = sharpInstance.jpeg({ quality, progressive: true, mozjpeg: true });
        outputMimetype = 'image/jpeg';
      } else if (format === 'png') {
        sharpInstance = sharpInstance.png({ quality, progressive: true, compressionLevel: 9 });
        outputMimetype = 'image/png';
      }
      
      if (outputMimetype !== mimetype) {
        processingSteps.push('format-conversion');
        wasOptimized = true;
      }
      
      processingSteps.push('compression');
      wasCompressed = true;
    }

    const processedBuffer = await sharpInstance.toBuffer();
    const finalMetadata = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      mimetype: outputMimetype,
      width: finalMetadata.width,
      height: finalMetadata.height,
      size: processedBuffer.length,
      metadata: {
        originalMimetype: mimetype,
        wasOptimized,
        wasCompressed,
        wasRotated,
        processingSteps,
        format: fullMetadata.format,
        space: fullMetadata.space,
        channels: fullMetadata.channels,
        depth: fullMetadata.depth,
        density: fullMetadata.density,
        hasProfile: fullMetadata.hasProfile,
        hasAlpha: fullMetadata.hasAlpha,
        isAnimated,
        exif: fullMetadata.exif
      }
    };

  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate multiple variants of an image
 */
export async function generateImageVariants(
  buffer: Buffer, 
  mimetype: string,
  options: ImageProcessingOptions = {}
): Promise<ImageVariants> {
  try {
    const variants: ImageVariants = {
      original: await processImage(buffer, mimetype, options)
    };

    // Generate thumbnail (150x150, cropped)
    if (options.generateThumbnail !== false) {
      const thumbnailBuffer = await sharp(buffer)
        .resize(150, 150, { fit: 'cover', position: 'center' })
        .webp({ quality: 80, effort: 6 })
        .toBuffer();

      const thumbnailMetadata = await sharp(thumbnailBuffer).metadata();
      
      variants.thumbnail = {
        buffer: thumbnailBuffer,
        mimetype: 'image/webp',
        width: thumbnailMetadata.width,
        height: thumbnailMetadata.height,
        size: thumbnailBuffer.length,
        metadata: {
          originalMimetype: mimetype,
          wasOptimized: true,
          wasCompressed: true,
          processingSteps: ['resize', 'crop', 'format-conversion', 'compression']
        }
      };
    }

    // Generate medium variant (800px max)
    if (options.generateMedium !== false) {
      const mediumBuffer = await sharp(buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, effort: 6 })
        .toBuffer();

      const mediumMetadata = await sharp(mediumBuffer).metadata();
      
      variants.medium = {
        buffer: mediumBuffer,
        mimetype: 'image/webp',
        width: mediumMetadata.width,
        height: mediumMetadata.height,
        size: mediumBuffer.length,
        metadata: {
          originalMimetype: mimetype,
          wasOptimized: true,
          wasCompressed: true,
          processingSteps: ['resize', 'format-conversion', 'compression']
        }
      };
    }

    return variants;

  } catch (error) {
    console.error('Error generating image variants:', error);
    throw new Error(`Variant generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save image variants to database
 */
export async function saveImageVariants(
  variants: ImageVariants,
  originalFilename: string,
  uploadedBy: mongoose.Types.ObjectId,
  metadata: {
    description?: string;
    alt?: string;
    tags?: string[];
  } = {}
): Promise<{
  original: mongoose.Types.ObjectId;
  thumbnail?: mongoose.Types.ObjectId;
  medium?: mongoose.Types.ObjectId;
}> {
  try {
    const savedIds: any = {};

    // Save original
    const originalBlob = new ImageBlob({
      filename: `${Date.now()}-${Math.random().toString(36).substring(2)}-${originalFilename}`,
      originalName: originalFilename,
      mimetype: variants.original.mimetype,
      size: variants.original.size,
      data: variants.original.buffer,
      uploadedBy,
      description: metadata.description,
      alt: metadata.alt,
      tags: metadata.tags,
      width: variants.original.width,
      height: variants.original.height,
      isCompressed: variants.original.metadata.wasCompressed,
      originalSize: variants.original.metadata.wasOptimized ? undefined : variants.original.size,
      metadata: variants.original.metadata
    });

    await originalBlob.save();
    savedIds.original = originalBlob._id;

    // Save thumbnail if generated
    if (variants.thumbnail) {
      const thumbnailBlob = new ImageBlob({
        filename: `thumb-${Date.now()}-${Math.random().toString(36).substring(2)}-${originalFilename}`,
        originalName: `thumbnail-${originalFilename}`,
        mimetype: variants.thumbnail.mimetype,
        size: variants.thumbnail.size,
        data: variants.thumbnail.buffer,
        uploadedBy,
        description: `Thumbnail of ${metadata.description || originalFilename}`,
        alt: metadata.alt ? `Thumbnail: ${metadata.alt}` : undefined,
        tags: metadata.tags ? [...metadata.tags, 'thumbnail'] : ['thumbnail'],
        width: variants.thumbnail.width,
        height: variants.thumbnail.height,
        isCompressed: true,
        metadata: variants.thumbnail.metadata
      });

      await thumbnailBlob.save();
      savedIds.thumbnail = thumbnailBlob._id;
    }

    // Save medium if generated
    if (variants.medium) {
      const mediumBlob = new ImageBlob({
        filename: `med-${Date.now()}-${Math.random().toString(36).substring(2)}-${originalFilename}`,
        originalName: `medium-${originalFilename}`,
        mimetype: variants.medium.mimetype,
        size: variants.medium.size,
        data: variants.medium.buffer,
        uploadedBy,
        description: `Medium variant of ${metadata.description || originalFilename}`,
        alt: metadata.alt ? `Medium: ${metadata.alt}` : undefined,
        tags: metadata.tags ? [...metadata.tags, 'medium'] : ['medium'],
        width: variants.medium.width,
        height: variants.medium.height,
        isCompressed: true,
        metadata: variants.medium.metadata
      });

      await mediumBlob.save();
      savedIds.medium = mediumBlob._id;
    }

    // Update original with variant references
    if (savedIds.thumbnail || savedIds.medium) {
      await ImageBlob.findByIdAndUpdate(savedIds.original, {
        'metadata.variants': {
          thumbnail: savedIds.thumbnail?.toString(),
          medium: savedIds.medium?.toString()
        }
      });
    }

    return savedIds;

  } catch (error) {
    console.error('Error saving image variants:', error);
    throw new Error(`Failed to save variants: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract EXIF data and image metadata
 */
export async function extractImageMetadata(buffer: Buffer): Promise<{
  width?: number;
  height?: number;
  format?: string;
  space?: string;
  channels?: number;
  depth?: string;
  density?: number;
  hasProfile?: boolean;
  hasAlpha?: boolean;
  orientation?: number;
  exif?: any;
}> {
  try {
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasProfile: metadata.hasProfile,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      exif: metadata.exif ? {
        // Extract common EXIF data
        make: metadata.exif?.Make?.toString(),
        model: metadata.exif?.Model?.toString(),
        dateTime: metadata.exif?.DateTime?.toString(),
        software: metadata.exif?.Software?.toString(),
        orientation: metadata.exif?.Orientation,
        xResolution: metadata.exif?.XResolution,
        yResolution: metadata.exif?.YResolution(),
        resolutionUnit: metadata.exif?.ResolutionUnit,
        // GPS data (if available)
        gps: metadata.exif?.GPSLatitude ? {
          latitude: metadata.exif.GPSLatitude,
          longitude: metadata.exif.GPSLongitude,
          altitude: metadata.exif.GPSAltitude
        } : undefined
      } : undefined
    };
  } catch (error) {
    console.error('Error extracting image metadata:', error);
    return {};
  }
}

/**
 * Auto-rotate image based on EXIF orientation
 */
export async function autoRotateImage(buffer: Buffer): Promise<{ buffer: Buffer; wasRotated: boolean }> {
  try {
    const metadata = await sharp(buffer).metadata();

    if (metadata.orientation && metadata.orientation !== 1) {
      // Apply rotation based on EXIF orientation
      const rotatedBuffer = await sharp(buffer)
        .rotate() // Sharp automatically rotates based on EXIF
        .toBuffer();

      return { buffer: rotatedBuffer, wasRotated: true };
    }

    return { buffer, wasRotated: false };
  } catch (error) {
    console.error('Error auto-rotating image:', error);
    return { buffer, wasRotated: false };
  }
}

/**
 * Remove EXIF data for privacy
 */
export async function stripExifData(buffer: Buffer, mimetype: string): Promise<Buffer> {
  try {
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
      return await sharp(buffer)
        .jpeg({ quality: 95, progressive: true })
        .toBuffer();
    } else if (mimetype === 'image/png') {
      return await sharp(buffer)
        .png({ progressive: true })
        .toBuffer();
    } else if (mimetype === 'image/webp') {
      return await sharp(buffer)
        .webp({ quality: 95 })
        .toBuffer();
    }

    return buffer;
  } catch (error) {
    console.error('Error stripping EXIF data:', error);
    return buffer;
  }
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalFormat(userAgent?: string): 'webp' | 'jpeg' {
  if (!userAgent) return 'webp'; // Default to WebP

  // Check for WebP support (most modern browsers)
  if (userAgent.includes('Chrome/') ||
      userAgent.includes('Firefox/') ||
      userAgent.includes('Edge/') ||
      userAgent.includes('Opera/')) {
    return 'webp';
  }

  return 'jpeg'; // Fallback for older browsers
}

/**
 * Detect if image is animated (GIF, WebP, etc.)
 */
export async function isAnimatedImage(buffer: Buffer, mimetype: string): Promise<boolean> {
  try {
    if (mimetype === 'image/gif') {
      // Check for multiple frames in GIF
      const metadata = await sharp(buffer).metadata();
      return (metadata.pages || 1) > 1;
    }

    if (mimetype === 'image/webp') {
      // WebP can be animated
      const metadata = await sharp(buffer).metadata();
      return (metadata.pages || 1) > 1;
    }

    return false;
  } catch (error) {
    console.error('Error checking if image is animated:', error);
    return false;
  }
}

/**
 * Generate responsive image sizes
 */
export async function generateResponsiveImages(
  buffer: Buffer,
  mimetype: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
): Promise<Array<{ width: number; buffer: Buffer; size: number }>> {
  try {
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 1920;

    // Filter sizes that are smaller than original
    const validSizes = sizes.filter(size => size < originalWidth);

    const responsiveImages = await Promise.all(
      validSizes.map(async (width) => {
        const resizedBuffer = await sharp(buffer)
          .resize(width, undefined, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85, effort: 6 })
          .toBuffer();

        return {
          width,
          buffer: resizedBuffer,
          size: resizedBuffer.length
        };
      })
    );

    return responsiveImages;
  } catch (error) {
    console.error('Error generating responsive images:', error);
    return [];
  }
}
