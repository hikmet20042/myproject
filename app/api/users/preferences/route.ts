import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import UserPreferences from '@/lib/models/UserPreferences'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// Get user preferences
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await UserPreferences.findOne({ userId: session.user.id });
    
    if (!preferences) {
      // Create default preferences if none exist
      const defaults = UserPreferences.getDefaults();
      preferences = await UserPreferences.create({
        userId: session.user.id,
        ...defaults,
        updatedBy: 'system'
      });
    } else {
      // Merge with defaults to ensure all fields are present
      preferences = preferences.mergeWithDefaults();
      await preferences.save();
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user preferences
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences: newPreferences, section } = body;

    if (!newPreferences) {
      return NextResponse.json({ error: 'Preferences data required' }, { status: 400 });
    }

    // Get current preferences
    let preferences = await UserPreferences.findOne({ userId: session.user.id });
    
    if (!preferences) {
      // Create new preferences with defaults
     const defaults = UserPreferences.getDefaults();
      preferences = new UserPreferences({
        userId: session.user.id,
        ...defaults
      });
    }

    // Update specific section or all preferences
    if (section) {
      // Update only a specific section (e.g., 'privacy', 'notifications', etc.)
      if (preferences[section as keyof typeof preferences]) {
        Object.assign(preferences[section as keyof typeof preferences], newPreferences);
      } else {
        return NextResponse.json({ error: `Invalid section: ${section}` }, { status: 400 });
      }
    } else {
      // Update all provided preferences
      Object.keys(newPreferences).forEach(key => {
        if (preferences[key as keyof typeof preferences]) {
          Object.assign(preferences[key as keyof typeof preferences], newPreferences[key]);
        }
      });
    }

    // Update metadata
    preferences.lastUpdated = new Date();
    preferences.updatedBy = 'user';

    // Save preferences
    await preferences.save();



    return NextResponse.json({ 
      preferences,
      message: 'Preferences updated successfully' 
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Reset preferences to defaults
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    let preferences = await UserPreferences.findOne({ userId: session.user.id });
    
    if (!preferences) {
      return NextResponse.json({ error: 'Preferences not found' }, { status: 404 });
    }

    const defaults = UserPreferences.getDefaults();

    if (section) {
      // Reset only a specific section
      if (defaults[section as keyof typeof defaults]) {
        Object.assign(preferences[section as keyof typeof preferences], defaults[section as keyof typeof defaults]);
      } else {
        return NextResponse.json({ error: `Invalid section: ${section}` }, { status: 400 });
      }
    } else {
      // Reset all preferences to defaults
      Object.keys(defaults).forEach(key => {
        Object.assign(preferences[key as keyof typeof preferences], defaults[key as keyof typeof defaults]);
      });
    }

    // Update metadata
    preferences.lastUpdated = new Date();
    preferences.updatedBy = 'user';

    await preferences.save();



    return NextResponse.json({ 
      preferences,
      message: section ? `${section} preferences reset to defaults` : 'All preferences reset to defaults'
    });
  } catch (error) {
    console.error('Reset preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export user preferences (for backup/migration)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'export') {
      const preferences = await UserPreferences.findOne({ userId: session.user.id });
      
      if (!preferences) {
        return NextResponse.json({ error: 'Preferences not found' }, { status: 404 });
      }



      return NextResponse.json({
        preferences: preferences.toObject(),
        exportedAt: new Date(),
        version: '1.0'
      });
    }

    if (action === 'import') {
      const { importData } = body;
      
      if (!importData || !importData.preferences) {
        return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
      }

      // Validate and import preferences
      let preferences = await UserPreferences.findOne({ userId: session.user.id });
      
      if (!preferences) {
        preferences = new UserPreferences({ userId: session.user.id });
      }

      // Merge imported data with current preferences
      const defaults = UserPreferences.getDefaults();
      Object.keys(defaults).forEach(key => {
        if (importData.preferences[key]) {
          Object.assign(preferences[key as keyof typeof preferences], importData.preferences[key]);
        }
      });

      preferences.lastUpdated = new Date();
      preferences.updatedBy = 'user';

      await preferences.save();



      return NextResponse.json({
        preferences,
        message: 'Preferences imported successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Preferences action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
