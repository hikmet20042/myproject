import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth';
import dbConnect  from '@/lib/mongoose'
import Training from '@/lib/models/Training'
import User from '@/lib/models/User'
import mongoose from 'mongoose'

// GET /api/trainings/[id] - Get single training
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid training ID' },
        { status: 400 }
      )
    }
    
    const training = await Training.findById(params.id)
      .populate('createdBy', 'name organizationName email')
      .populate('approvedBy', 'name')
      .lean()
    
    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ training })
  } catch (error) {
    console.error('Error fetching training:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training' },
      { status: 500 }
    )
  }
}

// PUT /api/trainings/[id] - Update training
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
        { error: 'Invalid training ID' },
        { status: 400 }
      )
    }
    
    const training = await Training.findById(params.id)
    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      )
    }
    
    const user = await User.findById(session.user.id)
    
    // Check permissions
    const isOwner = training.createdBy.toString() === session.user.id
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
        training.isApproved = true
        training.approvedAt = new Date()
        training.approvedBy = session.user.id
        training.isPublished = true
        training.rejectedAt = undefined
        training.rejectionReason = undefined
      } else if (body.action === 'reject') {
        training.isApproved = false
        training.rejectedAt = new Date()
        training.rejectionReason = body.rejectionReason || 'No reason provided'
        training.approvedAt = undefined
        training.approvedBy = undefined
        training.isPublished = false
      }
    } else {
      // Regular update by owner
      if (training.isApproved && isOwner) {
        // If training was approved, reset approval status for re-review
        training.isApproved = false
        training.approvedAt = undefined
        training.approvedBy = undefined
        training.isPublished = false
      }
      
      // Validate dates if provided
      if (body.startDate && body.endDate) {
        const startDate = new Date(body.startDate)
        const endDate = new Date(body.endDate)
        
        if (startDate >= endDate) {
          return NextResponse.json(
            { error: 'End date must be after start date' },
            { status: 400 }
          )
        }
      }
      
      if (body.applicationDeadline && body.startDate) {
        const applicationDeadline = new Date(body.applicationDeadline)
        const startDate = new Date(body.startDate)
        
        if (applicationDeadline >= startDate) {
          return NextResponse.json(
            { error: 'Application deadline must be before start date' },
            { status: 400 }
          )
        }
      }
      
      // Update allowed fields
      const allowedFields = [
        'title', 'description', 'category', 'trainingType',
        'startDate', 'endDate', 'duration', 'schedule', 'location',
        'applicationLink', 'applicationDeadline', 'maxParticipants',
        'prerequisites', 'learningOutcomes', 'certification', 'cost',
        'targetAudience', 'tags', 'imageUrl', 'syllabus'
      ]
      
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          training[field] = body[field]
        }
      })
    }
    
    await training.save()
    
    const updatedTraining = await Training.findById(params.id)
      .populate('createdBy', 'name organizationName')
      .populate('approvedBy', 'name')
      .lean()
    
    return NextResponse.json({
      message: 'Training updated successfully',
      training: updatedTraining
    })
  } catch (error) {
    console.error('Error updating training:', error)
    return NextResponse.json(
      { error: 'Failed to update training' },
      { status: 500 }
    )
  }
}

// DELETE /api/trainings/[id] - Delete training
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
        { error: 'Invalid training ID' },
        { status: 400 }
      )
    }
    
    const training = await Training.findById(params.id)
    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      )
    }
    
    const user = await User.findById(session.user.id)
    
    // Check permissions
    const isOwner = training.createdBy.toString() === session.user.id
    const isAdmin = user?.role === 'admin'
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }
    
    await Training.findByIdAndDelete(params.id)
    
    return NextResponse.json({
      message: 'Training deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting training:', error)
    return NextResponse.json(
      { error: 'Failed to delete training' },
      { status: 500 }
    )
  }
}