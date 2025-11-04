import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/lib/models/User';
import NGO from '@/lib/models/NGO';
import cloudinaryService from '@/lib/services/cloudinaryService';

export const dynamic = 'force-dynamic';

// POST /api/profile/image - Upload or update profile image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

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

    // Determine if user is NGO or regular user
    const isNGO = session.user.isApprovedNGO;
    let userModel: any;
    let userDoc: any;

    if (isNGO) {
      userDoc = await NGO.findOne({ email: session.user.email });
      userModel = NGO;
    } else {
      userDoc = await User.findById(session.user.id);
      userModel = User;
    }

    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete old profile image from Cloudinary if exists
    if (userDoc.profileImage?.publicId) {
      try {
        await cloudinaryService.deleteImage(userDoc.profileImage.publicId);
      } catch (deleteError) {
        console.error('Error deleting old profile image:', deleteError);
        // Continue anyway, as we want to upload the new image
      }
    }

    // Upload new profile image to Cloudinary
    const uploadResult = await cloudinaryService.uploadProfileImage(
      buffer,
      isNGO ? userDoc._id.toString() : session.user.id
    );

    if (!uploadResult.success || !uploadResult.secureUrl || !uploadResult.publicId) {
      return NextResponse.json(
        { error: uploadResult.error || 'Failed to upload profile image' },
        { status: 500 }
      );
    }

    // Update user profile with new image
    const updateData = {
      profileImage: {
        url: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
      },
      // Also update the legacy 'image' field for backward compatibility
      image: uploadResult.secureUrl,
    };

    const updatedUser = await userModel.findByIdAndUpdate(
      userDoc._id,
      { $set: updateData },
      { new: true }
    ).select('profileImage image organizationName name email');

    return NextResponse.json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: updatedUser.profileImage,
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Determine if user is NGO or regular user
    const isNGO = session.user.isApprovedNGO;
    let userModel: any;
    let userDoc: any;

    if (isNGO) {
      userDoc = await NGO.findOne({ email: session.user.email });
      userModel = NGO;
    } else {
      userDoc = await User.findById(session.user.id);
      userModel = User;
    }

    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete profile image from Cloudinary if exists
    if (userDoc.profileImage?.publicId) {
      try {
        await cloudinaryService.deleteImage(userDoc.profileImage.publicId);
      } catch (deleteError) {
        console.error('Error deleting profile image:', deleteError);
        // Continue anyway to clear the database reference
      }
    }

    // Clear profile image from database
    const updateData = {
      profileImage: undefined,
      image: undefined,
    };

    await userModel.findByIdAndUpdate(
      userDoc._id,
      { $unset: { profileImage: '', image: '' } }
    );

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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Determine if user is NGO or regular user
    const isNGO = session.user.isApprovedNGO;
    let userDoc: any;

    if (isNGO) {
      userDoc = await NGO.findOne({ email: session.user.email }).select('profileImage image');
    } else {
      userDoc = await User.findById(session.user.id).select('profileImage image');
    }

    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return profile image info
    const profileImage = userDoc.profileImage;
    
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
