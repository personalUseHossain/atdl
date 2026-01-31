import { authOptions } from '@/lib/auth';
import { authenticate } from '@/middleware/auth';
import workerManager from '@/worker/MultiUserWorkerManager';
import { getServerSession } from 'next-auth';

export async function GET(request, { params }) {
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
      user: user.id 
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