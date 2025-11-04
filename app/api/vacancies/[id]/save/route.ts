import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import Vacancy from '@/lib/models/Vacancy'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const vacancyId = params.id;
    const userId = session.user.id;
    
    // Check if vacancy exists
    const vacancy = await Vacancy.findById(vacancyId);
    if (!vacancy) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user already saved this vacancy
    if (!user.savedVacancies) user.savedVacancies = [];
    const hasSaved = user.savedVacancies.some((id: any) => id.toString() === vacancyId);
    
    let action: 'saved' | 'unsaved';
    
    if (hasSaved) {
      // Unsave the vacancy
      user.savedVacancies = user.savedVacancies.filter((id: any) => id.toString() !== vacancyId);
      action = 'unsaved';
    } else {
      // Save the vacancy
      user.savedVacancies.push(vacancyId);
      action = 'saved';
    }
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      action,
      hasSaved: !hasSaved
    });
    
  } catch (error) {
    console.error('Save/unsave vacancy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get save status for current user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ hasSaved: false, canSave: false });
    }
    
    const vacancyId = params.id;
    const userId = session.user.id;
    
    const user = await User.findById(userId).select('savedVacancies');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const hasSaved = user.savedVacancies?.some((id: any) => id.toString() === vacancyId) || false;
    
    return NextResponse.json({
      hasSaved,
      canSave: true
    });
    
  } catch (error) {
    console.error('Get save status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
