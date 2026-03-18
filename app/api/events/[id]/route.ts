import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

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

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()

    const { data: eventRow, error } = await supabase
      .from('events')
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)')
      .eq('id', params.id)
      .single()
    
    if (error || !eventRow) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const event = mapEvent(eventRow)

    // Restrict unpublished or non-approved events
    if (event.status !== 'approved' || event.isPublished === false) {
      const session = await getServerSession()
      const createdById = typeof event.createdBy === 'object' && event.createdBy?._id
        ? event.createdBy._id.toString()
        : event.createdBy?.toString?.()
      const createdByOrganizationId = typeof event.createdByOrganization === 'object' && event.createdByOrganization?._id
        ? event.createdByOrganization._id.toString()
        : event.createdByOrganization?.toString?.()
      const isOwner = session?.user?.id && (session.user.id === createdById || session.user.id === createdByOrganizationId)

      let isAdmin = false
      if (session?.user?.id) {
        const { data: adminUser } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
        isAdmin = adminUser?.role === 'admin'
      }

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const supabase = createSupabaseAdminClient()

    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()
    if (eventError || !eventRow) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Check permissions (owner can be User via createdBy or Organization via createdByOrganization)
    const createdById = eventRow.created_by
    const createdByOrganizationId = eventRow.created_by_organization
    const isOwner = createdById === session.user.id || createdByOrganizationId === session.user.id
    const isAdmin = user?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // If admin is approving/rejecting
    if (isAdmin && (body.action === 'approve' || body.action === 'reject')) {
      const updateData: any = {}
      if (body.action === 'approve') {
        updateData.status = 'approved'
        updateData.approved_at = new Date().toISOString()
        updateData.approved_by = session.user.id
        updateData.is_published = true
        updateData.rejected_at = null
        updateData.rejection_reason = null
        updateData.admin_comment = body.adminComment || null
      } else if (body.action === 'reject') {
        updateData.status = 'rejected'
        updateData.rejected_at = new Date().toISOString()
        updateData.rejection_reason = body.rejectionReason || 'No reason provided'
        updateData.admin_comment = body.adminComment || body.rejectionReason || 'No reason provided'
        updateData.approved_at = null
        updateData.approved_by = null
        updateData.is_published = false
      }

      const { data: updatedRow, error: updateError } = await supabase
        .from('events')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)')
        .single()

      if (updateError || !updatedRow) {
        return NextResponse.json(
          { error: 'Failed to update event' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Event updated successfully',
        event: mapEvent(updatedRow)
      })
    } else {
      // Regular update by owner
      const updateData: any = {}
      if (eventRow.status === 'approved' && isOwner) {
        // If event was approved, reset approval status for re-review
        updateData.status = 'pending'
        updateData.approved_at = null
        updateData.approved_by = null
        updateData.is_published = false
      }
      
      // Update allowed fields
      const allowedFields = [
        'title', 'description', 'category', 'eventType', 'eventDate', 'endDate',
        'duration', 'schedule', 'prerequisites', 'learningOutcomes',
        'certification', 'cost', 'targetAudience', 'syllabus',
        'location', 'applicationLink', 'applicationDeadline',
        'maxParticipants', 'tags', 'imageUrl'
      ]
      
      if (body.description !== undefined) {
        const descText = typeof body.description === 'string'
          ? body.description.replace(/<[^>]*>/g, '').trim()
          : ''
        if (!descText || descText.length < 50) {
          return NextResponse.json(
            { error: 'Description must be at least 50 characters long' },
            { status: 400 }
          )
        }
      }

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field]
        }
      })

      if (updateData.eventType !== undefined) {
        updateData.event_type = updateData.eventType
        delete updateData.eventType
      }
      if (updateData.eventDate !== undefined) {
        updateData.event_date = updateData.eventDate
        delete updateData.eventDate
      }
      if (updateData.endDate !== undefined) {
        updateData.end_date = updateData.endDate
        delete updateData.endDate
      }
      if (updateData.learningOutcomes !== undefined) {
        updateData.learning_outcomes = updateData.learningOutcomes
        delete updateData.learningOutcomes
      }
      if (updateData.targetAudience !== undefined) {
        updateData.target_audience = updateData.targetAudience
        delete updateData.targetAudience
      }
      if (updateData.applicationLink !== undefined) {
        updateData.application_link = updateData.applicationLink
        delete updateData.applicationLink
      }
      if (updateData.applicationDeadline !== undefined) {
        updateData.application_deadline = updateData.applicationDeadline
        delete updateData.applicationDeadline
      }
      if (updateData.maxParticipants !== undefined) {
        updateData.max_participants = updateData.maxParticipants
        delete updateData.maxParticipants
      }
      if (updateData.imageUrl !== undefined) {
        updateData.image_url = updateData.imageUrl
        delete updateData.imageUrl
      }

      updateData.updated_at = new Date().toISOString()

      const { data: updatedRow, error: updateError } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', params.id)
        .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)')
        .single()

      if (updateError || !updatedRow) {
        return NextResponse.json(
          { error: 'Failed to update event' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Event updated successfully',
        event: mapEvent(updatedRow)
      })
    }
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const supabase = createSupabaseAdminClient()
    
    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('id, created_by, created_by_organization')
      .eq('id', params.id)
      .single()
    if (eventError || !eventRow) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Check permissions (owner can be User via createdBy or Organization via createdByOrganization)
    const createdById = eventRow.created_by
    const createdByOrganizationId = eventRow.created_by_organization
    const isOwner = createdById === session.user.id || createdByOrganizationId === session.user.id
    const isAdmin = user?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Event deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
