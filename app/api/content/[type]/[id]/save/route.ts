import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/apiResponse'

const CONTENT_TABLE_BY_TYPE = {
  blog: 'blogs',
  event: 'events',
  vacancy: 'vacancies',
} as const

type ContentType = keyof typeof CONTENT_TABLE_BY_TYPE

const isContentType = (value: string): value is ContentType => value in CONTENT_TABLE_BY_TYPE

async function assertContentExists(supabase: any, contentType: ContentType, contentId: string) {
  const tableName = CONTENT_TABLE_BY_TYPE[contentType]
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .eq('id', contentId)
    .maybeSingle()
  if (error) throw error
  return Boolean(data?.id)
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { type: string; id: string } },
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return errorResponse('Unauthorized', 'API_ERROR', {}, 401)

    const contentType = String(params.type || '').trim().toLowerCase()
    const contentId = String(params.id || '').trim()
    if (!contentId || !isContentType(contentType)) {
      return errorResponse('Invalid save payload', 'API_ERROR', {}, 400)
    }

    const supabase = createSupabaseAdminClient()
    const exists = await assertContentExists(supabase, contentType, contentId)
    if (!exists) return errorResponse('Content not found', 'API_ERROR', {}, 404)

    const { data: existing } = await supabase
      .from('content_saves')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle()

    let action: 'saved' | 'unsaved' = 'saved'
    let saved = true

    if (existing?.id) {
      const { error: deleteError } = await supabase
        .from('content_saves')
        .delete()
        .eq('id', existing.id)
      if (deleteError) return errorResponse(deleteError.message, 'API_ERROR', {}, 500)
      action = 'unsaved'
      saved = false
    } else {
      const { error: insertError } = await supabase
        .from('content_saves')
        .insert({
          user_id: session.user.id,
          content_type: contentType,
          content_id: contentId,
        })
      if (insertError) return errorResponse(insertError.message, 'API_ERROR', {}, 500)
    }

    const { count: totalSaves } = await supabase
      .from('content_saves')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', contentType)
      .eq('content_id', contentId)

    return successResponse({ action, saved, totalSaves: totalSaves || 0 })
  } catch (error) {
    console.error('Content save POST error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { type: string; id: string } },
) {
  try {
    const contentType = String(params.type || '').trim().toLowerCase()
    const contentId = String(params.id || '').trim()
    if (!contentId || !isContentType(contentType)) {
      return errorResponse('Invalid save query', 'API_ERROR', {}, 400)
    }

    const supabase = createSupabaseAdminClient()
    const exists = await assertContentExists(supabase, contentType, contentId)
    if (!exists) return errorResponse('Content not found', 'API_ERROR', {}, 404)

    const session = await getServerSession()
    let saved = false

    if (session?.user?.id) {
      const { data } = await supabase
        .from('content_saves')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .maybeSingle()
      saved = Boolean(data?.id)
    }

    const { count: totalSaves, error: countError } = await supabase
      .from('content_saves')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', contentType)
      .eq('content_id', contentId)

    if (countError) return errorResponse(countError.message, 'API_ERROR', {}, 500)
    return successResponse({ saved, totalSaves: totalSaves || 0 })
  } catch (error) {
    console.error('Content save GET error:', error)
    return errorResponse('Internal server error', 'API_ERROR', {}, 500)
  }
}
