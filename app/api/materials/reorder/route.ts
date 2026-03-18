import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { updates } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    // Validate updates structure
    for (const update of updates) {
      if (!update.id || typeof update.order !== 'number') {
        return NextResponse.json(
          { error: 'Each update must have id and order' },
          { status: 400 }
        );
      }
    }

    const updatePromises = updates.map(({ id, order }) =>
      supabase.from('materials').update({ order }).eq('id', id).select('*').single()
    );

    const updatedMaterials = await Promise.all(updatePromises);
    const materials = updatedMaterials
      .filter(result => !result.error)
      .map(result => result.data);

    return NextResponse.json({
      success: true,
      count: materials.length,
      materials
    });

  } catch (error: any) {
    console.error('Error updating material order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update material order' },
      { status: 500 }
    );
  }
}
