import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import UserProfile from '@/lib/models/UserProfile'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await User.findById(session.user.id).lean();
    if (!user || Array.isArray(user)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const profile = await UserProfile.findOne({ userId: (user as any).userId }).lean();
    return NextResponse.json({
      user: {
        id: (user as any).userId,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified
      },
      profile: profile || null
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
    const { name, bio, location, website, phone, dateOfBirth, gender, occupation, organization, interests, avatar, socialLinks } = body;
    // Update user basic info
    if (name) {
      await User.findByIdAndUpdate(session.user.id, { name });
    }
    // Upsert profile
    await UserProfile.findOneAndUpdate(
      { userId: session.user.id },
      {
        bio,
        location,
        website,
        phone,
        dateOfBirth,
        gender,
        occupation,
        organization,
        interests,
        avatar,
        socialLinks,
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
