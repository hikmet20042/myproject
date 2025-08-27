import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Event from '@/lib/models/Event'
import mongoose from 'mongoose'

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
    const { action, rejectionReason } = body

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
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: session.user.id,
        isPublished: true,
        rejectedAt: undefined,
        rejectionReason: undefined
      }
    } else if (action === 'reject') {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        )
      }
      
      updateData = {
        isApproved: false,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason.trim(),
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