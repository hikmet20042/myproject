import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdminSession } from '@/lib/roles';

export const dynamic = 'force-dynamic';

async function isAdmin(session: any) {
  return isAdminSession(session);
}

// Get all users with pagination, search, and filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at', { count: 'exact' })
      .in('role', ['user', 'admin'])
      .order(sortBy === 'createdAt' ? 'created_at' : 'updated_at', { ascending: sortOrder === 'asc' })
      .range(skip, skip + limit - 1);

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, count: total, error } = await query;

    if (error) {
      console.error('GET /api/admin/users query error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const userIds = (users || []).map(user => user.id);
    const { data: profiles } = userIds.length
      ? await supabase
          .from('user_profiles')
          .select('user_id, bio, location, occupation, avatar')
          .in('user_id', userIds)
      : { data: [] };

    const profileMap = new Map((profiles || []).map(profile => [profile.user_id, profile]));

    const { data: blogs } = userIds.length
      ? await supabase
          .from('blogs')
          .select('author_id')
          .in('author_id', userIds)
      : { data: [] };

    const blogCounts = new Map<string, number>();
    (blogs || []).forEach((blog: any) => {
      if (!blog.author_id) return;
      blogCounts.set(blog.author_id, (blogCounts.get(blog.author_id) || 0) + 1);
    });

    const userStats = (users || []).map(user => {
      const profile = profileMap.get(user.id);
      return {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: null,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        image: profile?.avatar || null,
        profile: profile
          ? {
              bio: profile.bio,
              location: profile.location,
              occupation: profile.occupation
            }
          : null,
        stats: {
          blogs: blogCounts.get(user.id) || 0
        }
      };
    });

    const [totalUsersResult, adminUsersResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).in('role', ['user', 'admin']),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin')
    ]);

    const totalUsers = totalUsersResult.count || 0;
    const verifiedUsers = totalUsers;
    const adminUsers = adminUsersResult.count || 0;

    return NextResponse.json({
      users: userStats,
      pagination: {
        total: total || 0,
        page,
        limit,
        totalPages: Math.ceil((total || 0) / limit)
      },
      stats: {
        total: totalUsers,
        verified: verifiedUsers,
        admin: adminUsers
      },
      filters: {
        search,
        role,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// Update user (role, status, etc.)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, updates, action } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from modifying their own role
    if (userId === session.user.id && updates.role) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 });
    }

    let result;
    let notificationMessage = '';

    switch (action) {
      case 'updateRole':
        if (!['user', 'admin'].includes(updates.role)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }
        await supabase
          .from('users')
          .update({ role: updates.role, updated_at: new Date().toISOString() })
          .eq('id', userId);
        notificationMessage = `Your account role has been updated to ${updates.role}`;
        result = { message: `User role updated to ${updates.role}` };
        break;

      case 'updateProfile':
        // Update basic user info
        await supabase
          .from('users')
          .update({
            ...(updates.name ? { name: updates.name } : {}),
            ...(updates.email ? { email: updates.email } : {}),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        result = { message: 'User profile updated successfully' };
        break;



      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Send notification to user if message exists
    if (notificationMessage) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'admin',
        title: 'Account Update',
        message: notificationMessage,
        data: { action, adminId: session.user.id }
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete user (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deletion of organizations through this endpoint - they should be managed through organization API
    // Delete user's related content first to avoid foreign key constraints
    await Promise.all([
      supabase.from('user_profiles').delete().eq('user_id', userId),
      supabase.from('blogs').delete().eq('author_id', userId),
      supabase.from('notifications').delete().eq('user_id', userId)
    ]);

    // Delete auth user (cascades to public.users)
    await supabase.auth.admin.deleteUser(userId);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}