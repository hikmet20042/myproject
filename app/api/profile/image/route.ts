import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import cloudinaryService from '@/lib/services/cloudinaryService';

export const dynamic = 'force-dynamic';

// POST /api/profile/image - Upload or update profile image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Check if Cloudinary is configured
    if (!cloudinaryService.isConfigured()) {
      return NextResponse.json(
        { error: 'Image upload service is not configured' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as unknown as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = cloudinaryService.validateImageFile(file, 5); // 5MB limit for profile images
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine if user is organization or regular user
    const isOrganization = session.user.organizationStatus === 'approved';
    let userDoc: any;

    if (isOrganization) {
      const { data: profile } = await supabase
        .from('organization_profiles')
        .select('account_id, profile_image')
        .eq('account_id', session.user.id)
        .maybeSingle();

      userDoc = profile;
    } else {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, avatar, avatar_metadata')
        .eq('user_id', session.user.id)
        .single();
      userDoc = profile;
    }

    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete old profile image from Cloudinary if exists
    const existingPublicId = isOrganization
      ? userDoc?.profile_image?.publicId
      : userDoc?.avatar_metadata?.publicId;

    if (existingPublicId) {
      try {
        await cloudinaryService.deleteImage(existingPublicId);
      } catch (deleteError) {
        console.error('Error deleting old profile image:', deleteError);
        // Continue anyway, as we want to upload the new image
      }
    }

    // Upload new profile image to Cloudinary
    const uploadResult = await cloudinaryService.uploadProfileImage(
      buffer,
      session.user.id
    );

    if (!uploadResult.success || !uploadResult.secureUrl || !uploadResult.publicId) {
      return NextResponse.json(
        { error: uploadResult.error || 'Failed to upload profile image' },
        { status: 500 }
      );
    }

    // Update user profile with new image
    if (isOrganization) {
      await supabase
        .from('organization_profiles')
        .update({
          profile_image: {
            url: uploadResult.secureUrl,
            publicId: uploadResult.publicId
          },
          updated_at: new Date().toISOString()
        })
        .eq('account_id', session.user.id);
    } else {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (existingProfile?.id) {
        await supabase
          .from('user_profiles')
          .update({
            avatar: uploadResult.secureUrl,
            avatar_blob_id: null,
            avatar_metadata: { publicId: uploadResult.publicId },
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id);
      } else {
        await supabase
          .from('user_profiles')
          .insert({
            user_id: session.user.id,
            avatar: uploadResult.secureUrl,
            avatar_blob_id: null,
            avatar_metadata: { publicId: uploadResult.publicId }
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: {
        url: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
      },
      url: uploadResult.secureUrl,
      thumbnailUrl: cloudinaryService.getThumbnailUrl(uploadResult.publicId, 200),
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile image' },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/image - Delete profile image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Determine if user is organization or regular user
    const isOrganization = session.user.organizationStatus === 'approved';
    let userDoc: any;

    if (isOrganization) {
      const { data: profile } = await supabase
        .from('organization_profiles')
        .select('account_id, profile_image')
        .eq('account_id', session.user.id)
        .maybeSingle();
      userDoc = profile;
    } else {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, avatar_metadata')
        .eq('user_id', session.user.id)
        .single();
      userDoc = profile;
    }

    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete profile image from Cloudinary if exists
    const existingPublicId = isOrganization
      ? userDoc?.profile_image?.publicId
      : userDoc?.avatar_metadata?.publicId;

    if (existingPublicId) {
      try {
        await cloudinaryService.deleteImage(existingPublicId);
      } catch (deleteError) {
        console.error('Error deleting profile image:', deleteError);
        // Continue anyway to clear the database reference
      }
    }

    // Clear profile image from database
    if (isOrganization) {
      await supabase
        .from('organization_profiles')
        .update({ profile_image: null, updated_at: new Date().toISOString() })
        .eq('account_id', session.user.id);
    } else {
      await supabase
        .from('user_profiles')
        .update({ avatar: null, avatar_metadata: null, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    return NextResponse.json(
      { error: 'Failed to delete profile image' },
      { status: 500 }
    );
  }
}

// GET /api/profile/image - Get current profile image URL
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Determine if user is organization or regular user
    const isOrganization = session.user.organizationStatus === 'approved';
    let userDoc: any;

    if (isOrganization) {
      const { data: profile } = await supabase
        .from('organization_profiles')
        .select('profile_image')
        .eq('account_id', session.user.id)
        .maybeSingle();
      userDoc = profile;
    } else {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('avatar, avatar_metadata')
        .eq('user_id', session.user.id)
        .single();
      userDoc = profile;
    }

    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return profile image info
    const profileImage = isOrganization ? userDoc?.profile_image : {
      url: userDoc?.avatar,
      publicId: userDoc?.avatar_metadata?.publicId
    };

    if (!profileImage?.url) {
      return NextResponse.json({
        hasImage: false,
        url: null,
      });
    }

    return NextResponse.json({
      hasImage: true,
      url: profileImage.url,
      publicId: profileImage.publicId,
      thumbnailUrl: profileImage.publicId 
        ? cloudinaryService.getThumbnailUrl(profileImage.publicId, 200)
        : profileImage.url,
    });
  } catch (error) {
    console.error('Error fetching profile image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile image' },
      { status: 500 }
    );
  }
}
