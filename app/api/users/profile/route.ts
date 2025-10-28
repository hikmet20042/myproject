import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import UserProfile from '@/lib/models/UserProfile'
import NGO from '@/lib/models/NGO'
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

    console.log('Profile GET - Session user ID:', session.user.id, 'Type:', typeof session.user.id);
    console.log('Profile GET - Session user role:', session.user.role);
    console.log('Profile GET - Is valid ObjectId:', mongoose.Types.ObjectId.isValid(session.user.id));

    // Check if user is NGO - if so, fetch directly from NGO collection
    if (session.user.role === 'ngo') {
      const ngoProfile = await NGO.findById(session.user.id);
      console.log('Profile GET - NGO query result:', ngoProfile ? 'Found' : 'Not found');
      
      if (!ngoProfile) {
        console.log('Profile GET - NGO not found. Searched for ID:', session.user.id);
        return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 });
      }
      
      return NextResponse.json({
        user: {
          id: (ngoProfile._id as mongoose.Types.ObjectId).toString(),
          email: ngoProfile.email,
          name: ngoProfile.organizationName,
          image: null,
          role: 'ngo',
          emailVerified: ngoProfile.emailVerified,
          createdAt: ngoProfile.createdAt
        },
        profile: {
          bio: ngoProfile.description,
          location: ngoProfile.address,
          website: ngoProfile.website,
          phone: ngoProfile.contactPhone,
          organization: ngoProfile.organizationName,
          socialMedia: ngoProfile.socialMedia,
          // Map NGO fields to profile structure
          registrationNumber: ngoProfile.registrationNumber,
          focusAreas: ngoProfile.focusAreas,
          status: ngoProfile.status,
          contactPerson: ngoProfile.contactPerson
        },
        isNGO: true
      });
    }

    // Handle regular users
    const user = await User.findById(session.user.id);
    console.log('Profile GET - User query result:', user ? 'Found' : 'Not found');
    
    if (!user) {
      console.log('Profile GET - User not found. Searched for ID:', session.user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use the user's _id for profile lookup
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
      profile: profile ? profile.toJSON() : null,
      isNGO: false
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
