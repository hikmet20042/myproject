import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const vacancyId = params.id;
    const userId = session.user.id;
    
    // Check if vacancy exists
    const { data: vacancy, error: vacancyError } = await supabase
      .from('vacancies')
      .select('id')
      .eq('id', vacancyId)
      .single();
    if (vacancyError || !vacancy) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }
    
    // Find the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, saved_vacancies')
      .eq('id', userId)
      .single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user already saved this vacancy
    const savedVacancies = Array.isArray(user.saved_vacancies) ? user.saved_vacancies : [];
    const hasSaved = savedVacancies.some((id: any) => id.toString() === vacancyId);
    
    let action: 'saved' | 'unsaved';
    
    if (hasSaved) {
      // Unsave the vacancy
      const updated = savedVacancies.filter((id: any) => id.toString() !== vacancyId);
      await supabase.from('users').update({ saved_vacancies: updated }).eq('id', userId);
      action = 'unsaved';
    } else {
      // Save the vacancy
      const updated = [...savedVacancies, vacancyId];
      await supabase.from('users').update({ saved_vacancies: updated }).eq('id', userId);
      action = 'saved';
    }
    
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
    const supabase = createSupabaseAdminClient();
    
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ hasSaved: false, canSave: false });
    }
    
    const vacancyId = params.id;
    const userId = session.user.id;
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('saved_vacancies')
      .eq('id', userId)
      .single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const savedVacancies = Array.isArray(user.saved_vacancies) ? user.saved_vacancies : [];
    const hasSaved = savedVacancies.some((id: any) => id.toString() === vacancyId) || false;
    
    return NextResponse.json({
      hasSaved,
      canSave: true
    });
    
  } catch (error) {
    console.error('Get save status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
