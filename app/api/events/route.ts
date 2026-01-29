import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose'
import Event from '@/lib/models/Event'
import User from '@/lib/models/User'
import NGO from '@/lib/models/NGO'
import cloudinaryService from '@/lib/services/cloudinaryService'

// GET /api/events - Get events with filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const eventType = searchParams.get('eventType') // 'event', 'training', 'workshop', etc.
    const trainingType = searchParams.get('trainingType') // For backward compatibility
    const location = searchParams.get('location')
    const month = searchParams.get('month')
    const search = searchParams.get('search')
    const status = searchParams.get('status') // 'approved', 'pending', 'all'
    const createdBy = searchParams.get('createdBy') // For NGO's own events
    const author = searchParams.get('author') // Handle 'author=me' parameter
    const adminView = searchParams.get('adminView') === 'true'
    const sortBy = searchParams.get('sortBy') || 'eventDate'
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1
    
    const skip = (page - 1) * limit
    
    // Handle author=me parameter
    let actualCreatedBy = createdBy
    if (author === 'me') {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      actualCreatedBy = session.user.id
    }
    
    // Build filter query
    const filter: any = {}
    
    // Admin view shows all events, regular view shows only approved
    if (!adminView) {
      if (status !== 'all' && !createdBy) {
        filter.status = 'approved'
        filter.isPublished = true
      }
    } else {
      // Admin view with status filtering
      if (status === 'approved') {
        filter.status = 'approved'
      } else if (status === 'pending') {
        filter.status = 'pending'
      } else if (status === 'rejected') {
        filter.status = 'rejected'
      }
    }
    
    // If viewing own events, filter by creator
    if (actualCreatedBy) {
      filter.createdBy = actualCreatedBy
      if (status === 'approved') {
        filter.status = 'approved'
      } else if (status === 'pending') {
        filter.status = 'pending'
      } else if (status === 'rejected') {
        filter.status = 'rejected'
      }
    }
    
    if (category && category !== 'all') {
      filter.category = category
    }
    
    // Event type filtering
    if (eventType && eventType !== 'all') {
      filter.eventType = eventType
    }
    
    // Backward compatibility for trainingType parameter
    if (trainingType && trainingType !== 'all') {
      filter.eventType = 'training'
      if (trainingType === 'online') {
        filter['location.type'] = { $in: ['online', 'hybrid'] }
      } else if (trainingType === 'in-person') {
        filter['location.type'] = { $in: ['physical', 'hybrid'] }
      }
    }
    
    if (location && location !== 'all') {
      if (location === 'online') {
        filter['location.type'] = { $in: ['online', 'hybrid'] }
      } else if (location === 'physical') {
        filter['location.type'] = { $in: ['physical', 'hybrid'] }
      } else {
        filter['location.city'] = new RegExp(location, 'i')
      }
    }
    
    if (month && month !== 'all') {
      const year = new Date().getFullYear()
      const monthNum = parseInt(month)
      const startDate = new Date(year, monthNum - 1, 1)
      const endDate = new Date(year, monthNum, 0, 23, 59, 59)
      filter.eventDate = { $gte: startDate, $lte: endDate }
    }
    
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }
    
    // Build sort object
    const sortObj: any = {}
    sortObj[sortBy] = sortOrder
    
    const events = await Event.find(filter)
      .populate('createdBy', 'name ngoProfile')
      .populate('approvedBy', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Event.countDocuments(filter)
    
    // Calculate stats for admin view
    let stats = null
    if (adminView) {
      const [pending, approved, rejected, totalCount] = await Promise.all([
        Event.countDocuments({ status: 'pending' }),
        Event.countDocuments({ status: 'approved' }),
        Event.countDocuments({ status: 'rejected' }),
        Event.countDocuments({})
      ])
      
      stats = { pending, approved, rejected, total: totalCount }
    }
    
    const response: any = {
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
    
    if (stats) {
      response.stats = stats
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create new event (NGO only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    await dbConnect()
    
    // Check if user is an approved NGO
    if (!session.user.isApprovedNGO) {
      return NextResponse.json(
        { error: 'Only approved NGOs can create events' },
        { status: 403 }
      )
    }
    
    // Parse form data if contains files, otherwise JSON
    const contentType = request.headers.get('content-type') || '';
    let body;
    let imageFiles: File[] = [];
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Extract event data
      const eventDataStr = formData.get('eventData') as string;
      body = eventDataStr ? JSON.parse(eventDataStr) : {};
      
      // Extract image files
      const files = formData.getAll('images');
      imageFiles = files.filter((file): file is File => file instanceof File);
    } else {
      body = await request.json();
    }
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'eventDate', 'location', 'eventType']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }
    const descText = typeof body.description === 'string'
      ? body.description.replace(/<[^>]*>/g, '').trim()
      : ''
    if (!descText || descText.length < 50) {
      return NextResponse.json(
        { error: 'Description must be at least 50 characters long' },
        { status: 400 }
      )
    }
    
    // Validate eventType
    const validEventTypes = ['event', 'training', 'workshop', 'conference', 'seminar']
    if (!validEventTypes.includes(body.eventType)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }
    
    // Additional validation for training events
    if (body.eventType === 'training') {
      if (body.duration && (!body.duration.value || !body.duration.unit)) {
        return NextResponse.json(
          { error: 'Duration must include both value and unit for training events' },
          { status: 400 }
        )
      }
      
      if (body.cost && !body.cost.hasOwnProperty('isFree')) {
        return NextResponse.json(
          { error: 'Cost information must specify if training is free' },
          { status: 400 }
        )
      }
    }
    
    // Validate location structure
    if (!body.location.type || !['online', 'physical', 'hybrid'].includes(body.location.type)) {
      return NextResponse.json(
        { error: 'Valid location type is required' },
        { status: 400 }
      )
    }
    
    // Fetch NGO profile for organization name
    const ngo = await NGO.findOne({ email: session.user.email })
    if (!ngo) {
      return NextResponse.json(
        { error: 'NGO profile not found' },
        { status: 404 }
      )
    }
    
    // Create event first to get ID
    const event = new Event({
      ...body,
      eventType: body.eventType || 'event',
      createdBy: session.user.id,
      organizationName: ngo.organizationName || 'Unknown Organization',
      status: 'pending',
      isPublished: false,
      currentParticipants: 0,
      images: [] // Will be populated if images are uploaded
    })
    
    await event.save()
    
    // Upload images to Cloudinary if provided
    if (imageFiles.length > 0) {
      const uploadedImages = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        // Validate file
        const validation = cloudinaryService.validateImageFile(file, 10);
        if (!validation.valid) {
          console.warn(`Skipping invalid image: ${validation.error}`);
          continue;
        }
        
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // Upload to Cloudinary
          const uploadResult = await cloudinaryService.uploadEventImage(
            buffer,
            event._id.toString(),
            i
          );
          
          if (uploadResult.success && uploadResult.secureUrl && uploadResult.publicId) {
            uploadedImages.push({
              url: uploadResult.secureUrl,
              publicId: uploadResult.publicId,
              alt: body.title || 'Event image',
              isPrimary: i === 0 // First image is primary
            });
          }
        } catch (uploadError) {
          console.error(`Error uploading image ${i}:`, uploadError);
        }
      }
      
      // Update event with images
      if (uploadedImages.length > 0) {
        event.images = uploadedImages;
        // Set imageUrl to primary image for backward compatibility
        event.imageUrl = uploadedImages[0].url;
        await event.save();
      }
    }
    
    return NextResponse.json(
      { message: 'Event created successfully. Awaiting admin approval.', event },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
