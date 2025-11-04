import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import NGO from '@/lib/models/NGO'
import User from '@/lib/models/User'

// Force dynamic rendering due to request.url usage
export const dynamic = 'force-dynamic'

// GET /api/ngos - Get NGOs
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const myNgos = searchParams.get('myNgos') === 'true'
    const status = searchParams.get('status')
    
    const skip = (page - 1) * limit
    
    // Build filter query
    let filter: any = {}
    
    // If requesting user's NGOs (not applicable for independent NGOs)
    if (myNgos) {
      // This endpoint is not used for independent NGOs
      // NGOs should use their own dashboard API
      return NextResponse.json({ error: 'Use NGO-specific endpoints for NGO data' }, { status: 400 })
    } else {
      // For public access, only show approved NGOs
      filter.status = 'approved'
    }
    
    // Filter by status if provided (for admin or own NGOs)
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      if (session?.user?.role === 'admin' || myNgos) {
        filter.status = status
      }
    }
    
    // Category filter
    if (category && category !== 'all') {
      filter.focusAreas = { $in: [category] }
    }
    
    // Location filter
    if (location && location !== 'all') {
      filter.address = new RegExp(location, 'i')
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { organizationName: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { focusAreas: { $in: [new RegExp(search, 'i')] } },
        { 'contactPerson.name': new RegExp(search, 'i') }
      ]
    }
    
    // Build sort object
    const sort: any = {}
    if (sortBy === 'name') {
      sort.organizationName = sortOrder === 'desc' ? -1 : 1
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1
    }
    
    const ngos = await NGO.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .populate('approvedBy', 'name email')
      .select('-__v -password -verificationToken')
      .lean()
    
    const total = await NGO.countDocuments(filter)
    
    // Transform data for frontend
    const transformedNgos = ngos.map(ngo => ({
      // Keep field names consistent with frontend expectations
      _id: ngo._id,
      organizationName: ngo.organizationName,
      description: ngo.description,
      focusAreas: ngo.focusAreas || [],
      address: ngo.address || 'Not specified',
      website: ngo.website || '',
      contactPhone: ngo.contactPhone || '',
      contactPerson: ngo.contactPerson,
      socialMedia: ngo.socialMedia,
      registrationNumber: ngo.registrationNumber,
      status: ngo.status,
      createdBy: ngo.createdBy,
      managers: ngo.managers,
      createdAt: ngo.createdAt,
      updatedAt: ngo.updatedAt
    }))
    
    return NextResponse.json({
      ngos: transformedNgos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching NGOs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NGOs' },
      { status: 500 }
    )
  }
}

// POST - Create new NGO (This endpoint is deprecated for independent NGOs)
export async function POST(request: NextRequest) {
  try {
    // This endpoint is no longer used for creating NGOs
    // NGOs are now created through the registration process
    return NextResponse.json({
      error: 'NGO creation is handled through the registration process. Please use /api/auth/register with type=ngo'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in deprecated NGO creation endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}