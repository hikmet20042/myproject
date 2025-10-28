import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Blog from '@/lib/models/Blog';

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
    const blogs = await Blog.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ results: blogs });
  } catch (error) {
    console.error('GET /api/blogs/user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user blogs' }, { status: 500 });
  }
}
