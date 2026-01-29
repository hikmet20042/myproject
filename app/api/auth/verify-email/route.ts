import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import NGO from '@/lib/models/NGO'
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
    // Find user or NGO with verification token
    const user = await User.findOne({ verificationToken: token });
    const ngo = await NGO.findOne({ verificationToken: token });
    
    if (!user && !ngo) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }
    
    const account = user || ngo;
    const isNGO = !!ngo;
    
    if (account.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }
    
    // Update account as verified
    account.emailVerified = new Date();
    account.verificationToken = undefined;
    await account.save();
    
    // Create email verification notification (only for users, not NGOs)
    if (!isNGO) {
      await NotificationModel.create({
        userId: account._id,
        type: 'email_verification',
        title: 'E-poçt uğurla təsdiqləndi!',
        message: 'E-poçtunuz təsdiqləndi. İndi hesabınıza daxil ola bilərsiniz.',
        data: { type: 'email_verification' },
      });
    }
    const message = isNGO 
      ? 'E-poçt uğurla təsdiqləndi! QHT qeydiyyatınız indi admin təsdiqi gözləyir.'
      : 'E-poçt uğurla təsdiqləndi! İndi daxil ola bilərsiniz.';
      
    return NextResponse.json({
      message,
      accountType: isNGO ? 'ngo' : 'user'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
