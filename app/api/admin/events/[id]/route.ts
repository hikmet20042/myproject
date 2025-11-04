import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Event from '@/lib/models/Event'
import mongoose from 'mongoose'
import { NotificationService } from '@/lib/services/notificationService'

// PATCH /api/admin/events/[id] - Admin approve/reject event
export async function PATCH(
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
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

    const event = await Event.findById(params.id)
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    if (action === 'approve') {
      updateData = {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: session.user.id,
        isPublished: true,
        rejectedAt: undefined,
        rejectionReason: undefined,
        adminComment: adminComment || undefined
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
        rejectedAt: new Date(),
        rejectionReason: adminComment.trim(),
        adminComment: adminComment.trim(),
        isPublished: false,
        approvedAt: undefined,
        approvedBy: undefined
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    )
      .populate('createdBy', 'name ngoProfile email')
      .populate('approvedBy', 'name')

    // Send notification to event creator
    if (updatedEvent && updatedEvent.createdBy) {
      try {
        const creatorId = typeof updatedEvent.createdBy === 'object' && '_id' in updatedEvent.createdBy
          ? updatedEvent.createdBy._id.toString()
          : updatedEvent.createdBy.toString()
        
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
    await dbConnect()
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      )
    }

    const event = await Event.findById(params.id)
      .populate('createdBy', 'name ngoProfile email')
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
    console.error('Error fetching event for admin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}