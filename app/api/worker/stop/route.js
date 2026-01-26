// app/api/worker/stop/route.js
import workerManager from '@/worker/worker';

export async function POST() {
    try {
        workerManager.stopProcessing();
        
        return Response.json({
            success: true,
            message: 'Worker stopped successfully',
            status: workerManager.getStatus()
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}