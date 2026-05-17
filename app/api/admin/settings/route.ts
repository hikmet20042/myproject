import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { siteSettingsDefaults } from '@/lib/supabase/siteSettingsDefaults'
import { canAccessAdmin } from '@/lib/auth/permissions'
import { successResponse, errorResponse } from '@/lib/apiResponse'
import { applyRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// Get site settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || !canAccessAdmin(session)) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }
    const supabase = createSupabaseAdminClient()

    let { data: settingsRow } = await supabase
      .from('site_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!settingsRow) {
      const defaults = {
        ...siteSettingsDefaults,
        lastUpdated: new Date().toISOString(),
        updatedBy: session.user.id,
        version: '1.0.0'
      }

      const { data: inserted, error } = await supabase
        .from('site_settings')
        .insert({ data: defaults })
        .select('*')
        .single()

      if (error || !inserted) {
        return errorResponse(error?.message || 'Failed to create settings', "API_ERROR", {}, 500)
      }
      settingsRow = inserted
    }

    return successResponse({ settings: settingsRow.data })
  } catch (error) {
    console.error('Get settings error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

// Update site settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || !canAccessAdmin(session)) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }
    const body = await request.json()
    const { settings: newSettings, section } = body

    if (!newSettings) {
      return errorResponse('Settings data required', "API_ERROR", {}, 400)
    }

    const supabase = createSupabaseAdminClient()
    let { data: settingsRow } = await supabase
      .from('site_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!settingsRow) {
      const defaults = {
        ...siteSettingsDefaults,
        lastUpdated: new Date().toISOString(),
        updatedBy: session.user.id,
        version: '1.0.0'
      }

      const { data: inserted, error } = await supabase
        .from('site_settings')
        .insert({ data: defaults })
        .select('*')
        .single()

      if (error || !inserted) {
        return errorResponse(error?.message || 'Failed to create settings', "API_ERROR", {}, 500)
      }
      settingsRow = inserted
    }

    const settings = settingsRow.data || {}

    // Track what was changed for logging
    const changes: string[] = []

    if (section) {
      // Update specific section
      if (settings[section as keyof typeof settings]) {
        const oldValue = JSON.stringify(settings[section as keyof typeof settings])
        Object.assign(settings[section as keyof typeof settings], newSettings)
        const newValue = JSON.stringify(settings[section as keyof typeof settings])
        
        if (oldValue !== newValue) {
          changes.push(section)
        }
      } else {
        return errorResponse(`Invalid section: ${section}`, "API_ERROR", {}, 400)
      }
    } else {
      // Update all provided settings
      Object.keys(newSettings).forEach(key => {
        if (settings[key as keyof typeof settings]) {
          const oldValue = JSON.stringify(settings[key as keyof typeof settings])
          Object.assign(settings[key as keyof typeof settings], newSettings[key])
          const newValue = JSON.stringify(settings[key as keyof typeof settings])
          
          if (oldValue !== newValue) {
            changes.push(key)
          }
        }
      })
    }

    // Update metadata
    settings.lastUpdated = new Date().toISOString()
    settings.updatedBy = session.user.id
    
    // Increment version for major changes
    if (changes.length > 0) {
      const versionParts = (settings.version || '1.0.0').split('.')
      versionParts[2] = (parseInt(versionParts[2]) + 1).toString()
      settings.version = versionParts.join('.')
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('site_settings')
      .update({ data: settings })
      .eq('id', settingsRow.id)
      .select('*')
      .single()

    if (updateError || !updatedRow) {
      return errorResponse(updateError?.message || 'Failed to update settings', "API_ERROR", {}, 500)
    }

    return successResponse({ 
      settings: updatedRow.data,
      message: section 
        ? `${section} settings updated successfully` 
        : 'Settings updated successfully',
      changes
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

// Reset settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || !canAccessAdmin(session)) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    const supabase = createSupabaseAdminClient()
    const { data: settingsRow } = await supabase
      .from('site_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!settingsRow) {
      return errorResponse('Settings not found', "API_ERROR", {}, 404)
    }

    const settings = settingsRow.data || {}
    const defaults = siteSettingsDefaults
    const changes: string[] = []

    if (section) {
      // Reset specific section
      if (defaults[section as keyof typeof defaults]) {
        const oldValue = JSON.stringify(settings[section as keyof typeof settings])
        Object.assign(settings[section as keyof typeof settings], defaults[section as keyof typeof defaults])
        const newValue = JSON.stringify(settings[section as keyof typeof settings])
        
        if (oldValue !== newValue) {
          changes.push(section)
        }
      } else {
        return errorResponse(`Invalid section: ${section}`, "API_ERROR", {}, 400)
      }
    } else {
      // Reset all settings to defaults
      Object.keys(defaults).forEach(key => {
        const oldValue = JSON.stringify(settings[key as keyof typeof settings])
        Object.assign(settings[key as keyof typeof settings], defaults[key as keyof typeof defaults])
        const newValue = JSON.stringify(settings[key as keyof typeof settings])
        
        if (oldValue !== newValue) {
          changes.push(key)
        }
      })
    }

    // Update metadata
    settings.lastUpdated = new Date().toISOString()
    settings.updatedBy = session.user.id
    
    // Increment version
    if (changes.length > 0) {
      const versionParts = (settings.version || '1.0.0').split('.')
      versionParts[1] = (parseInt(versionParts[1]) + 1).toString()
      versionParts[2] = '0'
      settings.version = versionParts.join('.')
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('site_settings')
      .update({ data: settings })
      .eq('id', settingsRow.id)
      .select('*')
      .single()

    if (updateError || !updatedRow) {
      return errorResponse(updateError?.message || 'Failed to reset settings', "API_ERROR", {}, 500)
    }

    return successResponse({ 
      settings: updatedRow.data,
      message: section 
        ? `${section} settings reset to defaults` 
        : 'All settings reset to defaults',
      changes
    })
  } catch (error) {
    console.error('Reset settings error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}

// Get settings history/versions
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || !canAccessAdmin(session)) {
      return errorResponse('Unauthorized', "API_ERROR", {}, 401)
    }

    return successResponse({ 
      history: [],
      message: 'Settings history not available'
    })
  } catch (error) {
    console.error('Get settings history error:', error)
    return errorResponse('Internal server error', "API_ERROR", {}, 500)
  }
}
