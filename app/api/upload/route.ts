import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import ImageBlob from '@/lib/models/ImageBlob'
import mongoose from 'mongoose'
import sharp from 'sharp'
import { generateImageVariants, saveImageVariants, getOptimalFormat } from '@/lib/services/imageProcessingService'
import ImgBBService from '@/lib/services/imgbbService'

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
    await dbConnect();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData()
    const file = formData.get('file') as unknown as File | null
    const description = formData.get('description') as string || ''
    const alt = formData.get('alt') as string || ''
    const tags = formData.get('tags') as string || ''
    const context = formData.get('context') as string || 'general' // article, story, profile, etc.

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse tags
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // Determine if we should use ImgBB or blob storage
    const useImgBB = ImgBBService.shouldUseImgBB(context);

    if (useImgBB) {
      // Upload to ImgBB for public images
      try {
        const base64Data = await ImgBBService.fileToBase64(file);
        const uploadResult = await ImgBBService.uploadImage(base64Data, file.name);

        if (!uploadResult.success) {
          return NextResponse.json({ error: uploadResult.error || 'ImgBB upload failed' }, { status: 500 });
        }

        // Get image dimensions for metadata
        const dimensions = await getImageDimensions(buffer, file.type);

        // Save metadata to database (without binary data)
        const imageBlob = new ImageBlob({
          filename: file.name,
          originalName: file.name,
          mimetype: file.type,
          size: file.size,
          data: null, // No binary data for ImgBB images
          uploadedBy: new mongoose.Types.ObjectId(session.user.id),
          uploadedAt: new Date(),
          description: description || undefined,
          alt: alt || undefined,
          tags: tagArray.length > 0 ? tagArray : undefined,
          width: dimensions.width,
          height: dimensions.height,
          isCompressed: false,
          originalSize: file.size,
          metadata: {
            context,
            storage: 'imgbb',
            imgbbUrl: uploadResult.url,
            deleteUrl: uploadResult.deleteUrl
          }
        });

        await imageBlob.save();

        return NextResponse.json({
          id: imageBlob._id,
          filename: imageBlob.filename,
          originalName: imageBlob.originalName,
          mimetype: imageBlob.mimetype,
          size: imageBlob.size,
          url: uploadResult.url, // Direct ImgBB URL
          width: imageBlob.width,
          height: imageBlob.height,
          description: imageBlob.description,
          alt: imageBlob.alt,
          tags: imageBlob.tags,
          uploadedAt: imageBlob.uploadedAt,
          isCompressed: imageBlob.isCompressed,
          originalSize: imageBlob.originalSize,
          storage: 'imgbb',
          metadata: imageBlob.metadata
        });
      } catch (error) {
        console.error('ImgBB upload error:', error);
        return NextResponse.json({ error: 'ImgBB upload failed' }, { status: 500 });
      }
    } else {
      // Use blob storage for private images
      // Get optimal format based on user agent
      const userAgent = request.headers.get('user-agent') || undefined;
      const optimalFormat = getOptimalFormat(userAgent);

      // Generate image variants with optimization
      const variants = await generateImageVariants(buffer, file.type, {
        generateThumbnail: true,
        generateMedium: true,
        optimizeForWeb: true,
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 85,
        format: optimalFormat
      });

      // Save all variants to database
      const savedIds = await saveImageVariants(
        variants,
        file.name,
        new mongoose.Types.ObjectId(session.user.id),
        {
          description: description || undefined,
          alt: alt || undefined,
          tags: tagArray.length > 0 ? tagArray : undefined
        }
      );

      // Update the original image blob with context and storage metadata
      await ImageBlob.findByIdAndUpdate(savedIds.original, {
        $set: {
          'metadata.context': context,
          'metadata.storage': 'blob'
        }
      });

      // Get the main image blob for response
      const imageBlob = await ImageBlob.findById(savedIds.original);

      if (!imageBlob) {
        return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
      }

      // Return metadata without binary data
      return NextResponse.json({
        id: imageBlob._id,
        filename: imageBlob.filename,
        originalName: imageBlob.originalName,
        mimetype: imageBlob.mimetype,
        size: imageBlob.size,
        url: `/api/images/${imageBlob._id}`,
        width: imageBlob.width,
        height: imageBlob.height,
        description: imageBlob.description,
        alt: imageBlob.alt,
        tags: imageBlob.tags,
        uploadedAt: imageBlob.uploadedAt,
        isCompressed: imageBlob.isCompressed,
        originalSize: imageBlob.originalSize,
        storage: 'blob',
        variants: {
          thumbnail: savedIds.thumbnail ? `/api/images/${savedIds.thumbnail}` : undefined,
          medium: savedIds.medium ? `/api/images/${savedIds.medium}` : undefined
        },
        metadata: imageBlob.metadata
      });
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}


