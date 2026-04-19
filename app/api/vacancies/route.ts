import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canAccessAdmin, canCreateVacancy, isAdmin, isApprovedOrganization } from '@/lib/auth/permissions'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { buildVacancyDbPayload, mapVacancyRow, validateVacancyPayload } from '@/app/api/vacancies/helpers'

// GET /api/vacancies - Get vacancies with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const createdBy = searchParams.get('createdBy') // For organization's own vacancies
    const organizationId = searchParams.get('organizationId')
    const author = searchParams.get('author') // Handle 'author=me' parameter
    const adminView = searchParams.get('adminView') === 'true'
    const status = searchParams.get('status') || (adminView ? 'all' : 'approved')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const skip = (page - 1) * limit
    
    // Handle author=me parameter
    let actualCreatedBy = createdBy
    if (author === 'me') {
      const session = await getServerSession()
      if (!session?.user?.id) {
        return errorResponse('Authentication required', "API_ERROR", {}, 401)
      }
      actualCreatedBy = session.user.id
    }
    
    // Build filter object
    const filter: any = {}
    
    // Admin view requires admin session
    if (adminView) {
      const session = await getServerSession()
      if (!session?.user?.id || !canAccessAdmin(session)) {
        return errorResponse('Admin access required', "API_ERROR", {}, 403)
      }
    }

    // Admin view shows all vacancies, regular view shows only approved
    if (!adminView) {
      // Regular view: only show approved vacancies unless filtering by creator
      if (!createdBy) {
        filter.status = 'approved'
      }
    } else {
      // Admin view with status filtering
      if (status && status !== 'all') {
        if (status === 'pending') {
          filter.status = 'pending'
        } else if (status === 'approved') {
          filter.status = 'approved'
        } else if (status === 'rejected') {
          filter.status = 'rejected'
        }
      }
      // If status is 'all' or not specified in admin view, show all vacancies (no additional filter)
    }
    
    // Type filter
    if (type && type !== 'all') {
      filter.type = type
    }

    // Search filter
    const searchOr = search
      ? [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { requirements: { $regex: search, $options: 'i' } }
        ]
      : null

    // Combine creator and search so they don't overwrite each other
    const creatorOr = actualCreatedBy
      ? [{ createdBy: actualCreatedBy }, { createdByOrganization: actualCreatedBy }]
      : null
    const andParts: any[] = []
    if (creatorOr) andParts.push({ $or: creatorOr })
    if (searchOr) {
      andParts.push({ $or: searchOr })
    }
    if (andParts.length > 0) {
      filter.$and = andParts
    }
    
    const sortFieldMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      applicationDeadline: 'application_deadline',
    }
    const orderField = sortFieldMap[sortBy] || 'created_at'
    const ascending = sortOrder === 'asc'

    let query = supabase
      .from('vacancies_with_stats')
      .select(
        '*, created_by (id, name, email), created_by_organization (id), approved_by (id, name)',
        { count: 'exact' }
      )
      .order(orderField, { ascending })
      .range(skip, skip + limit - 1)

    if (filter.status) {
      query = query.eq('status', filter.status)
    }

    if (!adminView && !createdBy) {
      query = query.eq('is_published', true)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (actualCreatedBy) {
      query = query.or(`created_by.eq.${actualCreatedBy},created_by_organization.eq.${actualCreatedBy}`)
    }

    if (organizationId) {
      query = query.eq('created_by_organization', organizationId)
    }

    if (search) {
      const searchFilter = `title.ilike.%${search}%,description.ilike.%${search}%`
      query = query.or(searchFilter)
    }

    const { data: vacancyRows, error, count } = await query

    if (error) {
      console.error('Error fetching vacancies:', error)
      return errorResponse('Failed to fetch vacancies', "API_ERROR", {}, 500)
    }

    const vacancies = (vacancyRows || []).map(mapVacancyRow)
    
    // Fetch organization names for vacancies created by organizations
    const orgIds = vacancyRows
      .filter((v: any) => v.created_by_organization)
      .map((v: any) => v.created_by_organization.id)
    
    let orgNames: any[] = []
    if (orgIds.length > 0) {
      const { data: orgData } = await supabase
        .from('organization_profiles')
        .select('account_id, organization_name, email')
        .in('account_id', orgIds)
      orgNames = orgData || []
    }
    
    // Merge organization names into vacancies
    const vacanciesWithOrgNames = vacancies.map((vacancy: any) => {
      if (!vacancy.createdByOrganization) return vacancy
      const orgProfile = orgNames.find((o: any) => o.account_id === vacancy.createdByOrganization.id)
      return {
        ...vacancy,
        createdByOrganization: {
          ...vacancy.createdByOrganization,
          organizationName: orgProfile?.organization_name || 'Unknown organization',
          email: orgProfile?.email || vacancy.createdByOrganization.email || null,
        }
      }
    })
    
    const total = count || 0
    
    // Calculate stats for admin view
    let stats = null
    if (adminView) {
      const [pendingResult, approvedResult, rejectedResult, totalResult] = await Promise.all([
        supabase.from('vacancies').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('vacancies').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('vacancies').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('vacancies').select('id', { count: 'exact', head: true })
      ])
      
      stats = {
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
        total: totalResult.count || 0
      }
    }
    
    const response: any = {
      vacancies: vacanciesWithOrgNames,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalVacancies: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
        pages: Math.ceil(total / limit)
      }
    }
    
    if (stats) {
      response.stats = stats
    }
    
    return successResponse(response)
    
  } catch (error) {
    console.error('Error fetching vacancies:', error)
    return errorResponse('Failed to fetch vacancies', "API_ERROR", {}, 500)
  }
}

// POST /api/vacancies - Create new vacancy
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return errorResponse('Authentication required', "API_ERROR", {}, 401)
    }
    
    const supabase = createSupabaseAdminClient()
    const organizationProfile = isApprovedOrganization(session)
      ? await supabase
          .from('organization_profiles')
          .select('organization_name')
          .eq('account_id', session.user.id)
          .single()
      : { data: null, error: null }
    
    // Allow admin or approved organization only
    if (!canCreateVacancy(session)) {
      return errorResponse('Only approved organizations can create vacancies', "API_ERROR", {}, 403)
    }
    
    const body = await request.json()
    
    const validation = validateVacancyPayload(body)
    if (!validation.valid) {
      return errorResponse(validation.error, "API_ERROR", {}, 400)
    }

    const vacancyData = buildVacancyDbPayload(body)

    const { data: vacancyRow, error } = await supabase
      .from('vacancies')
      .insert({
        ...vacancyData,
        created_by: isApprovedOrganization(session) ? null : session.user.id,
        created_by_organization: isApprovedOrganization(session) ? session.user.id : null,
        status: isAdmin(session) ? 'approved' : 'pending',
        is_published: isAdmin(session),
        is_featured: false,
        is_urgent: false,
      })
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, url_handle)')
      .single()

    if (error || !vacancyRow) {
      console.error('Error creating vacancy:', error)
      return errorResponse('Failed to create vacancy', "API_ERROR", {}, 500)
    }

    const populatedVacancy = mapVacancyRow(vacancyRow)

    if (isApprovedOrganization(session) && organizationProfile?.data?.organization_name) {
      await NotificationService.notifyOrganizationFollowersAboutNewContent({
        organizationId: session.user.id,
        organizationName: organizationProfile.data.organization_name,
        contentType: 'vacancy',
        contentId: populatedVacancy.id,
        contentSlug: populatedVacancy.slug || populatedVacancy.id,
        contentTitle: populatedVacancy.title,
      })
    }

    if (vacancyRow.status === 'pending') {
      await NotificationService.notifyAdminsAboutSubmission(
        'vacancy',
        populatedVacancy.id,
        populatedVacancy.title,
        isApprovedOrganization(session)
          ? organizationProfile?.data?.organization_name || 'Unknown organization'
          : session.user.name || 'Unknown submitter'
      )
    }

    if (vacancyRow.status === 'approved' && vacancyRow.is_published) {
      await NotificationService.notifyUsersAboutRelevantItem({
        itemType: 'vacancy',
        itemId: populatedVacancy.id,
        title: populatedVacancy.title,
        description: populatedVacancy.description,
        tags: [],
        actionUrl: `/resources/vacancies/${populatedVacancy.id}`,
      })
    }
    
    return successResponse({
      message: 'Vacancy created successfully',
      vacancy: populatedVacancy
    }, {}, 201)
    
  } catch (error) {
    console.error('Error creating vacancy:', error)
    return errorResponse('Failed to create vacancy', "API_ERROR", {}, 500)
  }
}
