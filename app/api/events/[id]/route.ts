import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth';
import  dbConnect  from '@/lib/mongoose'
import Event from '@/lib/models/Event'
import User from '@/lib/models/User'
import mongoose from 'mongoose'

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      )
    }
    
    const event = await Event.findById(params.id)
      .populate('createdBy', 'name organizationName email')
      .populate('approvedBy', 'name')
      .lean()
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      )
    }
    
    const event = await Event.findById(params.id)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    const user = await User.findById(session.user.id)
    
    // Check permissions
    const isOwner = event.createdBy.toString() === session.user.id
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
      if (body.action === 'approve') {
        event.isApproved = true
        event.approvedAt = new Date()
        event.approvedBy = session.user.id
        event.isPublished = true
        event.rejectedAt = undefined
        event.rejectionReason = undefined
      } else if (body.action === 'reject') {
        event.isApproved = false
        event.rejectedAt = new Date()
        event.rejectionReason = body.rejectionReason || 'No reason provided'
        event.approvedAt = undefined
        event.approvedBy = undefined
        event.isPublished = false
      }
    } else {
      // Regular update by owner
      if (event.isApproved && isOwner) {
        // If event was approved, reset approval status for re-review
        event.isApproved = false
        event.approvedAt = undefined
        event.approvedBy = undefined
        event.isPublished = false
      }
      
      // Update allowed fields
      const allowedFields = [
        'title', 'description', 'category', 'eventDate', 'endDate',
        'location', 'applicationLink', 'applicationDeadline',
        'maxParticipants', 'tags', 'imageUrl'
      ]
      
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          event[field] = body[field]
        }
      })
    }
    
    await event.save()
    
    const updatedEvent = await Event.findById(params.id)
      .populate('createdBy', 'name organizationName')
      .populate('approvedBy', 'name')
      .lean()
    
    return NextResponse.json({
      message: 'Event updated successfully',
      event: updatedEvent
    })
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      )
    }
    
    const event = await Event.findById(params.id)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    const user = await User.findById(session.user.id)
    
    // Check permissions
    const isOwner = event.createdBy.toString() === session.user.id
    const isAdmin = user?.role === 'admin'
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }
    
    await Event.findByIdAndDelete(params.id)
    
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