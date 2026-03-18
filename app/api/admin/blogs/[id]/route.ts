import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { NotificationService } from '@/lib/services/notificationService'
import { isAdminSession } from '@/lib/roles'

export const dynamic = 'force-dynamic'

async function isAdmin(session: any) {
  return isAdminSession(session)
}

// GET /api/admin/blogs/[id] - Get single blog by ID for admin preview
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*, author_id (id, name, email)')
      .eq('id', params.id)
      .single()
    if (error || !blog) {
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
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', params.id)
      .select('*')
      .single()
    
    if (error || !blog) {
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
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
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
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .update({
        status,
        admin_comment: adminComment || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id
      })
      .eq('id', params.id)
      .select('*')
      .single()
    
    if (error || !blog) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    // Send notification to blog author about the status change
    if (blog.author_id) {
      try {
        await NotificationService.notifyBlogStatus(
          blog.author_id.toString(),
          blog.id.toString(),
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