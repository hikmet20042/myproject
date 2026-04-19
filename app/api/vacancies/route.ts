import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canAccessAdmin, canCreateVacancy, isAdmin, isApprovedOrganization } from '@/lib/auth/permissions'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { successResponse, errorResponse } from '@/lib/apiResponse'

const mapVacancy = (row: any) => ({
  _id: row.id,
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  type: row.type,
  category: row.category,
  workType: row.work_type,
  location: row.location,
  requirements: row.requirements || [],
  responsibilities: row.responsibilities || [],
  qualifications: row.qualifications || [],
  experienceLevel: row.experience_level,
  duration: row.duration,
  compensation: row.compensation,
  applicationProcess: row.application_process,
  applicationDeadline: row.application_deadline,
  startDate: row.start_date,
  skills: row.skills || [],
  languages: row.languages || [],
  tags: row.tags || [],
  imageUrl: row.image_url,
  createdBy: row.created_by
    ? { _id: row.created_by.id, name: row.created_by.name, email: row.created_by.email }
    : row.created_by,
  createdByOrganization: row.created_by_organization
    ? { _id: row.created_by_organization.id, id: row.created_by_organization.id, organizationName: row.created_by_organization.organization_name, email: row.created_by_organization.email }
    : row.created_by_organization,
  status: row.status,
  approvedAt: row.approved_at,
  approvedBy: row.approved_by
    ? { _id: row.approved_by.id, name: row.approved_by.name }
    : row.approved_by,
  rejectedAt: row.rejected_at,
  rejectionReason: row.rejection_reason,
  adminComment: row.admin_comment,
  isPublished: row.is_published,
  isFeatured: row.is_featured,
  isUrgent: row.is_urgent,
  applicationCount: row.application_count,
  views: row.real_views ?? row.views,
  uniqueViews: row.real_unique_views ?? row.unique_views,
  saves: row.real_saves ?? row.saves ?? 0,
  viewedBy: row.viewed_by || [],
  engagementScore: row.engagement_score,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// GET /api/vacancies - Get vacancies with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const location = searchParams.get('location')
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

    // Location filter (location is an object: city, country, address)
    const locationRe = location && location !== 'all' ? new RegExp(location, 'i') : null
    const locationOr = locationRe
      ? [
          { 'location.city': locationRe },
          { 'location.country': locationRe },
          { 'location.address': locationRe }
        ]
      : null

    // Search filter
    const searchOr = search
      ? [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { requirements: { $regex: search, $options: 'i' } }
        ]
      : null

    // Combine creator, location, and search so they don't overwrite each other
    const creatorOr = actualCreatedBy
      ? [{ createdBy: actualCreatedBy }, { createdByOrganization: actualCreatedBy }]
      : null
    const andParts: any[] = []
    if (creatorOr) andParts.push({ $or: creatorOr })
    if (locationOr && searchOr) {
      andParts.push({ $or: locationOr }, { $or: searchOr })
    } else if (locationOr) {
      andParts.push({ $or: locationOr })
    } else if (searchOr) {
      andParts.push({ $or: searchOr })
    }
    if (andParts.length > 0) {
      filter.$and = andParts
    }
    
    const sortFieldMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      applicationDeadline: 'application_deadline',
      startDate: 'start_date'
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

    if (location && location !== 'all') {
      const locationFilter = `location->>city.ilike.%${location}%,location->>country.ilike.%${location}%,location->>address.ilike.%${location}%`
      query = query.or(locationFilter)
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

    const vacancies = (vacancyRows || []).map(mapVacancy)
    
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
    
    // Validate required fields
    const requiredFields = [
      'title', 'description', 'type', 'category', 'workType', 'experienceLevel', 'applicationDeadline', 'applicationInstructions'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return errorResponse(`${field} is required`, "API_ERROR", {}, 400)
      }
    }

    const descText = typeof body.description === 'string'
      ? body.description.replace(/<[^>]*>/g, '').trim()
      : ''
    if (!descText || descText.length < 50) {
      return errorResponse('Description must be at least 50 characters long', "API_ERROR", {}, 400)
    }

    if (typeof body.applicationInstructions === 'string') {
      const instr = body.applicationInstructions.trim()
      if (instr.length < 30) {
        return errorResponse('Application instructions must be at least 30 characters long', "API_ERROR", {}, 400)
      }
    }

    // Validate application method
    if (body.applicationMethod === 'link' && !body.applicationLink) {
      return errorResponse('Application link is required when using link method', "API_ERROR", {}, 400)
    }

    if (body.applicationMethod === 'email' && !body.applicationEmail) {
      return errorResponse('Application email is required when using email method', "API_ERROR", {}, 400)
    }
    
    // Validate deadline if provided
    if (body.deadline) {
      const deadline = new Date(body.deadline)
      if (deadline <= new Date()) {
        return errorResponse('Deadline must be in the future', "API_ERROR", {}, 400)
      }
    }
    
    // Prepare application process data
    const applicationProcess: any = {
      instructions: body.applicationInstructions || ''
    }
    
    if (body.applicationMethod === 'link' && body.applicationLink) {
      applicationProcess.applicationLink = body.applicationLink
    }
    
    if (body.applicationMethod === 'email' && body.applicationEmail) {
      applicationProcess.email = body.applicationEmail
    }

    // Map compensation type from form values to database enum values
    const mapCompensationType = (formType: string): string => {
      switch (formType) {
        case 'salary':
        case 'hourly':
        case 'negotiable':
          return 'paid'
        case 'volunteer':
          return 'unpaid'
        case 'stipend':
          return 'stipend'
        default:
          return 'unpaid' // fallback
      }
    }

    // Prepare compensation data
    const compensation: any = {
      type: mapCompensationType(body.compensationType || 'volunteer')
    }
    
    if (body.compensationAmount && body.compensationType !== 'volunteer') {
      compensation.amount = parseFloat(body.compensationAmount.replace(/[^0-9.]/g, ''))
      compensation.currency = body.compensationCurrency || 'USD'
    }
    
    // Set compensation period based on type
    if (body.compensationType === 'salary') {
      compensation.period = 'yearly'
    } else if (body.compensationType === 'hourly') {
      compensation.period = 'hourly'
    }

    // Map duration type from form values to database enum values
    const mapDurationType = (formType: string): string => {
      switch (formType) {
        case 'permanent':
          return 'permanent'
        case 'fixed':
        case 'project':
          return 'contract'
        case 'temporary':
          return 'temporary'
        default:
          return 'temporary' // fallback
      }
    }

    // Prepare duration data
    const duration: any = {
      type: mapDurationType(body.durationType || 'permanent')
    }
    
    if (body.contractLength && body.contractUnit && body.durationType !== 'permanent') {
      duration.contractLength = {
        value: parseInt(body.contractLength),
        unit: body.contractUnit
      }
    }

    // Prepare location data
    const location: any = {
      isRemote: body.workType === 'remote'
    }
    
    if (body.city) {
      location.city = body.city
    }
    
    if (body.country) {
      location.country = body.country
    }
    
    if (body.address) {
      location.address = body.address
    }

    // Create vacancy with proper structure
    const vacancyData = {
      title: body.title,
      description: body.description,
      type: body.type,
      category: body.category,
      work_type: body.workType,
      experience_level: body.experienceLevel,
      location,
      compensation: {
        ...compensation,
        benefits: body.benefits || []
      },
      duration,
      application_process: {
        ...applicationProcess,
        contactPhone: body.contactPhone || undefined,
        requiredDocuments: body.requiredDocuments || []
      },
      application_deadline: body.applicationDeadline,
      responsibilities: body.responsibilities || [],
      requirements: body.requirements || [],
      qualifications: body.qualifications || [],
      tags: body.tags || [],
      created_by: isApprovedOrganization(session) ? null : session.user.id,
      created_by_organization: isApprovedOrganization(session) ? session.user.id : null,
      status: isAdmin(session) ? 'approved' : 'pending',
      is_published: isAdmin(session),
      is_featured: false,
      is_urgent: false
    }

    const { data: vacancyRow, error } = await supabase
      .from('vacancies')
      .insert({
        ...vacancyData,
        experience_level: body.experienceLevel,
        application_deadline: body.applicationDeadline,
        start_date: body.startDate || null,
        skills: body.skills || [],
        languages: body.languages || [],
        image_url: body.imageUrl || null
      })
      .select('*, created_by (id, name, email), created_by_organization (id, organization_name, url_handle)')
      .single()

    if (error || !vacancyRow) {
      console.error('Error creating vacancy:', error)
      return errorResponse('Failed to create vacancy', "API_ERROR", {}, 500)
    }

    const populatedVacancy = mapVacancy(vacancyRow)

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
        tags: Array.isArray(populatedVacancy.tags) ? populatedVacancy.tags : [],
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
