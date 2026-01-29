import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Material from '@/lib/models/Material';

// GET: Fetch all materials (with optional filters)
export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    const query: any = { isPublished: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.featured = true;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch materials
    const materials = await Material.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v')
      .lean();

    const total = await Material.countDocuments(query);

    return NextResponse.json({
      materials,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new material (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const {
      title,
      description,
      category,
      type,
      url,
      imageUrl,
      provider,
      duration,
      language,
      tags,
      featured,
      isPublished,
      order
    } = body;

    // Validate required fields
    if (!title || !description || !category || !type || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, type, url' },
        { status: 400 }
      );
    }

    // Create material
    const material = await Material.create({
      title,
      description,
      category,
      type,
      url,
      imageUrl,
      provider,
      duration,
      language: language || ['English'],
      tags: tags || [],
      featured: featured || false,
      isPublished: isPublished !== undefined ? isPublished : true,
      order: order || 0,
      createdBy: session.user.id
    });

    return NextResponse.json(
      { message: 'Material created successfully', material },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { error: 'Failed to create material', details: error.message },
      { status: 500 }
    );
  }
}
