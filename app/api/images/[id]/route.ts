import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import ImageBlob from '@/lib/models/ImageBlob'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    // Find the image
    const imageBlob = await ImageBlob.getImageWithData(id);
    
    if (!imageBlob) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Increment usage count (async, don't wait)
    ImageBlob.incrementUsage(id).catch(err => 
      console.error('Failed to increment usage count:', err)
    );

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', imageBlob.mimetype);
    headers.set('Content-Length', imageBlob.size.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    headers.set('ETag', `"${imageBlob._id}-${imageBlob.uploadedAt.getTime()}"`);
    
    // Add filename for download
    if (imageBlob.originalName) {
      headers.set('Content-Disposition', `inline; filename="${imageBlob.originalName}"`);
    }

    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    const etag = `"${imageBlob._id}-${imageBlob.uploadedAt.getTime()}"`;
    
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers });
    }

    // Return the image data
    return new NextResponse(new Uint8Array(imageBlob.data as Buffer), {
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
    await dbConnect();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse(null, { status: 400 });
    }

    const imageBlob = await ImageBlob.findById(id).select('-data');
    
    if (!imageBlob) {
      return new NextResponse(null, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', imageBlob.mimetype);
    headers.set('Content-Length', imageBlob.size.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', `"${imageBlob._id}-${imageBlob.uploadedAt.getTime()}"`);
    
    if (imageBlob.originalName) {
      headers.set('Content-Disposition', `inline; filename="${imageBlob.originalName}"`);
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
