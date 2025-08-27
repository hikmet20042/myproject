import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Story from '@/lib/models/Story'

export const dynamic = 'force-dynamic'

async function isAdmin(session: any) {
  return session?.user?.email === 'hikmat.mammadlii@gmail.com' || session?.user?.role === 'admin'
}

// GET /api/admin/stories/[id] - Get single story by ID for admin preview
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
    
    const story = await Story.findById(params.id).lean()
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ story })
  } catch (error) {
    console.error('GET /api/admin/stories/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch story' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/stories/[id] - Update story status and admin comment
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
    
    const story = await Story.findByIdAndUpdate(
      params.id,
      {
        status,
        adminComment: adminComment || null,
        reviewedAt: new Date(),
        reviewedBy: session.user.id
      },
      { new: true }
    )
    
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      story,
      message: `Story ${status} successfully`
    })
  } catch (error) {
    console.error('PUT /api/admin/stories/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update story' },
      { status: 500 }
    )
  }
}