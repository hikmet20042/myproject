import { getServerSession } from '@/lib/auth/server'
import { applyRateLimit } from '@/lib/rateLimit'
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

function resolveUploadFolder(context: string): string {
  if (context === 'blog') return 'blogs'
  if (context === 'event') return 'events'
  if (context === 'vacancy') return 'vacancies'
  return 'content'
}

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
  const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
    request,
    preset: 'upload',
    endpoint: '/api/upload',
  })

  if (!rateLimitResult.allowed) {
    const response = errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', {}, 429)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }

  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      const response = errorResponse('Unauthorized', 'API_ERROR', {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    // Block organizations from uploading blog content images
    const formData = await request.formData()
    const context = (formData.get('context') as string) || 'general'
    const isBlog = context === 'blog'

    if (isBlog && session.user.accountType === 'organization') {
      const response = errorResponse('Organization accounts cannot upload blog content images', 'FORBIDDEN_ACCOUNT_TYPE', {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const file = formData.get('file') as unknown as File | null
    const description = (formData.get('description') as string) || ''
    const alt = (formData.get('alt') as string) || ''
    const tags = (formData.get('tags') as string) || ''

    if (!file) {
      const response = errorResponse('No file provided', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      const response = errorResponse('Invalid file type. Only image files are allowed.', 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const maxFileSize = isBlog ? MAX_FILE_SIZE_BLOG : MAX_FILE_SIZE_GENERAL

    if (file.size > maxFileSize) {
      const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(0)
      const response = errorResponse(`File is too large. Maximum allowed size is ${sizeMB}MB.`, 'API_ERROR', {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const originalBytes = await file.arrayBuffer()
    const originalBuffer = Buffer.from(originalBytes)
    const optimized = await optimizeImage(originalBuffer, file.type, context)
    const folder = resolveUploadFolder(context)
    const tagArray = tags
      ? tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : []

    if (!cloudinaryService.isConfigured()) {
      const response = errorResponse('Cloudinary is not configured for content uploads', 'API_ERROR', {}, 503)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const uploadResult = await cloudinaryService.uploadImage(optimized.buffer, {
      folder,
      transformation: [
        { width: isBlog ? MAX_WIDTH_BLOG : MAX_WIDTH_GENERAL, height: isBlog ? MAX_HEIGHT_BLOG : MAX_HEIGHT_GENERAL, crop: 'limit' },
        { quality: isBlog ? 80 : 82 },
        { fetch_format: 'auto' },
      ],
      tags: [...tagArray, context, 'content', session.user.id],
    })

    if (!uploadResult.success || !uploadResult.secureUrl || !uploadResult.publicId) {
      console.error('Cloudinary upload failed:', uploadResult.error)
      const response = errorResponse('Failed to save image', 'API_ERROR', {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const successResp = successResponse({
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
      tags: tagArray,
      uploadedAt: new Date().toISOString(),
      isCompressed: true,
      originalSize: file.size,
      storage: 'cloudinary',
      thumbnailUrl: cloudinaryService.getThumbnailUrl(uploadResult.publicId, 400),
      metadata: {
        context,
        storage: 'cloudinary',
        publicId: uploadResult.publicId,
        optimization: {
          originalSize: file.size,
          optimizedSize: uploadResult.bytes || optimized.buffer.length,
          reducedBytes: Math.max(0, file.size - (uploadResult.bytes || optimized.buffer.length)),
        },
      },
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      successResp.headers.set(key, value)
    }
    return successResp
  } catch (error) {
    console.error('Upload error:', error)
    const response = errorResponse('Upload failed', 'API_ERROR', {}, 500)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }
    return response
  }
}
