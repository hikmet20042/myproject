import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdminSession } from '@/lib/roles';

// Helper function to check admin access
async function isAdmin(session: any) {
  return isAdminSession(session);
}

// GET - Fetch all organization registrations for admin review
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;
    const sortColumn = sortBy === 'organizationName' ? 'organization_name' : sortBy === 'createdAt' ? 'created_at' : sortBy;

    let query = supabase
      .from('organization_profiles')
      .select('account_id, organization_name, email, description, moderation_status, reviewed_at, reviewed_by, admin_comment, created_at, updated_at, contact_person', { count: 'exact' })
      .order(sortColumn, { ascending: sortOrder !== 'desc' })
      .range(skip, skip + limit - 1);

    if (status !== 'all') {
      query = query.eq('moderation_status', status);
    }

    if (search) {
      query = query.or(
        `organization_name.ilike.%${search}%,email.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data: organizations = [], count, error } = await query;
    if (error) {
      throw error;
    }
    const organizationRows = organizations || [];

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get counts for different statuses from organization collection
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

    return NextResponse.json({
      organizations: organizationRows.map((org: any) => ({
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

  } catch (error) {
    console.error('GET /api/admin/organizations error:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

// PUT - Approve or reject organization registration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();
    
    const { id, organizationId, action, rejectionReason } = await request.json();
    
    // Support both 'id' and 'organizationId'
    const userId = id || organizationId;
    
    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    if (action === 'reject' && !rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const { data: organization, error: orgError } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', userId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // reviewed_by references public.users(id); admin may exist only in accounts after a reset.
    const { data: reviewerProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle();
    const reviewerId = reviewerProfile?.id ?? null;

    const updateData: any = {};
    if (action === 'approve') {
      updateData.moderation_status = 'approved';
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by = reviewerId;
      updateData.admin_comment = null;
    } else if (action === 'reject') {
      updateData.moderation_status = 'rejected';
      updateData.admin_comment = rejectionReason.trim();
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
      return NextResponse.json({ error: updateError?.message || 'Failed to update organization' }, { status: 500 });
    }

    // Send notification to organization
    const notificationTitle = action === 'approve' 
      ? 'Təşkilat qeydiyyatı təsdiqləndi!' 
      : 'Təşkilat qeydiyyatı yeniləndi';
    
    const notificationMessage = action === 'approve'
      ? `Təbriklər! "${updatedOrganization.organization_name}" təşkilatınız təsdiqləndi. İndi bütün təşkilat funksiyalarına çıxışınız var.`
      : `Təşkilat qeydiyyatınız nəzərdən keçirildi. Səbəb: ${rejectionReason}`;

    await supabase.from('notifications').insert({
      organization_id: updatedOrganization.account_id,
      type: action === 'approve' ? 'organization_approved' : 'organization_rejected',
      title: notificationTitle,
      message: notificationMessage,
      data: { 
        action,
        organizationName: updatedOrganization.organization_name,
        ...(action === 'reject' && { rejectionReason })
      },
    });

    return NextResponse.json({ 
      message: `Organization ${action}d successfully`,
      organization: {
        _id: updatedOrganization.account_id,
        organizationName: updatedOrganization.organization_name,
        email: updatedOrganization.email,
        status: updatedOrganization.moderation_status,
        approvedAt: updatedOrganization.reviewed_at,
        approvedBy: updatedOrganization.reviewed_by
      }
    });

  } catch (error) {
    console.error('PUT /api/admin/organizations error:', error);
    return NextResponse.json({ error: 'Failed to update organization status' }, { status: 500 });
  }
}

// PATCH - Bulk operations on organizations
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();
    
    const { action, organizationIds, rejectionReason } = await request.json();
    
    if (!action || !organizationIds || !Array.isArray(organizationIds) || organizationIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'reject' && !rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required for bulk rejection' }, { status: 400 });
    }

    const { data: organizations = [] } = await supabase
      .from('organization_profiles')
      .select('account_id, organization_name')
      .in('account_id', organizationIds);
    const organizationRows = organizations || [];

    if (organizationRows.length === 0) {
      return NextResponse.json({ error: 'No valid organizations found' }, { status: 404 });
    }

    const updateData: any = {};
    if (action === 'approve') {
      updateData.moderation_status = 'approved';
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by = session.user.id;
      updateData.admin_comment = null;
    } else if (action === 'reject') {
      updateData.moderation_status = 'rejected';
      updateData.admin_comment = rejectionReason.trim();
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
        : `Təşkilat qeydiyyatınız nəzərdən keçirildi. Səbəb: ${rejectionReason}`;

      await supabase.from('notifications').insert({
        organization_id: organization.account_id,
        type: action === 'approve' ? 'organization_approved' : 'organization_rejected',
        title: notificationTitle,
        message: notificationMessage,
        data: { 
          action,
          organizationName: organization.organization_name,
          ...(action === 'reject' && { rejectionReason })
        },
      });
    }

    return NextResponse.json({ 
      message: `${organizationRows.length} organization(s) ${action}d successfully`,
      processedCount: organizationRows.length
    });

  } catch (error) {
    console.error('PATCH /api/admin/organizations error:', error);
    return NextResponse.json({ error: 'Failed to process bulk organization operation' }, { status: 500 });
  }
}
