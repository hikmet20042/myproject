import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose'
import Vacancy from '@/lib/models/Vacancy'
import User from '@/lib/models/User'
import Notification from '@/lib/models/Notification'
import mongoose from 'mongoose'

// GET /api/vacancies/[id] - Get single vacancy
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid vacancy ID' },
        { status: 400 }
      )
    }
    
    const vacancy = await Vacancy.findById(params.id)
      .populate('createdBy', 'name email organizationName')
      .lean()
    
    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ vacancy })
  } catch (error) {
    console.error('Error fetching vacancy:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vacancy' },
      { status: 500 }
    )
  }
}

// PUT /api/vacancies/[id] - Update vacancy
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
        { error: 'Invalid vacancy ID' },
        { status: 400 }
      )
    }
    
    const vacancy = await Vacancy.findById(params.id)
    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found' },
        { status: 404 }
      )
    }
    
    const user = await User.findById(session.user.id)
    
    // Check permissions
    const isOwner = vacancy.createdBy.toString() === session.user.id
    const isAdmin = user?.role === 'admin'
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'type', 'location']
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }
    
    // Validate deadline if provided
    if (body.deadline) {
      const deadline = new Date(body.deadline)
      if (deadline <= new Date()) {
        return NextResponse.json(
          { error: 'Deadline must be in the future' },
          { status: 400 }
        )
      }
    }
    
    // Update allowed fields
    const allowedFields = [
      'title', 'description', 'type', 'location', 'requirements',
      'responsibilities', 'benefits', 'deadline', 'contactEmail',
      'contactPhone', 'applicationInstructions', 'tags'
    ]
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        vacancy[field] = body[field]
      }
    })
    
    // Reset approval status if content changed (except for admins)
    if (!isAdmin && isOwner) {
      vacancy.isApproved = false
      vacancy.approvedAt = undefined
      vacancy.approvedBy = undefined
      vacancy.rejectedAt = undefined
      vacancy.rejectionReason = undefined
    }
    
    await vacancy.save()
    
    const updatedVacancy = await Vacancy.findById(params.id)
      .populate('createdBy', 'name email organizationName')
      .lean()
    
    return NextResponse.json({
      message: 'Vacancy updated successfully',
      vacancy: updatedVacancy
    })
  } catch (error) {
    console.error('Error updating vacancy:', error)
    return NextResponse.json(
      { error: 'Failed to update vacancy' },
      { status: 500 }
    )
  }
}

// PATCH /api/vacancies/[id] - Approve or reject vacancy (Admin only)
export async function PATCH(
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
    
    const user = await User.findById(session.user.id)
    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid vacancy ID' },
        { status: 400 }
      )
    }
    
    const vacancy = await Vacancy.findById(params.id)
      .populate('organization', 'name email organizationName')
    
    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found' },
        { status: 404 }
      )
    }
    
    const { action, rejectionReason } = await request.json()
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }
    
    if (action === 'reject' && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }
    
    // Update vacancy status
    if (action === 'approve') {
      vacancy.isApproved = true
      vacancy.approvedAt = new Date()
      vacancy.approvedBy = session.user.id
      // Clear any previous rejection data
      vacancy.rejectedAt = undefined
      vacancy.rejectionReason = undefined
    } else if (action === 'reject') {
      vacancy.isApproved = false
      vacancy.rejectedAt = new Date()
      vacancy.rejectionReason = rejectionReason.trim()
      // Clear any previous approval data
      vacancy.approvedAt = undefined
      vacancy.approvedBy = undefined
    }
    
    await vacancy.save()
    
    // Create notification for the NGO
    const notificationTitle = action === 'approve'
      ? 'Vacancy Approved!'
      : 'Vacancy Rejected'
    
    const notificationMessage = action === 'approve'
      ? `Your vacancy "${vacancy.title}" has been approved and is now live.`
      : `Your vacancy "${vacancy.title}" was rejected. Reason: ${rejectionReason}`
    
    await Notification.create({
      recipient: vacancy.createdBy._id,
      title: notificationTitle,
      message: notificationMessage,
      type: action === 'approve' ? 'vacancy_approved' : 'vacancy_rejected',
      relatedId: vacancy._id,
      relatedModel: 'Vacancy',
      metadata: {
        vacancyTitle: vacancy.title,
        action,
        ...(action === 'reject' && { rejectionReason })
      }
    })
    
    const updatedVacancy = await Vacancy.findById(params.id)
      .populate('createdBy', 'name email organizationName')
      .populate('approvedBy', 'name')
      .lean()
    
    return NextResponse.json({
      message: `Vacancy ${action}d successfully`,
      vacancy: updatedVacancy
    })
  } catch (error) {
    console.error('Error updating vacancy status:', error)
    return NextResponse.json(
      { error: 'Failed to update vacancy status' },
      { status: 500 }
    )
  }
}

// DELETE /api/vacancies/[id] - Delete vacancy
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
        { error: 'Invalid vacancy ID' },
        { status: 400 }
      )
    }
    
    const vacancy = await Vacancy.findById(params.id)
    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found' },
        { status: 404 }
      )
    }
    
    const user = await User.findById(session.user.id)
    
    // Check permissions
    const isOwner = vacancy.createdBy.toString() === session.user.id
    const isAdmin = user?.role === 'admin'
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }
    
    await Vacancy.findByIdAndDelete(params.id)
    
    return NextResponse.json({
      message: 'Vacancy deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting vacancy:', error)
    return NextResponse.json(
      { error: 'Failed to delete vacancy' },
      { status: 500 }
    )
  }
}