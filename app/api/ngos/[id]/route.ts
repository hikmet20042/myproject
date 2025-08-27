import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import { Types } from 'mongoose'

interface NGOUser {
  _id: Types.ObjectId
  name: string
  email: string
  role: 'user' | 'admin' | 'ngo'
  ngoProfile?: {
    organizationName: string
    description: string
    website?: string
    contactPhone?: string
    address?: string
    registrationNumber?: string
    focusAreas: string[]
    isApproved: boolean
    approvedAt?: Date
    approvedBy?: Types.ObjectId
    rejectedAt?: Date
    rejectionReason?: string
  }
  createdAt: Date
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const { id } = params
    
    if (!id) {
      return NextResponse.json({ error: 'NGO ID is required' }, { status: 400 })
    }
    
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid NGO ID format' }, { status: 400 })
    }
    
    // Find the NGO user by ID
    const ngoUser = await User.findById(id)
      .select('name email role ngoProfile createdAt')
      .lean() as NGOUser | null
    
    if (!ngoUser) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
    }
    
    // Check if user is an NGO and is approved
    if (ngoUser.role !== 'ngo' || !ngoUser.ngoProfile?.isApproved) {
      return NextResponse.json({ error: 'NGO not found or not approved' }, { status: 404 })
    }
    
    // Transform data for frontend
    const transformedNgo = {
      _id: ngoUser._id,
      name: ngoUser.ngoProfile?.organizationName || ngoUser.name,
      description: ngoUser.ngoProfile?.description || '',
      category: ngoUser.ngoProfile?.focusAreas?.[0] || 'Other',
      focusAreas: ngoUser.ngoProfile?.focusAreas || [],
      location: ngoUser.ngoProfile?.address || 'Not specified',
      website: ngoUser.ngoProfile?.website || '',
      email: ngoUser.email,
      phone: ngoUser.ngoProfile?.contactPhone || '',
      verified: ngoUser.ngoProfile?.isApproved || false,
      logo: null, // Logo field doesn't exist in schema
      address: ngoUser.ngoProfile?.address || '',
      registrationNumber: ngoUser.ngoProfile?.registrationNumber || '',
      createdAt: ngoUser.createdAt
    }
    
    return NextResponse.json(transformedNgo)
    
  } catch (error) {
    console.error('Error fetching NGO:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}