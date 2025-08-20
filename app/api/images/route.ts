import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import ImageBlob from '@/lib/models/ImageBlob'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page
    const mimetype = searchParams.get('mimetype') || undefined;
    
    const skip = (page - 1) * limit;

    // Get user's images (without binary data)
    const images = await ImageBlob.findByUser(
      new mongoose.Types.ObjectId(session.user.id),
      { limit, skip, mimetype }
    );

    // Get total count for pagination
    const query: any = { uploadedBy: new mongoose.Types.ObjectId(session.user.id) };
    if (mimetype) {
      query.mimetype = mimetype;
    }
    const total = await ImageBlob.countDocuments(query);

    // Format response
    const formattedImages = images.map(image => ({
      id: image._id,
      filename: image.filename,
      originalName: image.originalName,
      mimetype: image.mimetype,
      size: image.size,
      width: image.width,
      height: image.height,
      description: image.description,
      alt: image.alt,
      tags: image.tags,
      usageCount: image.usageCount,
      uploadedAt: image.uploadedAt,
      lastAccessed: image.lastAccessed,
      url: `/api/images/${image._id}`
    }));

    return NextResponse.json({
      images: formattedImages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Images list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve images' }, { status: 500 });
  }
}

// Delete image
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('id');

    if (!imageId || !mongoose.Types.ObjectId.isValid(imageId)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    // Find and delete the image (only if owned by user)
    const deletedImage = await ImageBlob.findOneAndDelete({
      _id: imageId,
      uploadedBy: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!deletedImage) {
      return NextResponse.json({ error: 'Image not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Image deleted successfully',
      deletedImage: {
        id: deletedImage._id,
        filename: deletedImage.filename,
        originalName: deletedImage.originalName
      }
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
