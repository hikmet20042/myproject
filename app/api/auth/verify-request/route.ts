import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/lib/models/User';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }
    // Enforce 1 hour cooldown for verification email
    const now = new Date();
    if (user.verificationEmailLastSent && now.getTime() - new Date(user.verificationEmailLastSent).getTime() < 60 * 60 * 1000) {
      const minutes = Math.ceil((60 * 60 * 1000 - (now.getTime() - new Date(user.verificationEmailLastSent).getTime())) / (60 * 1000));
      return NextResponse.json({ error: `You can request a new verification email in ${minutes} minute(s).` }, { status: 429 });
    }
    // Generate new verification token
    const verificationToken = Math.random().toString(36).substring(2, 15);
    user.verificationToken = verificationToken;
    user.verificationEmailLastSent = now;
    await user.save();
    // Send verification email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
    const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'E-poçt ünvanınızı təsdiqləyin - icma360',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">icma360-a xoş gəlmisiniz!</h2>
          <p>Salam ${user.name || user.email},</p>
          <p>Qeydiyyatdan keçdiyiniz üçün təşəkkür edirik. E-poçt ünvanınızı təsdiqləmək üçün aşağıdakı düyməni klikləyin:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">E-poçtu Təsdiqlə</a>
          </div>
          <p>Düymə işləmirsə, bu linki brauzeriziə kopyalayıb yapışdıra bilərsiniz:</p>
          <p style="word-break: break-all; color: #007bff;">${verifyUrl}</p>
          <p>Bu təsdiqləmə linki 24 saat ərzində etibarsız olacaq.</p>
          <p>Bu hesabı siz yaratmamısınızsa, bu e-poçtu nəzərə almayın.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            Bu e-poçt icma360 tərəfindən göndərilib<br>
            Sualınız varsa, bizimlə əlaqə saxlayın: support@icma360.az
          </p>
        </div>
      `
    });
    return NextResponse.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}
