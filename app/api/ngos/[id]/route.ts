import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import NGO from '@/lib/models/NGO'
import User from '@/lib/models/User'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

// Helper function to verify NGO token
function verifyNGOToken(request: NextRequest) {
  const token = request.cookies.get('ngo-token')?.value
  
  if (!token) {
    return null
  }
  
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any
    return decoded
  } catch (error) {
    return null
  }
}

export const dynamic = 'force-dynamic'

// GET - Get single NGO by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const { id } = params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid NGO ID' }, { status: 400 })
    }

    const ngo = await NGO.findById(id)
      .populate('approvedBy', 'name email')
      .lean()

    if (!ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    }

    return NextResponse.json({ ngo })
  } catch (error) {
    console.error('Error fetching NGO:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update NGO (for NGO owners and admins)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const { id } = params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid NGO ID' }, { status: 400 })
    }

    const ngo = await NGO.findById(id)
    if (!ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    }

    // Check permissions - NGO owner or admin
    const ngoTokenData = verifyNGOToken(request)
    const session = await getServerSession(authOptions)
    
    const isNGOOwner = ngoTokenData && ngoTokenData.ngoId === id
    const isAdmin = session?.user?.id && (await User.findById(session.user.id))?.role === 'admin'
    
    if (!isNGOOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      organizationName,
      description,
      website,
      contactPhone,
      address,
      registrationNumber,
      focusAreas,
      contactPerson,
      socialMedia,
      status // Only admins can change status
    } = body

    // Validation
    if (!organizationName || !description || !contactPerson?.name || !contactPerson?.email) {
      return NextResponse.json({
        error: 'Organization name, description, contact person name and email are required'
      }, { status: 400 })
    }

    // Check if another NGO with same name exists (excluding current NGO)
    if (organizationName !== ngo.organizationName) {
      const existingNGO = await NGO.findOne({ 
        organizationName: { $regex: new RegExp(`^${organizationName}$`, 'i') },
        _id: { $ne: id }
      })
      if (existingNGO) {
        return NextResponse.json({
          error: 'An NGO with this name already exists'
        }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {
      organizationName,
      description,
      website,
      contactPhone,
      address,
      registrationNumber,
      focusAreas: focusAreas || [],
      contactPerson,
      socialMedia,
      updatedAt: new Date()
    }

    // Only admins can change status
    if (isAdmin && status) {
      updateData.status = status
      if (status === 'approved') {
        updateData.approvedBy = session?.user?.id
        updateData.approvedAt = new Date()
      }
    }

    const updatedNGO = await NGO.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('approvedBy', 'name email')
      .lean()

    return NextResponse.json({
      message: 'NGO updated successfully',
      ngo: updatedNGO
    })
  } catch (error) {
    console.error('Error updating NGO:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete NGO (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await User.findById(session.user.id)
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid NGO ID' }, { status: 400 })
    }

    const deletedNGO = await NGO.findByIdAndDelete(id)
    if (!deletedNGO) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'NGO deleted successfully' })
  } catch (error) {
    console.error('Error deleting NGO:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}