import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', params.id)
      .single();
    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar')
      .eq('user_id', params.id)
      .single();
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        image: profile?.avatar || null,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
