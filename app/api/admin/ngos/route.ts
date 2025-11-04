import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/lib/models/User';
import NGO from '@/lib/models/NGO';
import NotificationModel from '@/lib/models/Notification';

// Helper function to check admin access
async function isAdmin(session: any) {
  return session?.user?.email === 'hikmat.mammadlii@gmail.com' || session?.user?.role === 'admin';
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

    // Build query for independent NGOs
    const query: any = {};
    
    if (status !== 'all') {
      if (status === 'pending') {
        query.status = 'pending';
      } else if (status === 'approved') {
        query.status = 'approved';
      } else if (status === 'rejected') {
        query.status = 'rejected';
      }
    }

    if (search) {
      query.$or = [
        { organizationName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const ngos = await NGO.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('approvedBy', 'name email')
      .select('-password -verificationToken')
      .lean();

    const total = await NGO.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get counts for different statuses from NGO collection
    const pendingCount = await NGO.countDocuments({ status: 'pending' });
    const approvedCount = await NGO.countDocuments({ status: 'approved' });
    const rejectedCount = await NGO.countDocuments({ status: 'rejected' });

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

    const ngo = await NGO.findById(userId);
    if (!ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 });
    }

    if (action === 'approve') {
      ngo.status = 'approved';
      ngo.approvedAt = new Date();
      ngo.approvedBy = session.user.id;
      // Clear any previous rejection data
      ngo.adminComment = undefined;
    } else if (action === 'reject') {
      ngo.status = 'rejected';
      ngo.adminComment = rejectionReason.trim();
      // Clear approval data
      ngo.approvedAt = undefined;
      ngo.approvedBy = undefined;
    }

    await ngo.save();

    // Send notification to NGO
    const notificationTitle = action === 'approve' 
      ? 'QHT qeydiyyatı təsdiqləndi!' 
      : 'QHT qeydiyyatı yeniləndi';
    
    const notificationMessage = action === 'approve'
      ? `Təbriklər! "${ngo.organizationName}" QHT-niz təsdiqləndi. İndi bütün QHT funksiyalarına çıxışınız var.`
      : `QHT qeydiyyatınız nəzərdən keçirildi. Səbəb: ${rejectionReason}`;

    await NotificationModel.create({
      ngoId: ngo._id,
      type: action === 'approve' ? 'ngo_approved' : 'ngo_rejected',
      title: notificationTitle,
      message: notificationMessage,
      data: { 
        action,
        organizationName: ngo.organizationName,
        ...(action === 'reject' && { rejectionReason })
      },
    });

    return NextResponse.json({ 
      message: `NGO ${action}d successfully`,
      ngo: {
        _id: ngo._id,
        organizationName: ngo.organizationName,
        email: ngo.email,
        status: ngo.status,
        approvedAt: ngo.approvedAt,
        approvedBy: ngo.approvedBy
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

    const ngos = await NGO.find({ _id: { $in: ngoIds } });
    
    if (ngos.length === 0) {
      return NextResponse.json({ error: 'No valid NGOs found' }, { status: 404 });
    }

    const updateData: any = {};
    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.approvedAt = new Date();
      updateData.approvedBy = session.user.id;
      updateData.$unset = {
        adminComment: 1
      };
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.adminComment = rejectionReason.trim();
      updateData.$unset = {
        approvedAt: 1,
        approvedBy: 1
      };
    }

    await NGO.updateMany(
      { _id: { $in: ngoIds } },
      updateData
    );

    // Send notifications to all affected NGOs
    for (const ngo of ngos) {
      const notificationTitle = action === 'approve' 
        ? 'QHT qeydiyyatı təsdiqləndi!' 
        : 'QHT qeydiyyatı yeniləndi';
      
      const notificationMessage = action === 'approve'
        ? `Təbriklər! "${ngo.organizationName}" QHT-niz təsdiqləndi. İndi bütün QHT funksiyalarına çıxışınız var.`
        : `QHT qeydiyyatınız nəzərdən keçirildi. Səbəb: ${rejectionReason}`;

      await NotificationModel.create({
        ngoId: ngo._id,
        type: action === 'approve' ? 'ngo_approved' : 'ngo_rejected',
        title: notificationTitle,
        message: notificationMessage,
        data: { 
          action,
          organizationName: ngo.organizationName,
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