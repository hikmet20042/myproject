import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { NotificationService } from '@/lib/services/notificationService'

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

// PATCH /api/admin/events/[id] - Admin approve/reject event
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, adminComment } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

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

    let updateData: any = {}

    if (action === 'approve') {
      updateData = {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: session.user.id,
        is_published: true,
        rejected_at: null,
        rejection_reason: null,
        admin_comment: adminComment || null
      }
    } else if (action === 'reject') {
      if (!adminComment || !adminComment.trim()) {
        return NextResponse.json(
          { error: 'Admin comment is required for rejection' },
          { status: 400 }
        )
      }
      
      updateData = {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: adminComment.trim(),
        admin_comment: adminComment.trim(),
        is_published: false,
        approved_at: null,
        approved_by: null
      }
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

    const updatedEvent = mapEvent(updatedRow)

    // Send notification to event creator
    const eventCreator = updatedEvent?.createdBy || updatedEvent?.createdByOrganization
    if (updatedEvent && eventCreator) {
      try {
        const creatorId = typeof eventCreator === 'object' && '_id' in eventCreator
          ? eventCreator._id.toString()
          : eventCreator.toString()
        
        await NotificationService.notifyEventStatus(
          creatorId,
          updatedEvent._id.toString(),
          updatedEvent.title,
          action,
          adminComment
        )
      } catch (notifError) {
        console.error('Failed to send notification:', notifError)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      message: `Event ${action}d successfully`,
      event: updatedEvent
    })
  } catch (error) {
    console.error('Error processing event action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/events/[id] - Admin get event details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, email), approved_by (id, name)')
      .eq('id', params.id)
      .single()
    
    if (eventError || !eventRow) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ event: mapEvent(eventRow) })
  } catch (error) {
    console.error('Error fetching event for admin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}