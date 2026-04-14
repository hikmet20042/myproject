import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import cloudinaryService from '@/lib/services/cloudinaryService'
import sharp from 'sharp'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

// Blog content images: smaller limit to save bandwidth
const MAX_FILE_SIZE_BLOG = 5 * 1024 * 1024 // 5MB for blog images
const MAX_FILE_SIZE_GENERAL = 10 * 1024 * 1024 // 10MB for other images
const MAX_WIDTH_BLOG = 1200
const MAX_HEIGHT_BLOG = 1200
const MAX_WIDTH_GENERAL = 1920
const MAX_HEIGHT_GENERAL = 1080

async function optimizeImage(buffer: Buffer, mimeType: string, context: string): Promise<{ buffer: Buffer; mimeType: string; compressed: boolean; width?: number; height?: number }> {
  try {
    // Keep GIF as-is to preserve animation
    if (mimeType.toLowerCase() === 'image/gif') {
      const metadata = await sharp(buffer, { failOn: 'none' }).metadata().catch(() => null)
      return {
        buffer,
        mimeType: 'image/gif',
        compressed: false,
        width: metadata?.width,
        height: metadata?.height,
      }
    }

    const isBlog = context === 'blog'
    const maxWidth = isBlog ? MAX_WIDTH_BLOG : MAX_WIDTH_GENERAL
    const maxHeight = isBlog ? MAX_HEIGHT_BLOG : MAX_HEIGHT_GENERAL

    let pipeline = sharp(buffer, { failOn: 'none' }).rotate()
    const metadata = await pipeline.metadata()
    const width = metadata.width
    const height = metadata.height

    if ((width && width > maxWidth) || (height && height > maxHeight)) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    // Blog images: quality 80, general images: quality 82
    const quality = isBlog ? 80 : 82
    const optimized = await pipeline.webp({ quality, effort: 6 }).toBuffer()
    const optimizedMeta = await sharp(optimized, { failOn: 'none' }).metadata().catch(() => null)

    return {
      buffer: optimized,
      mimeType: 'image/webp',
      compressed: optimized.length < buffer.length,
      width: optimizedMeta?.width || width,
      height: optimizedMeta?.height || height,
    }
  } catch (error) {
    console.error('Upload optimization failed, using original image:', error)
    const metadata = await sharp(buffer, { failOn: 'none' }).metadata().catch(() => null)
    return {
      buffer,
      mimeType,
      compressed: false,
      width: metadata?.width,
      height: metadata?.height,
    }
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    }

    // Block organizations from uploading blog content images
    const formData = await request.formData()
    const context = (formData.get('context') as string) || 'general'
    const isBlog = context === 'blog'

    if (isBlog && session.user.accountType === 'organization') {
      return errorResponse('Organization accounts cannot upload blog content images', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
    }

    const file = formData.get('file') as unknown as File | null
    const description = (formData.get('description') as string) || ''
    const alt = (formData.get('alt') as string) || ''
    const tags = (formData.get('tags') as string) || ''

    if (!file) {
      return errorResponse('No file provided', 'API_ERROR', {}, 400)
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      return errorResponse('Invalid file type. Only image files are allowed.', 'API_ERROR', {}, 400)
    }

    const isBlog = context === 'blog'
    const maxFileSize = isBlog ? MAX_FILE_SIZE_BLOG : MAX_FILE_SIZE_GENERAL

    if (file.size > maxFileSize) {
      const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(0)
      return errorResponse(`File is too large. Maximum allowed size is ${sizeMB}MB.`, 'API_ERROR', {}, 400)
    }

    const originalBytes = await file.arrayBuffer()
    const originalBuffer = Buffer.from(originalBytes)
    const optimized = await optimizeImage(originalBuffer, file.type, context)

    // For blog context, use Cloudinary instead of Supabase database
    if (isBlog && cloudinaryService.isConfigured()) {
      try {
        const uploadResult = await cloudinaryService.uploadImage(optimized.buffer, {
          folder: 'blogs',
          transformation: [
            { width: MAX_WIDTH_BLOG, height: MAX_HEIGHT_BLOG, crop: 'limit' },
            { quality: 80 },
            { fetch_format: 'auto' },
          ],
          tags: ['blog', 'content', session.user.id],
        })

        if (uploadResult.success && uploadResult.secureUrl) {
          return successResponse({
            id: uploadResult.publicId,
            filename: file.name,
            originalName: file.name,
            mimetype: uploadResult.format ? `image/${uploadResult.format}` : optimized.mimeType,
            size: uploadResult.bytes || optimized.buffer.length,
            url: uploadResult.secureUrl,
            width: uploadResult.width,
            height: uploadResult.height,
            description: description || undefined,
            alt: alt || undefined,
            tags: ['blog', 'content'],
            uploadedAt: new Date().toISOString(),
            isCompressed: true,
            originalSize: file.size,
            storage: 'cloudinary',
            thumbnailUrl: cloudinaryService.getThumbnailUrl(uploadResult.publicId!, 400),
            metadata: {
              context: 'blog',
              storage: 'cloudinary',
              publicId: uploadResult.publicId,
              optimization: {
                originalSize: file.size,
                optimizedSize: uploadResult.bytes || optimized.buffer.length,
                reducedBytes: Math.max(0, file.size - (uploadResult.bytes || optimized.buffer.length)),
              },
            },
          })
        } else {
          console.error('Cloudinary upload failed:', uploadResult.error)
          // Fall through to Supabase storage as fallback
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError)
        // Fall through to Supabase storage as fallback
      }
    }

    // For non-blog contexts or if Cloudinary fails, use Supabase database
    const supabase = createSupabaseAdminClient()

    const tagArray = tags
      ? tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : []

    const { data: imageBlob, error } = await supabase
      .from('image_blobs')
      .insert({
        filename: file.name,
        original_name: file.name,
        mimetype: optimized.mimeType,
        content_type: optimized.mimeType,
        size: optimized.buffer.length,
        data: optimized.buffer,
        uploaded_by: session.user.id,
        uploaded_at: new Date().toISOString(),
        description: description || undefined,
        alt: alt || undefined,
        tags: tagArray.length > 0 ? tagArray : [],
        width: optimized.width,
        height: optimized.height,
        is_compressed: optimized.compressed,
        original_size: file.size,
        metadata: {
          context,
          storage: 'supabase_db',
          optimization: {
            originalSize: file.size,
            optimizedSize: optimized.buffer.length,
            reducedBytes: Math.max(0, file.size - optimized.buffer.length),
          },
        },
      })
      .select('*')
      .single()

    if (error || !imageBlob) {
      console.error('Image blob save error:', error)
      return errorResponse('Failed to save image', 'API_ERROR', {}, 500)
    }

    const imageUrl = `/api/images/${imageBlob.id}`

    return successResponse({
      id: imageBlob.id,
      filename: imageBlob.filename,
      originalName: imageBlob.original_name,
      mimetype: imageBlob.mimetype || imageBlob.content_type,
      size: imageBlob.size,
      url: imageUrl,
      width: imageBlob.width,
      height: imageBlob.height,
      description: imageBlob.description,
      alt: imageBlob.alt,
      tags: imageBlob.tags,
      uploadedAt: imageBlob.uploaded_at,
      isCompressed: imageBlob.is_compressed,
      originalSize: imageBlob.original_size,
      storage: 'supabase_db',
      thumbnailUrl: imageUrl,
      metadata: imageBlob.metadata,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return errorResponse('Upload failed', 'API_ERROR', {}, 500)
  }
}
