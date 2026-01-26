// app/api/worker/start/route.js
import workerManager from '@/worker/worker';

export async function POST(request) {
    try {
        const body = await request.json();
        const { query, maxPapers } = body;
        
        // Start processing in background
        workerManager.startProcessing(query, maxPapers).catch(console.error);
        
        return Response.json({
            success: true,
            message: 'Worker started successfully',
            status: workerManager.getStatus()
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}