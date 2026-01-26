// app/api/worker/results/route.js
import workerManager from '@/worker/worker';

export async function GET() {
    try {
        const results = workerManager.getResults();
        const logs = workerManager.getLogs(50);
        
        return Response.json({
            success: true,
            results,
            logs
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}