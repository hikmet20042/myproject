import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'

export const dynamic = 'force-dynamic'

// GET - Get single organization by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createSupabaseAdminClient()
    const { data: profile, error: profileError } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', id)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const row: any = profile

    return NextResponse.json({
      organization: {
        _id: row.account_id || row.id,
        organizationName: row.organization_name,
        organizationType: row.organization_type,
        email: row.email,
        profileImage: row.profile_image,
        description: row.description,
        website: row.website,
        contactPhone: row.contact_phone,
        address: row.address,
        registrationNumber: row.registration_number,
        focusAreas: row.focus_areas || [],
        status: row.moderation_status || row.status,
        approvedAt: row.reviewed_at || row.approved_at,
        approvedBy: row.reviewed_by || row.approved_by,
        adminComment: row.admin_comment,
        contactPerson: row.contact_person,
        socialMedia: row.social_links || row.social_media,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update organization (for organization owners and admins)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createSupabaseAdminClient()
    const { data: organization, error: fetchError } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', id)
      .maybeSingle()

    if (fetchError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check permissions - organization owner or admin
    const session = await getServerSession()
    const isOrganizationOwner = session?.user?.organizationStatus === 'approved' && session.user.id === id
    const isAdmin = session?.user?.role === 'admin'

    if (!isOrganizationOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      organizationName,
      organizationType,
      description,
      website,
      contactPhone,
      address,
      registrationNumber,
      focusAreas,
      contactPerson,
      socialMedia,
      status // Only admins can change status
    } = body

    // Validation
    if (!organizationName || !description || !contactPerson?.name || !contactPerson?.email) {
      return NextResponse.json({
        error: 'Organization name, description, contact person name and email are required'
      }, { status: 400 })
    }

    if (organizationType && !ORGANIZATION_TYPE_VALUES.includes(organizationType)) {
      return NextResponse.json({
        error: 'Invalid organization type'
      }, { status: 400 })
    }

    // Check if another organization with same name exists (excluding current organization)
    if (organizationName !== organization.organization_name) {
      const { data: existingOrganization } = await supabase
        .from('organization_profiles')
        .select('account_id')
        .ilike('organization_name', organizationName)
        .neq('account_id', id)
        .maybeSingle()

      if (existingOrganization) {
        return NextResponse.json({
          error: 'An organization with this name already exists'
        }, { status: 400 })
      }
    }

    // Prepare update data
    const profileUpdateData: any = {
      organization_name: organizationName,
      ...(organizationType ? { organization_type: organizationType } : {}),
      description,
      website,
      contact_phone: contactPhone,
      address,
      registration_number: registrationNumber,
      focus_areas: focusAreas || [],
      contact_person: contactPerson,
      social_links: socialMedia,
      updated_at: new Date().toISOString()
    }

    // Only admins can change status
    if (isAdmin && status) {
      profileUpdateData.moderation_status = status
      if (status === 'approved') {
        profileUpdateData.reviewed_by = session?.user?.id
        profileUpdateData.reviewed_at = new Date().toISOString()
        profileUpdateData.admin_comment = null
      }
      if (status === 'rejected') {
        profileUpdateData.reviewed_by = null
        profileUpdateData.reviewed_at = null
      }
    }

    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organization_profiles')
      .update(profileUpdateData)
      .eq('account_id', id)
      .select('*')
      .single()

    if (updateError || !updatedOrganization) {
      return NextResponse.json({ error: updateError?.message || 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Organization updated successfully',
      organization: {
        _id: updatedOrganization.account_id,
        organizationName: updatedOrganization.organization_name,
        organizationType: updatedOrganization.organization_type,
        email: updatedOrganization.email,
        profileImage: updatedOrganization.profile_image,
        description: updatedOrganization.description,
        website: updatedOrganization.website,
        contactPhone: updatedOrganization.contact_phone,
        address: updatedOrganization.address,
        registrationNumber: updatedOrganization.registration_number,
        focusAreas: updatedOrganization.focus_areas || [],
        status: updatedOrganization.moderation_status,
        approvedAt: updatedOrganization.reviewed_at,
        approvedBy: updatedOrganization.reviewed_by,
        adminComment: updatedOrganization.admin_comment,
        contactPerson: updatedOrganization.contact_person,
        socialMedia: updatedOrganization.social_links,
        createdAt: updatedOrganization.created_at,
        updatedAt: updatedOrganization.updated_at
      }
    })
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete organization (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = params
    const supabase = createSupabaseAdminClient()

    await supabase
      .from('organization_profiles')
      .delete()
      .eq('account_id', id)

    await supabase.auth.admin.deleteUser(id)

    return NextResponse.json({ message: 'Organization deleted successfully' })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
