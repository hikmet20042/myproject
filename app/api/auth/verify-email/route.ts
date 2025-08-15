import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import NotificationModel from '@/lib/models/Notification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }
    // Find user with verification token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }
    // Update user as verified
    user.emailVerified = new Date();
    user.verificationToken = undefined;
    await user.save();
    // Create email verification notification
    await NotificationModel.create({
      userId: user._id,
      type: 'email_verification',
      title: 'Email Verified Successfully!',
      message: 'Your email has been verified. You can now sign in to your account.',
      data: { type: 'email_verification' },
    });
    return NextResponse.json({
      message: 'Email verified successfully! You can now sign in.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
