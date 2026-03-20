import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import cloudinaryService from '@/lib/services/cloudinaryService'

const mapEvent = (row: any) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  eventType: row.event_type,
  eventDate: row.event_date,
  endDate: row.end_date,
  duration: row.duration,
  schedule: row.schedule,
  prerequisites: row.prerequisites || [],
  learningOutcomes: row.learning_outcomes || [],
  certification: row.certification,
  cost: row.cost,
  targetAudience: row.target_audience || [],
  syllabus: row.syllabus,
  location: row.location,
  applicationLink: row.application_link,
  applicationDeadline: row.application_deadline,
  maxParticipants: row.max_participants,
  currentParticipants: row.current_participants,
  tags: row.tags || [],
  imageUrl: row.image_url,
  images: row.images,
  createdBy: row.created_by
    ? { _id: row.created_by.id, name: row.created_by.name, email: row.created_by.email }
    : row.created_by,
  createdByOrganization: row.created_by_organization
    ? { _id: row.created_by_organization.id, organizationName: row.created_by_organization.organization_name, email: row.created_by_organization.email }
    : row.created_by_organization,
  organizationName: row.organization_name,
  status: row.status,
  approvedAt: row.approved_at,
  approvedBy: row.approved_by
    ? { _id: row.approved_by.id, name: row.approved_by.name }
    : row.approved_by,
  rejectedAt: row.rejected_at,
  rejectionReason: row.rejection_reason,
  adminComment: row.admin_comment,
  isPublished: row.is_published,
  isFeatured: row.is_featured,
  views: row.views,
  uniqueViews: row.unique_views,
  viewedBy: row.viewed_by || [],
  engagementScore: row.engagement_score,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// GET /api/events - Get events with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    
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
    const createdBy = searchParams.get('createdBy') // For organization's own events
    const author = searchParams.get('author') // Handle 'author=me' parameter
    const adminView = searchParams.get('adminView') === 'true'
    const sortBy = searchParams.get('sortBy') || 'eventDate'
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1
    
    const skip = (page - 1) * limit
    
    // Handle author=me parameter
    let actualCreatedBy = createdBy
    if (author === 'me') {
      const session = await getServerSession()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      actualCreatedBy = session.user.id
    }
    
    // Build filter query
    const filter: any = {}
    
    // Admin view requires admin session
    if (adminView) {
      const session = await getServerSession()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
      const { data: adminUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if (!adminUser || adminUser.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

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
    
    // If viewing own events, filter by creator (User or Organization)
    if (actualCreatedBy) {
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

    // Combine creator and search so they don't overwrite each other
    const creatorOr = actualCreatedBy
      ? [{ createdBy: actualCreatedBy }, { createdByOrganization: actualCreatedBy }]
      : null
    const searchOr = search
      ? [
          { title: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      : null
    const andParts: any[] = []
    if (creatorOr) andParts.push({ $or: creatorOr })
    if (searchOr) andParts.push({ $or: searchOr })
    if (andParts.length > 0) {
      filter.$and = andParts
    }
    
    const sortFieldMap: Record<string, string> = {
      eventDate: 'event_date',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
    const orderField = sortFieldMap[sortBy] || 'event_date'
    const ascending = sortOrder === -1 ? false : true

    let query = supabase
      .from('events')
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)', { count: 'exact' })
      .order(orderField, { ascending })
      .range(skip, skip + limit - 1)

    if (filter.status) {
      query = query.eq('status', filter.status)
    }

    if (!adminView) {
      if (status !== 'all' && !createdBy) {
        query = query.eq('is_published', true)
      }
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType)
    }

    if (trainingType && trainingType !== 'all') {
      if (trainingType === 'online') {
        query = query.or('location->>type.eq.online,location->>type.eq.hybrid')
      } else if (trainingType === 'in-person') {
        query = query.or('location->>type.eq.physical,location->>type.eq.hybrid')
      }
    }

    if (location && location !== 'all') {
      if (location === 'online') {
        query = query.or('location->>type.eq.online,location->>type.eq.hybrid')
      } else if (location === 'physical') {
        query = query.or('location->>type.eq.physical,location->>type.eq.hybrid')
      } else {
        query = query.or(`location->>city.ilike.%${location}%`)
      }
    }

    if (month && month !== 'all') {
      const year = new Date().getFullYear()
      const monthNum = parseInt(month)
      const startDate = new Date(year, monthNum - 1, 1)
      const endDate = new Date(year, monthNum, 0, 23, 59, 59)
      query = query.gte('event_date', startDate.toISOString()).lte('event_date', endDate.toISOString())
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (actualCreatedBy) {
      query = query.or(`created_by.eq.${actualCreatedBy},created_by_organization.eq.${actualCreatedBy}`)
    }

    const { data: eventRows, error, count } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    const events = (eventRows || []).map(mapEvent)
    const total = count || 0
    
    // Calculate stats for admin view
    let stats = null
    if (adminView) {
      const [pendingResult, approvedResult, rejectedResult, totalResult] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('events').select('id', { count: 'exact', head: true })
      ])
      
      stats = {
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
        total: totalResult.count || 0
      }
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

// POST /api/events - Create new event (organization only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const supabase = createSupabaseAdminClient()
    
    // Check if user is an approved organization
    if (session.user.organizationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved organizations can create events' },
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
    
    // Fetch organization profile for organization name
    const { data: organization, error: orgError } = await supabase
      .from('organization_profiles')
      .select('organization_name')
      .eq('account_id', session.user.id)
      .single()
    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization profile not found' },
        { status: 404 }
      )
    }
    
    // Create event first to get ID (organization creates: use createdByOrganization, not createdBy)
    const { data: eventRow, error: insertError } = await supabase
      .from('events')
      .insert({
        title: body.title,
        description: body.description,
        category: body.category,
        event_type: body.eventType || 'event',
        event_date: body.eventDate,
        end_date: body.endDate || null,
        duration: body.duration || null,
        schedule: body.schedule || null,
        prerequisites: body.prerequisites || [],
        learning_outcomes: body.learningOutcomes || [],
        certification: body.certification || null,
        cost: body.cost || null,
        target_audience: body.targetAudience || [],
        syllabus: body.syllabus || null,
        location: body.location,
        application_link: body.applicationLink || null,
        application_deadline: body.applicationDeadline || null,
        max_participants: body.maxParticipants || null,
        tags: body.tags || [],
        created_by: null,
        created_by_organization: session.user.id,
        organization_name: organization.organization_name || 'Unknown Organization',
        status: 'pending',
        is_published: false,
        current_participants: 0,
        images: []
      })
      .select('*')
      .single()

    if (insertError || !eventRow) {
      console.error('Error creating event:', insertError)
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      )
    }
    
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
            eventRow.id,
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
        await supabase
          .from('events')
          .update({
            images: uploadedImages,
            image_url: uploadedImages[0].url,
            updated_at: new Date().toISOString()
          })
          .eq('id', eventRow.id)
      }
    }

    const { data: updatedEventRow } = await supabase
      .from('events')
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)')
      .eq('id', eventRow.id)
      .single()
    
    return NextResponse.json(
      { message: 'Event created successfully. Awaiting admin approval.', event: mapEvent(updatedEventRow || eventRow) },
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
