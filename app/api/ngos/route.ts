import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'

// GET /api/ngos - Get approved NGOs for public display
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const skip = (page - 1) * limit
    
    // Build filter query - only show approved NGOs
    const filter: any = {
      role: 'ngo',
      'ngoProfile.status': 'approved'
    }
    
    // Category filter
    if (category && category !== 'all') {
      filter['ngoProfile.focusAreas'] = { $in: [category] }
    }
    
    // Location filter
    if (location && location !== 'all') {
      filter['ngoProfile.address.city'] = new RegExp(location, 'i')
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { 'ngoProfile.organizationName': new RegExp(search, 'i') },
        { 'ngoProfile.description': new RegExp(search, 'i') },
        { 'ngoProfile.focusAreas': { $in: [new RegExp(search, 'i')] } }
      ]
    }
    
    // Build sort object
    const sort: any = {}
    if (sortBy === 'name') {
      sort['ngoProfile.organizationName'] = sortOrder === 'desc' ? -1 : 1
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1
    }
    
    const ngos = await User.find(filter)
      .select('name email ngoProfile createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await User.countDocuments(filter)
    
    // Transform data for frontend
    const transformedNgos = ngos.map(ngo => ({
      _id: ngo._id,
      name: ngo.ngoProfile?.organizationName || ngo.name,
      description: ngo.ngoProfile?.description || '',
      category: ngo.ngoProfile?.focusAreas?.[0] || 'Other',
      focusAreas: ngo.ngoProfile?.focusAreas || [],
      location: ngo.ngoProfile?.address?.city || 'Not specified',
      website: ngo.ngoProfile?.website || '',
      email: ngo.email,
      phone: ngo.ngoProfile?.phone || '',
      verified: ngo.ngoProfile?.status === 'approved' || false,
      logo: ngo.ngoProfile?.logo || null,
      address: ngo.ngoProfile?.address || {},
      createdAt: ngo.createdAt
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