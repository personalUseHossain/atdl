import { authenticate } from '@/middleware/auth';
import workerManager from '@/worker/MultiUserWorkerManager';

export async function POST(request, { params }) {
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
    
    // Verify user owns this worker
    const WorkerInstance = require('@/models/WorkerInstance');
    const worker = await WorkerInstance.findOne({ 
      sessionId, 
      user: user._id 
    });
    
    if (!worker) {
      return Response.json({
        success: false,
        error: 'Worker not found or unauthorized'
      }, { status: 404 });
    }
    
    // Stop processing
    const success = await workerManager.stopProcessing(sessionId);
    
    return Response.json({
      success: true,
      message: 'Worker stopped successfully',
      stopped: success
    });
    
  } catch (error) {
    console.error('Stop worker error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}