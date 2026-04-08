import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
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

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const MAX_WIDTH = 1920
const MAX_HEIGHT = 1080

async function optimizeImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string; compressed: boolean; width?: number; height?: number }> {
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

    let pipeline = sharp(buffer, { failOn: 'none' }).rotate()
    const metadata = await pipeline.metadata()
    const width = metadata.width
    const height = metadata.height

    if ((width && width > MAX_WIDTH) || (height && height > MAX_HEIGHT)) {
      pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    const optimized = await pipeline.webp({ quality: 82, effort: 5 }).toBuffer()
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
    const supabase = createSupabaseAdminClient()

    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 'API_ERROR', {}, 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as unknown as File | null
    const description = (formData.get('description') as string) || ''
    const alt = (formData.get('alt') as string) || ''
    const tags = (formData.get('tags') as string) || ''
    const context = (formData.get('context') as string) || 'general'

    if (!file) {
      return errorResponse('No file provided', 'API_ERROR', {}, 400)
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      return errorResponse('Invalid file type. Only image files are allowed.', 'API_ERROR', {}, 400)
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse('File is too large. Maximum allowed size is 10MB.', 'API_ERROR', {}, 400)
    }

    const originalBytes = await file.arrayBuffer()
    const originalBuffer = Buffer.from(originalBytes)
    const optimized = await optimizeImage(originalBuffer, file.type)

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
