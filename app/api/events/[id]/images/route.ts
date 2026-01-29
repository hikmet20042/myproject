import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Event from '@/lib/models/Event';
import cloudinaryService from '@/lib/services/cloudinaryService';

export const dynamic = 'force-dynamic';

// POST /api/events/[id]/images - Add images to an existing event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if user is an approved NGO
    if (!session.user.isApprovedNGO) {
      return NextResponse.json(
        { error: 'Only approved NGOs can upload event images' },
        { status: 403 }
      );
    }

    const eventId = params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user owns this event
    if (event.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only upload images to your own events' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('images');
    const imageFiles = files.filter((file): file is File => file instanceof File);

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    const uploadedImages = [];
    const errors = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];

      // Validate file
      const validation = cloudinaryService.validateImageFile(file, 10);
      if (!validation.valid) {
        errors.push(`Image ${i + 1}: ${validation.error}`);
        continue;
      }

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Get current image count for indexing
        const currentImageCount = event.images?.length || 0;

        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadEventImage(
          buffer,
          eventId,
          currentImageCount + i
        );

        if (uploadResult.success && uploadResult.secureUrl && uploadResult.publicId) {
          uploadedImages.push({
            url: uploadResult.secureUrl,
            publicId: uploadResult.publicId,
            alt: event.title || 'Event image',
            isPrimary: currentImageCount === 0 && i === 0, // First image is primary if no images exist
          });
        } else {
          errors.push(`Image ${i + 1}: ${uploadResult.error || 'Upload failed'}`);
        }
      } catch (uploadError: any) {
        console.error(`Error uploading image ${i}:`, uploadError);
        errors.push(`Image ${i + 1}: ${uploadError.message || 'Upload failed'}`);
      }
    }

    // Update event with new images
    if (uploadedImages.length > 0) {
      if (!event.images) {
        event.images = [];
      }
      event.images.push(...uploadedImages);

      // Set imageUrl to first image if not set
      if (!event.imageUrl && uploadedImages.length > 0) {
        event.imageUrl = uploadedImages[0].url;
      }

      await event.save();
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      uploadedImages,
      errors: errors.length > 0 ? errors : undefined,
      event: {
        id: event._id,
        images: event.images,
        imageUrl: event.imageUrl,
      },
    });
  } catch (error) {
    console.error('Error uploading event images:', error);
    return NextResponse.json(
      { error: 'Failed to upload event images' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/images - Delete specific images from an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if user is an approved NGO
    if (!session.user.isApprovedNGO) {
      return NextResponse.json(
        { error: 'Only approved NGOs can manage event images' },
        { status: 403 }
      );
    }

    const eventId = params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user owns this event
    if (event.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete images from your own events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { publicIds } = body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json(
        { error: 'No image public IDs provided' },
        { status: 400 }
      );
    }

    // Delete images from Cloudinary
    const deleteResults = await cloudinaryService.deleteImages(publicIds);

    // Remove images from event
    if (event.images) {
      event.images = event.images.filter(
        (img: any) => !publicIds.includes(img.publicId)
      );

      // Update primary image if needed
      if (event.images.length > 0) {
        // Ensure at least one image is marked as primary
        const hasPrimary = event.images.some((img: any) => img.isPrimary);
        if (!hasPrimary) {
          event.images[0].isPrimary = true;
        }
        event.imageUrl = event.images.find((img: any) => img.isPrimary)?.url || event.images[0].url;
      } else {
        event.imageUrl = undefined;
      }

      await event.save();
    }

    return NextResponse.json({
      success: true,
      message: `${deleteResults.deletedCount} image(s) deleted successfully`,
      deletedCount: deleteResults.deletedCount,
      errors: deleteResults.errors.length > 0 ? deleteResults.errors : undefined,
      event: {
        id: event._id,
        images: event.images,
        imageUrl: event.imageUrl,
      },
    });
  } catch (error) {
    console.error('Error deleting event images:', error);
    return NextResponse.json(
      { error: 'Failed to delete event images' },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[id]/images - Update image properties (e.g., set primary)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if user is an approved NGO
    if (!session.user.isApprovedNGO) {
      return NextResponse.json(
        { error: 'Only approved NGOs can manage event images' },
        { status: 403 }
      );
    }

    const eventId = params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user owns this event
    if (event.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update images for your own events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { publicId, updates } = body;

    if (!publicId || !updates) {
      return NextResponse.json(
        { error: 'Public ID and updates are required' },
        { status: 400 }
      );
    }

    // Update image properties
    if (event.images) {
      const imageIndex = event.images.findIndex((img: any) => img.publicId === publicId);
      
      if (imageIndex === -1) {
        return NextResponse.json(
          { error: 'Image not found in event' },
          { status: 404 }
        );
      }

      // If setting as primary, remove primary flag from other images
      if (updates.isPrimary) {
        event.images.forEach((img: any) => {
          img.isPrimary = false;
        });
      }

      // Update the image
      Object.assign(event.images[imageIndex], updates);

      // Update event imageUrl if primary changed
      if (updates.isPrimary) {
        event.imageUrl = event.images[imageIndex].url;
      }

      await event.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Image updated successfully',
      event: {
        id: event._id,
        images: event.images,
        imageUrl: event.imageUrl,
      },
    });
  } catch (error) {
    console.error('Error updating event image:', error);
    return NextResponse.json(
      { error: 'Failed to update event image' },
      { status: 500 }
    );
  }
}
