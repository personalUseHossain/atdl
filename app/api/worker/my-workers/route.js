// app/api/worker/my-workers/route.js - SIMPLER VERSION
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import WorkerInstance from '@/models/WorkerInstance';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Get user from database
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update last active
    user.stats.lastActive = new Date();
    await user.save();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    
    // Build query
    const query = { user: user._id };
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Get total count
    const total = await WorkerInstance.countDocuments(query);
    
    // Get workers with pagination
    const workers = await WorkerInstance.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-logs')
      .lean();
    
    return NextResponse.json({
      success: true,
      workers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get my workers error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}