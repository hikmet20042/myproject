import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { isAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic'

// GET /api/admin/blogs/[id] - Get single blog by ID for admin preview
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const session = await getServerSession()
    if (!session || !isAdmin(session)) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403)
    }
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*, author_id (id, name, email)')
      .eq('id', params.id)
      .single()
    if (error || !blog) {
      return errorResponse('Story not found', "API_ERROR", {}, 404)
    }
    
    return successResponse({ blog })
  } catch (error) {
    console.error('PUT /api/admin/blogs/[id] error:', error)
    return errorResponse('Failed to update blog', "API_ERROR", {}, 500)
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
    if (!session || !isAdmin(session)) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403)
    }
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', params.id)
      .select('*')
      .single()
    
    if (error || !blog) {
      return errorResponse('Story not found', "API_ERROR", {}, 404)
    }
    
    return successResponse({ 
      message: 'Story deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/admin/blogs/[id] error:', error)
    return errorResponse('Failed to delete blog', "API_ERROR", {}, 500)
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
    if (!session || !isAdmin(session)) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403)
    }
    
    const body = await request.json()
    const { status, adminComment } = body
    
    if (!status) {
      return errorResponse('Status is required', "API_ERROR", {}, 400)
    }
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return errorResponse('Invalid status', "API_ERROR", {}, 400)
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
      return errorResponse('Story not found', "API_ERROR", {}, 404)
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

    if (status === 'approved') {
      try {
        await NotificationService.notifyUsersAboutRelevantItem({
          itemType: 'blog',
          itemId: blog.id.toString(),
          title: blog.title,
          description: blog.abstract || '',
          tags: Array.isArray(blog.tags) ? blog.tags : [],
          actionUrl: `/blogs/${blog.id}`,
        })
      } catch (notifError) {
        console.error('Failed to notify relevant users for blog:', notifError)
      }
    }
    
    return successResponse({ 
      blog,
      message: `Story ${status} successfully`
    })
  } catch (error) {
    console.error('PUT /api/admin/blogs/[id] error:', error)
    return errorResponse('Failed to update blog', "API_ERROR", {}, 500)
  }
}
