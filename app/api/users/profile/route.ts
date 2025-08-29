import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import UserProfile from '@/lib/models/UserProfile'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
  
  const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('Profile GET - No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.user.id);
    
    if (!user || Array.isArray(user)) {
      console.log('Profile GET - User not found or is array');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use the user's _id for profile lookup, not a non-existent userId field
    const profile = await UserProfile.findOne({ userId: user._id });

    return NextResponse.json({
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      },
      profile: profile ? profile.toJSON() : null
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, location, website, phone, dateOfBirth, gender, occupation, organization, interests, avatar, socialLinks, socialMedia } = body;

    // Update user basic info
    if (name) {
      await User.findByIdAndUpdate(session.user.id, { name });
    }

    // Handle avatar - extract blob ID if it's a blob URL
    let avatarBlobId = undefined;
    let avatarPath = avatar;

    if (avatar && avatar.startsWith('/api/images/')) {
      // Extract blob ID from URL
      const blobId = avatar.replace('/api/images/', '');
      if (mongoose.Types.ObjectId.isValid(blobId)) {
        avatarBlobId = new mongoose.Types.ObjectId(blobId);
        avatarPath = undefined; // Clear legacy path when using blob
      }
    }

    // Upsert profile - use the user's _id as userId
    const updateData: any = {
      bio,
      location,
      website,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      occupation,
      organization,
      interests,
      socialLinks: socialLinks,
      socialMedia: socialMedia || {},
    };

    // Only update avatar fields if provided
    if (avatarBlobId) {
      updateData.avatarBlobId = avatarBlobId;
      updateData.avatar = undefined; // Clear legacy field
    } else if (avatarPath) {
      updateData.avatar = avatarPath;
    }

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId: session.user.id },
      updateData,
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
