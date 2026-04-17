import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import cloudinaryService from '@/lib/services/cloudinaryService';
import { canCreateEvent, isAdminOrOwner } from '@/lib/auth/permissions';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { resolveEntityBySlugOrId } from '@/lib/identifier';

export const dynamic = 'force-dynamic';

// POST /api/events/[slug]/images - Add images to an existing event
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401);
    }

    const supabase = createSupabaseAdminClient();

    // Only approved organizations can manage event images
    if (!canCreateEvent(session)) {
      return errorResponse('Only approved organizations can upload event images', 'FORBIDDEN', {}, 403);
    }

    const eventIdentifier = params.slug;
    const { data: resolvedEvent, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'events',
      eventIdentifier,
      'id'
    )

    if (resolveError || !resolvedEvent?.id) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404);
    }

    const eventId = String(resolvedEvent.id)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, images, image_url, created_by, created_by_organization')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404);
    }

    if (!isAdminOrOwner(session, event)) {
      return errorResponse('You can only upload images to your own events', 'FORBIDDEN', {}, 403);
    }

    const formData = await request.formData();
    const files = formData.getAll('images');
    const imageFiles = files.filter((file): file is File => file instanceof File);

    if (imageFiles.length === 0) {
      return errorResponse('No images provided', 'VALIDATION_ERROR', {}, 400);
    }

    const uploadedImages: any[] = [];
    const errors = [];

    const existingImages = Array.isArray(event.images) ? event.images : [];

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
        const currentImageCount = existingImages.length || 0;

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
    let updatedImages = existingImages;
    let updatedImageUrl = event.image_url;

    if (uploadedImages.length > 0) {
      updatedImages = [...existingImages, ...uploadedImages];
      if (!updatedImageUrl && uploadedImages.length > 0) {
        updatedImageUrl = uploadedImages[0].url;
      }

      await supabase
        .from('events')
        .update({ images: updatedImages, image_url: updatedImageUrl, updated_at: new Date().toISOString() })
        .eq('id', eventId);
    }

    return successResponse({
      uploadedImages,
      errors: errors.length > 0 ? errors : undefined,
      event: {
        id: event.id,
        images: updatedImages,
        imageUrl: updatedImageUrl,
      },
    }, { message: `${uploadedImages.length} image(s) uploaded successfully` });
  } catch (error) {
    console.error('Error uploading event images:', error);
    return errorResponse('Failed to upload event images', 'UPLOAD_EVENT_IMAGES_FAILED', {}, 500);
  }
}

// DELETE /api/events/[slug]/images - Delete specific images from an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401);
    }

    const supabase = createSupabaseAdminClient();

    // Only approved organizations can manage event images
    if (!canCreateEvent(session)) {
      return errorResponse('Only approved organizations can manage event images', 'FORBIDDEN', {}, 403);
    }

    const eventIdentifier = params.slug;
    const { data: resolvedEvent, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'events',
      eventIdentifier,
      'id'
    )

    if (resolveError || !resolvedEvent?.id) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404);
    }

    const eventId = String(resolvedEvent.id)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, images, image_url, created_by, created_by_organization')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404);
    }

    if (!isAdminOrOwner(session, event)) {
      return errorResponse('You can only delete images from your own events', 'FORBIDDEN', {}, 403);
    }

    const body = await request.json();
    const { publicIds } = body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return errorResponse('No image public IDs provided', 'VALIDATION_ERROR', {}, 400);
    }

    // Delete images from Cloudinary
    const deleteResults = await cloudinaryService.deleteImages(publicIds);

    // Remove images from event
    let updatedImages = Array.isArray(event.images) ? event.images : [];
    updatedImages = updatedImages.filter((img: any) => !publicIds.includes(img.publicId));

    let updatedImageUrl = event.image_url;
    if (updatedImages.length > 0) {
      const hasPrimary = updatedImages.some((img: any) => img.isPrimary);
      if (!hasPrimary) {
        updatedImages[0].isPrimary = true;
      }
      updatedImageUrl = updatedImages.find((img: any) => img.isPrimary)?.url || updatedImages[0].url;
    } else {
      updatedImageUrl = null;
    }

    await supabase
      .from('events')
      .update({ images: updatedImages, image_url: updatedImageUrl, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    return successResponse({
      deletedCount: deleteResults.deletedCount,
      errors: deleteResults.errors.length > 0 ? deleteResults.errors : undefined,
      event: {
        id: event.id,
        images: updatedImages,
        imageUrl: updatedImageUrl,
      },
    }, { message: `${deleteResults.deletedCount} image(s) deleted successfully` });
  } catch (error) {
    console.error('Error deleting event images:', error);
    return errorResponse('Failed to delete event images', 'DELETE_EVENT_IMAGES_FAILED', {}, 500);
  }
}

// PATCH /api/events/[slug]/images - Update image properties (e.g., set primary)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return errorResponse('Authentication required', 'AUTH_REQUIRED', {}, 401);
    }

    const supabase = createSupabaseAdminClient();

    // Only approved organizations can manage event images
    if (!canCreateEvent(session)) {
      return errorResponse('Only approved organizations can manage event images', 'FORBIDDEN', {}, 403);
    }

    const eventIdentifier = params.slug;
    const { data: resolvedEvent, error: resolveError } = await resolveEntityBySlugOrId(
      supabase,
      'events',
      eventIdentifier,
      'id'
    )

    if (resolveError || !resolvedEvent?.id) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404);
    }

    const eventId = String(resolvedEvent.id)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, images, image_url, created_by, created_by_organization')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return errorResponse('Event not found', 'EVENT_NOT_FOUND', {}, 404);
    }

    if (!isAdminOrOwner(session, event)) {
      return errorResponse('You can only update images for your own events', 'FORBIDDEN', {}, 403);
    }

    const body = await request.json();
    const { publicId, updates } = body;

    if (!publicId || !updates) {
      return errorResponse('Public ID and updates are required', 'VALIDATION_ERROR', {}, 400);
    }

    // Update image properties
    let updatedImages = Array.isArray(event.images) ? event.images : [];
    if (event.images) {
      const imageIndex = updatedImages.findIndex((img: any) => img.publicId === publicId);

      if (imageIndex === -1) {
        return errorResponse('Image not found in event', 'IMAGE_NOT_FOUND', {}, 404);
      }

      // If setting as primary, remove primary flag from other images
      if (updates.isPrimary) {
        updatedImages.forEach((img: any) => {
          img.isPrimary = false;
        });
      }

      // Update the image
      Object.assign(updatedImages[imageIndex], updates);

      // Update event imageUrl if primary changed
      let updatedImageUrl = event.image_url;
      if (updates.isPrimary) {
        updatedImageUrl = updatedImages[imageIndex].url;
      }

      await supabase
        .from('events')
        .update({ images: updatedImages, image_url: updatedImageUrl, updated_at: new Date().toISOString() })
        .eq('id', eventId);
    }

    return successResponse({
      event: {
        id: event.id,
        images: updatedImages,
        imageUrl: updatedImages.find((img: any) => img.isPrimary)?.url || event.image_url,
      },
    }, { message: 'Image updated successfully' });
  } catch (error) {
    console.error('Error updating event image:', error);
    return errorResponse('Failed to update event image', 'UPDATE_EVENT_IMAGE_FAILED', {}, 500);
  }
}
