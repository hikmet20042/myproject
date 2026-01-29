import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/lib/models/User';
import UserProfile from '@/lib/models/UserProfile';

import Blog from '@/lib/models/Blog';
import Notification from '@/lib/models/Notification';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

async function isAdmin(session: any) {
  return session?.user?.email === 'hikmat.mammadlii@gmail.com' || session?.user?.role === 'admin';
}

// Get all users with pagination, search, and filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      // Exclude NGOs - they have a separate management interface
      role: { $in: ['user', 'admin'] }
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }

    // Get total count (only users and admins, not NGOs)
    const total = await User.countDocuments(query);
    
    // Calculate overall user statistics (not filtered, but exclude NGOs)
    // emailVerified is a Date field, not boolean - null means not verified, any date means verified
    const [totalUsers, verifiedUsers, adminUsers] = await Promise.all([
      User.countDocuments({ role: { $in: ['user', 'admin'] } }),
      User.countDocuments({ role: { $in: ['user', 'admin'] }, emailVerified: { $ne: null } }),
      User.countDocuments({ role: 'admin' })
    ]);

    // Get users with profiles
    const users = await User.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'userprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      {
        $addFields: {
          profile: { $arrayElemAt: ['$profile', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          emailVerified: 1,
          createdAt: 1,
          updatedAt: 1,
          image: 1,
          'profile.bio': 1,
          'profile.location': 1,
          'profile.occupation': 1
        }
      },
      { $sort: { [sortBy]: sortOrder } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get user statistics
    const userStats = await Promise.all(
      users.map(async (user) => {
        const [storyCount] = await Promise.all([
          Blog.countDocuments({ author: user._id })
        ]);
        return {
          ...user,
          stats: {
            
            blogs: storyCount,
            
          }
        };
      })
    );

    return NextResponse.json({
      users: userStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
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
        sortOrder: sortOrder === 1 ? 'asc' : 'desc'
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
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, updates, action } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
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
        if (!['user', 'admin', 'moderator'].includes(updates.role)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }
        user.role = updates.role;
        await user.save();
        notificationMessage = `Your account role has been updated to ${updates.role}`;
        result = { message: `User role updated to ${updates.role}` };
        break;

      case 'updateProfile':
        // Update basic user info
        if (updates.name) user.name = updates.name;
        if (updates.email) user.email = updates.email;
        await user.save();
        result = { message: 'User profile updated successfully' };
        break;



      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Send notification to user if message exists
    if (notificationMessage) {
      await Notification.create({
        userId: user._id,
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
    await dbConnect();
    const session = await getServerSession(authOptions);
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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deletion of NGOs through this endpoint - they should be managed through NGO API
    if (user.role === 'ngo') {
      return NextResponse.json({ error: 'NGOs cannot be deleted through this endpoint. Use the NGO management interface.' }, { status: 400 });
    }

    // Delete the user (hard delete since soft delete fields don't exist in schema)
    await User.findByIdAndDelete(userId);

    // Also delete user's related content
    await Promise.all([
      UserProfile.deleteOne({ userId: new mongoose.Types.ObjectId(userId) }),
      Blog.deleteMany({ author: new mongoose.Types.ObjectId(userId) }),
      Notification.deleteMany({ userId: new mongoose.Types.ObjectId(userId) })
    ]);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}