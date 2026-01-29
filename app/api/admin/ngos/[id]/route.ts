import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'

export const dynamic = 'force-dynamic'

// DELETE /api/admin/ngos/[id] - Delete NGO registration permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const ngo = await User.findById(params.id)
    
    if (!ngo) {
      return NextResponse.json(
        { error: 'NGO not found' },
        { status: 404 }
      )
    }
    
    if (ngo.role !== 'ngo') {
      return NextResponse.json(
        { error: 'User is not an NGO' },
        { status: 400 }
      )
    }
    
    await User.findByIdAndDelete(params.id)
    
    return NextResponse.json({ 
      message: 'NGO deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/admin/ngos/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete NGO' },
      { status: 500 }
    )
  }
}
