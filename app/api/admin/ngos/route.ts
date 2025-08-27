import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/lib/models/User';
import NotificationModel from '@/lib/models/Notification';

// Helper function to check admin access
async function isAdmin(session: any) {
  return session?.user?.email === 'hikmat@mammadli.space' || session?.user?.role === 'admin';
}

// GET - Fetch all NGO registrations for admin review
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query for NGO users
    const query: any = { role: 'ngo' };
    
    if (status !== 'all') {
      if (status === 'pending') {
        query['ngoProfile.isApproved'] = false;
        query['ngoProfile.rejectedAt'] = { $exists: false };
      } else if (status === 'approved') {
        query['ngoProfile.isApproved'] = true;
      } else if (status === 'rejected') {
        query['ngoProfile.rejectedAt'] = { $exists: true };
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'ngoProfile.organizationName': { $regex: search, $options: 'i' } },
        { 'ngoProfile.description': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const ngos = await User.find(query)
      .select('name email ngoProfile createdAt emailVerified')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get counts for different statuses
    const pendingCount = await User.countDocuments({
      role: 'ngo',
      'ngoProfile.isApproved': false,
      'ngoProfile.rejectedAt': { $exists: false }
    });
    
    const approvedCount = await User.countDocuments({
      role: 'ngo',
      'ngoProfile.isApproved': true
    });
    
    const rejectedCount = await User.countDocuments({
      role: 'ngo',
      'ngoProfile.rejectedAt': { $exists: true }
    });

    return NextResponse.json({
      ngos,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total
      }
    });

  } catch (error) {
    console.error('GET /api/admin/ngos error:', error);
    return NextResponse.json({ error: 'Failed to fetch NGOs' }, { status: 500 });
  }
}

// PUT - Approve or reject NGO registration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await dbConnect();
    
    const { id, ngoId, action, rejectionReason } = await request.json();
    
    // Support both 'id' and 'ngoId' for backward compatibility
    const userId = id || ngoId;
    
    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    if (action === 'reject' && !rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const ngo = await User.findOne({ _id: userId, role: 'ngo' });
    if (!ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 });
    }

    if (action === 'approve') {
      ngo.ngoProfile.isApproved = true;
      ngo.ngoProfile.approvedAt = new Date();
      ngo.ngoProfile.approvedBy = session.user.id;
      // Clear any previous rejection data
      ngo.ngoProfile.rejectedAt = undefined;
      ngo.ngoProfile.rejectionReason = undefined;
    } else if (action === 'reject') {
      ngo.ngoProfile.isApproved = false;
      ngo.ngoProfile.rejectedAt = new Date();
      ngo.ngoProfile.rejectionReason = rejectionReason.trim();
      // Clear approval data
      ngo.ngoProfile.approvedAt = undefined;
      ngo.ngoProfile.approvedBy = undefined;
    }

    await ngo.save();

    // Send notification to NGO
    const notificationTitle = action === 'approve' 
      ? 'NGO Registration Approved!' 
      : 'NGO Registration Update';
    
    const notificationMessage = action === 'approve'
      ? `Congratulations! Your NGO "${ngo.ngoProfile.organizationName}" has been approved. You can now access all NGO features.`
      : `Your NGO registration has been reviewed. Reason: ${rejectionReason}`;

    await NotificationModel.create({
      userId: ngo._id,
      type: action === 'approve' ? 'ngo_approved' : 'ngo_rejected',
      title: notificationTitle,
      message: notificationMessage,
      data: { 
        action,
        organizationName: ngo.ngoProfile.organizationName,
        ...(action === 'reject' && { rejectionReason })
      },
    });

    return NextResponse.json({ 
      message: `NGO ${action}d successfully`,
      ngo: {
        _id: ngo._id,
        name: ngo.name,
        email: ngo.email,
        ngoProfile: ngo.ngoProfile
      }
    });

  } catch (error) {
    console.error('PUT /api/admin/ngos error:', error);
    return NextResponse.json({ error: 'Failed to update NGO status' }, { status: 500 });
  }
}

// PATCH - Bulk operations on NGOs
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(await isAdmin(session))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await dbConnect();
    
    const { action, ngoIds, rejectionReason } = await request.json();
    
    if (!action || !ngoIds || !Array.isArray(ngoIds) || ngoIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'reject' && !rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required for bulk rejection' }, { status: 400 });
    }

    const ngos = await User.find({ _id: { $in: ngoIds }, role: 'ngo' });
    
    if (ngos.length === 0) {
      return NextResponse.json({ error: 'No valid NGOs found' }, { status: 404 });
    }

    const updateData: any = {};
    if (action === 'approve') {
      updateData['ngoProfile.isApproved'] = true;
      updateData['ngoProfile.approvedAt'] = new Date();
      updateData['ngoProfile.approvedBy'] = session.user.id;
      updateData['$unset'] = {
        'ngoProfile.rejectedAt': 1,
        'ngoProfile.rejectionReason': 1
      };
    } else if (action === 'reject') {
      updateData['ngoProfile.isApproved'] = false;
      updateData['ngoProfile.rejectedAt'] = new Date();
      updateData['ngoProfile.rejectionReason'] = rejectionReason.trim();
      updateData['$unset'] = {
        'ngoProfile.approvedAt': 1,
        'ngoProfile.approvedBy': 1
      };
    }

    await User.updateMany(
      { _id: { $in: ngoIds }, role: 'ngo' },
      updateData
    );

    // Send notifications to all affected NGOs
    for (const ngo of ngos) {
      const notificationTitle = action === 'approve' 
        ? 'NGO Registration Approved!' 
        : 'NGO Registration Update';
      
      const notificationMessage = action === 'approve'
        ? `Congratulations! Your NGO "${ngo.ngoProfile.organizationName}" has been approved. You can now access all NGO features.`
        : `Your NGO registration has been reviewed. Reason: ${rejectionReason}`;

      await NotificationModel.create({
        userId: ngo._id,
        type: action === 'approve' ? 'ngo_approved' : 'ngo_rejected',
        title: notificationTitle,
        message: notificationMessage,
        data: { 
          action,
          organizationName: ngo.ngoProfile.organizationName,
          ...(action === 'reject' && { rejectionReason })
        },
      });
    }

    return NextResponse.json({ 
      message: `${ngos.length} NGO(s) ${action}d successfully`,
      processedCount: ngos.length
    });

  } catch (error) {
    console.error('PATCH /api/admin/ngos error:', error);
    return NextResponse.json({ error: 'Failed to process bulk NGO operation' }, { status: 500 });
  }
}