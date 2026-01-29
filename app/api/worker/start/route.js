import { authenticate } from '@/middleware/auth';
import workerManager from '@/worker/MultiUserWorkerManager';

export async function POST(request) {
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
    const body = await request.json();
    const { query, maxPapers } = body;
    
    // Get metadata from request
    const metadata = {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };
    
    // Start processing for this user
    const result = await workerManager.startProcessing(
      user._id,
      query || user.preferences.defaultSearchQuery,
      maxPapers || user.preferences.defaultMaxPapers,
      metadata
    );
    
    return Response.json({
      success: true,
      message: 'Worker started successfully',
      sessionId: result.sessionId
    });
    
  } catch (error) {
    console.error('Start worker error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}