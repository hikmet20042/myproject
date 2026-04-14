import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

function byteaToBuffer(value: unknown): Buffer | null {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') {
    if (value.startsWith('\\x')) {
      return Buffer.from(value.slice(2), 'hex');
    }
    try {
      return Buffer.from(value, 'base64');
    } catch {
      return null;
    }
  }
  return null;
}

async function isImageReferencedByApprovedContent(supabase: any, imageId: string): Promise<boolean> {
  // Check if image is referenced as featured_image in an approved blog
  const { data: blogCount } = await supabase
    .from('blogs')
    .select('id', { count: 'exact', head: true })
    .eq('featured_image_blob_id', imageId)
    .eq('status', 'approved');
  if (blogCount && blogCount > 0) return true;

  // Check if image is referenced in blog media (JSONB)
  const { data: blogMedia } = await supabase
    .from('blogs')
    .select('media')
    .eq('status', 'approved');
  if (blogMedia) {
    for (const row of blogMedia) {
      if (row.media && Array.isArray(row.media)) {
        if (row.media.some((m: any) => m.blobId === imageId || m.blob_id === imageId)) return true;
      }
    }
  }

  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    const supabase = createSupabaseAdminClient();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    // Find the image
    const { data: imageBlob, error } = await supabase
      .from('image_blobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !imageBlob) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Authorization: allow if the user uploaded it, or if it's referenced by approved content
    const isOwner = session?.user?.id && imageBlob.uploaded_by === session.user.id;
    const isAdminUser = isAdmin(session);
    const isPublic = await isImageReferencedByApprovedContent(supabase, id);

    if (!isOwner && !isAdminUser && !isPublic) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Increment usage count (async, don't wait)
    supabase
      .from('image_blobs')
      .update({
        usage_count: (imageBlob.usage_count || 0) + 1,
        last_accessed: new Date().toISOString()
      })
      .eq('id', id)
      .then(({ error: updateError }) => {
        if (updateError) {
          console.error('Failed to increment usage count:', updateError);
        }
      });

    const imageData = byteaToBuffer(imageBlob.data);
    if (!imageData) {
      const cloudinaryUrl = imageBlob.metadata?.cloudinaryUrl as string | undefined;
      if (cloudinaryUrl) {
        return NextResponse.redirect(cloudinaryUrl, 302);
      }
      return NextResponse.json({ error: 'Image data not available' }, { status: 404 });
    }

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', imageBlob.mimetype || imageBlob.content_type || 'application/octet-stream');
    const contentLength = imageBlob.size || imageData.length;
    headers.set('Content-Length', contentLength.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    headers.set('ETag', `"${imageBlob.id}-${new Date(imageBlob.uploaded_at || imageBlob.created_at).getTime()}"`);
    
    // Add filename for download
    if (imageBlob.original_name) {
      headers.set('Content-Disposition', `inline; filename="${imageBlob.original_name}"`);
    }

    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    const etag = `"${imageBlob.id}-${new Date(imageBlob.uploaded_at || imageBlob.created_at).getTime()}"`;
    
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers });
    }

    // Return the image data
    return new NextResponse(new Uint8Array(imageData), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Image retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve image' }, { status: 500 });
  }
}

// Optional: Add metadata endpoint
export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const supabase = createSupabaseAdminClient();

    const { id } = params;

    if (!id) {
      return new NextResponse(null, { status: 400 });
    }

    const { data: imageBlob, error } = await supabase
      .from('image_blobs')
      .select('id, original_name, mimetype, content_type, size, uploaded_by, uploaded_at, created_at')
      .eq('id', id)
      .single();

    if (error || !imageBlob) {
      return new NextResponse(null, { status: 404 });
    }

    // Same auth check as GET
    const isOwner = session?.user?.id && imageBlob.uploaded_by === session.user.id;
    const isAdminUser = isAdmin(session);
    const isPublic = await isImageReferencedByApprovedContent(supabase, id);

    if (!isOwner && !isAdminUser && !isPublic) {
      return new NextResponse(null, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', imageBlob.mimetype || imageBlob.content_type || 'application/octet-stream');
    headers.set('Content-Length', String(imageBlob.size || 0));
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', `"${imageBlob.id}-${new Date(imageBlob.uploaded_at || imageBlob.created_at).getTime()}"`);
    
    if (imageBlob.original_name) {
      headers.set('Content-Disposition', `inline; filename="${imageBlob.original_name}"`);
    }

    return new NextResponse(null, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Image HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
