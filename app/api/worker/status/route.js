// app/api/worker/status/route.js
import workerManager from '@/worker/worker';

export async function GET() {
    try {
        const status = workerManager.getStatus();
        return Response.json({
            success: true,
            ...status
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}