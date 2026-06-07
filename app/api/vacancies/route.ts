import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canAccessAdmin, canCreateVacancy, isAdmin, isApprovedOrganization } from '@/lib/auth/permissions'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { buildVacancyDbPayload, mapVacancyRow, validateVacancyPayload } from '@/app/api/vacancies/helpers'
import { applyRateLimit } from '@/lib/rateLimit'
import { submitVacancyToIndexNow } from '@/lib/indexnow'
import { cache, generateCacheKey, withCache } from '@/lib/cache'

// GET /api/vacancies - Get vacancies with filtering
export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'publicRead',
      endpoint: '/api/vacancies',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse(
        'Çox sayda sorğu. Bir az sonra yenidən cəhd edin.',
        'RATE_LIMIT_EXCEEDED',
        { retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) },
        429
      )
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const supabase = createSupabaseAdminClient()
    
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const city = searchParams.get('city')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const createdBy = searchParams.get('createdBy')
    const organizationId = searchParams.get('organizationId')
    const author = searchParams.get('author')
    const adminView = searchParams.get('adminView') === 'true'
    const status = searchParams.get('status') || (adminView ? 'all' : 'approved')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const skip = (page - 1) * limit
    
    let actualCreatedBy = createdBy
    if (author === 'me') {
      const session = await getServerSession()
      if (!session?.user?.id) {
        return errorResponse('Autentifikasiya tələb olunur', "API_ERROR", {}, 401)
      }
      actualCreatedBy = session.user.id
    }
    
    const filter: any = {}
    
    if (adminView) {
      const session = await getServerSession()
      if (!session?.user?.id || !canAccessAdmin(session)) {
        return errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403)
      }
    }

    if (!adminView) {
      if (!actualCreatedBy) {
        filter.status = 'approved'
      }
    } else {
      if (status && status !== 'all') {
        if (status === 'pending') {
          filter.status = 'pending'
        } else if (status === 'approved') {
          filter.status = 'approved'
        } else if (status === 'rejected') {
          filter.status = 'rejected'
        }
      }
    }
    
    if (type && type !== 'all') {
      filter.type = type
    }

    const sortFieldMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      applicationDeadline: 'application_deadline',
    }
    const orderField = sortFieldMap[sortBy] || 'created_at'
    const ascending = sortOrder === 'asc'

    const cacheKey = generateCacheKey.vacancies(page, limit, search || undefined, type || undefined, city || undefined, sortBy, sortOrder, dateFrom || undefined, dateTo || undefined);

    const cachedResult = await withCache(
      cache.vacancies,
      cacheKey,
      async () => {
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

        if (!adminView && !actualCreatedBy) {
          query = query.eq('is_published', true)
        }

        if (type && type !== 'all') {
          query = query.eq('type', type)
        }

        if (city) {
          query = query.ilike('city', `%${city}%`)
        }

        if (dateFrom) {
          query = query.gte('application_deadline', `${dateFrom}T00:00:00`)
        }
        if (dateTo) {
          query = query.lte('application_deadline', `${dateTo}T23:59:59`)
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
          throw new Error(error.message)
        }

        const vacancies = (vacancyRows || []).map(mapVacancyRow)
        
        const orgIds = (vacancyRows as { created_by_organization?: { id: string } }[])
          .filter((v) => v.created_by_organization)
          .map((v) => v.created_by_organization!.id)
        
        let orgNames: any[] = []
        if (orgIds.length > 0) {
          const { data: orgData } = await supabase
            .from('organization_profiles')
            .select('account_id, organization_name, email')
            .in('account_id', orgIds)
          orgNames = orgData || []
        }
        
        const vacanciesWithOrgNames = vacancies.map((vacancy: any) => {
          if (!vacancy.createdByOrganization) return vacancy
          const orgProfile = orgNames.find((o: any) => o.account_id === vacancy.createdByOrganization.id)
          return {
            ...vacancy,
            createdByOrganization: {
              ...vacancy.createdByOrganization,
              organizationName: orgProfile?.organization_name || 'Naməlum təşkilat',
              email: orgProfile?.email || vacancy.createdByOrganization.email || null,
            }
          }
        })

        return { vacancies: vacanciesWithOrgNames, total: count || 0 }
      }
    )

    const { vacancies, total } = cachedResult as { vacancies: any[], total: number }
    
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
      vacancies,
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
    
    const successResp = successResponse(response)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      successResp.headers.set(key, value)
    }
    return successResp
    
  } catch (error) {
    console.error('Error fetching vacancies:', error)
    return errorResponse('Vakansiyalar yüklənə bilmədi', "API_ERROR", {}, 500)
  }
}

// POST /api/vacancies - Create new vacancy
export async function POST(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = applyRateLimit({
      request,
      preset: 'write',
      endpoint: '/api/vacancies',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse(
        'Çox sayda sorğu. Bir az sonra yenidən cəhd edin.',
        'RATE_LIMIT_EXCEEDED',
        { retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) },
        429
      )
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const session = await getServerSession()
    
    if (!session?.user?.id) {
      const response = errorResponse('Autentifikasiya tələb olunur', "API_ERROR", {}, 401)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
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
      const response = errorResponse('Yalnız təsdiqlənmiş təşkilatlar vakansiya yarada bilər', "API_ERROR", {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }
    
    const body = await request.json()
    
    const validation = validateVacancyPayload(body)
    if (!validation.valid) {
      const response = errorResponse(validation.error, "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
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
      .select('*, created_by (id, name, email)')
      .single()

    if (error || !vacancyRow) {
      console.error('Error creating vacancy:', error)
      const response = errorResponse('Vakansiya yaradıla bilmədi', "API_ERROR", {}, 500)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    // Fetch organization profile separately if created by org
    let orgProfile = null
    if (vacancyRow.created_by_organization) {
      const { data: orgData } = await supabase
        .from('organization_profiles')
        .select('account_id, organization_name, url_handle')
        .eq('account_id', vacancyRow.created_by_organization)
        .single()
      orgProfile = orgData
    }

    const populatedVacancy = mapVacancyRow({
      ...vacancyRow,
      created_by_organization: orgProfile ? {
        id: orgProfile.account_id,
        organization_name: orgProfile.organization_name,
        url_handle: orgProfile.url_handle,
      } : vacancyRow.created_by_organization,
    })

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
          ? organizationProfile?.data?.organization_name || 'Naməlum təşkilat'
          : session.user.name || 'Naməlum göndərən'
      )
    }

    if (vacancyRow.status === 'approved' && vacancyRow.is_published) {
      await NotificationService.notifyUsersAboutRelevantItem({
        itemType: 'vacancy',
        itemId: populatedVacancy.id,
        title: populatedVacancy.title,
        description: populatedVacancy.description,
        tags: [],
        actionUrl: `/resources/vacancies/${populatedVacancy.slug || populatedVacancy.id}`,
      });

      void submitVacancyToIndexNow(populatedVacancy.slug || populatedVacancy.id);
    }
    
    const successResp = successResponse({
      message: 'Vakansiya uğurla yaradıldı',
      vacancy: populatedVacancy
    }, {}, 201)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      successResp.headers.set(key, value)
    }
    return successResp
    
  } catch (error) {
    console.error('Error creating vacancy:', error)
    return errorResponse('Vakansiya yaradıla bilmədi', "API_ERROR", {}, 500)
  }
}
