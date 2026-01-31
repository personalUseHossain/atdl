import { authOptions } from '@/lib/auth';
import { authenticate } from '@/middleware/auth';
import workerManager from '@/worker/MultiUserWorkerManager';
import { getServerSession } from 'next-auth';

export async function POST(request, { params }) {
  try {
    // Await the params promise
    const { sessionId } = await params;
    
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = session.user;
    
    // Verify user owns this worker
    const WorkerInstance = require('@/models/WorkerInstance');
    const worker = await WorkerInstance.findOne({ 
      sessionId, 
      user: user.id 
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