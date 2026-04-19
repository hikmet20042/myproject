import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  error?: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  transformation?: any[];
  quality?: string | number;
  format?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  public_id?: string;
  overwrite?: boolean;
  eager?: any[];
  tags?: string[];
}

class CloudinaryService {
  /**
   * Upload an image to Cloudinary from a buffer
   */
  async uploadImage(
    buffer: Buffer,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      // Convert buffer to base64
      const base64String = buffer.toString('base64');
      const dataURI = `data:image/jpeg;base64,${base64String}`;

      const uploadOptions: any = {
        folder: options.folder || 'general',
        resource_type: options.resource_type || 'auto',
        quality: options.quality || 'auto:good',
        format: options.format,
        public_id: options.public_id,
        overwrite: options.overwrite !== false,
        tags: options.tags || [],
        ...options.transformation && { transformation: options.transformation },
        ...options.eager && { eager: options.eager },
      };

      const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

      return {
        success: true,
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image to Cloudinary',
      };
    }
  }

  /**
   * Upload profile image with optimizations
   */
  async uploadProfileImage(
    buffer: Buffer,
    userId: string
  ): Promise<CloudinaryUploadResult> {
    return this.uploadImage(buffer, {
      folder: 'profiles',
      public_id: `profile_${userId}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
      eager: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { width: 100, height: 100, crop: 'fill', gravity: 'face' },
      ],
      tags: ['profile', 'user'],
    });
  }

  /**
   * Upload event image with optimizations
   */
  async uploadEventImage(
    buffer: Buffer,
    eventId: string,
    index: number = 0
  ): Promise<CloudinaryUploadResult> {
    return this.uploadImage(buffer, {
      folder: 'events',
      public_id: `event_${eventId}_${index}`,
      overwrite: true,
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
      eager: [
        { width: 600, height: 400, crop: 'fill' },
        { width: 300, height: 200, crop: 'fill' },
      ],
      tags: ['event'],
    });
  }

  /**
   * Upload blog content image with optimizations for modern web standards
   * Max 1200x1200, quality 80, auto format (WebP/AVIF)
   */
  async uploadBlogImage(
    buffer: Buffer,
    filename?: string
  ): Promise<CloudinaryUploadResult> {
    return this.uploadImage(buffer, {
      folder: 'blogs',
      public_id: filename ? `blog_${filename.split('.')[0]}` : undefined,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 80 },
        { fetch_format: 'auto' },
      ],
      tags: ['blog', 'content'],
    });
  }

  /**
   * Upload material image with optimizations
   */
  async uploadMaterialImage(
    buffer: Buffer,
    materialId?: string
  ): Promise<CloudinaryUploadResult> {
    return this.uploadImage(buffer, {
      folder: 'materials',
      public_id: materialId ? `material_${materialId}` : undefined,
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
      eager: [
        { width: 400, height: 300, crop: 'fill' },
        { width: 200, height: 150, crop: 'fill' },
      ],
      tags: ['material', 'resource'],
    });
  }

  /**
   * Delete an image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok' || result.result === 'not found') {
        return { success: true };
      }
      
      return {
        success: false,
        error: `Failed to delete image: ${result.result}`,
      };
    } catch (error: any) {
      console.error('Cloudinary delete error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete image from Cloudinary',
      };
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  async deleteImages(publicIds: string[]): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let deletedCount = 0;

    for (const publicId of publicIds) {
      const result = await this.deleteImage(publicId);
      if (result.success) {
        deletedCount++;
      } else {
        errors.push(`Failed to delete ${publicId}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      deletedCount,
      errors,
    };
  }

  /**
   * Generate transformation URL for an existing image
   */
  getTransformedUrl(
    publicId: string,
    transformations: any
  ): string {
    return cloudinary.url(publicId, transformations);
  }

  /**
   * Get optimized URL with responsive transformations
   */
  getResponsiveUrl(
    publicId: string,
    width: number,
    options: any = {}
  ): string {
    return cloudinary.url(publicId, {
      width,
      crop: 'scale',
      quality: 'auto:good',
      fetch_format: 'auto',
      ...options,
    });
  }

  /**
   * Generate thumbnail URL
   */
  getThumbnailUrl(publicId: string, size: number = 200): string {
    return cloudinary.url(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto',
    });
  }

  /**
   * Check if Cloudinary is configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
      };
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSizeMB}MB.`,
      };
    }

    return { valid: true };
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(url: string): string | null {
    try {
      // Match pattern: /upload/v{version}/{folder}/{publicId}.{extension}
      const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
      const match = url.match(regex);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: Array<{ buffer: Buffer; filename?: string }>,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    const uploadPromises = files.map(file =>
      this.uploadImage(file.buffer, {
        ...options,
        public_id: file.filename ? `${options.folder}_${file.filename.split('.')[0]}` : undefined,
      })
    );

    return Promise.all(uploadPromises);
  }
}

const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
