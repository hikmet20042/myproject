import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Material from '@/lib/models/Material';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

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

    // Update all materials with new order
    const updatePromises = updates.map(({ id, order }) =>
      Material.findByIdAndUpdate(id, { order }, { new: true })
    );

    const updatedMaterials = await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      count: updatedMaterials.length,
      materials: updatedMaterials
    });

  } catch (error: any) {
    console.error('Error updating material order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update material order' },
      { status: 500 }
    );
  }
}
