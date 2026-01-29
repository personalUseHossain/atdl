import { authenticate } from '@/middleware/auth';
import User from '@/models/User';

export async function GET(request) {
  try {
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
    
    // Get user stats
    const connectionCount = await require('@/models/Connection').countDocuments({ user: user._id });
    const processedPapersCount = await require('@/models/ProcessedPaper').countDocuments({ 
      user: user._id, 
      processed: true 
    });
    const workerCount = await require('@/models/WorkerInstance').countDocuments({ user: user._id });
    
    return Response.json({
      success: true,
      user: {
        ...user.toObject(),
        stats: {
          ...user.stats,
          connectionCount,
          processedPapersCount,
          workerCount
        }
      }
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 401 });
  }
}