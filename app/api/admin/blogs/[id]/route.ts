import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Blog from '@/lib/models/Blog'
import { NotificationService } from '@/lib/services/notificationService'

export const dynamic = 'force-dynamic'

async function isAdmin(session: any) {
  return session?.user?.email === 'hikmat.mammadlii@gmail.com' || session?.user?.role === 'admin'
}

// GET /api/admin/blogs/[id] - Get single blog by ID for admin preview
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const session = await getServerSession(authOptions)
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const blog = await Blog.findById(params.id)
      .populate('author', 'name email _id') // Populate author with name, email, and _id
      .lean()
    if (!blog) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ blog })
  } catch (error) {
    console.error('PUT /api/admin/blogs/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update blog' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/blogs/[id] - Delete blog permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const session = await getServerSession(authOptions)
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const blog = await Blog.findByIdAndDelete(params.id)
    
    if (!blog) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Story deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/admin/blogs/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/blogs/[id] - Update blog status and admin comment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const session = await getServerSession(authOptions)
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { status, adminComment } = body
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    
    const blog = await Blog.findByIdAndUpdate(
      params.id,
      {
        status,
        adminComment: adminComment || null,
        reviewedAt: new Date(),
        reviewedBy: session.user.id
      },
      { new: true }
    )
    
    if (!blog) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    // Send notification to blog author about the status change
    if (blog.authorId) {
      try {
        await NotificationService.notifyBlogStatus(
          blog.authorId.toString(),
          blog._id.toString(),
          blog.title,
          status,
          adminComment
        )
      } catch (notifError) {
        console.error('Failed to send notification:', notifError)
        // Don't fail the whole request if notification fails
      }
    }
    
    return NextResponse.json({ 
      blog,
      message: `Story ${status} successfully`
    })
  } catch (error) {
    console.error('PUT /api/admin/blogs/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update blog' },
      { status: 500 }
    )
  }
}