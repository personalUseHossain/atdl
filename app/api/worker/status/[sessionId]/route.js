import { authenticate } from '@/middleware/auth';
import workerManager from '@/worker/MultiUserWorkerManager';

export async function GET(request, { params }) {
  try {
    // Await the params promise
    const { sessionId } = await params;
    
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
    
    // Get worker status
    const status = await workerManager.getWorkerStatus(sessionId);
    
    if (!status) {
      return Response.json({
        success: false,
        error: 'Worker not found'
      }, { status: 404 });
    }
    
    // Verify user owns this worker
    const WorkerInstance = require('@/models/WorkerInstance');
    const worker = await WorkerInstance.findOne({ 
      sessionId, 
      user: user._id 
    });
    
    if (!worker) {
      return Response.json({
        success: false,
        error: 'Unauthorized access'
      }, { status: 403 });
    }
    
    return Response.json({
      success: true,
      ...status
    });
    
  } catch (error) {
    console.error('Get worker status error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}