import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Material from '@/lib/models/Material';

// GET: Fetch single material by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const material = await Material.findById(params.id).select('-__v').lean();

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await Material.findByIdAndUpdate(params.id, { $inc: { views: 1 } });

    return NextResponse.json({ material });
  } catch (error: any) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update material (Admin only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Update material
    const material = await Material.findByIdAndUpdate(
      params.id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Material updated successfully',
      material
    });
  } catch (error: any) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      { error: 'Failed to update material', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete material (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const material = await Material.findByIdAndDelete(params.id);

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Material deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { error: 'Failed to delete material', details: error.message },
      { status: 500 }
    );
  }
}
