import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id || !session.user.isApprovedOrganization) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createSupabaseAdminClient()
    const { data: organizationProfile } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', session.user.id)
      .maybeSingle()

    if (!organizationProfile) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      organization: {
        _id: organizationProfile.account_id,
        organizationName: organizationProfile.organization_name,
        organizationType: organizationProfile.organization_type,
        email: organizationProfile.email,
        profileImage: organizationProfile.profile_image,
        description: organizationProfile.description,
        website: organizationProfile.website,
        contactPhone: organizationProfile.contact_phone,
        address: organizationProfile.address,
        registrationNumber: organizationProfile.registration_number,
        focusAreas: organizationProfile.focus_areas || [],
        status: organizationProfile.moderation_status,
        approvedAt: organizationProfile.reviewed_at,
        approvedBy: organizationProfile.reviewed_by,
        adminComment: organizationProfile.admin_comment,
        contactPerson: organizationProfile.contact_person,
        socialMedia: organizationProfile.social_links,
        createdAt: organizationProfile.created_at,
        updatedAt: organizationProfile.updated_at
      }
    })
  } catch (error) {
    console.error('Organization profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id || !session.user.isApprovedOrganization) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createSupabaseAdminClient()
    const { data: organizationProfile } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('account_id', session.user.id)
      .maybeSingle()

    if (!organizationProfile) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }
    
    // Only allow updates if organization is approved
    const moderationStatus = organizationProfile.moderation_status
    if (moderationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Profile updates are only allowed for approved organizations' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const {
      organizationType,
      description,
      website,
      contactPhone,
      address,
      focusAreas,
      contactPerson,
      socialMedia
    } = body
    
    // Update allowed fields
    const updateData: any = {}
    if (organizationType !== undefined) {
      if (!ORGANIZATION_TYPE_VALUES.includes(organizationType)) {
        return NextResponse.json(
          { error: 'Invalid organization type' },
          { status: 400 }
        )
      }
      updateData.organization_type = organizationType
    }
    if (description !== undefined) updateData.description = description
    if (website !== undefined) updateData.website = website
    if (contactPhone !== undefined) updateData.contact_phone = contactPhone
    if (address !== undefined) updateData.address = address
    if (focusAreas !== undefined) updateData.focus_areas = focusAreas
    if (contactPerson !== undefined) updateData.contact_person = contactPerson
    if (socialMedia !== undefined) updateData.social_links = socialMedia
    updateData.updated_at = new Date().toISOString()

    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organization_profiles')
      .update(updateData)
      .eq('account_id', session.user.id)
      .select('*')
      .single()

    if (updateError || !updatedOrganization) {
      return NextResponse.json(
        { error: updateError?.message || 'Failed to update organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
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
    console.error('Organization profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
