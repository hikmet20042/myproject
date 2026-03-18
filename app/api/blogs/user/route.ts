import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // optional: filter by status
    let query = supabase
      .from('blogs')
      .select('*')
      .eq('author_id', session.user.id)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data: blogs, error } = await query;
    if (error) {
      console.error('GET /api/blogs/user query error:', error);
      return NextResponse.json({ error: 'Failed to fetch user blogs' }, { status: 500 });
    }
    return NextResponse.json({ results: blogs || [] });
  } catch (error) {
    console.error('GET /api/blogs/user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user blogs' }, { status: 500 });
  }
}
