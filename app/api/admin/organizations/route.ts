import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/permissions';
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { NotificationService } from '@/features/notifications/services/notificationService'
import { applyRateLimit } from '@/lib/rateLimit'
import { escapeIlike } from '@/lib/utils'
import type { OrganizationProfileRow, OrganizationListRow, OrganizationActionBody, OrganizationBulkActionBody } from '@/features/admin/types/organization'


// GET - Fetch all organization registrations for admin review
export async function GET(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
      request,
      preset: 'admin',
      endpoint: '/api/admin/organizations',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response
    }

    const session = await getServerSession();
    
    if (!isAdmin(session)) {
      const response = errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response;
    }

    const supabase = createSupabaseAdminClient();
    
    const { searchParams } = new URL(request.url);
    const pageParam = parseInt(searchParams.get('page') || '1');
    const limitParam = parseInt(searchParams.get('limit') || '10');
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 10;
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;
    const allowedSortColumns: Record<string, string> = {
      organizationName: 'organization_name',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      moderation_status: 'moderation_status',
    };
    const sortColumn = allowedSortColumns[sortBy] || 'created_at';

    let query = supabase
      .from('organization_profiles')
      .select('account_id, organization_name, email, description, moderation_status, reviewed_at, reviewed_by, admin_comment, created_at, updated_at, contact_person', { count: 'exact' })
      .order(sortColumn, { ascending: sortOrder !== 'desc' })
      .range(skip, skip + limit - 1);

    if (status !== 'all') {
      query = query.eq('moderation_status', status);
    }

    if (search) {
      const safeSearch = escapeIlike(search)
      query = query.or(
        `organization_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`
      );
    }

    const { data: organizations = [], count, error } = await query;
    if (error) {
      throw error;
    }
    const organizationRows = organizations || [];

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const { count: pendingCount = 0 } = await supabase
      .from('organization_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'pending');
    const { count: approvedCount = 0 } = await supabase
      .from('organization_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'approved');
    const { count: rejectedCount = 0 } = await supabase
      .from('organization_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'rejected');

    const successResp = successResponse({
      organizations: (organizationRows as OrganizationProfileRow[]).map((org) => ({
        _id: org.account_id,
        organizationName: org.organization_name,
        email: org.email,
        description: org.description,
        status: org.moderation_status,
        approvedAt: org.reviewed_at,
        approvedBy: org.reviewed_by,
        adminComment: org.admin_comment,
        createdAt: org.created_at,
        updatedAt: org.updated_at,
        contactPerson: org.contact_person
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total
      }
    });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      successResp.headers.set(key, value)
    }
    return successResp;

  } catch (error) {
    console.error('GET /api/admin/organizations error:', error);
    return errorResponse('Təşkilatlar yüklənə bilmədi', "API_ERROR", {}, 500);
  }
}

// PUT - Approve or reject organization registration
export async function PUT(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
      request,
      preset: 'admin',
      endpoint: '/api/admin/organizations',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', "RATE_LIMIT_EXCEEDED", {}, 429);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response;
    }

    const session = await getServerSession();
    
    if (!isAdmin(session)) {
      const response = errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response;
    }

    const supabase = createSupabaseAdminClient();
    
    const { id, organizationId, action, rejectionReason } = await request.json() as OrganizationActionBody;
    
    // Support both 'id' and 'organizationId'
    const userId = id || organizationId;
    
    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      const response = errorResponse('Yanlış sorğu məlumatı', "API_ERROR", {}, 400);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response;
    }

    const rejectionReasonText = rejectionReason?.trim() || '';

    if (action === 'reject' && !rejectionReasonText) {
      const response = errorResponse('Rədd səbəbi tələb olunur', "API_ERROR", {}, 400);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response;
    }

    const { data: organization, error: orgError } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', userId)
      .single();

    if (orgError || !organization) {
      const response = errorResponse('Təşkilat tapılmadı', "API_ERROR", {}, 404);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response;
    }

    const adminUserId = session?.user?.id;
    if (!adminUserId) {
      const response = errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response;
    }

    const { data: reviewerProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', adminUserId)
      .maybeSingle();
    const reviewerId = reviewerProfile?.id ?? null;

    const updateData: Record<string, string | null> = {};
    if (action === 'approve') {
      updateData.moderation_status = 'approved';
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by = reviewerId;
      updateData.admin_comment = null;
    } else if (action === 'reject') {
      updateData.moderation_status = 'rejected';
      updateData.admin_comment = rejectionReasonText;
      updateData.reviewed_at = null;
      updateData.reviewed_by = null;
    }

    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organization_profiles')
      .update(updateData)
      .eq('account_id', userId)
      .select('*')
      .single();

    if (updateError || !updatedOrganization) {
      const response = errorResponse(updateError?.message || 'Təşkilat yenilənə bilmədi', "API_ERROR", {}, 500);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      return response;
    }

    // Send notification to organization
    const notificationTitle = action === 'approve' 
      ? 'Təşkilat qeydiyyatı təsdiqləndi!' 
      : 'Təşkilat qeydiyyatı yeniləndi';
    
    const notificationMessage = action === 'approve'
      ? `Təbriklər! "${updatedOrganization.organization_name}" təşkilatınız təsdiqləndi. İndi bütün təşkilat funksiyalarına çıxışınız var.`
      : `Təşkilat qeydiyyatınız nəzərdən keçirildi. Səbəb: ${rejectionReasonText}`;

    await NotificationService.createNotification({
      organizationId: updatedOrganization.account_id,
      type: action === 'approve' ? 'organization_approved' : 'organization_rejected',
      title: notificationTitle,
      message: notificationMessage,
      data: {
        action,
        organizationName: updatedOrganization.organization_name,
        ...(action === 'reject' && { rejectionReason: rejectionReasonText })
      },
      actionUrl: '/profile',
    })

    const successResp = successResponse({ 
      message: `Organization ${action}d successfully`,
      organization: {
        _id: updatedOrganization.account_id,
        organizationName: updatedOrganization.organization_name,
        email: updatedOrganization.email,
        status: updatedOrganization.moderation_status,
        approvedAt: updatedOrganization.reviewed_at,
        approvedBy: updatedOrganization.reviewed_by,
        ...(action === 'reject' && { rejectionReason: rejectionReasonText })
      }
    });
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      successResp.headers.set(key, value)
    }
    return successResp;

  } catch (error) {
    console.error('PUT /api/admin/organizations error:', error);
    return errorResponse('Təşkilat statusu yenilənə bilmədi', "API_ERROR", {}, 500);
  }
}

// PATCH - Bulk operations on organizations
export async function PATCH(request: NextRequest) {
  try {
    const { result: rateLimitResult, headers: rateLimitHeaders } = await applyRateLimit({
      request,
      preset: 'admin',
      endpoint: '/api/admin/organizations',
    })

    if (!rateLimitResult.allowed) {
      const response = errorResponse('Çox sayda sorğu. Bir az sonra yenidən cəhd edin.', 'RATE_LIMIT_EXCEEDED', {}, 429)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const session = await getServerSession();
    
    if (!isAdmin(session)) {
      const response = errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const supabase = createSupabaseAdminClient();
    
    const { action, organizationIds, rejectionReason } = await request.json() as OrganizationBulkActionBody;
    
    if (!action || !organizationIds || !Array.isArray(organizationIds) || organizationIds.length === 0) {
      const response = errorResponse('Yanlış sorğu məlumatı', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    if (!['approve', 'reject'].includes(action)) {
      const response = errorResponse('Yanlış əməliyyat', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const rejectionReasonText = rejectionReason?.trim() || '';

    if (action === 'reject' && !rejectionReasonText) {
      const response = errorResponse('Kütləvi rədd üçün rədd səbəbi tələb olunur', "API_ERROR", {}, 400)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const adminUserId = session?.user?.id;
    if (!adminUserId) {
      const response = errorResponse('Admin girişi tələb olunur', "API_ERROR", {}, 403)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const { data: organizations = [] } = await supabase
      .from('organization_profiles')
      .select('account_id, organization_name')
      .in('account_id', organizationIds);
    const organizationRows = (organizations || []) as OrganizationListRow[];

    if (organizationRows.length === 0) {
      const response = errorResponse('Etibarlı təşkilat tapılmadı', "API_ERROR", {}, 404)
      for (const [key, value] of Object.entries(rateLimitHeaders)) response.headers.set(key, value)
      return response
    }

    const updateData: Record<string, string | null> = {};
    if (action === 'approve') {
      updateData.moderation_status = 'approved';
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by = adminUserId;
      updateData.admin_comment = null;
    } else if (action === 'reject') {
      updateData.moderation_status = 'rejected';
      updateData.admin_comment = rejectionReasonText;
      updateData.reviewed_at = null;
      updateData.reviewed_by = null;
    }

    await supabase
      .from('organization_profiles')
      .update(updateData)
      .in('account_id', organizationIds);

    // Send notifications to all affected organizations
    for (const organization of organizationRows) {
      const notificationTitle = action === 'approve' 
        ? 'Təşkilat qeydiyyatı təsdiqləndi!' 
        : 'Təşkilat qeydiyyatı yeniləndi';
      
      const notificationMessage = action === 'approve'
        ? `Təbriklər! "${organization.organization_name}" təşkilatınız təsdiqləndi. İndi bütün təşkilat funksiyalarına çıxışınız var.`
        : `Təşkilat qeydiyyatınız nəzərdən keçirildi. Səbəb: ${rejectionReasonText}`;

      await NotificationService.createNotification({
        organizationId: organization.account_id,
        type: action === 'approve' ? 'organization_approved' : 'organization_rejected',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          action,
          organizationName: organization.organization_name,
          ...(action === 'reject' && { rejectionReason: rejectionReasonText })
        },
        actionUrl: '/profile',
      })
    }

    const successResp = successResponse({ 
      message: `${organizationRows.length} organization(s) ${action}d successfully`,
      processedCount: organizationRows.length
    })
    for (const [key, value] of Object.entries(rateLimitHeaders)) successResp.headers.set(key, value)
    return successResp

  } catch (error) {
    console.error('PATCH /api/admin/organizations error:', error);
    return errorResponse('Kütləvi təşkilat əməliyyatı yerinə yetirilə bilmədi', "API_ERROR", {}, 500);
  }
}
