import { authOptions } from '@/lib/auth';
import { authenticate } from '@/middleware/auth';
import workerManager from '@/worker/MultiUserWorkerManager';
import { getServerSession } from 'next-auth';

export async function POST(request) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = session.user;
    const body = await request.json();
    const { query, maxPapers } = body;
    
    // Get metadata from request
    const metadata = {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };
    
    // Start processing for this user
    const result = await workerManager.startProcessing(
      user.id,
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