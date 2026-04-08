import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/permissions';
import { successResponse, errorResponse } from '@/lib/apiResponse'

export const dynamic = 'force-dynamic';

type UserProfileRow = {
  user_id: string;
  bio: string | null;
  location: string | null;
  occupation: string | null;
  avatar: string | null;
};

type BlogAuthorRow = {
  author_id: string | null;
};

type UserUpdatePayload = {
  userId?: string;
  action?: 'updateRole' | 'updateProfile';
  updates?: {
    role?: 'user' | 'admin';
    name?: string;
    email?: string;
  };
};

// Get all users with pagination, search, and filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!isAdmin(session)) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403);
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
      .select('id, name, email, created_at, updated_at', { count: 'exact' })
      .order(sortBy === 'createdAt' ? 'created_at' : 'updated_at', { ascending: sortOrder === 'asc' })
      .range(skip, skip + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, count: total, error } = await query;

    if (error) {
      console.error('GET /api/admin/users query error:', error);
      return errorResponse('Failed to fetch users', "API_ERROR", {}, 500);
    }

    const userIds = (users || []).map(user => user.id);
    const { data: profiles } = userIds.length
      ? await supabase
          .from('user_profiles')
          .select('user_id, bio, location, occupation, avatar')
          .in('user_id', userIds)
      : { data: [] };

    const profileMap = new Map(
      ((profiles || []) as UserProfileRow[]).map(profile => [profile.user_id, profile])
    );

    const { data: blogs } = userIds.length
      ? await supabase
          .from('blogs')
          .select('author_id')
          .in('author_id', userIds)
      : { data: [] };

    const blogCounts = new Map<string, number>();
    (blogs || []).forEach((blog: BlogAuthorRow) => {
      if (!blog.author_id) return;
      blogCounts.set(blog.author_id, (blogCounts.get(blog.author_id) || 0) + 1);
    });

    const { data: accountRows } = userIds.length
      ? await supabase
          .from('accounts')
          .select('id, is_admin')
          .in('id', userIds)
      : { data: [] };

    const accountMap = new Map((accountRows || []).map(account => [account.id, account]));

    const allUserStats = (users || []).map(user => {
      const profile = profileMap.get(user.id);
      const account = accountMap.get(user.id);
      const derivedRole = account?.is_admin ? 'admin' : 'user';
      return {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: derivedRole,
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

    const userStats = role && role !== 'all'
      ? allUserStats.filter(user => user.role === role)
      : allUserStats;

    const [totalUsersResult, adminUsersResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('is_admin', true)
    ]);

    const totalUsers = totalUsersResult.count || 0;
    const verifiedUsers = totalUsers;
    const adminUsers = adminUsersResult.count || 0;

    return successResponse({
      users: userStats,
      pagination: {
        total: role && role !== 'all' ? userStats.length : (total || 0),
        page,
        limit,
        totalPages: Math.ceil((role && role !== 'all' ? userStats.length : (total || 0)) / limit)
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
    return errorResponse('Failed to fetch users', "API_ERROR", {}, 500);
  }
}

// Update user (role, status, etc.)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!isAdmin(session)) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403);
    }

    const body = await request.json() as UserUpdatePayload;
    const { userId, action } = body;
    const updates = body.updates || {};

    if (!userId) {
      return errorResponse('User ID is required', "API_ERROR", {}, 400);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    if (userError || !user) {
      return errorResponse('User not found', "API_ERROR", {}, 404);
    }

    // Prevent admin from modifying their own role
    const adminUserId = session?.user?.id;
    if (!adminUserId) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403);
    }

    if (userId === adminUserId && updates.role) {
      return errorResponse('Cannot modify your own role', "API_ERROR", {}, 400);
    }

    let result;
    let notificationMessage = '';

    switch (action) {
      case 'updateRole':
        if (updates.role !== 'user' && updates.role !== 'admin') {
          return errorResponse('Invalid role', "API_ERROR", {}, 400);
        }
        await supabase
          .from('accounts')
          .update({ is_admin: updates.role === 'admin', updated_at: new Date().toISOString() })
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
        return errorResponse('Invalid action', "API_ERROR", {}, 400);
    }

    // Send notification to user if message exists
    if (notificationMessage) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'admin',
        title: 'Account Update',
        message: notificationMessage,
        data: { action, adminId: adminUserId }
      });
    }

    return successResponse(result);
  } catch (error) {
    console.error('PUT /api/admin/users error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}

// Delete user (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const session = await getServerSession();
    if (!isAdmin(session)) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return errorResponse('User ID is required', "API_ERROR", {}, 400);
    }

    const adminUserId = session?.user?.id;
    if (!adminUserId) {
      return errorResponse('Admin access required', "API_ERROR", {}, 403);
    }

    if (userId === adminUserId) {
      return errorResponse('Cannot delete your own account', "API_ERROR", {}, 400);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    if (userError || !user) {
      return errorResponse('User not found', "API_ERROR", {}, 404);
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

    return successResponse({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/users error:', error);
    return errorResponse('Internal server error', "API_ERROR", {}, 500);
  }
}
