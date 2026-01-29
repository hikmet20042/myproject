import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import SiteSettings from '@/lib/models/SiteSettings'

import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// Get site settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    let settings = await SiteSettings.findOne().populate('updatedBy', 'name email')
    
    // If no settings exist, create default settings
    if (!settings) {
      const defaults = SiteSettings.getDefaults()
      settings = new SiteSettings({
        ...defaults,
        updatedBy: session.user.id,
      })
      await settings.save()
      await settings.populate('updatedBy', 'name email')
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update site settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { settings: newSettings, section } = body

    if (!newSettings) {
      return NextResponse.json({ error: 'Settings data required' }, { status: 400 })
    }

    let settings = await SiteSettings.findOne()
    
    if (!settings) {
      // Create new settings if none exist
      const defaults = SiteSettings.getDefaults()
      settings = new SiteSettings({
        ...defaults,
        updatedBy: session.user.id,
      })
    }

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
        return NextResponse.json({ error: `Invalid section: ${section}` }, { status: 400 })
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
    settings.lastUpdated = new Date()
    settings.updatedBy = new mongoose.Types.ObjectId(session.user.id)
    
    // Increment version for major changes
    if (changes.length > 0) {
      const versionParts = settings.version.split('.')
      versionParts[2] = (parseInt(versionParts[2]) + 1).toString()
      settings.version = versionParts.join('.')
    }

    await settings.save()
    await settings.populate('updatedBy', 'name email')



    return NextResponse.json({ 
      settings,
      message: section 
        ? `${section} settings updated successfully` 
        : 'Settings updated successfully',
      changes
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Reset settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    let settings = await SiteSettings.findOne()
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    const defaults = SiteSettings.getDefaults()
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
        return NextResponse.json({ error: `Invalid section: ${section}` }, { status: 400 })
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
    settings.lastUpdated = new Date()
    settings.updatedBy = new mongoose.Types.ObjectId(session.user.id)
    
    // Increment version
    if (changes.length > 0) {
      const versionParts = settings.version.split('.')
      versionParts[1] = (parseInt(versionParts[1]) + 1).toString()
      versionParts[2] = '0'
      settings.version = versionParts.join('.')
    }

    await settings.save()
    await settings.populate('updatedBy', 'name email')



    return NextResponse.json({ 
      settings,
      message: section 
        ? `${section} settings reset to defaults` 
        : 'All settings reset to defaults',
      changes
    })
  } catch (error) {
    console.error('Reset settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get settings history/versions
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    return NextResponse.json({ 
      history: [],
      message: 'Settings history not available'
    })
  } catch (error) {
    console.error('Get settings history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}