import { authenticate } from '@/middleware/auth';
import workerManager from '@/worker/MultiUserWorkerManager';

export async function GET(request) {
  try {
    // Authenticate user
    const authResult = await new Promise((resolve, reject) => {
      authenticate(request, {
        json: (data) => reject(data),
        status: (code) => ({
          json: (data) => reject(data)
        })
      }, (err) => {
        if (err) reject(err);
        else resolve(request.user);
      });
    });
    
    const user = authResult;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    
    const WorkerInstance = require('@/models/WorkerInstance');
    
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
    
    return Response.json({
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
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}