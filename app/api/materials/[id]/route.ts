import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// GET: Fetch single material by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: material, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await supabase
      .from('materials')
      .update({ views: (material.views || 0) + 1 })
      .eq('id', params.id);

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
    const session = await getServerSession();

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const body = await request.json();

    // Update material
    const updateData: any = { ...body };
    if (updateData.imageUrl !== undefined) {
      updateData.image_url = updateData.imageUrl;
      delete updateData.imageUrl;
    }
    if (updateData.isPublished !== undefined) {
      updateData.is_published = updateData.isPublished;
      delete updateData.isPublished;
    }
    if (updateData.order !== undefined) {
      updateData.order = updateData.order;
    }

    const { data: material, error } = await supabase
      .from('materials')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error || !material) {
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
    const session = await getServerSession();

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: material, error } = await supabase
      .from('materials')
      .delete()
      .eq('id', params.id)
      .select('*')
      .single();

    if (error || !material) {
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
