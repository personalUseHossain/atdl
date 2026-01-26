// app/api/cache/route.js
import workerManager from '@/worker/worker';

export async function GET() {
    try {
        const cacheStats = workerManager.getCacheStats();
        const processedPapers = workerManager.getProcessedPapers();
        const history = workerManager.getProcessingHistory();
        
        return Response.json({
            success: true,
            cache: cacheStats,
            processedPapers: processedPapers.length,
            history: history.slice(0, 10)
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';
        
        const success = workerManager.clearCache(type);
        
        return Response.json({
            success: true,
            message: `Cache cleared: ${type}`,
            cleared: success
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}