import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Story from '@/lib/models/Story';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // optional: filter by status
    const query: any = { author: session.user.id };
    if (status) query.status = status;
    const stories = await Story.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ results: stories });
  } catch (error) {
    console.error('GET /api/stories/user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user stories' }, { status: 500 });
  }
}
