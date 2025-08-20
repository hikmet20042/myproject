import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Article from '@/lib/models/Article';

export const dynamic = 'force-dynamic';

// Bulk delete operation for drafts
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { draftIds } = body;

    if (!draftIds || !Array.isArray(draftIds)) {
      return NextResponse.json({ error: 'Draft IDs array required' }, { status: 400 });
    }

    const query = { 
      _id: { $in: draftIds }, 
      userId: session.user.id, 
      status: 'draft' 
    };

    const result = await Article.deleteMany(query);
    return NextResponse.json({ 
      message: `${result.deletedCount} drafts deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
