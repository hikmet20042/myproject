import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import sharp from 'sharp'
import cloudinaryService from '@/lib/services/cloudinaryService'

export const dynamic = 'force-dynamic'

// Helper function to get image dimensions
async function getImageDimensions(buffer: Buffer, mimetype: string): Promise<{ width?: number; height?: number }> {
  try {
    // Use Sharp to get image metadata
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    console.error('Error getting image dimensions with Sharp:', error);
    // Fallback: try to parse basic image headers for common formats
    try {
      if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
        return parseJPEGDimensions(buffer);
      } else if (mimetype === 'image/png') {
        return parsePNGDimensions(buffer);
      }
    } catch (fallbackError) {
      console.error('Fallback dimension parsing failed:', fallbackError);
    }
    return {};
  }
}

// Fallback JPEG dimension parser
function parseJPEGDimensions(buffer: Buffer): { width?: number; height?: number } {
  try {
    // Look for SOF (Start of Frame) markers
    for (let i = 0; i < buffer.length - 8; i++) {
      if (buffer[i] === 0xFF && (buffer[i + 1] === 0xC0 || buffer[i + 1] === 0xC2)) {
        const height = buffer.readUInt16BE(i + 5);
        const width = buffer.readUInt16BE(i + 7);
        return { width, height };
      }
    }
  } catch (error) {
    console.error('Error parsing JPEG dimensions:', error);
  }
  return {};
}

// Fallback PNG dimension parser
function parsePNGDimensions(buffer: Buffer): { width?: number; height?: number } {
  try {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (buffer.length >= 24 &&
        buffer[0] === 0x89 && buffer[1] === 0x50 &&
        buffer[2] === 0x4E && buffer[3] === 0x47) {
      // IHDR chunk starts at byte 12
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
  } catch (error) {
    console.error('Error parsing PNG dimensions:', error);
  }
  return {};
}

// Helper function to compress image if needed
async function compressImageIfNeeded(buffer: Buffer, mimetype: string): Promise<{ buffer: Buffer; isCompressed: boolean; originalSize: number }> {
  const originalSize = buffer.length;
  const maxSize = 5 * 1024 * 1024; // 5MB

  const targetSize = 2 * 1024 * 1024; // Target 2MB for compression

  // If image is already small enough, return as-is
  if (originalSize <= targetSize) {
    return { buffer, isCompressed: false, originalSize };
  }

  try {
    let compressedBuffer: Buffer;
    let quality = 85; // Start with high quality

    // Use Sharp for compression based on image type
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
      compressedBuffer = await sharp(buffer)
        .jpeg({ quality, progressive: true, mozjpeg: true })
        .toBuffer();
    } else if (mimetype === 'image/png') {
      compressedBuffer = await sharp(buffer)
        .png({ quality, progressive: true, compressionLevel: 9 })
        .toBuffer();
    } else if (mimetype === 'image/webp') {
      compressedBuffer = await sharp(buffer)
        .webp({ quality, effort: 6 })
        .toBuffer();
    } else {
      // For other formats, try to convert to JPEG
      compressedBuffer = await sharp(buffer)
        .jpeg({ quality, progressive: true, mozjpeg: true })
        .toBuffer();
    }

    // If still too large, reduce quality further
    while (compressedBuffer.length > maxSize && quality > 20) {
      quality -= 15;

      if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
        compressedBuffer = await sharp(buffer)
          .jpeg({ quality, progressive: true, mozjpeg: true })
          .toBuffer();
      } else if (mimetype === 'image/png') {
        compressedBuffer = await sharp(buffer)
          .png({ quality, progressive: true, compressionLevel: 9 })
          .toBuffer();
      } else if (mimetype === 'image/webp') {
        compressedBuffer = await sharp(buffer)
          .webp({ quality, effort: 6 })
          .toBuffer();
      } else {
        compressedBuffer = await sharp(buffer)
          .jpeg({ quality, progressive: true, mozjpeg: true })
          .toBuffer();
      }
    }

    // If still too large, resize the image
    if (compressedBuffer.length > maxSize) {
      const metadata = await sharp(buffer).metadata();
      const currentWidth = metadata.width || 1920;
      const currentHeight = metadata.height || 1080;

      // Calculate new dimensions (reduce by 20% each iteration)
      let newWidth = Math.floor(currentWidth * 0.8);
      let newHeight = Math.floor(currentHeight * 0.8);

      compressedBuffer = await sharp(buffer)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 75, progressive: true, mozjpeg: true })
        .toBuffer();

      // Continue reducing size if needed
      while (compressedBuffer.length > maxSize && newWidth > 200) {
        newWidth = Math.floor(newWidth * 0.8);
        newHeight = Math.floor(newHeight * 0.8);

        compressedBuffer = await sharp(buffer)
          .resize(newWidth, newHeight, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 60, progressive: true, mozjpeg: true })
          .toBuffer();
      }
    }

    const compressionRatio = ((originalSize - compressedBuffer.length) / originalSize * 100).toFixed(1);
    console.log(`Image compressed: ${originalSize} bytes → ${compressedBuffer.length} bytes (${compressionRatio}% reduction)`);

    return {
      buffer: compressedBuffer,
      isCompressed: true,
      originalSize
    };

  } catch (error) {
    console.error('Error compressing image with Sharp:', error);
    // If compression fails, return original if it's not too large
    if (originalSize <= maxSize) {
      return { buffer, isCompressed: false, originalSize };
    }
    // If original is too large and compression failed, throw error
    throw new Error('Image is too large and compression failed');
  }
}

// Helper function to optimize image for web
async function optimizeImageForWeb(buffer: Buffer, mimetype: string): Promise<{ buffer: Buffer; mimetype: string; optimized: boolean }> {
  try {
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;

    // Maximum dimensions for web images
    const maxWidth = 1920;
    const maxHeight = 1080;

    let sharpInstance = sharp(buffer);
    let optimized = false;
    let outputMimetype = mimetype;

    // Resize if too large
    if (width && height && (width > maxWidth || height > maxHeight)) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
      optimized = true;
    }

    // Convert to WebP for better compression (except for SVG)
    if (mimetype !== 'image/svg+xml' && mimetype !== 'image/webp') {
      sharpInstance = sharpInstance.webp({
        quality: 85,
        effort: 6,
        lossless: false
      });
      outputMimetype = 'image/webp';
      optimized = true;
    } else if (mimetype === 'image/webp') {
      // Re-optimize WebP
      sharpInstance = sharpInstance.webp({
        quality: 85,
        effort: 6,
        lossless: false
      });
      optimized = true;
    }

    // Apply optimization
    if (optimized) {
      const optimizedBuffer = await sharpInstance.toBuffer();
      return {
        buffer: optimizedBuffer,
        mimetype: outputMimetype,
        optimized: true
      };
    }

    return { buffer, mimetype, optimized: false };

  } catch (error) {
    console.error('Error optimizing image:', error);
    return { buffer, mimetype, optimized: false };
  }
}



export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdminClient();

    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Cloudinary is configured
    if (!cloudinaryService.isConfigured()) {
      return NextResponse.json(
        { error: 'Image upload service is not configured' },
        { status: 503 }
      );
    }

    const formData = await request.formData()
    const file = formData.get('file') as unknown as File | null
    const description = formData.get('description') as string || ''
    const alt = formData.get('alt') as string || ''
    const tags = formData.get('tags') as string || ''
    const context = formData.get('context') as string || 'general' // article, story, profile, event, etc.

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const validation = cloudinaryService.validateImageFile(file, 10);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse tags
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // Get image dimensions for metadata
    const dimensions = await getImageDimensions(buffer, file.type);

    // Upload to Cloudinary based on context
    let uploadResult;
    
    switch (context) {
      case 'profile':
        uploadResult = await cloudinaryService.uploadProfileImage(buffer, session.user.id);
        break;
      case 'blog':
      case 'article':
        uploadResult = await cloudinaryService.uploadBlogImage(buffer, file.name);
        break;
      case 'event':
        // For events, we'll use a temporary ID that will be updated later
        uploadResult = await cloudinaryService.uploadImage(buffer, {
          folder: 'events',
          tags: ['event', ...tagArray],
        });
        break;
      case 'material':
        uploadResult = await cloudinaryService.uploadMaterialImage(buffer);
        break;
      default:
        uploadResult = await cloudinaryService.uploadImage(buffer, {
          folder: 'general',
          tags: tagArray,
        });
    }

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Image upload failed' },
        { status: 500 }
      );
    }

    // Save metadata to database
    const { data: imageBlob, error } = await supabase
      .from('image_blobs')
      .insert({
      filename: file.name,
      original_name: file.name,
      mimetype: file.type,
      content_type: file.type,
      size: uploadResult.bytes || file.size,
      data: null, // No binary data for Cloudinary images
      uploaded_by: session.user.id,
      uploaded_at: new Date().toISOString(),
      description: description || undefined,
      alt: alt || undefined,
      tags: tagArray.length > 0 ? tagArray : [],
      width: uploadResult.width || dimensions.width,
      height: uploadResult.height || dimensions.height,
      is_compressed: false,
      original_size: file.size,
      metadata: {
        context,
        storage: 'cloudinary',
        cloudinaryUrl: uploadResult.secureUrl,
        cloudinaryPublicId: uploadResult.publicId,
        format: uploadResult.format,
      }
      })
      .select('*')
      .single();

    if (error || !imageBlob) {
      console.error('Image metadata save error:', error);
      return NextResponse.json({ error: 'Failed to save image metadata' }, { status: 500 });
    }

    // Generate thumbnail URL
    const thumbnailUrl = uploadResult.publicId 
      ? cloudinaryService.getThumbnailUrl(uploadResult.publicId, 300)
      : uploadResult.secureUrl;

    return NextResponse.json({
      id: imageBlob.id,
      filename: imageBlob.filename,
      originalName: imageBlob.original_name,
      mimetype: imageBlob.mimetype || imageBlob.content_type,
      size: imageBlob.size,
      url: uploadResult.secureUrl, // Direct Cloudinary URL
      publicId: uploadResult.publicId,
      width: imageBlob.width,
      height: imageBlob.height,
      description: imageBlob.description,
      alt: imageBlob.alt,
      tags: imageBlob.tags,
      uploadedAt: imageBlob.uploaded_at,
      isCompressed: imageBlob.is_compressed,
      originalSize: imageBlob.original_size,
      storage: 'cloudinary',
      thumbnailUrl,
      metadata: imageBlob.metadata
    });
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}


