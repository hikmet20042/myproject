import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { ORGANIZATION_TYPE_VALUES } from '@/lib/organizationTypes'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an approved organization
    if (!session.user.isApprovedOrganization) {
      return NextResponse.json({ error: 'Access denied. Approved organization account required.' }, { status: 403 })
    }

    const supabase = createSupabaseAdminClient()

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
      socialMedia
    } = body

    // Validate required fields
    if (!organizationName || !description) {
      return NextResponse.json(
        { error: 'Organization name and description are required' },
        { status: 400 }
      )
    }

    if (organizationType && !ORGANIZATION_TYPE_VALUES.includes(organizationType)) {
      return NextResponse.json(
        { error: 'Invalid organization type' },
        { status: 400 }
      )
    }

    // Primary write to organization_profiles
    const profileUpdate = {
      organization_name: organizationName,
      ...(organizationType ? { organization_type: organizationType } : {}),
      description,
      website: website || '',
      contact_phone: contactPhone || '',
      address: address || '',
      registration_number: registrationNumber || '',
      focus_areas: focusAreas || [],
      social_links: socialMedia || {},
      updated_at: new Date().toISOString()
    }

    const { data: updatedOrganization, error } = await supabase
      .from('organization_profiles')
      .update(profileUpdate)
      .eq('account_id', session.user.id)
      .select('*')
      .single()

    if (error || !updatedOrganization) {
      return NextResponse.json({ error: 'Organization profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Organization profile updated successfully',
      organizationProfile: {
        _id: updatedOrganization.account_id,
        organizationName: updatedOrganization.organization_name,
        organizationType: updatedOrganization.organization_type,
        description: updatedOrganization.description,
        website: updatedOrganization.website,
        contactPhone: updatedOrganization.contact_phone,
        address: updatedOrganization.address,
        registrationNumber: updatedOrganization.registration_number,
        focusAreas: updatedOrganization.focus_areas || [],
        socialMedia: updatedOrganization.social_links || {},
        status: updatedOrganization.moderation_status
      }
    })

  } catch (error) {
    console.error('Error updating organization profile:', error)
    return NextResponse.json(
      { error: 'Failed to update organization profile' },
      { status: 500 }
    )
  }
}
