import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/lib/models/User';
import UserProfile from '@/lib/models/UserProfile';
import Article from '@/lib/models/Article';
import Story from '@/lib/models/Story';
import Notification from '@/lib/models/Notification';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

async function isAdmin(session: any) {
  return session?.user?.email === 'hikmat@mammadli.space' || session?.user?.role === 'admin';
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
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }

    // Get total count
    const total = await User.countDocuments(query);

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
        const [articleCount, storyCount] = await Promise.all([
          Article.countDocuments({ userId: user._id }),
          Story.countDocuments({ author: user._id })
        ]);
        return {
          ...user,
          stats: {
            articles: articleCount,
            stories: storyCount,
            totalContent: articleCount + storyCount
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

    // Soft delete - mark as deleted instead of actually deleting
    user.deleted = true;
    user.deletedAt = new Date();
    user.deletedBy = session.user.id;
    await user.save();

    // Also soft delete user's content
    await Promise.all([
      Article.updateMany(
        { userId: new mongoose.Types.ObjectId(userId) },
        { 
          deleted: true,
          deletedAt: new Date(),
          deletedBy: session.user.id
        }
      ),
      Story.updateMany(
        { author: new mongoose.Types.ObjectId(userId) },
        { 
          deleted: true,
          deletedAt: new Date(),
          deletedBy: session.user.id
        }
      )
    ]);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}